import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useStore, type BookView } from '../store';
import {
  CATEGORY_LABEL,
  PRECISION_LABEL,
  REALITY_LABEL,
  RELATION_ICON,
  RELATION_LABEL,
  TEMPORAL_KIND_LABEL,
  VERIFICATION_ICON,
  VERIFICATION_LABEL,
  type ContextLink,
  type TemporalContext,
} from '../types';
import { formatAuthors } from '../lib/util';
import { timesFor } from '../lib/selectors';
import { Ico } from './Ico';
import MemoEditor from './MemoEditor';
import { useToast } from './Toast';
import LinkReview from './LinkReview';
import BoardingPass from './BoardingPass';
import { go } from '../lib/util';

interface Props {
  book: BookView;
  selectedLinkId: string | null;
  onSelectLink: (linkId: string | null, focusMap?: boolean) => void;
  onClose: () => void;
  onTypingChange?: (t: boolean) => void;
  closeRef?: React.Ref<HTMLButtonElement>;
  hideClose?: boolean;
}

export default function BookDetail({ book, selectedLinkId, onSelectLink, onClose, onTypingChange, closeRef, hideClose }: Props) {
  const { data, byId, deleteBook, restoreBook } = useStore();
  const toast = useToast();
  const temporals = useMemo(() => new Map(data.temporals.map((t) => [t.id, t])), [data.temporals]);
  const evidence = useMemo(() => new Map(data.evidence.map((e) => [e.id, e])), [data.evidence]);
  const { work, entry, editions, links } = book;
  const link = links.find((l) => l.id === selectedLinkId) ?? null;
  const place = link?.placeId ? byId.place.get(link.placeId) ?? null : null;
  const ordered = links.filter((l) => l.narrativeOrder != null).sort((a, b) => a.narrativeOrder! - b.narrativeOrder!);
  const isPhilosophy = work.category === 'philosophy';
  const [tab, setTab] = useState<'book' | 'place'>('book');
  const [showReview, setShowReview] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!selectedLinkId && tab === 'place') setTab('book');
  }, [selectedLinkId, tab]);

  const translators = [...new Set(editions.flatMap((e) => e.translators ?? []))];
  const review = editions.find((e) => e.needsReview);
  const workTimes = data.temporals.filter((t) => t.workId === work.id && !t.deletedAt);
  const timesByKind = groupTimes(workTimes);

  const onDelete = async () => {
    await deleteBook(work.id);
    toast({ message: `‘${work.canonicalTitle}’을 삭제했어요`, actionLabel: '실행 취소', onAction: () => restoreBook(work.id) });
    onClose();
  };

  const placeCard = (l: ContextLink, step?: number) => {
    const p = l.placeId ? byId.place.get(l.placeId) : null;
    const fictional = p?.reality === 'fictional';
    return (
      <li key={l.id}>
        <button
          type="button"
          className={`place-card${fictional ? ' fictional' : ''}`}
          aria-current={l.id === selectedLinkId}
          onClick={() => onSelectLink(l.id, true)}
        >
          {step !== undefined ? <span className="step">{step}</span> : <Ico name={RELATION_ICON[l.relationType]} />}
          <span className="layout-child">
            <span className="card-title" style={{ display: 'block' }}>
              {p?.displayName ?? '위치 없이 기록'}
            </span>
            <span className="meta" style={{ display: 'block' }}>
              {RELATION_LABEL[l.relationType]}
              {p && ` · ${fictional ? '가상 장소 · 정확한 위치 없음' : p.reality === 'unknown' ? REALITY_LABEL.unknown : PRECISION_LABEL[p.precision]}`}
            </span>
          </span>
          <Ico name={VERIFICATION_ICON[l.verificationStatus]} label={VERIFICATION_LABEL[l.verificationStatus]} />
        </button>
      </li>
    );
  };

  return (
    <article className="detail" aria-labelledby={`t-${work.id}`}>
      <div className="detail-top">
        <div className="layout-child">
          <div className="eyebrow">{CATEGORY_LABEL[work.category]}</div>
          <h2 id={`t-${work.id}`} ref={titleRef} className="book-title" tabIndex={-1}>
            {work.canonicalTitle}
          </h2>
        </div>
        {!hideClose && (
          <button ref={closeRef} type="button" className="icon-btn" aria-label="상세 닫기" onClick={onClose}>
            <X size={22} aria-hidden />
          </button>
        )}
      </div>
      {work.subtitle && <p className="subtitle prose">{work.subtitle}</p>}
      <p className="authors prose">{formatAuthors(work.authors, translators)}</p>
      <div className="meta-row" style={{ marginBottom: 4 }}>
        {work.originalTitle && <span className="meta meta-item">원제 {work.originalTitle}</span>}
        {editions.length > 1 && <span className="meta meta-item">{editions.length}권 · {editions.map((e) => e.volumeLabel ?? '').filter(Boolean).join(' / ')}</span>}
        {editions[0]?.publisher && <span className="meta meta-item">{editions[0].publisher}</span>}
        {editions[0]?.series && <span className="meta meta-item">{editions[0].series}</span>}
      </div>
      <div className="actions" style={{ margin: '10px 0 4px' }}>
        <button type="button" className="action small bp-open" onClick={() => setShowPass(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" />
            <path d="M15 7v10" strokeDasharray="1.6 1.8" />
          </svg>
          탑승권 받기
        </button>
      </div>
      {showPass && (
        <BoardingPass
          book={book}
          link={link}
          onClose={() => setShowPass(false)}
          onBoard={(id) => {
            setShowPass(false);
            onSelectLink(id, true);
          }}
        />
      )}
      {review && (
        <p className="notice" role="note">
          <span aria-hidden>!</span>
          <span className="prose">판독 확인 필요 · {review.reviewNote}</span>
        </p>
      )}

      {/* 선택한 장소 */}
      {link && (
        <section className="detail-section" aria-label="선택한 장소">
          <p className="place-hero">{place?.displayName ?? '위치 없이 기록'}</p>
          <div className="meta-row" style={{ marginBottom: 8 }}>
            <span className="tag">
              <Ico name={RELATION_ICON[link.relationType]} /> {RELATION_LABEL[link.relationType]}
            </span>
            {place && (
              <span className={`tag${place.reality === 'fictional' ? ' dashed' : ''}`}>
                <Ico name={place.reality === 'real' ? 'place-real' : place.reality === 'fictional' ? 'place-fictional' : 'place-unknown'} />
                {place.reality === 'real' ? PRECISION_LABEL[place.precision] : REALITY_LABEL[place.reality]}
              </span>
            )}
            <span className={`tag${link.verificationStatus === 'curated' ? ' solid' : ''}`}>
              <Ico name={VERIFICATION_ICON[link.verificationStatus]} /> {VERIFICATION_LABEL[link.verificationStatus]}
            </span>
            {link.userAcceptedAt && link.verificationStatus !== 'user_authored' && <span className="tag">내가 채택함</span>}
          </div>
          {place?.historicName && <p className="meta">당시 이름 · {place.historicName}</p>}
          <p className="prose" style={{ margin: '0 0 8px' }}>
            {link.summary}
          </p>
          {place?.reality === 'fictional' && <p className="meta prose">작품 속 가상 장소라 지도에 좌표를 만들지 않았어요.</p>}
          {place?.geometry && (place.precision === 'city' || place.precision === 'country' || place.precision === 'region') && (
            <p className="meta prose">지도 위치는 {PRECISION_LABEL[place.precision]} 대표 위치예요. 사건이 일어난 정확한 현장이 아니에요.</p>
          )}
          <TimeList times={timesFor(link, temporals)} />
          <Evidence ids={link.evidenceIds} evidence={evidence} status={link.verificationStatus} />
        </section>
      )}

      {/* 문학: 주요 배경의 흐름 / 연결된 장소 */}
      {ordered.length > 1 && !isPhilosophy && (
        <section className="detail-section">
          <h3>주요 배경의 흐름</h3>
          <p className="meta prose" style={{ marginTop: -6, marginBottom: 10 }}>
            핵심 장소를 순서대로 요약했어요. 작품 속 전체 이동 경로나 길찾기가 아니에요.
          </p>
          <ol className="place-cards">{ordered.map((l, i) => placeCard(l, i + 1))}</ol>
        </section>
      )}

      {isPhilosophy && (
        <section className="detail-section">
          <h3>어떤 질문을 다루는가</h3>
          {work.questions?.length ? (
            work.questions.map((q, i) => (
              <p key={i} className="prose" style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>
                {q.text}
                {q.draft ? <span className="meta" style={{ fontWeight: 500, fontSize: 13 }}> · 소개 초안</span> : <span className="meta" style={{ fontWeight: 500, fontSize: 13 }}> · 책의 부제</span>}
              </p>
            ))
          ) : (
            <p className="meta prose">아직 적어 둔 질문이 없어요. 아래 책 메모에 ‘내가 남긴 질문’을 써 보세요.</p>
          )}
          {work.subjects.length > 0 && (
            <div className="meta-row" style={{ marginTop: 8 }}>
              {work.subjects.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {(ordered.length <= 1 || isPhilosophy) && (
        <section className="detail-section">
          <h3>{isPhilosophy ? '어떤 시대·지역과 연결되는가' : '연결된 장소'}</h3>
          {links.length ? (
            <ul className="place-cards">{links.map((l) => placeCard(l))}</ul>
          ) : (
            <p className="notice" role="note">
              <Ico name="place-unlocated" />
              <span className="prose">위치 없이 기록한 책이에요. 장소를 정할 근거가 없어도 메모와 주제로 계속 기록할 수 있어요.</span>
            </p>
          )}
        </section>
      )}

      {Object.keys(timesByKind).length > 0 && (
        <section className="detail-section">
          <h3>시간</h3>
          <dl className="kv">
            {Object.entries(timesByKind).map(([k, list]) => (
              <Frag key={k} k={TEMPORAL_KIND_LABEL[k as TemporalContext['kind']]} v={list.map((t) => t.label + (t.certainty === 'estimated' && !/추정/.test(t.label) && t.kind !== 'publication' ? ' (추정)' : '')).join(' / ')} />
            ))}
          </dl>
        </section>
      )}

      {/* 메모 */}
      <section className="detail-section" aria-label="나의 기록">
        <h3>나의 기록</h3>
        <div className="tabs" role="tablist" aria-label="메모 종류">
          <button type="button" role="tab" aria-selected={tab === 'book'} aria-controls="memo-panel" onClick={() => setTab('book')}>
            {isPhilosophy ? '책 메모 · 내가 남긴 질문' : '책 메모'}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'place'} aria-controls="memo-panel" disabled={!link} onClick={() => setTab('place')} title={link ? undefined : '장소를 먼저 고르세요'}>
            장소 메모{place ? ` · ${place.displayName}` : ''}
          </button>
          <span className="indicator" style={{ transform: `translateX(${tab === 'place' ? '100%' : '0'})` }} />
        </div>
        <div id="memo-panel" role="tabpanel" className="tab-panel" key={tab + (link?.id ?? '')}>
          {tab === 'book' || !link ? (
            <MemoEditor
              entryId={entry.id}
              linkId={null}
              label={`‘${work.canonicalTitle}’ 전체에 대한 메모`}
              placeholder={isPhilosophy ? '이 책이 남긴 질문, 다시 생각해 보고 싶은 대목을 적어 보세요.' : '이 책을 다시 떠올릴 때 붙잡고 싶은 생각을 적어 보세요.'}
              onTypingChange={onTypingChange}
            />
          ) : (
            <MemoEditor
              entryId={entry.id}
              linkId={link.id}
              label={`${place?.displayName ?? '이 장소'}에서 떠올린 생각`}
              placeholder="이 장소와 장면에서 떠오른 생각을 적어 보세요."
              onTypingChange={onTypingChange}
            />
          )}
        </div>
      </section>

      <section className="detail-section">
        <div className="actions">
          <button type="button" className="action small" onClick={() => setShowReview((v) => !v)} aria-expanded={showReview}>
            {showReview ? '연결 검토 닫기' : '연결 검토 · 장소 추가'}
          </button>
          <button type="button" className="action small ghost" onClick={onDelete}>
            책 삭제
          </button>
        </div>
        {showReview && (
          <LinkReview
            book={book}
            onAdded={(id) => {
              onSelectLink(id, true);
              toast({ message: '쾅! 독서 여권에 입국 도장이 찍혔어요', actionLabel: '여권 보기', onAction: () => go({ name: 'conquest' }) });
            }}
          />
        )}
      </section>
    </article>
  );
}

function Frag({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt>{k}</dt>
      <dd className="ko">{v}</dd>
    </>
  );
}

function groupTimes(list: TemporalContext[]) {
  const out: Partial<Record<TemporalContext['kind'], TemporalContext[]>> = {};
  const order: TemporalContext['kind'][] = ['story', 'discussion', 'thinker_activity', 'publication'];
  for (const k of order) {
    const items = list.filter((t) => t.kind === k);
    if (items.length) out[k] = items;
  }
  return out;
}

function TimeList({ times }: { times: TemporalContext[] }) {
  if (!times.length) return <p className="meta">시대 확인 중</p>;
  return (
    <div className="meta-row" style={{ margin: '4px 0 8px' }}>
      {times.map((t) => (
        <span key={t.id} className="meta meta-item">
          {TEMPORAL_KIND_LABEL[t.kind]} · <span className="nowrap-unit">{t.label}</span>
          {t.certainty === 'estimated' && !/추정/.test(t.label) ? ' (추정)' : ''}
        </span>
      ))}
    </div>
  );
}

function Evidence({ ids, evidence, status }: { ids: string[]; evidence: Map<string, import('../types').Evidence>; status: ContextLink['verificationStatus'] }) {
  const list = ids.map((id) => evidence.get(id)).filter(Boolean) as import('../types').Evidence[];
  if (!list.length)
    return (
      <p className="meta prose">
        {status === 'user_authored' ? '직접 입력한 연결이에요.' : '아직 출처가 없어요. 근거를 확인하기 전까지 검증된 정보로 보지 마세요.'}
      </p>
    );
  return (
    <details>
      <summary className="arrow-link" style={{ listStyle: 'none' }}>
        근거 {list.length}개 보기 <span className="arrow" aria-hidden>→</span>
      </summary>
      <ul className="evidence-list">
        {list.map((e) => (
          <li key={e.id}>
            <a href={e.url ?? undefined} target="_blank" rel="noreferrer noopener">
              {e.title}
            </a>
            <br />
            <span className="meta">뒷받침하는 내용 · {e.supportedClaim} · 확인일 {e.accessedAt}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
