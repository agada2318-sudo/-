// "이렇게 바꾸고 싶어요" — 사용자가 고른 줄 + 요청 → Claude가 고치는 방법과 새 코드를 돌려줌
import Anthropic from '@anthropic-ai/sdk';

export interface EditRequest {
  code: string; // 전체 코드
  startLine: number; // 1부터 시작
  endLine: number;
  request: string; // 사용자의 요청 (예: "이 줄의 공백을 더 넓히고 싶어")
  fileName?: string;
}

export interface EditResult {
  keyChange: string; // 핵심: 어떤 속성/명령어/태그를 쓰면 되는지
  explanation: string; // 고치는 방법 설명
  modifiedCode: string; // 고른 줄을 대신할 새 코드
  originalCode: string;
  startLine: number;
  endLine: number;
}

const MODEL = 'claude-opus-5-5';

const SYSTEM_PROMPT = `너는 코딩을 막 배우기 시작한 초보 개발자를 돕는 친절한 코딩 튜터야.
사용자는 자기 코드에서 몇 줄을 고르고 "이렇게 바꾸고 싶어"라고 요청해. 그 줄을 요청대로 실제로 고쳐 주고, 어떻게 고치는지 알려줘.

답의 세 항목:
- keyChange: 어떤 태그·속성·명령어를 어떻게 바꾸면 되는지 한두 문장. 바꿀 수 있는 선택지가 여러 개면 함께 알려줘.
- modifiedCode: 고른 줄만 요청대로 고친 새 코드. 고른 줄 바깥의 코드는 넣지 말고, 원래 들여쓰기를 그대로 지켜. 요청과 상관없는 부분은 바꾸지 마.
- explanation: 그 태그·속성·명령어가 무슨 일을 하고, 이렇게 바꾸면 화면이나 동작이 어떻게 달라지는지 쉬운 한국어 "~해요" 말투로 2~3문장.

제목 태그(<h1>~<h6>)의 글씨 크기를 바꿔 달라는 요청에는 다음처럼 선택지를 알려줘.
예: <h1>을 더 작게 → keyChange: "<h1> 보다 작은 크기의 글씨인 <h2>, <h3>, <h4>, 잘 사용하진 않지만 <h5>, <h6> 으로 바꿀 수 있어요", modifiedCode는 한 단계 아래 태그(<h2>)로, 여는 태그와 닫는 태그를 둘 다 바꿔.
<h1>보다 크게, <h6>보다 작게처럼 태그로 안 되는 경우에는 CSS font-size를 쓰라고 알려줘.`;

// 구조화 출력: 항상 이 세 항목이 있는 JSON으로 답하게 함
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    keyChange: { type: 'string' },
    modifiedCode: { type: 'string' },
    explanation: { type: 'string' },
  },
  required: ['keyChange', 'modifiedCode', 'explanation'],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;
function getClient() {
  // ANTHROPIC_API_KEY (.env) 등 환경의 인증 정보를 자동으로 사용
  if (!client) client = new Anthropic();
  return client;
}

export class EditAssistantError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message);
  }
}

function buildPrompt(req: EditRequest, lines: string[], startLine: number, endLine: number) {
  // 고른 줄 주변 코드도 함께 보여줘서 문맥에 맞게 고치도록 함
  const from = Math.max(1, startLine - 30);
  const to = Math.min(lines.length, endLine + 30);
  const context = lines
    .slice(from - 1, to)
    .map((l, i) => {
      const n = from + i;
      const mark = n >= startLine && n <= endLine ? '>>' : '  ';
      return `${mark}${String(n).padStart(4)} | ${l}`;
    })
    .join('\n');
  const selected = lines.slice(startLine - 1, endLine).join('\n');
  const range = startLine === endLine ? `${startLine}번째 줄` : `${startLine}~${endLine}번째 줄`;

  return `${req.fileName ? `파일 이름: ${req.fileName}\n` : ''}주변 코드 (>> 표시가 사용자가 고른 줄):
<context>
${context}
</context>

사용자가 고른 ${range}:
<selected>
${selected}
</selected>

사용자 요청: ${req.request}`;
}

export async function suggestEdit(req: EditRequest): Promise<EditResult> {
  const lines = req.code.replace(/\r\n/g, '\n').split('\n');
  const startLine = Math.max(1, Math.min(lines.length, Math.floor(req.startLine)));
  const endLine = Math.max(startLine, Math.min(lines.length, Math.floor(req.endLine)));
  const originalCode = lines.slice(startLine - 1, endLine).join('\n');

  let response;
  try {
    response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // 안전 필터가 요청을 거절하면 서버가 알아서 다른 모델로 다시 시도
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'low', // 줄 단위의 간단한 수정이라 빠른 응답 우선
        format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(req, lines, startLine, endLine) }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new EditAssistantError('Claude 인증 정보가 잘못됐어요. ANTHROPIC_API_KEY(또는 ANTHROPIC_AUTH_TOKEN) 값을 확인하고 서버를 다시 켜 주세요.', 503);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new EditAssistantError('요청이 너무 많아요. 잠시 뒤에 다시 시도해 주세요.', 429);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new EditAssistantError('Claude 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.', 502);
    }
    if (err instanceof Anthropic.APIError) {
      throw new EditAssistantError(`Claude API 오류 (${err.status}): ${err.message}`, 502);
    }
    // 인증 정보가 아예 없으면 SDK가 요청 전에 일반 Error를 던짐
    if (err instanceof Error && /api ?key|auth/i.test(err.message)) {
      throw new EditAssistantError('Claude 인증 정보가 없어요. .env 파일에 ANTHROPIC_API_KEY를 넣거나 ANTHROPIC_AUTH_TOKEN 환경 변수를 설정한 뒤 서버를 다시 켜 주세요.', 503);
    }
    throw err;
  }

  if (response.stop_reason === 'refusal') {
    throw new EditAssistantError('이 요청은 처리할 수 없어요. 요청 내용을 바꿔서 다시 시도해 주세요.', 422);
  }
  if (response.stop_reason === 'max_tokens') {
    throw new EditAssistantError('답이 너무 길어서 중간에 끊겼어요. 고르는 줄을 줄여서 다시 시도해 주세요.', 422);
  }

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  let parsed: { keyChange: string; modifiedCode: string; explanation: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new EditAssistantError('Claude의 답을 읽지 못했어요. 다시 시도해 주세요.', 502);
  }

  return {
    keyChange: parsed.keyChange.trim(),
    explanation: parsed.explanation.trim(),
    modifiedCode: parsed.modifiedCode.replace(/\s+$/, ''),
    originalCode,
    startLine,
    endLine,
  };
}
