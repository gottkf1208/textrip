/**
 * TEXTRIP 서버(선택): Cloudflare Worker
 * - 정적 파일(dist)을 그대로 서빙하고
 * - /api/recognitions 에서 Claude Vision을 호출한다. API 키는 서버 비밀값(ANTHROPIC_API_KEY)에만 둔다.
 * 배포: npx wrangler deploy  /  키 등록: npx wrangler secret put ANTHROPIC_API_KEY
 */
import { buildClaudeRequest, DEFAULT_MODEL, parseCandidates, textFromClaude } from '../src/lib/recognitionCore';

interface Env {
  ASSETS: { fetch: (r: Request) => Promise<Response> };
  ANTHROPIC_API_KEY?: string;
  CLAUDE_MODEL?: string;
}

const MAX_BASE64 = 6 * 1024 * 1024; // 앱이 4MB 이하 JPEG로 줄여 보낸다
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.endsWith('/api/health')) {
      return json({ recognition: Boolean(env.ANTHROPIC_API_KEY), model: env.CLAUDE_MODEL || DEFAULT_MODEL });
    }
    if (url.pathname.endsWith('/api/recognitions')) {
      if (req.method !== 'POST') return json({ error: 'POST만 받아요.' }, 405);
      if (!env.ANTHROPIC_API_KEY) return json({ error: '서버에 API 키가 없어요.' }, 503);
      let body: { imageId?: unknown; image?: unknown };
      try {
        body = await req.json();
      } catch {
        return json({ error: '요청 형식이 맞지 않아요.' }, 400);
      }
      const imageId = typeof body.imageId === 'string' ? body.imageId.slice(0, 80) : 'image';
      const image = typeof body.image === 'string' ? body.image : '';
      if (!image || image.length > MAX_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 200))) return json({ error: '사진 데이터가 없거나 너무 커요.' }, 413);
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(buildClaudeRequest(image, env.CLAUDE_MODEL || DEFAULT_MODEL)),
      });
      if (!r.ok) return json({ error: `분석 서비스 오류 (${r.status})` }, r.status === 429 ? 429 : 502);
      try {
        const candidates = parseCandidates(textFromClaude(await r.json()), imageId);
        return json({ imageId, candidates });
      } catch (e) {
        return json({ error: e instanceof Error ? e.message : '결과를 읽지 못했어요.' }, 502);
      }
    }
    return env.ASSETS.fetch(req);
  },
};
