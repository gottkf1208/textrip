import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_FILTERS,
  SCHEMA_VERSION,
  STORE_NAMES,
  type ContextLink,
  type DataSet,
  type Edition,
  type Filters,
  type LibraryEntry,
  type Note,
  type Place,
  type StoreName,
  type UserSettings,
  type Work,
} from './types';
import { clearAll, deleteDraft, deleteMany, loadAll, loadSettings, putMany, saveSettings, type DbMode } from './lib/db';
import { buildSampleData, SEED_VERSION } from './seed/build';
import { uid } from './lib/util';

const EMPTY: DataSet = { works: [], editions: [], entries: [], places: [], links: [], temporals: [], evidence: [], notes: [] };
const TRASH_DAYS = 7;
const MODE_KEY = 'textrip.mode';

export interface BookView {
  work: Work;
  entry: LibraryEntry;
  editions: Edition[];
  links: ContextLink[]; // 삭제되지 않은 연결
}

export interface NewBookInput {
  title: string;
  authors: string[];
  volumeLabel?: string | null;
  isbn?: string[];
  publisher?: string | null;
  publishedDate?: string | null;
  language?: string | null;
  coverUrl?: string | null;
  category?: Work['category'];
  source: Edition['metadataSource'];
  /** 이미 있는 작품에 판본으로 붙일 때 */
  attachToWorkId?: string | null;
}

interface Store {
  mode: DbMode;
  ready: boolean;
  error: string | null;
  data: DataSet;
  books: BookView[];
  trash: BookView[];
  byId: {
    work: Map<string, Work>;
    place: Map<string, Place>;
    link: Map<string, ContextLink>;
    entryByWork: Map<string, LibraryEntry>;
  };
  filters: Filters;
  settings: UserSettings | null;
  setFilters: (f: Filters) => void;
  saveMapView: (v: UserSettings['mapView']) => void;
  switchMode: (m: DbMode) => Promise<void>;
  resetSample: () => Promise<void>;
  copySampleToUser: () => Promise<number>;
  addBooks: (items: NewBookInput[]) => Promise<{ ok: NewBookInput[]; failed: { item: NewBookInput; error: string }[]; workIds: string[] }>;
  deleteBook: (workId: string) => Promise<void>;
  restoreBook: (workId: string) => Promise<void>;
  saveNote: (p: { entryId: string; linkId: string | null; body: string; baseRevision: number }) => Promise<{ status: 'saved' | 'conflict'; note: Note; current?: Note }>;
  deleteNote: (noteId: string) => Promise<void>;
  restoreNote: (noteId: string) => Promise<void>;
  reviewLink: (linkId: string, action: 'accept' | 'exclude' | 'restore', summary?: string) => Promise<void>;
  addUserLink: (p: { workId: string; placeId?: string | null; newPlaceName?: string | null; summary: string; lngLat?: { lng: number; lat: number } | null }) => Promise<string>;
  importData: (incoming: DataSet, strategy: 'skip' | 'copy') => Promise<{ added: number; skipped: number }>;
  exportData: () => object;
  reload: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
};

const now = () => new Date().toISOString();
const baseRecord = (id = uid()) => ({ id, createdAt: now(), updatedAt: now(), schemaVersion: SCHEMA_VERSION, deletedAt: null as string | null });

