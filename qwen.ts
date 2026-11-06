// Qwen2.5-1.5B-Instruct 로컬 실행 모듈 (node-llama-cpp, CPU에서도 동작)
// 사용자가 고른 줄 + "이렇게 바꾸고 싶어" 요청 → 수정 코드와 방법 설명을 돌려줌
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// npm run download-model 은 models/hf_Qwen_qwen2.5-1.5b-instruct-q4_k_m.gguf 로 저장함
const MODEL_CANDIDATES = [
  'hf_Qwen_qwen2.5-1.5b-instruct-q4_k_m.gguf',
  'qwen2.5-1.5b-instruct-q4_k_m.gguf',
].map((f) => path.join(__dirname, 'models', f));

function resolveModelPath() {
  if (process.env.QWEN_MODEL_PATH) return process.env.QWEN_MODEL_PATH;
  return MODEL_CANDIDATES.find((p) => fs.existsSync(p)) ?? MODEL_CANDIDATES[0];
}

export interface EditRequest {
  code: string; // 전체 코드
  startLine: number; // 1부터 시작
  endLine: number;
  request: string; // 사용자의 요청 (예: "이 줄의 공백을 더 넓히고 싶어")
  fileName?: string;
}

export interface EditResult {
  keyChange: string; // 핵심: 어떤 속성/명령어를 쓰면 되는지
  explanation: string; // 고치는 방법 설명
  modifiedCode: string; // 고른 줄을 대신할 새 코드
  originalCode: string;
  startLine: number;
  endLine: number;
}

const SYSTEM_PROMPT = `너는 초보 개발자를 돕는 코딩 튜터야.
사용자가 고른 줄을 사용자 요청대로 실제로 바꿔야 해. 원래 코드를 그대로 돌려주면 안 돼.
JSON 필드 (이 순서대로 써):
- keyChange: 무엇을 어떻게 바꿀지 한 문장 (예: "padding 값을 4px에서 16px로 늘리세요")
- modifiedCode: keyChange에 쓴 대로 고른 줄을 실제로 고친 새 코드. 고른 줄 말고 다른 줄은 절대 넣지 마. 들여쓰기는 원래대로.
- explanation: 그 속성·명령어가 무슨 일을 하고 왜 이렇게 바꾸면 요청이 이루어지는지 쉬운 한국어 2~3문장.
  바꾸는 방법이 여러 가지면 다른 선택지도 함께 알려줘.

예시)
고른 줄:
<h1>안녕하세요</h1>
사용자 요청: 글씨를 조금 더 작은 크기로 바꾸고 싶어
답:
{"keyChange": "<h1> 보다 작은 크기의 글씨인 <h2>, <h3>, <h4>, 잘 사용하진 않지만 <h5>, <h6> 으로 바꿀 수 있어요", "modifiedCode": "<h2>안녕하세요</h2>", "explanation": "제목 태그는 <h1>이 가장 크고 숫자가 커질수록 글씨가 작아져요. 조금만 작게 하고 싶다면 <h2>가 알맞아요. 여는 태그와 닫는 태그를 둘 다 바꿔야 해요."}

예시)
고른 줄:
  margin: 2px;
사용자 요청: 위아래 간격을 더 넓히고 싶어
답:
{"keyChange": "margin 값을 2px에서 20px로 늘리세요", "modifiedCode": "  margin: 20px;", "explanation": "margin은 요소 바깥쪽의 빈 공간이에요. 숫자를 키우면 다른 요소와의 간격이 넓어져요."}

예시)
고른 줄:
    print("hello")
사용자 요청: 이름을 넣어서 인사하고 싶어
답:
{"keyChange": "f-string을 써서 문자열 안에 변수를 넣으세요", "modifiedCode": "    name = \\"철수\\"\\n    print(f\\"hello, {name}\\")", "explanation": "문자열 앞에 f를 붙이면 중괄호 {} 안에 변수를 바로 넣을 수 있어요. 그래서 이름이 바뀌어도 인사말이 자동으로 바뀌어요."}`;

// 무엇을 바꿀지(keyChange) 먼저 정하고 → 그대로 코드를 고치고 → 설명하도록 순서를 고정
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    keyChange: { type: 'string' },
    modifiedCode: { type: 'string' },
    explanation: { type: 'string' },
  },
  required: ['keyChange', 'modifiedCode', 'explanation'],
} as const;

type Loaded = {
  llama: any;
  model: any;
  context: any;
  grammar: any;
  explainGrammar: any;
  LlamaChatSession: any;
};

let loading: Promise<Loaded> | null = null;
let queue: Promise<unknown> = Promise.resolve(); // 한 번에 하나씩만 생성 (CPU 보호)

export function qwenStatus() {
  return {
    model: 'Qwen2.5-1.5B-Instruct',
    modelFileExists: fs.existsSync(resolveModelPath()),
    loaded: loading !== null,
  };
}

