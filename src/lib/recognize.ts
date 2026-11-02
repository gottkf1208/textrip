import { buildClaudeRequest, DEFAULT_MODEL, parseCandidates, textFromClaude, type Candidate } from './recognitionCore';

/**
 * 사진 인식 연결 방식
 *  - server: 같은 주소의 /api/recognitions (Cloudflare Worker, 키는 서버 비밀값)
 *  - device: 이 기기에만 저장한 Claude API 키로 브라우저에서 직접 호출
 *  - none:   연결 없음 → 직접 입력만
 */
export type Provider = { kind: 'server'; model: string } | { kind: 'device'; model: string } | { kind: 'none' };

const KEY = 'textrip.claudeKey';
const MODEL = 'textrip.claudeModel';

const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string | null) {
    try {
      if (v) localStorage.setItem(k, v);
      else localStorage.removeItem(k);
    } catch {
      /* 저장 불가 환경 */
    }
  },
};

export const getDeviceKey = () => ls.get(KEY);
export const setDeviceKey = (k: string | null) => ls.set(KEY, k?.trim() || null);
export const getModel = () => ls.get(MODEL) || DEFAULT_MODEL;
export const setModel = (m: string | null) => ls.set(MODEL, m?.trim() || null);

let serverCache: Promise<{ ok: boolean; model?: string }> | null = null;
export function checkServer(force = false) {
  if (!serverCache || force) {
    serverCache = (async () => {
      try {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), 3500);
        const r = await fetch(`${import.meta.env.BASE_URL}api/health`, { signal: ctl.signal, cache: 'no-store' });
        clearTimeout(t);
        if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return { ok: false };
        const j = await r.json();
        return { ok: Boolean(j.recognition), model: j.model };
      } catch {
        return { ok: false };
      }
    })();
  }
  return serverCache;
}

export async function resolveProvider(): Promise<Provider> {
  const s = await checkServer();
  if (s.ok) return { kind: 'server', model: s.model ?? DEFAULT_MODEL };
  if (getDeviceKey()) return { kind: 'device', model: getModel() };
  return { kind: 'none' };
}

export class RecognitionError extends Error {
  constructor(message: string, public retryable = false) {
    super(message);
  }
}

function explain(status: number, body: string): RecognitionError {
  if (status === 401 || status === 403) return new RecognitionError('Claude API 키를 확인해 주세요. 키가 틀렸거나 권한이 없어요.');
  if (status === 404 || /model/i.test(body)) return new RecognitionError('설정한 모델 이름을 확인해 주세요.');
  if (status === 413) return new RecognitionError('사진이 너무 커요. 책 부분만 잘라서 다시 시도해 주세요.');
  if (status === 429) return new RecognitionError('요청이 많아 잠시 막혔어요. 조금 뒤 다시 시도해 주세요.', true);
  if (status >= 500) return new RecognitionError('분석 서비스가 잠시 응답하지 않아요.', true);
  return new RecognitionError('사진 분석 요청이 거절됐어요.');
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      rej(new DOMException('aborted', 'AbortError'));
    });
  });

async function once(provider: Provider, imageId: string, base64: string, signal: AbortSignal): Promise<Candidate[]> {
  if (provider.kind === 'none') throw new RecognitionError('사진 인식이 연결되지 않았어요.');
  let res: Response;
  try {
    if (provider.kind === 'server') {
      res = await fetch(`${import.meta.env.BASE_URL}api/recognitions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId, image: base64 }),
        signal,
      });
    } else {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': getDeviceKey() ?? '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(buildClaudeRequest(base64, provider.model)),
        signal,
      });
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new RecognitionError('네트워크 연결을 확인해 주세요.', true);
  }
  const body = await res.text();
  if (!res.ok) throw explain(res.status, body);
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new RecognitionError('분석 결과를 읽지 못했어요.', true);
  }
  if (provider.kind === 'server') {
    const c = (json as { candidates?: Candidate[] }).candidates;
    if (!Array.isArray(c)) throw new RecognitionError('분석 결과 형식이 맞지 않아요.');
    return c;
  }
  return parseCandidates(textFromClaude(json), imageId);
}

/** 네트워크·429·일시적 서버 오류는 최대 2회 지연 재시도 */
export async function recognize(provider: Provider, imageId: string, base64: string, signal: AbortSignal) {
  const delays = [1500, 4000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await once(provider, imageId, base64, signal);
    } catch (e) {
      if (e instanceof RecognitionError && e.retryable && attempt < delays.length) {
        await sleep(delays[attempt], signal);
        continue;
      }
      throw e;
    }
  }
}
