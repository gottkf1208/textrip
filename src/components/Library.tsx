import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { CATEGORY_LABEL, type Category } from '../types';
import { formatAuthors, hrefFor, normalizeTitle } from '../lib/util';
import { LINK_STATE_LABEL, linkState, type LinkState } from '../lib/selectors';
import { Ico } from './Ico';

export default function Library() {
  const { books, byId, mode } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [state, setState] = useState<LinkState | 'all'>('all');

  const rows = useMemo(() => {
    const nq = normalizeTitle(q);
    return books
      .map((b) => ({ b, st: linkState(b, byId.place) }))
      .filter(({ b, st }) => {
        if (cat !== 'all' && b.work.category !== cat) return false;
        if (state !== 'all' && st !== state) return false;
        if (!nq) return true;
        const hay = normalizeTitle([b.work.canonicalTitle, b.work.originalTitle ?? '', ...b.work.authors, ...b.editions.map((e) => e.displayTitle)].join(' '));
        return hay.includes(nq);
      });
  }, [books, byId.place, q, cat, state]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: books.length };
    for (const b of books) c[b.work.category] = (c[b.work.category] ?? 0) + 1;
    return c;
  }, [books]);
  const volumeCount = books.reduce((n, b) => n + Math.max(1, b.editions.length), 0);

  return (
    <div className="page">
      <h1 className="page-title">내 책장</h1>
      <p className="lede tnum">
        읽은 작품 {books.length}편 · 책 {volumeCount}권{mode === 'sample' ? ' · 샘플 책장' : ''}. 지도에 위치가 없는 책도 여기서는 언제나 찾을 수 있어요.
      </p>
      <div className="toolbar">
        <label className="field search-box">
          <span className="sr-only">제목·저자 검색</span>
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목이나 저자로 찾기" />
        </label>
        <label className="field" style={{ minWidth: 160 }}>
          <span className="sr-only">연결 상태</span>
          <select className="input" value={state} onChange={(e) => setState(e.target.value as LinkState | 'all')}>
            <option value="all">모든 연결 상태</option>
            {(Object.keys(LINK_STATE_LABEL) as LinkState[]).map((s) => (
              <option key={s} value={s}>
                {LINK_STATE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-row" style={{ marginBottom: 16 }} role="group" aria-label="장르">
        <button type="button" className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
          전체 <span className="count">{counts.all}</span>
        </button>
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) =>
          counts[c] ? (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {CATEGORY_LABEL[c]} <span className="count">{counts[c]}</span>
            </button>
          ) : null,
        )}
      </div>
      <p className="meta" aria-live="polite" style={{ marginBottom: 4 }}>
        {rows.length}편 표시
      </p>
      <div>
        {rows.map(({ b, st }) => (
          <a key={b.work.id} className="library-row" href={hrefFor({ name: 'book', bookId: b.work.id })}>
            <div className="book-row-content">
              <div className="card-title book-title">{b.work.canonicalTitle}</div>
              <div className="meta prose">
                {formatAuthors(b.work.authors)}
                {b.editions.length > 1 ? ` · ${b.editions.length}권(${b.editions.map((e) => e.volumeLabel).filter(Boolean).join('·')})` : ''}
              </div>
            </div>
            <div className="side-meta">
              <span className="tag">{CATEGORY_LABEL[b.work.category]}</span>
              <span className={`tag${st === 'unplaced' ? ' dashed' : ''}`}>
                <Ico name={st === 'linked' ? 'place-real' : st === 'review' ? 'ev-pending' : 'place-unlocated'} />
                {LINK_STATE_LABEL[st]}
              </span>
              {b.editions.some((e) => e.needsReview) && <span className="tag accent">판독 확인 필요</span>}
            </div>
          </a>
        ))}
        {!rows.length && (
          <p className="notice">
            <span className="prose">
              {books.length ? '조건에 맞는 책이 없어요. 검색어나 필터를 바꿔 보세요.' : '아직 등록한 책이 없어요.'}
            </span>
            {!books.length && (
              <a className="link-btn" href="#/add" style={{ minHeight: 28 }}>
                읽은 책 추가
              </a>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
