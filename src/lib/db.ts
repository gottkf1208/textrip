import { STORE_NAMES, type DataSet, type StoreName, type UserSettings } from '../types';

export type DbMode = 'user' | 'sample';
const DB_NAME: Record<DbMode, string> = { user: 'textrip-user', sample: 'textrip-sample' };
const VERSION = 1;
const EXTRA = ['drafts', 'settings'] as const;
type AnyStore = StoreName | (typeof EXTRA)[number];

const cache: Partial<Record<DbMode, Promise<IDBDatabase>>> = {};

function open(mode: DbMode): Promise<IDBDatabase> {
  if (!cache[mode]) {
    cache[mode] = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('이 브라우저는 기기 저장소(IndexedDB)를 쓸 수 없어요.'));
      const req = indexedDB.open(DB_NAME[mode], VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const s of [...STORE_NAMES, ...EXTRA]) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('저장소를 열지 못했어요.'));
      req.onblocked = () => reject(new Error('다른 탭에서 저장소를 쓰는 중이에요. 다른 탭을 닫고 다시 시도해 주세요.'));
    });
    cache[mode]!.catch(() => delete cache[mode]);
  }
  return cache[mode]!;
}

function done(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('저장하지 못했어요.'));
    tx.onabort = () => reject(tx.error ?? new Error('저장이 취소됐어요.'));
  });
}

export async function loadAll(mode: DbMode): Promise<DataSet> {
  const db = await open(mode);
  const tx = db.transaction([...STORE_NAMES], 'readonly');
  const out: Partial<DataSet> = {};
  await Promise.all(
    STORE_NAMES.map(
      (s) =>
        new Promise<void>((resolve, reject) => {
          const r = tx.objectStore(s).getAll();
          r.onsuccess = () => {
            (out as Record<string, unknown>)[s] = r.result;
            resolve();
          };
          r.onerror = () => reject(r.error);
        }),
    ),
  );
  return out as DataSet;
}

/** 여러 저장소에 한 번에 쓴다. 하나라도 실패하면 전체가 취소된다. */
export async function putMany(mode: DbMode, items: Partial<Record<AnyStore, object[]>>) {
  const names = Object.keys(items) as AnyStore[];
  if (!names.length) return;
  const db = await open(mode);
  const tx = db.transaction(names, 'readwrite');
  for (const n of names) for (const it of items[n] ?? []) tx.objectStore(n).put(it);
  await done(tx);
}

export async function deleteMany(mode: DbMode, items: Partial<Record<AnyStore, string[]>>) {
  const names = Object.keys(items) as AnyStore[];
  if (!names.length) return;
  const db = await open(mode);
  const tx = db.transaction(names, 'readwrite');
  for (const n of names) for (const id of items[n] ?? []) tx.objectStore(n).delete(id);
  await done(tx);
}

export async function getOne<T>(mode: DbMode, store: AnyStore, id: string): Promise<T | undefined> {
  const db = await open(mode);
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readonly').objectStore(store).get(id);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}

export async function clearAll(mode: DbMode) {
  const db = await open(mode);
  const names = [...STORE_NAMES, ...EXTRA];
  const tx = db.transaction(names, 'readwrite');
  for (const n of names) tx.objectStore(n).clear();
  await done(tx);
}

export async function loadSettings(mode: DbMode) {
  return getOne<UserSettings>(mode, 'settings', 'settings');
}

export async function saveSettings(mode: DbMode, s: UserSettings) {
  await putMany(mode, { settings: [s] });
}

export interface Draft {
  id: string; // `${entryId}:${linkId|book}`
  body: string;
  baseRevision: number;
  updatedAt: string;
}

export const getDraft = (mode: DbMode, id: string) => getOne<Draft>(mode, 'drafts', id);
export const putDraft = (mode: DbMode, d: Draft) => putMany(mode, { drafts: [d] });
export const deleteDraft = (mode: DbMode, id: string) => deleteMany(mode, { drafts: [id] });
