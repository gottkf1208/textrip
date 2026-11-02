/**
 * 책 표지 — 저장된 표지(도서 검색으로 고른 것) → 자동으로 찾은 표지(Google Books) → 내가 찍은 책등 사진 → 글자 표지 순서로 보여 줘요.
 * 자동으로 찾은 표지는 이 기기에만 기억해요(다시 찾지 않게). 사용자가 직접 고르면 그 표지로 고정돼요.
 */
import { useEffect, useReducer, useState } from 'react';
import type { BookView } from '../store';
import { normalizeTitle } from './util';

const KEY = 'textrip.covers.v1';
const MISS_TTL = 3 * 864e5;
type Entry = { u: string; t: number; pin?: 1 };

let cache: Record<string, Entry> = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
})();
const listeners = new Set<() => void>();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* 저장 공간이 없으면 이번 세션에서만 */
  }
  listeners.forEach((f) => f());
};

export const cleanThumb = (u: string) => u.replace(/^http:/, 'https:').replace(/&edge=curl/, '');

export function setCover(workId: string, url: string | null) {
  cache = { ...cache, [workId]: { u: url ?? '', t: Date.now(), pin: 1 } };
  persist();
}

/* ── 자동 찾기: 한 번에 2권씩, 조금씩 쉬어 가며 ── */
const queue: BookView[] = [];
/** Google이 한도 초과(429)를 주면 한동안 쉬어요 */
let blockedUntil = 0;
const inflight = new Set<string>();
let running = 0;

interface Vol {
  title?: string;
  subtitle?: string;
  authors?: string[];
  language?: string;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
}

export async function findCovers(title: string, author: string | null, signal?: AbortSignal): Promise<{ url: string; title: string; score: number }[]> {
  const q = `intitle:${title}${author ? ` inauthor:${author}` : ''}`;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books&fields=items(volumeInfo(title,subtitle,authors,language,imageLinks))`;
  let items: { volumeInfo: Vol }[] = [];
  if (Date.now() > blockedUntil) {
    const r = await fetch(url, { signal });
    if (r.status === 429) blockedUntil = Date.now() + 10 * 60 * 1000;
    else if (r.ok) items = ((await r.json()) as { items?: { volumeInfo: Vol }[] }).items ?? [];
  }
  if (!items.length) return openLibrary(title, author, signal);
  const j = { items };
  const want = normalizeTitle(title);
  const who = author ? normalizeTitle(author) : '';
  const out: { url: string; title: string; score: number }[] = [];
  for (const it of j.items ?? []) {
    const v = it.volumeInfo;
    const th = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
    if (!th) continue;
    const t = normalizeTitle(v.title ?? '');
    let score = 0;
    if (t === want) score += 3;
    else if (t.includes(want) || want.includes(t)) score += 2;
    if (v.language === 'ko') score += 1;
    if (who && (v.authors ?? []).some((a) => normalizeTitle(a).includes(who) || who.includes(normalizeTitle(a)))) score += 1;
    out.push({ url: cleanThumb(th), title: [v.title, v.subtitle].filter(Boolean).join(': '), score });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** 보조: Open Library (외서·고전에 강함) */
async function openLibrary(title: string, author: string | null, signal?: AbortSignal) {
  const u = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}${author ? `&author=${encodeURIComponent(author)}` : ''}&limit=8&fields=title,author_name,cover_i,language`;
  const r = await fetch(u, { signal });
  if (!r.ok) throw new Error(String(r.status));
  const j = (await r.json()) as { docs?: { title?: string; cover_i?: number; language?: string[] }[] };
  const want = normalizeTitle(title);
  return (j.docs ?? [])
    .filter((d) => d.cover_i)
    .map((d) => {
      const t = normalizeTitle(d.title ?? '');
      const score = (t === want ? 3 : t.includes(want) || want.includes(t) ? 2 : 0) + (d.language?.includes('kor') ? 1 : 0);
      return { url: `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`, title: d.title ?? '', score };
    })
    .sort((a, b) => b.score - a.score);
}

async function lookup(b: BookView) {
  const title = b.work.canonicalTitle;
  const author = b.work.authors[0] ?? null;
  let hits = await findCovers(title, author);
  if (!hits.some((h) => h.score >= 2) && author) hits = await findCovers(title, null);
  const best = hits.find((h) => h.score >= 2);
  // Google이 쉬는 중에 못 찾은 건 1시간 뒤 다시 찾아요
  const t = !best && Date.now() < blockedUntil ? Date.now() - MISS_TTL + 3600e3 : Date.now();
  cache = { ...cache, [b.work.id]: { u: best?.url ?? '', t } };
  persist();
}

function pump() {
  while (running < 2 && queue.length) {
    const b = queue.shift()!;
    running++;
    lookup(b)
      .catch(() => {
        /* 네트워크·한도 초과: 다음에 다시 */
      })
      .finally(() => {
        inflight.delete(b.work.id);
        setTimeout(() => {
          running--;
          pump();
        }, 250);
      });
  }
}

function want(b: BookView) {
  if (b.editions.some((e) => e.coverUrl)) return false;
  const c = cache[b.work.id];
  if (c && (c.u || c.pin || Date.now() - c.t < MISS_TTL)) return false;
  return !inflight.has(b.work.id);
}

export function coverUrlOf(b: BookView): string | null {
  const c = cache[b.work.id];
  if (c?.pin) return c.u || null;
  return b.editions.find((e) => e.coverUrl)?.coverUrl ?? (c?.u || null);
}

export function useCover(b: BookView | null) {
  const [, tick] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    listeners.add(tick);
    return () => {
      listeners.delete(tick);
    };
  }, []);
  useEffect(() => {
    if (!b || !want(b) || typeof navigator === 'undefined' || navigator.onLine === false) return;
    inflight.add(b.work.id);
    queue.push(b);
    pump();
  }, [b]);
  return b ? coverUrlOf(b) : null;
}

/** 표지 한 장. size: xs(목록 36) · s(책장 52) · m(상세 88) · fill(부모 크기) */
export function Cover({ book, size = 's', className = '' }: { book: BookView; size?: 'xs' | 's' | 'm' | 'fill'; className?: string }) {
  const url = useCover(book);
  const [bad, setBad] = useState<string | null>(null);
  const spine = book.editions.find((e) => e.spineImage)?.spineImage ?? null;
  const cls = `cover cv-${size} ${className}`;
  if (url && bad !== url) return <img className={cls} src={url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(url)} />;
  if (spine)
    return (
      <span className={`${cls} cv-spine`} aria-hidden>
        <img src={spine} alt="" />
      </span>
    );
  return (
    <span className={`${cls} cv-gen cv-${book.work.category}`} aria-hidden>
      <b>{book.work.canonicalTitle}</b>
      {size !== 'xs' && <small>{book.work.authors[0] ?? ''}</small>}
    </span>
  );
}
