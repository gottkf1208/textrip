import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, Map as MapIcon, SlidersHorizontal, X, ChevronLeft, Flag } from 'lucide-react';
import { useStore } from '../store';
import { computeView, type PlaceGroup } from '../lib/selectors';
import { computeConquest, formatYear, type Course } from '../lib/conquest';
import { go, useLayout, useReducedMotion, type Route } from '../lib/util';
import { DEFAULT_FILTERS, PRECISION_LABEL, RELATION_LABEL, VERIFICATION_LABEL } from '../types';
import BookDetail from './BookDetail';
import PlaceList from './PlaceList';
import FilterPanel, { activeFilterCount } from './FilterPanel';
import { asset } from './Ico';
import type { Padding } from './MapView';

const MapView = lazy(() => import('./MapView'));

export default function MapWorkspace({ route }: { route: Route }) {
  const { books, data, filters, setFilters, settings, saveMapView, mode, switchMode, ready } = useStore();
  const layout = useLayout();
  const reduce = useReducedMotion();
  const view = useMemo(() => computeView(books, data, filters), [books, data, filters]);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [nonce, setNonce] = useState(0);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const initialView = useRef(settings?.mapView ?? null);
  const [conquestOn, setConquestOn] = useState(route.layer === 'conquest');
  useEffect(() => {
    if (route.layer === 'conquest') setConquestOn(true);
  }, [route.layer]);
  const conquest = useMemo(() => computeConquest(books, data), [books, data]);
  const course = route.name === 'course' ? conquest.courses.find((c) => c.id === route.courseId) : undefined;
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => setStepIdx(0), [route.courseId]);
  const step = course?.steps[Math.min(stepIdx, (course?.steps.length ?? 1) - 1)];
  const courseGroups = useMemo<PlaceGroup[] | null>(() => {
    if (!course) return null;
    const m = new Map<string, PlaceGroup>();
    for (const st of course.steps) {
      if (!st.place?.geometry) continue;
      const g = m.get(st.place.id) ?? { place: st.place, items: [], pendingOnly: true };
      g.items.push({ book: st.book, link: st.link });
      if (st.link.verificationStatus === 'curated' || st.link.verificationStatus === 'user_authored') g.pendingOnly = false;
      m.set(st.place.id, g);
    }
    return [...m.values()];
  }, [course]);

  const book = route.name === 'book' ? books.find((b) => b.work.id === route.bookId) : undefined;
  const defaultLink = book?.links.find((l) => l.placeId && data.places.find((p) => p.id === l.placeId)?.geometry) ?? book?.links[0];
  const selectedLinkId = book ? route.linkId ?? defaultLink?.id ?? null : null;
  const selectedLink = book?.links.find((l) => l.id === selectedLinkId);
  const selectedPlaceId = course ? (step?.place?.geometry ? step.place.id : null) : book ? selectedLink?.placeId ?? null : placeId;
  const group = placeId && !book ? view.groups.find((g) => g.place.id === placeId) : undefined;
  const hasSelection = Boolean(book || group || course);
  const bookHiddenByFilter = book && !view.visibleBooks.some((b) => b.work.id === book.work.id);

  // 상세를 닫으면 시작한 항목으로 포커스를 돌린다
  const close = useCallback(() => {
    setPlaceId(null);
    setExpanded(false);
    setTyping(false);
    if (route.name === 'course') {
      go({ name: 'conquest' });
      return;
    }
    if (route.name === 'book') go({ name: 'map' });
    const t = lastTrigger.current;
    requestAnimationFrame(() => {
      if (t && document.contains(t)) t.focus();
    });
  }, [route.name]);

  const openBook = useCallback((workId: string, linkId?: string) => {
    if (document.activeElement instanceof HTMLElement && !document.activeElement.closest('.detail')) lastTrigger.current = document.activeElement;
    setPlaceId(null);
    go({ name: 'book', bookId: workId, linkId });
  }, []);

  const selectPlace = useCallback(
    (pid: string) => {
      const g = view.groups.find((x) => x.place.id === pid);
      if (!g) return;
      if (document.activeElement instanceof HTMLElement) lastTrigger.current = document.activeElement;
      const works = [...new Set(g.items.map((i) => i.book.work.id))];
      if (works.length === 1) {
        go({ name: 'book', bookId: works[0], linkId: g.items[0].link.id });
        return;
      }
      setPlaceId(pid);
      setExpanded(false);
      if (route.name === 'book') go({ name: 'map' });
    },
    [view.groups, route.name],
  );

  const onSelectLink = useCallback(
    (linkId: string | null, focus?: boolean) => {
      if (!book) return;
      go({ name: 'book', bookId: book.work.id, linkId: linkId ?? undefined }, true);
      if (focus) setNonce((n) => n + 1);
    },
    [book],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasSelection && !filterOpen && !(e.target instanceof HTMLTextAreaElement)) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hasSelection, filterOpen, close]);

  // 데스크톱: 상세가 열리면 제목으로 포커스
  useEffect(() => {
    if (book && layout.desktop) requestAnimationFrame(() => document.getElementById(`t-${book.work.id}`)?.focus({ preventScroll: true }));
  }, [book?.work.id, layout.desktop]); // eslint-disable-line react-hooks/exhaustive-deps

  const sheetH = typeof window !== 'undefined' ? window.innerHeight * (expanded ? 0.9 : 0.42) : 0;
  const padding: Padding = layout.desktop
    ? { top: 72, right: 24, bottom: 24, left: 24 }
    : layout.mobile
      ? { top: 64, right: 24, bottom: hasSelection ? sheetH + 16 : 96, left: 24 }
      : { top: 72, right: hasSelection ? Math.min(400, window.innerWidth - 24) + 32 : 24, bottom: 24, left: 24 };

  const fullScreen = layout.mobile && hasSelection && (layout.short || typing);
  const count = activeFilterCount(filters);
  const empty = ready && mode === 'user' && books.length === 0;

  const goStep = (i: number) => {
    setStepIdx(i);
    setNonce((n) => n + 1);
  };
  const detail = course ? (
    <CoursePanel course={course} index={Math.min(stepIdx, course.steps.length - 1)} onStep={goStep} onClose={close} onOpenBook={openBook} hideClose={layout.mobile} />
  ) : book ? (
    <>
      {bookHiddenByFilter && (
        <p className="notice" role="note">
          <span className="prose">지금 필터에서는 이 책이 지도에 보이지 않아요.</span>
          <button type="button" className="link-btn" style={{ minHeight: 28 }} onClick={() => setFilters(DEFAULT_FILTERS)}>
            필터 지우기
          </button>
        </p>
      )}
      <BookDetail
        book={book}
        selectedLinkId={selectedLinkId}
        onSelectLink={onSelectLink}
        onClose={close}
        onTypingChange={setTyping}
        closeRef={closeBtn}
        hideClose={layout.mobile}
      />
    </>
  ) : group ? (
    <PlaceSummary group={group} onOpenBook={openBook} onClose={close} dark={layout.mobile} hideClose={layout.mobile} />
  ) : null;

  if (route.name === 'book' && ready && !book) {
    return (
      <div className="page">
        <h1 className="page-title">책을 찾지 못했어요</h1>
        <p className="lede">삭제했거나 다른 기록(샘플/내 기록)에 있는 책일 수 있어요.</p>
        <div className="actions">
          <a className="action" href="#/">
            나의 지도로
          </a>
          <a className="action ghost" href="#/settings">
            휴지통 보기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="map-area">
        {!(layout.mobile && showList) && (
          <Suspense fallback={<div className="map-status">지도를 불러오고 있어요</div>}>
            <MapView
              groups={courseGroups ?? view.groups}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={selectPlace}
              padding={padding}
              initialView={initialView.current}
              onViewChange={saveMapView}
              reduceMotion={reduce}
              freeze={typing}
              onShowList={() => setShowList(true)}
              focusNonce={nonce}
              conquestCodes={conquestOn ? conquest.countryCodes : null}
            />
          </Suspense>
        )}

        {layout.mobile && showList && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: 'var(--canvas)', padding: '64px var(--gutter) 120px' }}>
            <PlaceList groups={view.groups} unmapped={view.unmapped} workCount={view.workCount} onOpenBook={openBook} />
          </div>
        )}

        <div className="map-toolbar">
          <button type="button" className="chip" onClick={() => setFilterOpen(true)} aria-haspopup="dialog">
            <SlidersHorizontal size={16} aria-hidden /> 필터{count ? <span className="count">{count}</span> : null}
          </button>
          {!layout.desktop && (
            <button type="button" className="chip" aria-pressed={showList} onClick={() => setShowList((v) => !v)}>
              {showList ? <MapIcon size={16} aria-hidden /> : <List size={16} aria-hidden />}
              {showList ? '지도로 보기' : '목록으로 보기'}
            </button>
          )}
          {count > 0 && (
            <button type="button" className="chip" onClick={() => setFilters(DEFAULT_FILTERS)}>
              필터 지우기
            </button>
          )}
          <button type="button" className="chip" aria-pressed={conquestOn} onClick={() => setConquestOn((v) => !v)}>
            <Flag size={16} aria-hidden /> 정복 지도
          </button>
        </div>

        {conquestOn && !(layout.mobile && hasSelection) && (
          <div className="conquest-legend" role="note">
            <span className="swatch" aria-hidden />
            <span className="ko">
              책으로 정복한 나라 <strong className="tnum">{conquest.countries.length}</strong>곳 · 대륙 {conquest.continents.size}/6
            </span>
            <a className="arrow-link" href="#/conquest" style={{ minHeight: 32 }}>
              현황 <span className="arrow swap" aria-hidden><span>→</span><span>→</span></span>
            </a>
          </div>
        )}

        {empty && (
          <div className="empty-card">
            <img src={asset('illustrations/empty-map.svg')} alt="" />
            <h2>읽은 책을 지도에 남겨보세요</h2>
            <p className="prose meta">책장 사진 한 장이면 여러 권을 한 번에 등록할 수 있어요.</p>
            <div className="actions stack-xs">
              <a className="action primary" href="#/add?mode=photo">
                사진으로 추가
              </a>
              <a className="action" href="#/add?mode=search">
                책 이름으로 추가
              </a>
            </div>
            <button type="button" className="link-btn" onClick={() => switchMode('sample')}>
              샘플 둘러보기
            </button>
          </div>
        )}

        {/* 태블릿: 오버레이 패널 */}
        {layout.tablet && detail && (
          <div className={`overlay-panel ${book || course ? 'panel' : ''}`} style={{ background: book || course ? undefined : 'var(--canvas)' }}>
            <div className="side-inner">{detail}</div>
          </div>
        )}

        {/* 모바일: 요약 → 시트 → 전체 상세 */}
        {layout.mobile && !hasSelection && !showList && !empty && ready && (
          <div className="mobile-summary">
            <span className="stat tnum">
              책 {view.workCount}권 · 장소 {view.groups.length}곳
            </span>
            <div className="actions">
              <button type="button" className="action small" onClick={() => setShowList(true)}>
                목록 보기
              </button>
            </div>
          </div>
        )}
        {layout.mobile && hasSelection && !fullScreen && (
          <MobileSheet expanded={expanded} setExpanded={setExpanded} onClose={close} title={course?.title ?? book?.work.canonicalTitle ?? group?.place.displayName ?? ''}>
            {detail}
          </MobileSheet>
        )}
      </div>

      {layout.desktop && (
        <aside className={`side ${book || course ? 'panel' : ''}`} aria-label={course ? '원정 코스' : book ? '책 상세' : '목록'}>
          <div className="side-inner">
            {detail ?? <PlaceList groups={view.groups} unmapped={view.unmapped} workCount={view.workCount} onOpenBook={openBook} onSelectPlace={selectPlace} />}
          </div>
        </aside>
      )}

      {fullScreen && (
        <div className="fullscreen-detail" role="dialog" aria-modal="true" aria-label={book?.work.canonicalTitle ?? group?.place.displayName}>
          <div className="fs-head">
            <button type="button" className="icon-btn" aria-label="지도로 돌아가기" onClick={close}>
              <ChevronLeft size={24} aria-hidden />
            </button>
            <span className="ko" style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {book?.work.canonicalTitle ?? group?.place.displayName}
            </span>
          </div>
          <div className="fs-body">{detail}</div>
        </div>
      )}

      {filterOpen && <FilterPanel filters={filters} onChange={setFilters} onClose={() => setFilterOpen(false)} hiddenUnknownEra={view.hiddenUnknownEra} />}
    </div>
  );
}

