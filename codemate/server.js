// 코드메이트 AI 서버: 정적 파일 제공 + Claude API 프록시 (의존성 없음, Node 20+)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const PORT = process.env.PORT || 3000;
const KEY = process.env.ANTHROPIC_API_KEY;
const MODELS = {
  default: process.env.MODEL_DEFAULT || 'claude-sonnet-5-5',
  quick: process.env.MODEL_QUICK || 'claude-haiku-5-5',
};
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

// 키 하나를 여러 사람이 쓰더라도 폭주하지 않도록 IP당 분당 호출 제한
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 30;
}

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

async function readBody(req, max = 200_000) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > max) throw Object.assign(new Error('too large'), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// 모델 응답에서 JSON 객체만 뽑아낸다 (```json 펜스가 붙어도 처리)
function extractJson(text) {
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s < 0 || e < s) throw new Error('no json');
  return JSON.parse(text.slice(s, e + 1));
}

async function handleAI(req, res) {
  if (!KEY) return send(res, 503, { code: 'not_granted', message: 'ANTHROPIC_API_KEY가 설정되지 않았어요.' });
  if (limited(req.socket.remoteAddress)) return send(res, 429, { code: 'rate_limited' });
  let body;
  try { body = JSON.parse(await readBody(req)); }
  catch (e) { return send(res, e.status || 400, { code: 'bad_request' }); }
  const { prompt, tier } = body;
  if (typeof prompt !== 'string' || !prompt.trim()) return send(res, 400, { code: 'bad_request' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODELS[tier] || MODELS.default,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (r.status === 429) return send(res, 429, { code: 'rate_limited' });
    if (!r.ok) {
      console.error('Anthropic API', r.status, await r.text());
      return send(res, 502, { code: 'upstream' });
    }
    const data = await r.json();
    const text = data.content?.map(b => b.text || '').join('') || '';
    send(res, 200, extractJson(text));
  } catch (e) {
    console.error(e);
    send(res, 502, { code: 'bad' });
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/api/ai') return handleAI(req, res);
  if (req.method !== 'GET') return send(res, 405, { code: 'method' });
  const rel = url.pathname === '/' ? 'index.html' : normalize(url.pathname).replace(/^([/\\]|\.\.)+/, '');
  try {
    send(res, 200, await readFile(join(ROOT, rel)), MIME[extname(rel)] || 'application/octet-stream');
  } catch { send(res, 404, 'Not found', 'text/plain'); }
}).listen(PORT, () => {
  console.log(`코드메이트 AI: http://localhost:${PORT}`);
  if (!KEY) console.log('⚠ ANTHROPIC_API_KEY 없음 → 기본 규칙 모드로 동작해요.');
});
