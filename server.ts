import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  applySyntaxError,
  buildFallbackAnalysis,
  interpretSingleLineFallback,
} from './src/utils/codeAnalyzer.ts';
import { LineInterpretation, SimpleCodeAnalysis } from './src/types.ts';
import { qwenStatus, suggestEdit } from './qwen.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Cloud Run / Kubernetes 헬스체크 엔드포인트
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Qwen2.5-1.5B-Instruct: 고른 줄을 사용자 요청대로 고치는 방법 안내
  app.get('/api/qwen/status', (_req, res) => {
    res.json(qwenStatus());
  });

  app.post('/api/qwen/edit', async (req, res) => {
    const { code, startLine, endLine, request, fileName } = req.body ?? {};
    if (typeof code !== 'string' || typeof request !== 'string' || !request.trim()) {
      return res.status(400).json({ error: '코드와 요청 내용을 보내주세요.' });
    }
    if (!Number.isFinite(startLine) || !Number.isFinite(endLine)) {
      return res.status(400).json({ error: '줄 번호가 올바르지 않아요.' });
    }
    try {
      const result = await suggestEdit({
        code,
        startLine,
        endLine,
        request: request.trim().slice(0, 500),
        fileName: typeof fileName === 'string' ? fileName : undefined,
      });
      res.json(result);
    } catch (err) {
      console.error('[qwen] edit failed:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Qwen 실행 중 오류가 났어요.' });
    }
  });

  app.post('/api/analyze-code', async (req, res) => {
    const { code } = req.body as { code?: string };

    if (!code || !code.trim()) {
      res.status(400).json({ error: '해석할 코드를 입력해주세요.' });
      return;
    }

    const cleanCode = code.replace(/\r\n/g, '\n');
    const rawLines = cleanCode.split('\n');
    const numberedCode = rawLines
      .map((line, idx) => `${idx + 1}: ${line}`)
      .join('\n');

    try {
      const ai = getGeminiClient();
      if (!ai) {
        throw new Error('GEMINI_API_KEY is not set');
      }
      const systemInstruction = `당신은 같은 코드를 초급자, 중급자, 전공자 3개 수준으로 "완전히 다른 내용과 말투"로 해석해주는 'CODEMATE' 수석 코드 튜터입니다.
사용자가 입력한 코드를 1번 줄부터 마지막 ${rawLines.length}번 줄까지 각 줄마다 아래 규칙대로 해석하세요.
세 레벨은 같은 문장을 반복하거나 같은 내용을 말만 바꿔 쓰면 안 됩니다. 레벨마다 관점 자체가 달라야 합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [초급자] 대상: 코딩을 한 번도 배운 적 없는 비전공자 / 관점: "이 코드는 무엇인가(정의)"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- IT 전문 용어(DOM, 렌더링, 파싱, 스코프, 바인딩, 호이스팅, 이벤트 등)를 쓰지 마세요. 꼭 필요하면 괄호로 일상어 풀이를 붙이세요.
- 일상 비유(상자, 이름표, 간판, 우편함 등)와 "화면에 무엇이 보이는지"를 중심으로 설명하세요.
- subCommentBeginner: 이 줄이 무엇인지 쉬운 말 1문장
- definition (코드 정의): 이 줄에 쓰인 태그/키워드/기능이 원래 무엇인지 일반적인 정의를 1문장으로. 반드시 그 이름을 넣어 "~는 ~하는 명령어(태그)입니다" 형태로 쓰세요.
  * 예: break; -> "break는 반복문(for, while)이나 switch 문을 그 자리에서 즉시 끝내고 빠져나오는 명령어입니다."
  * 예: <h1>콘텐츠 영역</h1> -> "<h1>은 웹페이지에 가장 큰 제목을 표시하는 코드입니다."
  * 예: localStorage.setItem('theme', 'dark'); -> "localStorage.setItem은 브라우저 안의 저장 공간에 값을 이름(키)과 함께 저장하는 기능입니다."
- easyExplanation (이 줄은 무슨 의미인가요?): definition과 겹치지 않게, "이 줄에서는" 실제로 무엇을 하는지 1~2문장.
  * 반드시 그 줄에 실제로 적힌 글자(태그 안 내용)와 속성 값(type, placeholder, class, href 등)을 문장 안에 그대로 넣어서, 그 코드가 화면에서 "어떤 모양으로 무엇을" 만드는지 구체적으로 설명하세요.
  * "~하는 태그입니다", "~하는 명령어입니다"로 끝내세요. "<h1>은 제목 태그입니다" 같은 일반적인 사전식 정의는 금지합니다.
  * "이 줄의 명령을 실행합니다", "코드가 수행됩니다", "동작을 처리합니다"처럼 무엇을 하는지 알 수 없는 뭉뚱그린 문장은 절대 쓰지 마세요. 함수 이름, 변수 이름, 값, 조건을 실제로 넣어서 그 줄이 정확히 무슨 뜻인지 풀어 쓰세요.
  * 자바스크립트/파이썬/CSS도 같은 방식으로 설명하세요:
    - const [query, setQuery] = useState(''); -> "query라는 값과, 그 값을 바꿀 때 쓰는 setQuery라는 기능을 한 쌍으로 만들고, query의 처음 값은 빈 글자('')로 정하는 명령어입니다."
    - if (!query.trim()) return; -> "만약 query에 공백 말고 실제 글자가 하나도 없으면 여기서 바로 멈추고, 아래에 있는 명령은 실행하지 않는 조건문입니다."
    - }, [query]); -> "위에서 시작한 useEffect 자동 실행 묶음을 여기서 닫는 동시에, query 값이 바뀔 때마다 이 묶음을 다시 실행하라고 정하는 줄입니다."
    - color: white; -> "이 요소의 글자 색(color)을 white로 정하는 명령어입니다."
    - 한 줄에 CSS 선언이 여러 개 있으면(예: width:800px; margin: 0 auto; background:#accbe5; height: 150px; }) 절대 뭉뚱그리지 말고 ①②③④ 번호를 붙여 하나씩 모두 설명하세요:
      "① 가로 폭(width)을 800픽셀로 정합니다. ② 바깥 여백(margin)을 위아래 0, 왼쪽·오른쪽 자동(auto)으로 정합니다. 좌우 여백을 브라우저가 똑같이 나눠 이 요소가 가로 가운데에 놓입니다. ③ 배경(background)을 #accbe5(연한 하늘색)로 칠합니다. ④ 세로 높이(height)를 150픽셀로 정합니다. 마지막의 }는 꾸밈 규칙 묶음이 끝난다는 표시입니다."
      색 코드(#accbe5, rgb(...))는 어떤 색인지 우리말 색 이름도 함께 알려주세요.
  * 예: <h1>환영합니다</h1> -> "제일 큰 글씨로 환영합니다를 출력하는 태그입니다."
  * 예: <button type="submit">로그인</button> -> "버튼의 타입을 제출할 수 있는 버튼 형식으로 만든 후 그 버튼의 이름을 로그인으로 표시하는 명령어입니다."
  * 예: <input type="text" placeholder="아이디를 입력하세요" required> -> "글자를 직접 입력할 수 있는 한 줄 입력칸을 만들고, 칸 안에 '아이디를 입력하세요'라는 흐린 안내 문구를 미리 보여주며, 비워두면 제출되지 않도록 반드시 채워야 하는 칸으로 정하는 명령어입니다."
  * 예: <p>아이디를 입력하고 로그인하세요.</p> -> "'아이디를 입력하고 로그인하세요.'라는 문장을 보통 크기 글씨의 한 문단으로 화면에 출력하는 태그입니다."
  * 예: <div class="login-box"> -> "화면의 여러 요소를 하나로 묶는 보이지 않는 상자를 만들고, 그 상자에 login-box라는 이름표를 붙이는 명령어입니다."
  * 예: const total = 10; -> "total이라는 이름표를 붙인 상자를 만들고 그 안에 숫자 10을 넣어두는 명령어입니다."
- whyUsedHere (왜 이 코드가 여기서 사용되었나요? 목적과 이유 예측):
  * 앞뒤 줄과 전체 화면의 흐름을 보고, 이 코드가 이 화면에서 "어떤 역할"을 맡고 있는지 실제 내용을 넣어 예측해 1~2문장으로 설명하세요.
  * 예: <h1>환영합니다</h1> -> "이 화면에서 가장 큰 첫번째 제목 글자를 표시하는 태그입니다. 사용자가 이 구역에 들어왔을 때 환영합니다를 가장 먼저 눈에 띄게 보여주려고 사용되었습니다."
  * 예: <button type="submit">로그인</button> -> "사용자가 입력한 양식 정보를 서버로 전송(제출)하기 위해 클릭할 수 있도록 배치한 로그인 필수 버튼입니다."
  * 예: <input type="text" placeholder="아이디를 입력하세요"> -> "로그인에 필요한 사용자의 아이디를 화면에서 직접 입력받기 위해 사용되었습니다."
  * 예: <div class="login-box"> -> "이름표(login-box)로 보아 로그인 관련 제목·입력칸·버튼 같은 요소들을 한 덩어리로 묶어서 함께 꾸미거나 위치를 정하기 위해 사용되었습니다."
- wrongExample / betterExample: 초보자가 흔히 하는 실수와 올바른 기초 코드 (reason도 쉬운 말)
- tokens: 태그·속성·키워드 조각마다 쉬운 말 뜻풀이

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. [중급자] 대상: 기초 문법은 아는 주니어 개발자 / 관점: "이 코드가 어떻게 작동하는가(작동 원리)"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- "~하는 태그입니다" 같은 정의 설명은 하지 마세요. 중급자는 이미 정의를 압니다.
- 대신 브라우저/엔진이 이 줄을 어떤 순서로 처리하는지, 값과 데이터가 어디서 어디로 흐르는지, 다른 줄과 어떻게 연결되어 동작하는지 설명하세요.
- isBasic: 닫는 태그, 괄호만 있는 줄, <!DOCTYPE>, <html>, <head>, <body>, 단순 console.log, import 문처럼 설명이 필요 없는 간단한 기본 코드면 true, 아니면 false.
  * isBasic이 true면: howItWorks는 짧은 1문장, subCommentIntermediate는 "기본 코드 (작동 원리 설명 생략)", betterRefactor와 suggestedAdditions는 생략하세요.
- howItWorks (어떻게 작동하나요?): 작동 원리 2~3문장
- subCommentIntermediate: 작동 원리 핵심 한 줄 요약
- codeCheckVerdict: 동작상 문제가 없는지 검증 소견
- betterRefactor: 더 나은 코드 추천 (리팩토링, 웹 표준, 성능)
- suggestedAdditions: 더 추가하면 좋을 코드와 그 이유

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. [전공자] 대상: 현업 개발자·CS 전공자 / 관점: "기술 스펙과 내부 동작, 결함"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 쉬운 풀이나 비유는 금지합니다. 정확한 IT 전문 용어를 적극 사용하세요.
  (예: HTML Living Standard, ECMAScript 스펙, tokenizer/tree construction, CSSOM, Render Tree, Layout/Paint, Lexical Environment, TDZ, 클로저, 이벤트 루프, 시간 복잡도, 힙/스택, XSS/CSRF, WCAG/ARIA, accessible name, render-blocking, tree-shaking 등)
- technicalDetail (기술 분석): 스펙·내부 처리 과정·성능·보안·접근성 관점에서 2~4문장
- subCommentAdvanced: 전문 용어로 된 잠재 버그/누락 점검 주석
- bugAudit: 런타임 오류, 취약점, 엣지 케이스 분석 (hasIssue, severity, issueTitle, issueDetail)
- missingAudit: 누락된 코드(필수 속성, A11y, 예외처리 등) 진단 (hasMissing, missingTitle, missingSnippet, reason)
- recommendedPatch: 최적화 패치 완성 코드`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `다음 코드를 초급자, 중급자, 전공자 3단계 레벨별로 정밀 분석해주세요:\n\n${numberedCode}`,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: '이 코드가 무엇을 하는 코드인지 한 줄 제목',
              },
              language: {
                type: Type.STRING,
                description: '코드 언어 (예: HTML, JavaScript, CSS, Python)',
              },
              summary: {
                type: Type.STRING,
                description: '전체 코드 1~2문장 요약',
              },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    lineNumber: { type: Type.INTEGER },
                    shortRole: { type: Type.STRING },
                    subCommentBeginner: { type: Type.STRING },
                    subCommentIntermediate: { type: Type.STRING },
                    subCommentAdvanced: { type: Type.STRING },
                    beginner: {
                      type: Type.OBJECT,
                      properties: {
                        definition: { type: Type.STRING },
                        easyExplanation: { type: Type.STRING },
                        whyUsedHere: { type: Type.STRING },
                        wrongExample: {
                          type: Type.OBJECT,
                          properties: {
                            code: { type: Type.STRING },
                            reason: { type: Type.STRING },
                          },
                          required: ['code', 'reason'],
                        },
                        betterExample: {
                          type: Type.OBJECT,
                          properties: {
                            code: { type: Type.STRING },
                            reason: { type: Type.STRING },
                          },
                          required: ['code', 'reason'],
                        },
                        tokens: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              token: { type: Type.STRING },
                              meaning: { type: Type.STRING },
                            },
                            required: ['token', 'meaning'],
                          },
                        },
                      },
                      required: ['definition', 'easyExplanation', 'whyUsedHere', 'tokens'],
                    },
                    intermediate: {
                      type: Type.OBJECT,
                      properties: {
                        isBasic: { type: Type.BOOLEAN },
                        howItWorks: { type: Type.STRING },
                        codeCheckVerdict: { type: Type.STRING },
                        betterRefactor: {
                          type: Type.OBJECT,
                          properties: {
                            code: { type: Type.STRING },
                            reason: { type: Type.STRING },
                          },
                          required: ['code', 'reason'],
                        },
                        suggestedAdditions: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              code: { type: Type.STRING },
                              meaning: { type: Type.STRING },
                              whyAdd: { type: Type.STRING },
                            },
                            required: ['code', 'meaning', 'whyAdd'],
                          },
                        },
                      },
                      required: ['isBasic', 'howItWorks', 'codeCheckVerdict'],
                    },
                    advanced: {
                      type: Type.OBJECT,
                      properties: {
                        technicalDetail: { type: Type.STRING },
                        bugAudit: {
                          type: Type.OBJECT,
                          properties: {
                            hasIssue: { type: Type.BOOLEAN },
                            severity: {
                              type: Type.STRING,
                              description: 'none, warning, error, security 중 하나',
                            },
                            issueTitle: { type: Type.STRING },
                            issueDetail: { type: Type.STRING },
                          },
                          required: ['hasIssue', 'severity', 'issueTitle', 'issueDetail'],
                        },
                        missingAudit: {
                          type: Type.OBJECT,
                          properties: {
                            hasMissing: { type: Type.BOOLEAN },
                            missingTitle: { type: Type.STRING },
                            missingSnippet: { type: Type.STRING },
                            reason: { type: Type.STRING },
                          },
                          required: ['hasMissing', 'missingTitle', 'missingSnippet', 'reason'],
                        },
                        recommendedPatch: { type: Type.STRING },
                      },
                      required: ['technicalDetail', 'bugAudit', 'missingAudit'],
                    },
                  },
                  required: [
                    'lineNumber',
                    'shortRole',
                    'subCommentBeginner',
                    'subCommentIntermediate',
                    'subCommentAdvanced',
                    'beginner',
                    'intermediate',
                    'advanced',
                  ],
                },
              },
            },
            required: ['title', 'language', 'summary', 'lines'],
          },
        },
      });

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error('Empty AI response');
      }

      const aiParsed = JSON.parse(textOutput) as {
        title: string;
        language: string;
        summary: string;
        lines: Array<{
          lineNumber: number;
          shortRole: string;
          subCommentBeginner?: string;
          subCommentIntermediate?: string;
          subCommentAdvanced?: string;
          beginner?: {
            definition?: string;
            easyExplanation: string;
            whyUsedHere: string;
            wrongExample?: { code: string; reason: string };
            betterExample?: { code: string; reason: string };
            tokens?: Array<{ token: string; meaning: string }>;
          };
          intermediate?: {
            isBasic?: boolean;
            howItWorks?: string;
            codeCheckVerdict: string;
            betterRefactor?: { code: string; reason: string };
            suggestedAdditions?: Array<{ code: string; meaning: string; whyAdd: string }>;
          };
          advanced?: {
            technicalDetail?: string;
            bugAudit: {
              hasIssue: boolean;
              severity: 'none' | 'warning' | 'error' | 'security';
              issueTitle: string;
              issueDetail: string;
            };
            missingAudit: {
              hasMissing: boolean;
              missingTitle: string;
              missingSnippet: string;
              reason: string;
            };
            recommendedPatch?: string;
          };
        }>;
      };

      const fallbackMaster = buildFallbackAnalysis(cleanCode);

      const mergedLines: LineInterpretation[] = rawLines.map((rawLine, idx) => {
        const lineNum = idx + 1;
        const isBlank = rawLine.trim().length === 0;
        const aiLine = aiParsed.lines?.find((l) => l.lineNumber === lineNum);
        // 문서 전체 문맥(괄호·태그 짝)까지 검사한 결과를 기준으로 사용
        const fallbackLine = fallbackMaster.lines[idx] ?? interpretSingleLineFallback(rawLine, lineNum);

        if (!aiLine || isBlank) {
          return fallbackLine;
        }

        const merged: LineInterpretation = {
          lineNumber: lineNum,
          code: rawLine,
          isBlank: false,
          shortRole: aiLine.shortRole || fallbackLine.shortRole,
          hasError: fallbackLine.hasError,
          errorDetail: fallbackLine.errorDetail,
          subCommentBeginner:
            aiLine.subCommentBeginner || fallbackLine.subCommentBeginner,
          subCommentIntermediate:
            aiLine.subCommentIntermediate || fallbackLine.subCommentIntermediate,
          subCommentAdvanced:
            aiLine.subCommentAdvanced || fallbackLine.subCommentAdvanced,
          beginner: {
            definition: aiLine.beginner?.definition || fallbackLine.beginner.definition,
            easyExplanation:
              aiLine.beginner?.easyExplanation || fallbackLine.beginner.easyExplanation,
            whyUsedHere:
              aiLine.beginner?.whyUsedHere || fallbackLine.beginner.whyUsedHere,
            wrongExample:
              aiLine.beginner?.wrongExample || fallbackLine.beginner.wrongExample,
            betterExample:
              aiLine.beginner?.betterExample || fallbackLine.beginner.betterExample,
            tokens:
              aiLine.beginner?.tokens && aiLine.beginner.tokens.length > 0
                ? aiLine.beginner.tokens
                : fallbackLine.beginner.tokens,
          },
          intermediate: {
            isBasic:
              typeof aiLine.intermediate?.isBasic === 'boolean'
                ? aiLine.intermediate.isBasic
                : fallbackLine.intermediate.isBasic,
            howItWorks:
              aiLine.intermediate?.howItWorks || fallbackLine.intermediate.howItWorks,
            codeCheckVerdict:
              aiLine.intermediate?.codeCheckVerdict ||
              fallbackLine.intermediate.codeCheckVerdict,
            betterRefactor:
              aiLine.intermediate?.betterRefactor ||
              fallbackLine.intermediate.betterRefactor,
            suggestedAdditions:
              aiLine.intermediate?.suggestedAdditions ||
              fallbackLine.intermediate.suggestedAdditions,
          },
          advanced: {
            technicalDetail:
              aiLine.advanced?.technicalDetail || fallbackLine.advanced.technicalDetail,
            bugAudit:
              aiLine.advanced?.bugAudit || fallbackLine.advanced.bugAudit,
            missingAudit:
              aiLine.advanced?.missingAudit || fallbackLine.advanced.missingAudit,
            recommendedPatch:
              aiLine.advanced?.recommendedPatch || fallbackLine.advanced.recommendedPatch,
          },
        };

        // 문법 오류는 검사기 결과를 우선 (AI 해설이 오류를 놓쳐도 빨간 줄 표시 유지)
        if (fallbackLine.hasError && fallbackLine.errorDetail) {
          return applySyntaxError(merged, {
            detail: fallbackLine.errorDetail,
            fixed: fallbackLine.advanced.bugAudit.issueTitle.startsWith('문법 오류')
              ? fallbackLine.advanced.recommendedPatch
              : undefined,
          });
        }
        return merged;
      });

      const result: SimpleCodeAnalysis = {
        title: aiParsed.title || fallbackMaster.title,
        language: aiParsed.language || fallbackMaster.language,
        summary: aiParsed.summary || fallbackMaster.summary,
        originalCode: cleanCode,
        commentedCodeBeginner: fallbackMaster.commentedCodeBeginner,
        commentedCodeIntermediate: fallbackMaster.commentedCodeIntermediate,
        commentedCodeAdvanced: fallbackMaster.commentedCodeAdvanced,
        lines: mergedLines,
      };

      res.json(result);
    } catch (error) {
      console.warn('Using built-in multi-level analyzer fallback:', error);
      const fallbackResult = buildFallbackAnalysis(cleanCode);
      res.json(fallbackResult);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CODEMATE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