function load(): Promise<Loaded> {
  if (!loading) {
    loading = (async () => {
      if (!fs.existsSync(resolveModelPath())) {
        throw new Error(`모델 파일이 없어요: ${resolveModelPath()} (npm run download-model 실행)`);
      }
      const { getLlama, LlamaChatSession } = await import('node-llama-cpp');
      const llama = await getLlama();
      const model = await llama.loadModel({ modelPath: resolveModelPath() });
      const context = await model.createContext({ contextSize: 4096 });
      const grammar = await llama.createGrammarForJsonSchema(RESPONSE_SCHEMA as any);
      const explainGrammar = await llama.createGrammarForJsonSchema({
        type: 'object',
        properties: { explanation: { type: 'string' } },
        required: ['explanation'],
      } as any);
      console.log('[qwen] Qwen2.5-1.5B-Instruct loaded');
      return { llama, model, context, grammar, explainGrammar, LlamaChatSession };
    })().catch((err) => {
      loading = null; // 다음 요청에서 다시 시도
      throw err;
    });
  }
  return loading;
}

function buildPrompt(req: EditRequest, lines: string[]) {
  const { startLine, endLine } = req;
  // 1.5B 모델은 문맥이 길면 헷갈리므로 고른 줄 주변만 보여줌
  const from = Math.max(1, startLine - 12);
  const to = Math.min(lines.length, endLine + 12);
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
\`\`\`
${context}
\`\`\`

사용자가 고른 ${range}:
\`\`\`
${selected}
\`\`\`

사용자 요청: ${req.request}
고른 줄만 요청대로 실제로 바꾼 코드와 설명을 JSON으로 답해줘.`;
}

// ---------- 정해진 규칙이 있는 요청 ----------
// 1.5B 모델은 힌트를 줘도 엉뚱한 예시를 따라 하므로, 답이 정해진 요청은 규칙으로 처리하고 Qwen은 설명만 씀

const EXPLAIN_PROMPT = `너는 초보 개발자를 돕는 코딩 튜터야.
바꾸기 전 코드와 바꾼 후 코드를 보고, 무엇이 바뀌었고 그래서 화면이 어떻게 달라지는지 초보자에게 말하듯 "~해요" 말투로 2~3문장 설명해.
다른 방법(CSS 등)은 말하지 말고, 보여준 변경만 설명해. JSON으로 답해.`;

interface Rule {
  keyChange: string;
  modifiedCode: string;
  fallbackExplanation: string;
}

// 제목 태그(<h1>~<h6>) 글씨 크기 바꾸기
// 예: <h1>안녕하세요</h1> + "글씨를 조금 더 작게" → <h2>, <h3>, <h4>, 잘 사용하진 않지만 <h5>, <h6>
function headingRule(selected: string, request: string): Rule | null {
  const m = selected.match(/<h([1-6])(?=[\s>])/i);
  if (!m) return null;
  const smaller = /(작게|작은|작아|줄이|줄여|축소)/.test(request);
  const bigger = /(크게|큰\s*크기|키우|키워|늘리|늘려|확대)/.test(request);
  const aboutSize = /(크기|글씨|글자|사이즈|size|폰트)/i.test(request);
  if (!aboutSize || smaller === bigger) return null;

  const n = Number(m[1]);
  const tag = (k: number) => `<h${k}>`;
  // 고른 코드 안의 <hN ...> 와 </hN> 를 모두 바꿈 (속성은 유지)
  const retag = (to: number) =>
    selected.replace(new RegExp(`<(/?)h${n}(?=[\\s>])`, 'gi'), (_m, slash) => `<${slash}h${to}`);

  if (smaller) {
    if (n === 6) {
      return {
        keyChange: '<h6>이 가장 작은 제목 태그라서 태그로는 더 작게 할 수 없어요. CSS의 font-size를 써야 해요',
        modifiedCode: selected.replace(/<h6(?=[\s>])(?![^>]*style=)/i, '<h6 style="font-size: 10px;"'),
        fallbackExplanation: 'font-size는 글씨 크기를 정하는 CSS 속성이에요. 숫자를 작게 할수록 글씨가 작아져요.',
      };
    }
    const options: string[] = [];
    for (let k = n + 1; k <= 6; k++) options.push(tag(k));
    const common = options.filter((t) => !/[56]/.test(t));
    const rare = options.filter((t) => /[56]/.test(t));
    const list =
      common.length && rare.length
        ? `${common.join(', ')}, 잘 사용하진 않지만 ${rare.join(', ')}`
        : options.join(', ');
    return {
      keyChange: `${tag(n)} 보다 작은 크기의 글씨인 ${list} 으로 바꿀 수 있어요`,
      modifiedCode: retag(n + 1),
      fallbackExplanation: `제목 태그는 <h1>이 가장 크고 숫자가 커질수록 글씨가 작아져요. 조금만 작게 하고 싶다면 바로 다음 단계인 ${tag(n + 1)}가 알맞아요. 여는 태그와 닫는 태그를 둘 다 바꿔야 해요.`,
    };
  }

  if (n === 1) {
    return {
      keyChange: '<h1>이 가장 큰 제목 태그라서 태그로는 더 크게 할 수 없어요. CSS의 font-size를 써야 해요',
      modifiedCode: selected.replace(/<h1(?=[\s>])(?![^>]*style=)/i, '<h1 style="font-size: 48px;"'),
      fallbackExplanation: 'font-size는 글씨 크기를 정하는 CSS 속성이에요. 숫자를 크게 할수록 글씨가 커져요.',
    };
  }
  const options: string[] = [];
  for (let k = n - 1; k >= 1; k--) options.push(tag(k));
  return {
    keyChange: `${tag(n)} 보다 큰 크기의 글씨인 ${options.join(', ')} 으로 바꿀 수 있어요`,
    modifiedCode: retag(n - 1),
    fallbackExplanation: `제목 태그는 숫자가 작을수록 글씨가 커져요. 조금만 크게 하고 싶다면 바로 위 단계인 ${tag(n - 1)}가 알맞아요. 여는 태그와 닫는 태그를 둘 다 바꿔야 해요.`,
  };
}

