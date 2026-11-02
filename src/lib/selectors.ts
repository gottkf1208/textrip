import type { BookView } from '../store';
import type { ContextLink, DataSet, Filters, Place, TemporalContext } from '../types';
import { eraMatches } from './util';

export interface PlaceItem {
  book: BookView;
  link: ContextLink;
}
export interface PlaceGroup {
  place: Place;
  items: PlaceItem[];
  pendingOnly: boolean;
}

export type LinkState = 'linked' | 'review' | 'unplaced';
export const LINK_STATE_LABEL: Record<LinkState, string> = {
  linked: '장소 연결됨',
  review: '연결 검토 중',
  unplaced: '위치 없이 기록',
};

export function timesFor(link: ContextLink, temporals: Map<string, TemporalContext>) {
  return link.temporalContextIds.map((id) => temporals.get(id)).filter(Boolean) as TemporalContext[];
}

export function linkState(book: BookView, places: Map<string, Place>): LinkState {
  const placed = book.links.filter((l) => l.placeId && places.get(l.placeId));
  if (!placed.length) return 'unplaced';
  return placed.some((l) => l.verificationStatus === 'curated' || l.verificationStatus === 'user_authored' || l.userAcceptedAt) ? 'linked' : 'review';
}

export function computeView(books: BookView[], data: DataSet, filters: Filters) {
  const places = new Map(data.places.filter((p) => !p.deletedAt).map((p) => [p.id, p]));
  const temporals = new Map(data.temporals.filter((t) => !t.deletedAt).map((t) => [t.id, t]));
  const groups = new Map<string, PlaceGroup>();
  const visibleBooks: BookView[] = [];
  const unmapped: BookView[] = []; // 지도에 핀이 없는 책(가상·위치 없음·연결 없음)
  let hiddenUnknownEra = 0;

  for (const book of books) {
    if (filters.categories.length && !filters.categories.includes(book.work.category)) continue;
    const links = book.links.filter((l) => !filters.relations.length || filters.relations.includes(l.relationType));
    const eraOk = (l: ContextLink) => {
      const m = eraMatches(timesFor(l, temporals), filters.era);
      if (m === null) return filters.includeUnknownEra;
      return m;
    };
    const passing = links.filter(eraOk);
    const anyEraKnown = links.some((l) => eraMatches(timesFor(l, temporals), 'all') !== null);
    if (filters.era !== 'all' && !anyEraKnown && !filters.includeUnknownEra) {
      hiddenUnknownEra++;
      continue;
    }
    if (filters.relations.length && !links.length) continue;
    if (filters.era !== 'all' && links.length && !passing.length) continue;

    const mappable = passing.filter((l) => l.placeId && places.get(l.placeId)?.geometry);
    if (!mappable.length) {
      if (!filters.includeUnplaced) continue;
      unmapped.push(book);
    }
    visibleBooks.push(book);
    for (const link of mappable) {
      const place = places.get(link.placeId!)!;
      const g = groups.get(place.id) ?? { place, items: [], pendingOnly: true };
      g.items.push({ book, link });
      if (link.verificationStatus === 'curated' || link.verificationStatus === 'user_authored' || link.userAcceptedAt) g.pendingOnly = false;
      groups.set(place.id, g);
    }
  }
  const workCount = new Set(visibleBooks.map((b) => b.work.id)).size;
  return { groups: [...groups.values()].sort((a, b) => b.items.length - a.items.length), visibleBooks, unmapped, places, temporals, workCount, hiddenUnknownEra };
}
