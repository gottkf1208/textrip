import { SCHEMA_VERSION, type ContextLink, type DataSet, type Edition, type Evidence, type LibraryEntry, type Place, type TemporalContext, type Work } from '../types';
import { SEED_BOOKS, SEED_EVIDENCE, SEED_PLACES, type SeedTime } from './books';

const T = '2026-11-02T00:00:00.000Z';
/** 샘플 데이터를 고치면 올린다 → 기존 샘플 저장소에 덮어쓰기(메모는 유지) */
export const SEED_VERSION = 3;
const base = (id: string) => ({ id, createdAt: T, updatedAt: T, schemaVersion: SCHEMA_VERSION, deletedAt: null });

/** 샘플 책장 → 데이터셋. ID는 고정이라 여러 번 불러도 같은 기록이 된다. */
export function buildSampleData(): DataSet {
  const works: Work[] = [];
  const editions: Edition[] = [];
  const entries: LibraryEntry[] = [];
  const links: ContextLink[] = [];
  const temporals: TemporalContext[] = [];

  const evidence: Evidence[] = Object.entries(SEED_EVIDENCE).map(([k, e]) => ({
    ...base(`ev-${k}`),
    title: e.title,
    url: e.url,
    sourceType: e.sourceType,
    accessedAt: e.accessedAt,
    supportedClaim: e.claim,
  }));

  const usedPlaces = new Set<string>();

  for (const b of SEED_BOOKS) {
    const workId = `w-${b.key}`;
    works.push({
      ...base(workId),
      canonicalTitle: b.title,
      subtitle: b.subtitle ?? null,
      originalTitle: b.original ?? null,
      authors: b.authors,
      category: b.category,
      subjects: b.subjects ?? [],
      questions: b.questions,
    });

    const vols = b.volumes ?? [{ title: b.title }];
    const editionIds: string[] = [];
    vols.forEach((v, i) => {
      const id = `e-${b.key}-${i + 1}`;
      editionIds.push(id);
      editions.push({
        ...base(id),
        workId,
        displayTitle: v.title,
        language: b.language ?? 'ko',
        isbn: [],
        publisher: b.publisher ?? null,
        publishedDate: null,
        volumeLabel: v.label ?? null,
        coverUrl: null,
        translators: b.translators ?? [],
        editionAuthors: v.authors,
        series: v.series ?? b.series ?? null,
        metadataSource: 'spine',
        needsReview: Boolean(b.review),
        reviewNote: b.review ?? null,
      });
    });

    entries.push({ ...base(`le-${b.key}`), workId, editionIds, readStatus: 'read', completedAt: null, addedAt: T });

    let tIndex = 0;
    const addTime = (t: SeedTime) => {
      const id = `t-${b.key}-${++tIndex}`;
      temporals.push({
        ...base(id),
        workId,
        kind: t.kind,
        label: t.label,
        startYear: t.start ?? null,
        endYear: t.end ?? null,
        precision: t.precision,
        certainty: t.certainty,
        evidenceIds: (t.ev ?? []).map((k) => `ev-${k}`),
      });
      return id;
    };

    // 작품 단위 시대(이야기 시대·출간 등) — 모든 연결에 공통으로 붙는 이야기/논의 시대
    const workTimeIds = (b.times ?? []).map(addTime);
    const sharedTimeIds = workTimeIds.filter((_, i) => (b.times ?? [])[i].kind !== 'publication');

    (b.links ?? []).forEach((l, i) => {
      if (l.place) usedPlaces.add(l.place);
      const ownTimes = (l.times ?? []).map(addTime);
      links.push({
        ...base(`l-${b.key}-${i + 1}`),
        workId,
        placeId: l.place ? `p-${l.place}` : null,
        relationType: l.rel,
        summary: l.summary,
        verificationStatus: l.status,
        userAcceptedAt: null,
        evidenceIds: (l.ev ?? []).map((k) => `ev-${k}`),
        temporalContextIds: ownTimes.length ? ownTimes : sharedTimeIds,
        narrativeOrder: l.order ?? null,
      });
    });
  }

  const places: Place[] = [...usedPlaces].map((k) => {
    const p = SEED_PLACES[k];
    if (!p) throw new Error(`seed place missing: ${k}`);
    return {
      ...base(`p-${k}`),
      displayName: p.name,
      historicName: p.historic ?? null,
      modernName: null,
      country: p.country ?? null,
      reality: p.reality,
      precision: p.precision,
      geometry: p.at && p.reality === 'real' ? { lng: p.at[0], lat: p.at[1] } : null,
      geocodeSource: p.at ? '샘플 대표 좌표(수동 입력)' : null,
      countryCode: p.code ?? null,
    };
  });

  return { works, editions, entries, places, links, temporals, evidence, notes: [] };
}