export async function suggestEdit(req: EditRequest): Promise<EditResult> {
  const lines = req.code.replace(/\r\n/g, '\n').split('\n');
  const startLine = Math.max(1, Math.min(lines.length, Math.floor(req.startLine)));
  const endLine = Math.max(startLine, Math.min(lines.length, Math.floor(req.endLine)));
  const normalized = { ...req, startLine, endLine };
  const originalCode = lines.slice(startLine - 1, endLine).join('\n');

  const rule = headingRule(originalCode, req.request);

  const run = async (): Promise<EditResult> => {
    const { context, grammar, explainGrammar, LlamaChatSession } = await load();
    const sequence = context.getSequence();
    try {
      // 정해진 규칙이 있는 요청: 답(keyChange·코드)은 규칙대로, Qwen은 쉬운 설명만 작성
      if (rule) {
        const session = new LlamaChatSession({ contextSequence: sequence, systemPrompt: EXPLAIN_PROMPT });
        let explanation = rule.fallbackExplanation;
        try {
          const raw = await session.prompt(
            `바꾸기 전:
${originalCode.trim()}
바꾼 후:
${rule.modifiedCode.trim()}
사용자 요청: ${req.request}
무엇이 바뀌었고 화면이 어떻게 달라지는지 설명해줘.`,
            { grammar: explainGrammar, temperature: 0.2, maxTokens: 300 }
          );
          const text = (explainGrammar.parse(raw) as { explanation: string }).explanation.trim();
          // 설명이 중간에 끊기거나 너무 짧으면 기본 설명 사용
          if (text.length >= 20 && /[.!?요다]$/.test(text)) explanation = text;
        } catch {
          // 규칙에 들어 있는 기본 설명 사용
        }
        return { keyChange: rule.keyChange, explanation, modifiedCode: rule.modifiedCode, originalCode, startLine, endLine };
      }

      const session = new LlamaChatSession({ contextSequence: sequence, systemPrompt: SYSTEM_PROMPT });
      type Answer = { keyChange: string; explanation: string; modifiedCode: string };
      const ask = async (text: string, temperature: number) =>
        grammar.parse(await session.prompt(text, { grammar, temperature, maxTokens: 900 })) as Answer;

      let parsed = await ask(buildPrompt(normalized, lines), 0.2);
      // 작은 모델이 설명만 하고 코드를 그대로 돌려주는 경우 → 한 번 더 요청
      if (sameCode(parsed.modifiedCode, originalCode)) {
        parsed = await ask(
          `modifiedCode가 원래 코드와 똑같아. "${parsed.keyChange}" 내용대로 고른 줄을 실제로 바꾼 코드를 다시 JSON으로 답해줘.`,
          0.5
        );
      }
      return {
        keyChange: parsed.keyChange.trim(),
        explanation: parsed.explanation.trim(),
        modifiedCode: matchIndent(stripFences(parsed.modifiedCode), originalCode),
        originalCode,
        startLine,
        endLine,
      };
    } finally {
      sequence.dispose();
    }
  };

  const job = queue.then(run, run);
  queue = job.catch(() => undefined);
  return job;
}

function sameCode(a: string, b: string) {
  const norm = (x: string) => x.replace(/\s+/g, ' ').trim();
  return norm(stripFences(a)) === norm(b);
}

// 작은 모델이 들여쓰기를 멋대로 바꾸는 경우 → 원래 코드의 들여쓰기 기준으로 맞춤
function matchIndent(code: string, original: string) {
  const indentOf = (text: string) => {
    const ls = text.split('\n').filter((l) => l.trim());
    if (!ls.length) return '';
    return ls.map((l) => l.match(/^[ \t]*/)![0]).reduce((a, b) => (b.length < a.length ? b : a));
  };
  const from = indentOf(code);
  const to = indentOf(original);
  if (from === to) return code;
  return code
    .split('\n')
    .map((l) => (l.trim() ? to + l.slice(from.length) : l))
    .join('\n');
}

// 모델이 코드 안에 ``` 를 넣는 경우 제거
function stripFences(code: string) {
  return code
    .replace(/^\s*```[\w-]*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .replace(/\s+$/, '');
}
