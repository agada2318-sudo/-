import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildFallbackAnalysis,
  interpretSingleLineFallback,
} from './src/utils/codeAnalyzer.ts';
import { LineInterpretation, SimpleCodeAnalysis } from './src/types.ts';

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
      const systemInstruction = `당신은 초급자, 중급자, 전공자 3개 수준별로 코드를 정확히 차별화하여 해석해주는 'CODE EASY' 수석 코드 튜터입니다.
사용자가 입력한 코드를 1번 줄부터 마지막 ${rawLines.length}번 줄까지 각 줄마다 아래 3가지 레벨별 관점으로 해석하세요:

1. [초급자 레벨 - 가장 친절하고 디테일하며 구체적인 일상어 해설]:
   - subCommentBeginner: 코드 바로 아래에 달릴 아주 친절하고 쉬운 1문장 일상어 주석
   - easyExplanation (이 줄은 무슨 의미인가요?):
     * 딱딱한 정의나 단답형 대신, 코드의 태그/속성/텍스트가 화면에서 실제로 어떤 동작과 결과물을 만드는지 풀어서 설명하세요.
     * [필수 예시 스타일 1]: <h1>환영합니다</h1> -> "제일 큰 글씨로 환영합니다를 출력하는 태그입니다."
     * [필수 예시 스타일 2]: <button type="submit">로그인</button> -> "버튼의 타입을 제출할 수 있는 버튼 형식으로 만든 후 그 버튼의 이름을 로그인으로 표시하는 명령어입니다."
     * [필수 예시 스타일 3]: <input type="text" placeholder="..."> -> "사용자가 키보드로 힌트를 보고 글자나 아이디를 직접 입력할 수 있는 한 줄 입력창을 만드는 명령어입니다."
   - whyUsedHere (왜 이 코드가 여기서 사용되었나요? 목적과 이유 예측):
     * 전체 화면과 문맥에서 이 코드가 왜 여기에 쓰였는지 그 목적과 역할을 구체적으로 예측하여 설명하세요.
     * [필수 예시 스타일 1]: <h1>환영합니다</h1> -> "이 화면에서 가장 큰 첫번째 제목 글자를 표시하는 태그입니다."
     * [필수 예시 스타일 2]: <button type="submit">로그인</button> -> "사용자가 입력한 양식 정보를 서버로 전송(제출)하기 위해 클릭할 수 있도록 배치한 필수 입력 버튼입니다."
     * [필수 예시 스타일 3]: <input ...> -> "로그인에 필요한 사용자의 계정 정보를 화면에서 직접 입력받기 위해 사용되었습니다."
   - wrongExample / betterExample: 초보자가 흔히 틀리는 코드와 더 좋은 기초 코드
   - tokens: 태그/속성/키워드별 조각 단어 의미

2. [중급자 레벨]:
   - subCommentIntermediate: 코드 검증 포인트 및 리팩토링 핵심 주석
   - codeCheckVerdict: 코드가 틀리지 않았는지 더 꼼꼼하게 검증한 소견
   - betterRefactor: 더 나은 코드 추천 (리팩토링, 클린 코드, 웹 표준, 성능)
   - suggestedAdditions: 지금까지 만든 코드에서 더 추가하면 좋을 코드와 그 코드를 왜 넣는지(의미/이유)

3. [전공자 레벨]:
   - subCommentAdvanced: 뻔한 설명 없이 코드의 잠재 버그/누락 점검 중심 주석
   - bugAudit: 코드의 런타임 오류, 취약점, 엣지 케이스 버그 분석 (hasIssue, severity, issueTitle, issueDetail)
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
                      required: ['easyExplanation', 'whyUsedHere', 'tokens'],
                    },
                    intermediate: {
                      type: Type.OBJECT,
                      properties: {
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
                      required: ['codeCheckVerdict'],
                    },
                    advanced: {
                      type: Type.OBJECT,
                      properties: {
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
                      required: ['bugAudit', 'missingAudit'],
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
            easyExplanation: string;
            whyUsedHere: string;
            wrongExample?: { code: string; reason: string };
            betterExample?: { code: string; reason: string };
            tokens?: Array<{ token: string; meaning: string }>;
          };
          intermediate?: {
            codeCheckVerdict: string;
            betterRefactor?: { code: string; reason: string };
            suggestedAdditions?: Array<{ code: string; meaning: string; whyAdd: string }>;
          };
          advanced?: {
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
        const fallbackLine = interpretSingleLineFallback(rawLine, lineNum);

        if (!aiLine || isBlank) {
          return fallbackLine;
        }

        return {
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
            bugAudit:
              aiLine.advanced?.bugAudit || fallbackLine.advanced.bugAudit,
            missingAudit:
              aiLine.advanced?.missingAudit || fallbackLine.advanced.missingAudit,
            recommendedPatch:
              aiLine.advanced?.recommendedPatch || fallbackLine.advanced.recommendedPatch,
          },
        };
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
    console.log(`CODE EASY server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