function MobileSheet({ expanded, setExpanded, onClose, title, children }: { expanded: boolean; setExpanded: (v: boolean) => void; onClose: () => void; title: string; children: React.ReactNode }) {
  const startY = useRef<number | null>(null);
  return (
    <section className={`sheet${expanded ? ' expanded' : ''}`} aria-label={title}>
      <div
        className="sheet-handle"
        onPointerDown={(e) => {
          startY.current = e.clientY;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          if (startY.current === null) return;
          const dy = e.clientY - startY.current;
          startY.current = null;
          if (dy < -30) setExpanded(true);
          else if (dy > 60) expanded ? setExpanded(false) : onClose();
        }}
        aria-hidden
      />
      <div className="sheet-head">
        <span className="eyebrow" style={{ flex: 1 }}>
          {expanded ? '상세' : '요약'}
        </span>
        <button type="button" className="arrow-link" style={{ padding: '0 8px' }} onClick={() => setExpanded(!expanded)}>
          {expanded ? '접기' : '상세 보기'} <span className="arrow" aria-hidden>{expanded ? '↓' : '↑'}</span>
        </button>
        <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
          <X size={22} aria-hidden />
        </button>
      </div>
      <div className="sheet-body">{children}</div>
    </section>
  );
}

function PlaceSummary({ group, onOpenBook, onClose, dark, hideClose }: { group: PlaceGroup; onOpenBook: (w: string, l?: string) => void; onClose: () => void; dark?: boolean; hideClose?: boolean }) {
  const p = group.place;
  return (
    <div className="detail" style={dark ? undefined : { color: 'var(--text)' }}>
      <div className="detail-top">
        <div className="layout-child">
          <div className="eyebrow">{PRECISION_LABEL[p.precision]}{p.country && p.country !== p.displayName ? ` · ${p.country}` : ''}</div>
          <h2 className="book-title" style={{ fontSize: 28, margin: '6px 0 4px', lineHeight: 1.3 }}>{p.displayName}</h2>
        </div>
        {!hideClose && (
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            <X size={22} aria-hidden />
          </button>
        )}
      </div>
      <p className="meta prose">이곳과 연결된 책 {new Set(group.items.map((i) => i.book.work.id)).size}권. 지도 위치는 대표 위치예요.</p>
      <ul className="book-links" style={{ marginTop: 8 }}>
        {group.items.map(({ book, link }) => (
          <li key={link.id} style={{ borderTop: `1px solid ${dark ? 'var(--panel-line)' : 'var(--line)'}` }}>
            <button type="button" onClick={() => onOpenBook(book.work.id, link.id)}>
              <span className="t book-title">{book.work.canonicalTitle}</span>
              <span className="s" style={dark ? { color: 'var(--panel-secondary)' } : undefined}>
                {RELATION_LABEL[link.relationType]} · {VERIFICATION_LABEL[link.verificationStatus]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoursePanel({ course, index, onStep, onClose, onOpenBook, hideClose }: { course: Course; index: number; onStep: (i: number) => void; onClose: () => void; onOpenBook: (w: string, l?: string) => void; hideClose?: boolean }) {
  const st = course.steps[index];
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' && index < course.steps.length - 1) onStep(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onStep(index - 1);
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [index, course.steps.length, onStep]);
  const kind = { city: '도시 원정', era: '시대 원정', thinker: '사상가 루트', fictional: '가상 장소 순례' }[course.kind];
  return (
    <div className="detail">
      <div className="detail-top">
        <div className="layout-child">
          <div className="eyebrow">{kind} · 원정 코스</div>
          <h2 className="book-title" style={{ fontSize: 28, margin: '6px 0 2px', lineHeight: 1.3 }}>{course.title}</h2>
          <p className="meta">{course.subtitle}</p>
        </div>
        {!hideClose && (
          <button type="button" className="icon-btn" aria-label="원정 끝내기" onClick={onClose}>
            <X size={22} aria-hidden />
          </button>
        )}
      </div>
      <section className="course-now step-desc" key={st.link.id} aria-live="polite">
        <div className="eyebrow tnum">
          {index + 1} / {course.steps.length}
          {st.time?.startYear != null ? ` · ${formatYear(st.time.startYear)}` : ''}
        </div>
        <h3 className="ko">{st.book.work.canonicalTitle}</h3>
        <p className="meta ko">{st.book.work.authors.join(' · ') || '저자 확인 필요'}</p>
        <p className="ko" style={{ margin: '8px 0 4px', fontWeight: 650 }}>
          {st.place?.displayName ?? '위치 없이 기록'}
          {st.place?.reality === 'fictional' ? ' · 가상 장소' : ''}
        </p>
        <p className="prose" style={{ margin: '0 0 6px' }}>{st.link.summary}</p>
        {st.time && <p className="meta ko">{st.time.label}</p>}
        <p className="meta">{st.link.verificationStatus === 'curated' ? '출처 있음' : st.link.verificationStatus === 'user_authored' ? '직접 입력' : '근거 확인 필요'}</p>
        <div className="actions" style={{ marginTop: 10 }}>
          <button type="button" className="action small" onClick={() => onStep(index - 1)} disabled={index === 0}>
            이전
          </button>
          <button type="button" className="action small primary" onClick={() => onStep(index + 1)} disabled={index === course.steps.length - 1}>
            다음 정복지
          </button>
          <button type="button" className="arrow-link" style={{ marginLeft: 4 }} onClick={() => onOpenBook(st.book.work.id, st.link.id)}>
            책 열기 <span className="arrow swap" aria-hidden><span>→</span><span>→</span></span>
          </button>
        </div>
      </section>
      <ol className="course-steps" aria-label="원정 순서">
        {course.steps.map((s, i) => (
          <li key={s.link.id}>
            <button type="button" aria-current={i === index ? 'step' : undefined} onClick={() => onStep(i)}>
              <span className="n">{i + 1}</span>
              <span className="layout-child">
                <span className="ko" style={{ display: 'block', fontWeight: 600 }}>{s.book.work.canonicalTitle}</span>
                <span className="meta ko" style={{ display: 'block' }}>
                  {s.place?.displayName ?? '위치 없음'}
                  {s.time?.startYear != null ? ` · ${formatYear(s.time.startYear)}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {course.kind === 'fictional' && <p className="meta prose" style={{ marginTop: 12 }}>가상 장소는 좌표가 없어 지도를 움직이지 않아요. 순서대로 카드만 넘겨 보세요.</p>}
    </div>
  );
}
