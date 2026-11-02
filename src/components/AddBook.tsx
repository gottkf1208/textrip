import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCw, Crop as CropIcon, Trash2, Check, Search } from 'lucide-react';
import { useStore, type NewBookInput } from '../store';
import { CATEGORY_LABEL, type Category } from '../types';
import { checkFile, cropThumb, decode, MAX_FILES, prepare, type Crop, type Prepared, ImageError } from '../lib/image';
import { recognize, resolveProvider, RecognitionError, type Provider } from '../lib/recognize';
import type { Candidate } from '../lib/recognitionCore';
import { searchBooks, type BookHit } from '../lib/bookSearch';
import { go, normalizeAuthors, normalizeTitle, uid } from '../lib/util';
import { useToast } from './Toast';

type PhotoStatus = 'ready' | 'preparing' | 'sending' | 'recognizing' | 'done' | 'error' | 'cancelled';
interface Photo {
  id: string;
  name: string;
  bmp: ImageBitmap;
  preview: string;
  rotation: number;
  crop: Crop | null;
  status: PhotoStatus;
  error?: string;
  prepared?: Prepared;
  found?: number;
  slow?: boolean;
}
interface Row {
  key: string;
  source: NewBookInput['source'];
  photoId?: string;
  cand?: Candidate;
  thumb?: string;
  title: string;
  author: string;
  volume: string;
  category: Category;
  isbn: string[];
  publisher: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  selected: boolean;
  dupChoice: 'skip' | 'attach' | 'separate';
  saveError?: string;
}

const STATUS_TEXT: Record<PhotoStatus, string> = {
  ready: '책 찾기 전',
  preparing: '사진 준비 중',
  sending: '보내는 중',
  recognizing: '책을 찾고 있어요',
  done: '완료',
  error: '실패',
  cancelled: '취소됨',
};

