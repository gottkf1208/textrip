/** 독서 여권 — 도장·탑승권 데이터. 모두 실제 기록에서만 만든다. */
import type { BookView } from '../store';
import type { DataSet, Place, TemporalContext } from '../types';
import { timesFor } from './selectors';

export type StampShape = 'circle' | 'rect' | 'oval' | 'fictional' | 'locked';
export interface Stamp {
  id: string;
  placeId: string | null;
  name: string;
  sub: string; // 나라
  year: number | null;
  shape: StampShape;
  ink: string;
  rot: number;
  books: { workId: string; linkId: string; title: string }[];
}

export const INK = { burgundy: '#6e1a2f', navy: '#1f3460', black: '#22201d', brown: '#6b4a2b' };

/** 문자열 → 안정적인 정수 (도장 기울기·여권번호용) */
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const CONTINENT_INK: Record<string, string> = {
  '250': INK.burgundy, '380': INK.burgundy, '724': INK.burgundy, '756': INK.burgundy, '788': INK.brown, '710': INK.brown,
  '840': INK.navy, '156': INK.black, '392': INK.black, '360': INK.black, '410': INK.navy,
};

const yearOf = (ts: TemporalContext[]) => {
  const ys = ts.filter((t) => t.kind !== 'publication' && t.startYear != null).map((t) => t.startYear!);
  return ys.length ? Math.min(...ys) : null;
};

export function computeStamps(books: BookView[], data: DataSet): { stamps: Stamp[]; locked: string[] } {
  const places = new Map(data.places.filter((p) => !p.deletedAt).map((p) => [p.id, p]));
  const temporals = new Map(data.temporals.filter((t) => !t.deletedAt).map((t) => [t.id, t]));
  const byPlace = new Map<string, { place: Place; years: number[]; books: Stamp['books'] }>();
  for (const b of books) {
    for (const l of b.links) {
      const p = l.placeId ? places.get(l.placeId) : null;
      if (!p) continue;
      const rec = byPlace.get(p.id) ?? { place: p, years: [], books: [] };
      const y = yearOf(timesFor(l, temporals));
      if (y != null) rec.years.push(y);
      if (!rec.books.some((x) => x.workId === b.work.id)) rec.books.push({ workId: b.work.id, linkId: l.id, title: b.work.canonicalTitle });
      byPlace.set(p.id, rec);
    }
  }
  const stamps: Stamp[] = [...byPlace.values()].map(({ place: p, years, books }) => {
    const h = hash(p.id);
    const shape: StampShape = p.reality === 'fictional' ? 'fictional' : p.precision === 'country' ? 'rect' : p.precision === 'region' ? 'oval' : 'circle';
    return {
      id: `s-${p.id}`,
      placeId: p.id,
      name: p.displayName,
      sub: p.country && p.country !== p.displayName ? p.country.split(' ')[0] : p.reality === 'fictional' ? '가상 입국' : '',
      year: years.length ? Math.min(...years) : null,
      shape,
      ink: shape === 'fictional' ? INK.black : CONTINENT_INK[p.countryCode ?? ''] ?? INK.burgundy,
      rot: ((h % 2400) / 100 - 12) | 0,
      books,
    };
  });
  // 연도순(이야기 속 시간 여행 순서), 연도 없는 것은 뒤로
  stamps.sort((a, b) => (a.year ?? 1e9) - (b.year ?? 1e9) || a.name.localeCompare(b.name, 'ko'));
  return { stamps, locked: [] };
}

export const formatStampYear = (y: number | null) => (y == null ? '— — —' : y < 0 ? `BC ${-y}` : String(y));

/** 탑승권에 쓰는 도시 약어 (공항 코드가 아니라 이 앱의 표기) */
const CODE: Record<string, string> = {
  'p-paris': 'PAR', 'p-besancon': 'BSN', 'p-lehavre': 'LHV', 'p-rouen': 'RNE', 'p-nordbasin': 'NRD', 'p-vernon': 'VRN', 'p-nice': 'NCE',
  'p-orsay': 'ORS', 'p-louvre': 'LVR', 'p-nyc': 'NYC', 'p-neworleans': 'NOL', 'p-newport': 'NPT', 'p-staugustine': 'STA', 'p-usa': 'USA',
  'p-liguria': 'RIV', 'p-rome': 'ROM', 'p-rapallo': 'RAP', 'p-italy': 'ITA', 'p-silsmaria': 'SLS', 'p-spain': 'ESP', 'p-prado': 'PRD',
  'p-tunis': 'TUN', 'p-southafrica': 'RSA', 'p-china': 'CHN', 'p-fujian': 'FJN', 'p-yongkang': 'YKG', 'p-qufu': 'QUF', 'p-tokyo': 'TYO',
  'p-bali': 'BAL', 'p-peninsula': 'KOR', 'p-korea': 'KOR', 'p-seoul': 'SEL', 'p-jeju': 'JJU', 'p-busan': 'PUS',
  'p-verrieres': 'VRR', 'p-montsou': 'MTS', 'p-croixmaufras': 'CXM', 'p-westegg': 'WEG', 'p-bellereve': 'BLR', 'p-woollett': 'WLT', 'p-beika': 'BKA',
};
export const placeCode = (p: Place | null | undefined) => (p ? CODE[p.id] ?? 'TXT' : 'IDEA');

export function passportNo(seed: string) {
  const h = hash(seed || 'textrip');
  return `TX${String(h % 10000000).padStart(7, '0')}`;
}

const HOLDER_KEY = 'textrip.holder';
export function getHolder(fallback: string) {
  try {
    return localStorage.getItem(HOLDER_KEY) || fallback;
  } catch {
    return fallback;
  }
}
export function setHolder(v: string) {
  try {
    localStorage.setItem(HOLDER_KEY, v.trim().slice(0, 20));
  } catch {
    /* 저장 안 돼도 화면에는 보임 */
  }
}

const SEEN_KEY = (mode: string) => `textrip.seenStamps.${mode}`;
export function getSeen(mode: string): Set<string> | null {
  try {
    const v = localStorage.getItem(SEEN_KEY(mode));
    return v ? new Set(JSON.parse(v)) : null;
  } catch {
    return null;
  }
}
export function setSeen(mode: string, ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY(mode), JSON.stringify(ids));
  } catch {
    /* noop */
  }
}

export async function saveNodeAsImage(node: HTMLElement, filename: string, bg = '#ffffff') {
  const { toPng } = await import('html-to-image');
  const url = await toPng(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true });
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