function readMode(): DbMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'sample' ? 'sample' : 'user';
  } catch {
    return 'user';
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DbMode>(readMode);
  const [data, setData] = useState<DataSet>(EMPTY);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const channel = useMemo(() => (typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('textrip') : null), []);

  const load = useCallback(async (m: DbMode) => {
    try {
      let ds = await loadAll(m);
      if (m === 'sample') {
        const prev = await loadSettings('sample');
        if (ds.works.length === 0 || prev?.seedVersion !== SEED_VERSION) {
          const seed = buildSampleData();
          // 같은 ID로 덮어쓰기 — 사용자가 남긴 메모·추가한 책은 그대로
          const { notes: _n, ...rest } = seed;
          void _n;
          await putMany('sample', rest as unknown as Record<StoreName, object[]>);
          await saveSettings('sample', { ...(prev ?? { id: 'settings', schemaVersion: SCHEMA_VERSION, filters: DEFAULT_FILTERS, mapView: null }), seedVersion: SEED_VERSION });
          ds = await loadAll('sample');
        }
      }
      // 7일 지난 휴지통 비우기
      const cutoff = Date.now() - TRASH_DAYS * 864e5;
      const expired = (r: { deletedAt?: string | null }) => r.deletedAt && Date.parse(r.deletedAt) < cutoff;
      const purge: Partial<Record<StoreName, string[]>> = {};
      for (const s of STORE_NAMES) {
        const ids = (ds[s] as { id: string; deletedAt?: string | null }[]).filter(expired).map((r) => r.id);
        if (ids.length) purge[s] = ids;
      }
      if (Object.keys(purge).length) {
        await deleteMany(m, purge);
        ds = await loadAll(m);
      }
      const st = (await loadSettings(m)) ?? { id: 'settings' as const, schemaVersion: SCHEMA_VERSION, filters: DEFAULT_FILTERS, mapView: null };
      if (modeRef.current !== m) return;
      setData(ds);
      setSettings(st);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load(mode);
  }, [mode, load]);

  useEffect(() => {
    if (!channel) return;
    channel.onmessage = (ev) => {
      if (ev.data?.mode === modeRef.current) load(modeRef.current);
    };
    return () => {
      channel.onmessage = null;
    };
  }, [channel, load]);

  const notify = useCallback(() => channel?.postMessage({ mode: modeRef.current }), [channel]);

  /** DB에 쓰고 성공하면 메모리 상태도 같은 내용으로 갱신 */
  const commit = useCallback(
    async (items: Partial<Record<StoreName, object[]>>) => {
      await putMany(modeRef.current, items);
      setData((prev) => {
        const next = { ...prev } as DataSet;
        for (const [store, records] of Object.entries(items) as [StoreName, { id: string }[]][]) {
          const map = new Map((prev[store] as { id: string }[]).map((r) => [r.id, r]));
          for (const r of records) map.set(r.id, r);
          (next as unknown as Record<string, unknown>)[store] = [...map.values()];
        }
        return next;
      });
      notify();
    },
    [notify],
  );

  const byId = useMemo(
    () => ({
      work: new Map(data.works.map((w) => [w.id, w])),
      place: new Map(data.places.map((p) => [p.id, p])),
      link: new Map(data.links.map((l) => [l.id, l])),
      entryByWork: new Map(data.entries.map((e) => [e.workId, e])),
    }),
    [data],
  );

  const { books, trash } = useMemo(() => {
    const edByWork = new Map<string, Edition[]>();
    for (const e of data.editions) if (!e.deletedAt) edByWork.set(e.workId, [...(edByWork.get(e.workId) ?? []), e]);
    const linkByWork = new Map<string, ContextLink[]>();
    for (const l of data.links) if (!l.deletedAt) linkByWork.set(l.workId, [...(linkByWork.get(l.workId) ?? []), l]);
    const all: BookView[] = [];
    for (const entry of data.entries) {
      const work = byId.work.get(entry.workId);
      if (!work) continue;
      all.push({
        work,
        entry,
        editions: (edByWork.get(work.id) ?? []).sort((a, b) => (a.volumeLabel ?? '').localeCompare(b.volumeLabel ?? '', 'ko')),
        links: (linkByWork.get(work.id) ?? []).sort((a, b) => (a.narrativeOrder ?? 99) - (b.narrativeOrder ?? 99)),
      });
    }
    const sorter = (a: BookView, b: BookView) => a.work.canonicalTitle.localeCompare(b.work.canonicalTitle, 'ko');
    return { books: all.filter((b) => !b.entry.deletedAt).sort(sorter), trash: all.filter((b) => b.entry.deletedAt).sort(sorter) };
  }, [data, byId]);

  const filters = settings?.filters ?? DEFAULT_FILTERS;

  const persistSettings = useCallback(async (patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...(prev ?? { id: 'settings' as const, schemaVersion: SCHEMA_VERSION }), ...patch } as UserSettings;
      saveSettings(modeRef.current, next).catch(() => undefined);
      return next;
    });
  }, []);

  const setFilters = useCallback((f: Filters) => persistSettings({ filters: f }), [persistSettings]);
  const saveMapView = useCallback((v: UserSettings['mapView']) => persistSettings({ mapView: v }), [persistSettings]);

  const switchMode = useCallback(async (m: DbMode) => {
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* 저장 안 돼도 이번 방문에는 동작 */
    }
    setReady(false);
    setData(EMPTY);
    setMode(m);
  }, []);

  const resetSample = useCallback(async () => {
    await clearAll('sample');
    if (modeRef.current === 'sample') {
      setReady(false);
      await load('sample');
    }
  }, [load]);

  const copySampleToUser = useCallback(async () => {
    const sample = await loadAll('sample');
    const user = await loadAll('user');
    const items: Partial<Record<StoreName, object[]>> = {};
    let added = 0;
    for (const s of STORE_NAMES) {
      const have = new Set((user[s] as { id: string }[]).map((r) => r.id));
      const fresh = (sample[s] as { id: string; deletedAt?: string | null }[]).filter((r) => !have.has(r.id) && !r.deletedAt);
      if (fresh.length) items[s] = fresh;
      if (s === 'entries') added = fresh.length;
    }
    await putMany('user', items);
    channel?.postMessage({ mode: 'user' });
    return added;
  }, [channel]);

  const addBooks: Store['addBooks'] = useCallback(
    async (inputs) => {
      const ok: NewBookInput[] = [];
      const failed: { item: NewBookInput; error: string }[] = [];
      const workIds: string[] = [];
      for (const item of inputs) {
        try {
          const items: Partial<Record<StoreName, object[]>> = {};
          const edition: Edition = {
            ...baseRecord(),
            workId: '',
            displayTitle: item.title.trim(),
            language: item.language ?? null,
            isbn: item.isbn ?? [],
            publisher: item.publisher ?? null,
            publishedDate: item.publishedDate ?? null,
            volumeLabel: item.volumeLabel?.trim() || null,
            coverUrl: item.coverUrl ?? null,
            translators: [],
            metadataSource: item.source,
          };
          if (item.attachToWorkId) {
            const entry = byId.entryByWork.get(item.attachToWorkId);
            if (!entry) throw new Error('붙일 책을 찾지 못했어요.');
            edition.workId = item.attachToWorkId;
            items.editions = [edition];
            items.entries = [{ ...entry, editionIds: [...entry.editionIds, edition.id], updatedAt: now(), deletedAt: null }];
            workIds.push(item.attachToWorkId);
          } else {
            const work: Work = {
              ...baseRecord(),
              canonicalTitle: item.title.replace(/\s*(上|下|\d+권?)$/u, '').trim() || item.title.trim(),
              originalTitle: null,
              authors: item.authors.filter(Boolean),
              category: item.category ?? 'other',
              subjects: [],
            };
            edition.workId = work.id;
            const entry: LibraryEntry = { ...baseRecord(), workId: work.id, editionIds: [edition.id], readStatus: 'read', completedAt: null, addedAt: now() };
            items.works = [work];
            items.editions = [edition];
            items.entries = [entry];
            workIds.push(work.id);
          }
          await commit(items);
          ok.push(item);
        } catch (e) {
          failed.push({ item, error: e instanceof Error ? e.message : '저장하지 못했어요.' });
        }
      }
      return { ok, failed, workIds };
    },
    [byId, commit],
  );

  const setDeleted = useCallback(
    async (workId: string, deletedAt: string | null) => {
      const entry = byId.entryByWork.get(workId);
      if (!entry) return;
      await commit({ entries: [{ ...entry, deletedAt, updatedAt: now() }] });
    },
    [byId, commit],
  );

  const deleteBook = useCallback((id: string) => setDeleted(id, now()), [setDeleted]);
  const restoreBook = useCallback((id: string) => setDeleted(id, null), [setDeleted]);

  const saveNote: Store['saveNote'] = useCallback(
    async ({ entryId, linkId, body, baseRevision }) => {
      const m = modeRef.current;
      const fresh = await loadAll(m);
      const current = fresh.notes.find((n) => n.libraryEntryId === entryId && (n.contextLinkId ?? null) === linkId && !n.deletedAt);
      if (current && current.revision !== baseRevision && current.body !== body) {
        return { status: 'conflict' as const, note: current, current };
      }
      const note: Note = current
        ? { ...current, body, revision: current.revision + 1, updatedAt: now() }
        : { ...baseRecord(), libraryEntryId: entryId, contextLinkId: linkId, scope: linkId ? 'place' : 'book', body, revision: 1 };
      await commit({ notes: [note] });
      await deleteDraft(m, `${entryId}:${linkId ?? 'book'}`).catch(() => undefined);
      return { status: 'saved' as const, note };
    },
    [commit],
  );

  const noteDel = useCallback(
    async (noteId: string, deletedAt: string | null) => {
      const n = data.notes.find((x) => x.id === noteId);
      if (n) await commit({ notes: [{ ...n, deletedAt, updatedAt: now() }] });
    },
    [data.notes, commit],
  );

  const reviewLink: Store['reviewLink'] = useCallback(
    async (linkId, action, summary) => {
      const l = byId.link.get(linkId);
      if (!l) return;
      const next: ContextLink = { ...l, updatedAt: now() };
      if (action === 'accept') next.userAcceptedAt = now(); // 근거 상태는 그대로 둔다
      if (action === 'exclude') next.deletedAt = now();
      if (action === 'restore') next.deletedAt = null;
      if (summary !== undefined) next.summary = summary;
      await commit({ links: [next] });
    },
    [byId, commit],
  );

  const addUserLink: Store['addUserLink'] = useCallback(
    async ({ workId, placeId, newPlaceName, summary, lngLat }) => {
      const items: Partial<Record<StoreName, object[]>> = {};
      let pid = placeId ?? null;
      if (!pid && newPlaceName) {
        const place: Place = {
          ...baseRecord(),
          displayName: newPlaceName.trim(),
          reality: 'unknown',
          precision: lngLat ? 'site' : 'unlocated',
          geometry: lngLat ?? null,
          geocodeSource: lngLat ? '사용자가 지도에서 선택' : null,
        };
        items.places = [place];
        pid = place.id;
      }
      const link: ContextLink = {
        ...baseRecord(),
        workId,
        placeId: pid,
        relationType: 'user_linked',
        summary: summary.trim(),
        verificationStatus: 'user_authored',
        userAcceptedAt: now(),
        evidenceIds: [],
        temporalContextIds: [],
        narrativeOrder: null,
      };
      items.links = [link];
      await commit(items);
      return link.id;
    },
    [commit],
  );

  const exportData = useCallback(() => {
    const strip = <T extends object>(rows: T[]) => rows;
    return {
      app: 'TEXTRIP',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now(),
      mode: modeRef.current,
      data: Object.fromEntries(STORE_NAMES.map((s) => [s, strip(data[s] as object[])])),
    };
  }, [data]);

  const importData: Store['importData'] = useCallback(
    async (incoming, strategy) => {
      const items: Partial<Record<StoreName, object[]>> = {};
      let added = 0;
      let skipped = 0;
      const have = new Map(STORE_NAMES.map((s) => [s, new Set((data[s] as { id: string }[]).map((r) => r.id))]));
      for (const s of STORE_NAMES) {
        const rows = ((incoming[s] ?? []) as { id: string }[]).filter((r) => {
          const exists = have.get(s)!.has(r.id);
          if (exists && strategy === 'skip') {
            if (s === 'entries') skipped++;
            return false;
          }
          return true;
        });
        if (rows.length) items[s] = rows;
        if (s === 'entries') added = rows.length;
      }
      await commit(items);
      return { added, skipped };
    },
    [data, commit],
  );

  const value: Store = {
    mode,
    ready,
    error,
    data,
    books,
    trash,
    byId,
    filters,
    settings,
    setFilters,
    saveMapView,
    switchMode,
    resetSample,
    copySampleToUser,
    addBooks,
    deleteBook,
    restoreBook,
    saveNote,
    deleteNote: (id) => noteDel(id, now()),
    restoreNote: (id) => noteDel(id, null),
    reviewLink,
    addUserLink,
    importData,
    exportData,
    reload: () => load(modeRef.current),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
