import 'dotenv/config';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { analyzeCode } from './src/server/analyze.ts';

// OPENAI_API_KEY 등 비밀 값은 .env.local(깃에 올라가지 않음)에서 서버만 읽는다.
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Cloud Run / Kubernetes 헬스체크 엔드포인트
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/analyze-code', async (req, res) => {
    const { code } = (req.body ?? {}) as { code?: string };
    const { status, body } = await analyzeCode(code);
    res.status(status).json(body);
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