export default function AddBook() {
  const initialMode = new URLSearchParams(location.hash.split('?')[1] ?? '').get('mode') === 'search' ? 'search' : 'photo';
  const [tab, setTab] = useState<'photo' | 'search'>(initialMode);
  const { books, addBooks, mode } = useStore();
  const toast = useToast();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [cropping, setCropping] = useState<Photo | null>(null);
  const [saving, setSaving] = useState(false);
  const [doneInfo, setDoneInfo] = useState<{ count: number; workIds: string[] } | null>(null);
  const jobs = useRef(new Map<string, AbortController>());
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    resolveProvider().then(setProvider);
    return () => {
      jobs.current.forEach((c) => c.abort());
      photosRef.current.forEach((p) => {
        URL.revokeObjectURL(p.preview);
        if (p.prepared) URL.revokeObjectURL(p.prepared.url);
        p.bmp.close();
      });
    };
  }, []);

  const patch = (id: string, p: Partial<Photo>) => setPhotos((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const errs: string[] = [];
    const room = MAX_FILES - photosRef.current.length;
    const picked = [...files].slice(0, Math.max(0, room));
    if (files.length > room) errs.push(`한 번에 ${MAX_FILES}장까지 올릴 수 있어요.`);
    for (const f of picked) {
      try {
        checkFile(f);
        const bmp = await decode(f);
        const preview = URL.createObjectURL(f);
        setPhotos((l) => [...l, { id: uid(), name: f.name, bmp, preview, rotation: 0, crop: null, status: 'ready' }]);
      } catch (e) {
        errs.push(`${f.name}: ${e instanceof ImageError ? e.message : '사진을 읽지 못했어요.'}`);
      }
    }
    setFileErrors(errs);
  };

  const runOne = useCallback(
    async (p: Photo, prov: Provider) => {
      const ctl = new AbortController();
      jobs.current.get(p.id)?.abort();
      jobs.current.set(p.id, ctl);
      const valid = () => jobs.current.get(p.id) === ctl && !ctl.signal.aborted;
      let slowTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        patch(p.id, { status: 'preparing', error: undefined, slow: false });
        if (p.prepared) URL.revokeObjectURL(p.prepared.url);
        const prepared = await prepare(p.bmp, p.rotation, p.crop);
        if (!valid()) return;
        patch(p.id, { status: 'sending', prepared });
        slowTimer = setTimeout(() => valid() && patch(p.id, { slow: true }), 60000);
        setTimeout(() => valid() && patch(p.id, { status: 'recognizing' }), 400);
        const cands = await recognize(prov, p.id, prepared.base64, ctl.signal);
        if (!valid()) return; // 취소 뒤 늦게 온 응답은 버린다
        clearTimeout(slowTimer);
        patch(p.id, { status: 'done', found: cands.length, slow: false });
        const newRows: Row[] = cands.map((c) => ({
          key: c.candidateId,
          source: 'photo',
          photoId: p.id,
          cand: c,
          title: c.titleGuess,
          author: c.authorGuess ?? '',
          volume: c.volumeGuess ?? '',
          category: 'other',
          isbn: [],
          publisher: null,
          publishedDate: null,
          coverUrl: null,
          selected: !c.needsReview && Boolean(c.titleGuess),
          dupChoice: 'skip',
        }));
        setRows((r) => [...r.filter((x) => x.photoId !== p.id), ...newRows]);
        for (const row of newRows) {
          if (!row.cand?.bbox) continue;
          cropThumb(prepared.url, row.cand.bbox)
            .then((thumb) => setRows((r) => r.map((x) => (x.key === row.key ? { ...x, thumb } : x))))
            .catch(() => undefined);
        }
      } catch (e) {
        clearTimeout(slowTimer);
        if ((e as Error).name === 'AbortError' || !valid()) return;
        patch(p.id, { status: 'error', slow: false, error: e instanceof RecognitionError || e instanceof ImageError ? e.message : '사진을 분석하지 못했어요.' });
      } finally {
        if (jobs.current.get(p.id) === ctl) jobs.current.delete(p.id);
      }
    },
    [],
  );

  /** 동시 처리 2개 */
  const findBooks = async (only?: string) => {
    if (!provider || provider.kind === 'none') return;
    const queue = photosRef.current.filter((p) => (only ? p.id === only : p.status === 'ready' || p.status === 'error' || p.status === 'cancelled'));
    const worker = async () => {
      while (queue.length) {
        const p = queue.shift()!;
        await runOne(photosRef.current.find((x) => x.id === p.id) ?? p, provider);
      }
    };
    await Promise.all([worker(), worker()]);
  };

  const cancelAll = () => {
    jobs.current.forEach((c) => c.abort());
    jobs.current.clear();
    setPhotos((l) => l.map((p) => (['preparing', 'sending', 'recognizing'].includes(p.status) ? { ...p, status: 'cancelled', slow: false } : p)));
  };

  const removePhoto = (id: string) => {
    jobs.current.get(id)?.abort();
    jobs.current.delete(id);
    setPhotos((l) => {
      const p = l.find((x) => x.id === id);
      if (p) {
        URL.revokeObjectURL(p.preview);
        if (p.prepared) URL.revokeObjectURL(p.prepared.url);
      }
      return l.filter((x) => x.id !== id);
    });
    setRows((r) => r.filter((x) => x.photoId !== id));
  };

  const addRow = (hit?: BookHit) =>
    setRows((r) => [
      ...r,
      {
        key: uid(),
        source: hit ? 'search' : 'user',
        title: hit?.title ?? '',
        author: hit?.authors.join(', ') ?? '',
        volume: '',
        category: 'other',
        isbn: hit?.isbn ?? [],
        publisher: hit?.publisher ?? null,
        publishedDate: hit?.publishedDate ?? null,
        coverUrl: hit?.thumbnail ?? null,
        selected: Boolean(hit),
        dupChoice: 'skip',
      },
    ]);

  const updateRow = (key: string, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));

  // 중복: ISBN 일치 또는 정규화한 제목+저자(+권차)
  const dupOf = useMemo(() => {
    const index = books.map((b) => ({
      workId: b.work.id,
      title: b.work.canonicalTitle,
      keys: new Set([normalizeTitle(b.work.canonicalTitle), ...b.editions.map((e) => normalizeTitle(e.displayTitle))]),
      authors: normalizeAuthors(b.work.authors),
      isbn: new Set(b.editions.flatMap((e) => e.isbn)),
    }));
    return (row: Row) => {
      const t = normalizeTitle(row.title);
      if (!t) return null;
      const a = normalizeAuthors(row.author.split(/[,·]/));
      return index.find((i) => row.isbn.some((x) => i.isbn.has(x)) || (i.keys.has(t) && (!a || !i.authors || i.authors === a))) ?? null;
    };
  }, [books]);

  const selected = rows.filter((r) => r.selected && r.title.trim());

  const save = async () => {
    setSaving(true);
    const inputs: (NewBookInput & { _key: string })[] = [];
    for (const r of selected) {
      const d = dupOf(r);
      if (d && r.dupChoice === 'skip') continue;
      inputs.push({
        _key: r.key,
        title: r.title.trim(),
        authors: r.author.split(/[,·]/).map((s) => s.trim()).filter(Boolean),
        volumeLabel: r.volume || null,
        isbn: r.isbn,
        publisher: r.publisher,
        publishedDate: r.publishedDate,
        coverUrl: r.coverUrl,
        spineImage: r.thumb ?? null,
        category: r.category,
        source: r.source,
        attachToWorkId: d && r.dupChoice === 'attach' ? d.workId : null,
      });
    }
    const res = await addBooks(inputs);
    setSaving(false);
    const failedKeys = new Map(res.failed.map((f) => [(f.item as NewBookInput & { _key: string })._key, f.error]));
    const okKeys = new Set(res.ok.map((o) => (o as NewBookInput & { _key: string })._key));
    const skipped = selected.filter((r) => dupOf(r) && r.dupChoice === 'skip').map((r) => r.key);
    setRows((list) => list.filter((r) => !okKeys.has(r.key) && !skipped.includes(r.key)).map((r) => (failedKeys.has(r.key) ? { ...r, saveError: failedKeys.get(r.key) } : r)));
    if (res.failed.length) toast({ message: `${res.ok.length}권 저장 · ${res.failed.length}권은 저장하지 못했어요` });
    if (res.ok.length) setDoneInfo({ count: res.ok.length, workIds: res.workIds });
  };

  const busy = photos.some((p) => ['preparing', 'sending', 'recognizing'].includes(p.status));
  const processing = photos.filter((p) => ['preparing', 'sending', 'recognizing'].includes(p.status)).length;
  const pending = photos.filter((p) => p.status === 'ready' || p.status === 'error' || p.status === 'cancelled').length;

  if (doneInfo) {
    return (
      <div className="page">
        <h1 className="page-title">{doneInfo.count}권을 책장에 넣었어요</h1>
        <p className="lede">장소와 시대 연결은 책 상세의 ‘연결 검토’에서 이어서 할 수 있어요. 장소를 못 찾아도 등록은 끝난 거예요.</p>
        <div className="actions">
          {doneInfo.workIds[0] && (
            <button type="button" className="action primary" onClick={() => go({ name: 'book', bookId: doneInfo.workIds[0] })}>
              첫 책 열기
            </button>
          )}
          <a className="action" href="#/library">
            내 책장 보기
          </a>
          <button type="button" className="action ghost" onClick={() => setDoneInfo(null)}>
            더 추가하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">읽은 책 추가</h1>
      <p className="lede">이미 읽은 책을 등록해요. {mode === 'sample' ? '지금은 샘플 책장에 추가돼요.' : ''}</p>
      <div className="tabs page-tabs" role="tablist" aria-label="추가 방법" style={{ maxWidth: 420 }}>
        <button type="button" role="tab" aria-selected={tab === 'photo'} onClick={() => setTab('photo')}>
          사진으로 추가
        </button>
        <button type="button" role="tab" aria-selected={tab === 'search'} onClick={() => setTab('search')}>
          책 이름으로 추가
        </button>
        <span className="indicator" style={{ transform: `translateX(${tab === 'search' ? '100%' : '0'})` }} />
      </div>

      {tab === 'photo' && (
        <section className="tab-panel" aria-label="사진으로 추가">
          <p className="prose" style={{ fontSize: 18, fontWeight: 600, margin: '8px 0 4px' }}>
            읽은 책의 표지나 책등이 보이게 찍어주세요.
          </p>
          <p className="help">한 번에 {MAX_FILES}장, 장당 15MB까지. JPG·PNG·WebP를 읽고, 아이폰 HEIC는 브라우저가 지원하면 자동으로 바꿔요.</p>
          {provider?.kind === 'none' && (
            <p className="notice alert" role="note">
              <span className="prose">
                사진 인식이 아직 연결되지 않았어요. <a href="#/settings">설정</a>에서 Claude API 키를 넣으면 바로 쓸 수 있어요. 지금은 <button type="button" className="link-btn" style={{ minHeight: 24 }} onClick={() => setTab('search')}>책 이름으로 추가</button>할 수 있어요.
              </span>
            </p>
          )}
          <div className="actions" style={{ margin: '16px 0' }}>
            <label className="action primary">
              <Camera size={18} aria-hidden /> 카메라로 촬영
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} disabled={photos.length >= MAX_FILES} />
            </label>
            <label className="action">
              <ImagePlus size={18} aria-hidden /> 사진 선택
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} disabled={photos.length >= MAX_FILES} />
            </label>
          </div>
          {fileErrors.map((e) => (
            <p key={e} className="error-text" role="alert">
              {e}
            </p>
          ))}

          {photos.length > 0 && (
            <>
              <ul className="photo-list" aria-label="고른 사진">
                {photos.map((p) => (
                  <li key={p.id} className="photo-row">
                    <img className="photo-thumb" src={p.prepared?.url ?? p.preview} alt={`${p.name} 미리보기`} style={{ transform: p.prepared ? undefined : `rotate(${p.rotation}deg)` }} />
                    <div className="layout-child">
                      <div className="ko" style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{p.name}</div>
                      <div className={`state${p.status === 'error' ? ' err' : ''}`} aria-live="polite">
                        {p.status === 'done' ? <Check size={16} className="ok" aria-hidden /> : null}
                        {STATUS_TEXT[p.status]}
                        {p.status === 'done' && ` · 후보 ${p.found}개`}
                        {p.crop ? ' · 잘라냄' : ''}
                        {p.rotation ? ` · ${p.rotation % 360}° 회전` : ''}
                      </div>
                      {p.status === 'error' && <p className="error-text">{p.error}</p>}
                      {p.status === 'done' && p.found === 0 && (
                        <p className="help">책 제목이 잘 보이지 않았어요. 사진을 다시 고르거나 책 이름으로 추가해 주세요.</p>
                      )}
                      {p.slow && (
                        <div className="notice" role="alert">
                          <span className="prose">60초가 지났어요. 계속 기다릴까요?</span>
                          <button type="button" className="link-btn" style={{ minHeight: 28 }} onClick={() => patch(p.id, { slow: false })}>
                            계속 기다리기
                          </button>
                          <button type="button" className="link-btn" style={{ minHeight: 28 }} onClick={() => { jobs.current.get(p.id)?.abort(); jobs.current.delete(p.id); patch(p.id, { status: 'cancelled', slow: false }); }}>
                            취소
                          </button>
                        </div>
                      )}
                      <div className="actions" style={{ marginTop: 8 }}>
                        <button type="button" className="action small" onClick={() => patch(p.id, { rotation: p.rotation + 90, crop: null, prepared: undefined, status: p.status === 'done' ? 'done' : 'ready' })} disabled={busy}>
                          <RotateCw size={16} aria-hidden /> 회전
                        </button>
                        <button type="button" className="action small" onClick={() => setCropping(p)} disabled={busy}>
                          <CropIcon size={16} aria-hidden /> 자르기
                        </button>
                        {(p.status === 'error' || p.status === 'cancelled' || (p.status === 'done' && p.found === 0)) && provider?.kind !== 'none' && (
                          <button type="button" className="action small" onClick={() => findBooks(p.id)}>
                            다시 시도
                          </button>
                        )}
                        <button type="button" className="action small ghost" onClick={() => removePhoto(p.id)} aria-label={`${p.name} 빼기`}>
                          <Trash2 size={16} aria-hidden /> 빼기
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {provider && provider.kind !== 'none' && (
                <p className="help" style={{ marginTop: 16 }}>
                  ‘책 찾기’를 누르면 책 제목을 찾기 위해 사진을 분석 서비스(Anthropic Claude{provider.kind === 'device' ? ' · 이 기기의 API 키' : ' · 서버 연결'})로 보내요. 사진의 위치 정보(EXIF)는 지우고, 원본 사진은 저장하지 않아요.
                </p>
              )}
              <div className="actions" style={{ marginTop: 12 }}>
                <button type="button" className="action primary" onClick={() => findBooks()} disabled={!provider || provider.kind === 'none' || busy || !pending}>
                  <Search size={18} aria-hidden /> 책 찾기
                </button>
                {busy && (
                  <button type="button" className="action" onClick={cancelAll}>
                    모두 취소
                  </button>
                )}
              </div>
              {busy && (
                <p className="meta" aria-live="polite" style={{ marginTop: 8 }}>
                  책을 찾고 있어요 · 처리 중인 사진 {processing}장
                </p>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'search' && (
        <section className="tab-panel" aria-label="책 이름으로 추가">
          <BookSearchBox onPick={(h) => addRow(h)} />
          <button type="button" className="link-btn" onClick={() => addRow()}>
            검색 결과에 없나요? 직접 입력
          </button>
        </section>
      )}

      {rows.length > 0 && (
        <section aria-label="인식 결과 확인" style={{ marginTop: 32 }}>
          <h2 className="section-title">추가할 책 확인</h2>
          <p className="help" style={{ marginTop: -6, marginBottom: 8 }}>
            잘못 읽힌 제목만 고쳐 주세요. ‘확인 필요’ 표시는 글자가 흐리거나 일부만 보인 책이라 기본으로 선택하지 않았어요.
          </p>
          <ul className="cand-list">
            {rows.map((r) => {
              const d = dupOf(r);
              return (
                <li key={r.key} className={`cand${r.selected ? '' : ' excluded'}`}>
                  {r.thumb || r.coverUrl ? <img className="cand-crop" src={r.thumb ?? r.coverUrl!} alt="" /> : <div className="cand-crop" aria-hidden />}
                  <div className="layout-child">
                    <div className="meta-row" style={{ marginBottom: 6 }}>
                      <label className="check">
                        <input type="checkbox" checked={r.selected} onChange={(e) => updateRow(r.key, { selected: e.target.checked })} />
                        추가
                      </label>
                      {r.cand?.needsReview && <span className="tag accent">확인 필요</span>}
                      {r.source === 'search' && <span className="tag">도서 검색</span>}
                      {r.source === 'user' && <span className="tag">직접 입력</span>}
                    </div>
                    {r.cand && (
                      <p className="raw ko">
                        읽은 글자 · {r.cand.rawText}
                        {r.cand.warnings.length ? ` · ${r.cand.warnings.join(', ')}` : ''}
                      </p>
                    )}
                    <div className="cand-fields">
                      <label className="field wide">
                        <span>제목</span>
                        <input className="input" value={r.title} onChange={(e) => updateRow(r.key, { title: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>저자</span>
                        <input className="input" value={r.author} placeholder="모르면 비워 두세요" onChange={(e) => updateRow(r.key, { author: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>권차</span>
                        <input className="input" value={r.volume} placeholder="예: 1, 上" onChange={(e) => updateRow(r.key, { volume: e.target.value })} />
                      </label>
                      <label className="field">
                        <span>장르</span>
                        <select className="input" value={r.category} onChange={(e) => updateRow(r.key, { category: e.target.value as Category })}>
                          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                            <option key={c} value={c}>
                              {CATEGORY_LABEL[c]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {d && (
                      <div className="dup" style={{ marginTop: 10 }}>
                        <p style={{ margin: '0 0 4px' }}>이미 책장에 ‘{d.title}’이 있어요.</p>
                        <div className="filter-row">
                          {(
                            [
                              ['skip', '추가하지 않기'],
                              ['attach', '같은 책의 다른 판본·권으로 추가'],
                              ['separate', '다른 책으로 따로 추가'],
                            ] as const
                          ).map(([v, l]) => (
                            <label key={v} className="check" style={{ fontWeight: 500 }}>
                              <input type="radio" name={`dup-${r.key}`} checked={r.dupChoice === v} onChange={() => updateRow(r.key, { dupChoice: v })} />
                              {l}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {r.saveError && (
                      <p className="error-text" role="alert">
                        {r.saveError}
                      </p>
                    )}
                    <RowSearch onPick={(h) => updateRow(r.key, { title: h.title, author: h.authors.join(', '), isbn: h.isbn, publisher: h.publisher, publishedDate: h.publishedDate, coverUrl: h.thumbnail, source: r.source === 'photo' ? 'photo' : 'search' })} initial={r.title} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="actions" style={{ marginTop: 16 }}>
            <button type="button" className="action primary" onClick={save} disabled={saving || !selected.length}>
              {saving ? '저장 중' : `선택한 책 추가 (${selected.length}권)`}
            </button>
            <button type="button" className="action" onClick={() => addRow()}>
              직접 입력 줄 추가
            </button>
          </div>
        </section>
      )}

      {cropping && (
        <CropModal
          photo={cropping}
          onClose={() => setCropping(null)}
          onSave={(crop) => {
            patch(cropping.id, { crop, prepared: undefined, status: cropping.status === 'done' ? 'done' : 'ready' });
            setCropping(null);
          }}
        />
      )}
    </div>
  );
}

function useBookSearch() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<BookHit[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');
  const composing = useRef(false);
  useEffect(() => {
    if (composing.current) return;
    if (q.trim().length < 2) {
      setHits([]);
      setState('idle');
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setState('loading');
      try {
        const r = await searchBooks(q, ctl.signal);
        setHits(r);
        setState('done');
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setErr((e as Error).message);
        setState('error');
      }
    }, 400);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);
  return { q, setQ, hits, state, err, composing };
}

function HitList({ hits, onPick }: { hits: BookHit[]; onPick: (h: BookHit) => void }) {
  return (
    <div className="results-pop" role="listbox" aria-label="검색 결과">
      {hits.map((h) => (
        <button key={h.providerBookId} type="button" role="option" aria-selected={false} onClick={() => onPick(h)}>
          {h.thumbnail ? <img src={h.thumbnail} alt="" loading="lazy" /> : <span className="noimg" />}
          <span className="layout-child">
            <span className="ko" style={{ display: 'block', fontWeight: 600 }}>{h.title}</span>
            <span className="meta" style={{ display: 'block' }}>
              {[h.authors.join(', '), h.publisher, h.publishedDate?.slice(0, 4)].filter(Boolean).join(' · ')}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function BookSearchBox({ onPick }: { onPick: (h: BookHit) => void }) {
  const s = useBookSearch();
  return (
    <div style={{ margin: '16px 0' }}>
      <label className="field">
        <span>책 이름이나 저자</span>
        <input
          className="input"
          type="search"
          value={s.q}
          onChange={(e) => s.setQ(e.target.value)}
          onCompositionStart={() => (s.composing.current = true)}
          onCompositionEnd={(e) => {
            s.composing.current = false;
            s.setQ((e.target as HTMLInputElement).value + '');
          }}
          placeholder="예: 적과 흑"
        />
      </label>
      <p className="help" aria-live="polite">
        {s.state === 'loading' && '찾는 중'}
        {s.state === 'done' && (s.hits.length ? `${s.hits.length}개 찾았어요 · Google Books` : '찾는 책이 없어요. 직접 입력해 주세요.')}
        {s.state === 'error' && s.err}
      </p>
      {s.hits.length > 0 && (
        <HitList
          hits={s.hits}
          onPick={(h) => {
            onPick(h);
            s.setQ('');
          }}
        />
      )}
    </div>
  );
}

function RowSearch({ onPick, initial }: { onPick: (h: BookHit) => void; initial: string }) {
  const [open, setOpen] = useState(false);
  const s = useBookSearch();
  if (!open)
    return (
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setOpen(true);
          s.setQ(initial);
        }}
      >
        도서 검색으로 고치기
      </button>
    );
  return (
    <div style={{ marginTop: 8 }}>
      <input className="input" type="search" value={s.q} onChange={(e) => s.setQ(e.target.value)} aria-label="이 책 검색" />
      <p className="help" aria-live="polite">
        {s.state === 'loading' && '찾는 중'}
        {s.state === 'done' && !s.hits.length && '맞는 후보가 없어요. 위 칸에 직접 고쳐 주세요.'}
        {s.state === 'error' && s.err}
      </p>
      {s.hits.length > 0 && (
        <HitList
          hits={s.hits}
          onPick={(h) => {
            onPick(h);
            setOpen(false);
          }}
        />
      )}
      <button type="button" className="link-btn" onClick={() => setOpen(false)}>
        닫기
      </button>
    </div>
  );
}

function CropModal({ photo, onClose, onSave }: { photo: Photo; onClose: () => void; onSave: (c: Crop | null) => void }) {
  const [src, setSrc] = useState('');
  const [rect, setRect] = useState<Crop | null>(photo.crop);
  const stage = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    // 회전을 반영한 미리보기
    const rot = ((photo.rotation % 360) + 360) % 360;
    const b = photo.bmp;
    const scale = Math.min(1, 1200 / Math.max(b.width, b.height));
    const w = Math.round(b.width * scale);
    const h = Math.round(b.height * scale);
    const c = document.createElement('canvas');
    c.width = rot % 180 ? h : w;
    c.height = rot % 180 ? w : h;
    const x = c.getContext('2d')!;
    x.translate(c.width / 2, c.height / 2);
    x.rotate((rot * Math.PI) / 180);
    x.drawImage(b, -w / 2, -h / 2, w, h);
    setSrc(c.toDataURL('image/jpeg', 0.85));
  }, [photo]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  const pos = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  return (
    <div className="modal-back">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="crop-title" style={{ width: 'min(900px, 100%)' }}>
        <h2 id="crop-title">책 부분만 남기기</h2>
        <p className="help" style={{ marginTop: -6, marginBottom: 12 }}>
          사진 위를 끌어서 책이 있는 영역을 고르세요. 배경의 사람·문서·주소는 빼고 보내는 게 좋아요.
        </p>
        <div style={{ textAlign: 'center' }}>
          <div
            ref={stage}
            className="crop-stage"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              start.current = pos(e);
              setRect(null);
            }}
            onPointerMove={(e) => {
              if (!start.current) return;
              const p = pos(e);
              const s = start.current;
              setRect({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
            }}
            onPointerUp={() => {
              start.current = null;
              setRect((r) => (r && r.w > 0.03 && r.h > 0.03 ? r : null));
            }}
          >
            {src && <img src={src} alt="자를 사진" draggable={false} />}
            {rect && <div className="crop-rect" style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }} />}
          </div>
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button type="button" className="action primary" onClick={() => onSave(rect)}>
            {rect ? '이 영역으로 자르기' : '자르지 않고 쓰기'}
          </button>
          <button type="button" className="action" onClick={() => setRect(null)}>
            선택 지우기
          </button>
          <button type="button" className="action ghost" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
