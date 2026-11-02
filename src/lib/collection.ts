/** 수집함 — 여행 가방 스티커 · 책 엽서 · 칭호 핀. 모두 실제 기록에서만 계산해요. */
import type { BookView } from '../store';
import type { DataSet, Place } from '../types';
import { SEED_PLACES } from '../seed/books';
import { computeStamps, hash } from './passport';
import { timesFor } from './selectors';
import { computeConquest } from './conquest';

export type Rarity = 'normal' | 'gold' | 'holo';
export interface Sticker {
  id: string;
  placeId: string;
  name: string;
  sub: string;
  year: number | null;
  rarity: Rarity;
  art: string | null;
  books: { workId: string; linkId: string; title: string }[];
  rot: number;
}

/** Codex가 그려 줄 스티커가 있는 장소(샘플 41곳) */
const ART_IDS = Object.keys(SEED_PLACES).map((k) => `p-${k}`);
const ART = new Set(ART_IDS);
export const stickerArt = (placeId: string) => (ART.has(placeId) ? `collect/stickers/${placeId}.webp` : null);

export function computeStickers(books: BookView[], data: DataSet) {
  const { stamps } = computeStamps(books, data);
  const places = new Map(data.places.map((p) => [p.id, p]));
  const owned: Sticker[] = stamps.map((s) => {
    const p = places.get(s.placeId!) as Place;
    const h = hash(`k-${s.placeId}`);
    return {
      id: `k-${s.placeId}`,
      placeId: s.placeId!,
      name: s.name,
      sub: p?.reality === 'fictional' ? '작품 속 가상 장소' : p?.country ?? '',
      year: s.year,
      rarity: p?.reality === 'fictional' ? 'holo' : s.books.length >= 3 ? 'gold' : 'normal',
      art: stickerArt(s.placeId!),
      books: s.books,
      rot: ((h % 1800) / 100 - 9) | 0,
    };
  });
  const have = new Set(owned.map((s) => s.placeId));
  const locked = ART_IDS.filter((id) => !have.has(id)).map((id) => ({ placeId: id, name: SEED_PLACES[id.slice(2)]?.name ?? '' }));
  return { owned, locked, total: Math.max(ART_IDS.length, owned.length) };
}

export interface Postcard {
  workId: string;
  linkId: string;
  title: string;
  place: Place;
  year: number | null;
  memo: string;
  date: string;
  category: BookView['work']['category'];
  art: string | null;
  rarity: Rarity;
}

export function computePostcards(books: BookView[], data: DataSet): Postcard[] {
  const places = new Map(data.places.filter((p) => !p.deletedAt).map((p) => [p.id, p]));
  const temporals = new Map(data.temporals.filter((t) => !t.deletedAt).map((t) => [t.id, t]));
  const out: Postcard[] = [];
  for (const b of books) {
    const withPlace = b.links.filter((l) => l.placeId && places.has(l.placeId)).sort((a, c) => (a.narrativeOrder ?? 99) - (c.narrativeOrder ?? 99));
    const l = withPlace[0];
    if (!l) continue;
    const place = places.get(l.placeId!)!;
    const ys = timesFor(l, temporals).filter((t) => t.kind !== 'publication' && t.startYear != null).map((t) => t.startYear!);
    const note = data.notes.find((n) => n.libraryEntryId === b.entry.id && n.scope === 'book' && !n.deletedAt);
    const d = new Date(b.entry.completedAt || b.entry.addedAt);
    out.push({
      workId: b.work.id,
      linkId: l.id,
      title: b.work.canonicalTitle,
      place,
      year: ys.length ? Math.min(...ys) : null,
      memo: note?.body?.trim() ?? '',
      date: Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
      category: b.work.category,
      art: stickerArt(place.id),
      rarity: place.reality === 'fictional' ? 'holo' : 'normal',
    });
  }
  // 메모를 쓴 엽서가 앞으로
  out.sort((a, c) => Number(Boolean(c.memo)) - Number(Boolean(a.memo)) || (a.year ?? 9e9) - (c.year ?? 9e9));
  return out;
}

export const PIN_IDS = ['citizen', 'continents', 'time', 'fiction', 'thinkers', 'sources', 'antipode'] as const;
export type PinId = (typeof PIN_IDS)[number];

export function computePins(books: BookView[], data: DataSet) {
  const c = computeConquest(books, data);
  return c.titles.map((t, i) => ({ id: PIN_IDS[i] ?? 'citizen', name: t.name, earned: t.earned, why: t.why, art: `collect/pins/${PIN_IDS[i] ?? 'citizen'}.webp` }));
}
