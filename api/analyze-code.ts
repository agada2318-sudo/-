// Vercel 서버리스 함수: POST /api/analyze-code
// 로컬 개발용 Express 서버(server.ts)와 같은 analyzeCode()를 쓴다.
// OPENAI_API_KEY 는 Vercel 환경변수에서 서버만 읽는다.
import { analyzeCode } from '../src/server/analyze.ts';

interface Req {
  method?: string;
  body?: unknown;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

export const config = { maxDuration: 60 };

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'POST 요청만 받아요.' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = undefined;
    }
  }
  const code = (body as { code?: string } | undefined)?.code;
  const { status, body: result } = await analyzeCode(code);
  res.status(status).json(result);
}
