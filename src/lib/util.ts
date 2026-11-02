import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Filters, TemporalContext } from '../types';

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** 중복 판정용: 공백·문장부호·권차 표기 제거 */
export function normalizeTitle(s: string) {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s·・,.:;!?'"“”‘’()[\]{}<>《》〈〉「」『』\-–—_/]/g, '')
    .replace(/(上|下|상권|하권|제?\d+권|vol\d+|\d+)$/u, '');
}

export function normalizeAuthors(a: string[]) {
  return a.map((x) => x.normalize('NFKC').replace(/\s|\(.*?\)|지음|옮김|저|역/g, '')).filter(Boolean).sort().join('|');
}

export type EraBucket = Filters['era'];

/** 시대 필터: 범위가 겹치면 포함. 연도가 없으면 null(시대 미상) */
export function eraMatches(times: TemporalContext[], era: EraBucket): boolean | null {
  const ranged = times.filter((t) => t.kind !== 'publication' && t.startYear != null);
  if (!ranged.length) return null;
  if (era === 'all') return true;
  const [lo, hi] = {
    ancient: [-5000, 499],
    premodern: [500, 1799],
    c19: [1800, 1899],
    c20: [1900, 1999],
    c21: [2000, 2100],
    all: [-1e9, 1e9],
  }[era];
  return ranged.some((t) => (t.startYear ?? 0) <= hi && (t.endYear ?? t.startYear ?? 0) >= lo);
}

export const ERA_LABEL: Record<EraBucket, string> = {
  all: '모든 시대',
  ancient: '고대',
  premodern: '중세·근세',
  c19: '19세기',
  c20: '20세기',
  c21: '21세기',
};

function subscribeMq(q: string) {
  return (cb: () => void) => {
    const m = window.matchMedia(q);
    m.addEventListener('change', cb);
    return () => m.removeEventListener('change', cb);
  };
}

export function useMediaQuery(q: string) {
  return useSyncExternalStore(subscribeMq(q), () => window.matchMedia(q).matches, () => false);
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** 모바일·좁은 높이·가로 모드에서 전체 화면 상세로 전환하는 기준 */
export function useLayout() {
  const mobile = useMediaQuery('(max-width: 767px)');
  const short = useMediaQuery('(max-height: 599px)');
  const desktop = useMediaQuery('(min-width: 1024px)');
  return { mobile: mobile || (short && !desktop), short, desktop, tablet: !mobile && !desktop };
}

/* ───── 해시 라우터 ───── */
export interface Route {
  name: 'map' | 'library' | 'book' | 'add' | 'settings' | 'conquest' | 'course' | 'collection';
  tab?: string;
  bookId?: string;
  linkId?: string;
  courseId?: string;
  layer?: string;
}

export function parseHash(h: string): Route {
  const [path, query = ''] = h.replace(/^#/, '').split('?');
  const q = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'library') return { name: 'library' };
  if (parts[0] === 'add') return { name: 'add' };
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'conquest') return { name: 'conquest' };
  if (parts[0] === 'collection') return { name: 'collection', tab: q.get('tab') ?? undefined };
  if (parts[0] === 'course' && parts[1]) return { name: 'course', courseId: decodeURIComponent(parts[1]) };
  if (parts[0] === 'books' && parts[1]) return { name: 'book', bookId: decodeURIComponent(parts[1]), linkId: q.get('link') ?? undefined };
  return { name: 'map', layer: q.get('layer') ?? undefined };
}

export function hrefFor(r: Route) {
  if (r.name === 'library') return '#/library';
  if (r.name === 'add') return '#/add';
  if (r.name === 'settings') return '#/settings';
  if (r.name === 'conquest') return '#/conquest';
  if (r.name === 'collection') return `#/collection${r.tab ? `?tab=${r.tab}` : ''}`;
  if (r.name === 'course' && r.courseId) return `#/course/${encodeURIComponent(r.courseId)}`;
  if (r.name === 'book' && r.bookId) return `#/books/${encodeURIComponent(r.bookId)}${r.linkId ? `?link=${encodeURIComponent(r.linkId)}` : ''}`;
  return '#/';
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (r: Route, replace = false) => {
  const h = hrefFor(r);
  if (replace) history.replaceState(null, '', h);
  else location.hash = h;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
};

export function formatAuthors(a: string[], translators?: string[]) {
  const main = a.length ? a.join(' · ') : '저자 확인 필요';
  return translators?.length ? `${main} · ${translators.join(' · ')} 옮김` : main;
}
