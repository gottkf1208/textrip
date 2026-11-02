import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useStore, type BookView } from '../store';
import { CATEGORY_LABEL, type ContextLink, type Work } from '../types';
import { timesFor } from '../lib/selectors';
import { formatStampYear, getHolder, hash, placeCode, saveNodeAsImage } from '../lib/passport';
import { useReducedMotion } from '../lib/util';
import { useToast } from './Toast';

const GATE: Record<Work['category'], string> = { literature: 'L', philosophy: 'P', art: 'A', travel: 'T', other: 'E' };

/**
 * 책 탑승권. 쿼카 모션랩 ‘티켓 스텁(ticket-stub)’의 절취선 구멍·일련번호 릴·스텁 뜯기 원리를 옮겼어요.
 * 정보는 모두 실제 기록에서 가져와요: 목적지 = 고른 장소(없으면 첫 장소), 출발 연도 = 이야기 속 시간.
 */
export default function BoardingPass({ book, link, onClose, onBoard }: { book: BookView; link: ContextLink | null; onClose: () => void; onBoard: (linkId: string) => void }) {
  const { data, byId, mode } = useStore();
  const toast = useToast();
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [torn, setTorn] = useState(false);
  const [saving, setSaving] = useState(false);
  const { work, entry, links } = book;

  const temporals = useMemo(() => new Map(data.temporals.filter((t) => !t.deletedAt).map((t) => [t.id, t])), [data.temporals]);
  const ordered = links.filter((l) => l.placeId).sort((a, b) => (a.narrativeOrder ?? 99) - (b.narrativeOrder ?? 99));
  const target = link ?? ordered[0] ?? null;
  const place = target?.placeId ? byId.place.get(target.placeId) ?? null : null;
  const year = useMemo(() => {
    if (!target) return null;
    const ys = timesFor(target, temporals).filter((t) => t.kind !== 'publication' && t.startYear != null).map((t) => t.startYear!);
    return ys.length ? Math.min(...ys) : null;
  }, [target, temporals]);

  const h = hash(work.id);
  const flight = `TX ${String((h % 9000) + 1000)}`;
  const seat = `${(h % 38) + 1}${'ABCDEF'[(h >> 5) % 6]}`;
  const gate = `${GATE[work.category]}${((h >> 8) % 9) + 1}`;
  const serial = String(h % 100000000).padStart(8, '0');
  const holder = getHolder(mode === 'sample' ? '두목쿼카' : '여행자');
  const date = (() => {
    const d = new Date(entry.completedAt || entry.addedAt);
    return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  })();
  const stops = ordered.length > 1 ? ordered.slice(0, 5).map((l) => placeCode(byId.place.get(l.placeId!))) : [];
  const bars = useMemo(() => {
    let x = 0;
    const out: { x: number; w: number }[] = [];
    let v = h;
    while (x < 230) {
      v = Math.imul(v ^ (v >>> 13), 2654435761) >>> 0;
      const w = 1 + (v % 3);
      out.push({ x, w });
      x += w + 1 + ((v >> 4) % 3);
    }
    return out;
  }, [h]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const board = () => {
    if (!target) return;
    if (reduced) return onBoard(target.id);
    setTorn(true);
    window.setTimeout(() => onBoard(target.id), 650);
  };

  const save = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      await saveNodeAsImage(cardRef.current, `textrip-boarding-${placeCode(place).toLowerCase()}.png`, '#f6f3ec');
    } catch {
      toast({ message: '이미지를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.' });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-back bp-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bp-modal" role="dialog" aria-modal="true" aria-label={`‘${work.canonicalTitle}’ 탑승권`}>
        <button ref={closeRef} type="button" className="icon-btn bp-close" aria-label="탑승권 닫기" onClick={onClose}>
          <X size={22} aria-hidden />
        </button>

        {/* 이미지 저장 범위 = 9:16 스토리 판 */}
        <div className="bp-story" ref={cardRef}>
          <img className="bp-word" src="brand/textrip-wordmark.svg" alt="TEXTRIP" />
          <div className={`bp-ticket${torn ? ' torn' : ''}`}>
            <div className="bp-main">
              <div className="bp-row bp-top">
                <span>BOARDING PASS · 탑승권</span>
                <span className="tnum">{flight}</span>
              </div>
              <div className="bp-route">
                <div>
                  <div className="bp-code">SHF</div>
                  <div className="bp-city ko">내 책장</div>
                </div>
                <svg className="bp-plane" viewBox="0 0 64 16" aria-hidden>
                  <path d="M2 8h50" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" fill="none" />
                  <path d="M52 3l9 5-9 5z" fill="currentColor" />
                </svg>
                <div className="to">
                  <div className="bp-code">{placeCode(place)}</div>
                  <div className="bp-city ko">{place?.displayName ?? '생각 속 어딘가'}</div>
                </div>
              </div>
              <div className="bp-book">
                <div className="bp-label">탑승 도서 / Book</div>
                <div className="bp-title ko">{work.canonicalTitle}</div>
              </div>
              <dl className="bp-grid">
                <div>
                  <dt>승객 / Passenger</dt>
                  <dd className="ko">{holder}</dd>
                </div>
                <div>
                  <dt>출발 연도 / Year</dt>
                  <dd className="tnum">{year != null ? formatStampYear(year) : '확인 중'}</dd>
                </div>
                <div>
                  <dt>게이트 / Gate</dt>
                  <dd>
                    {gate} <small className="ko">{CATEGORY_LABEL[work.category]}</small>
                  </dd>
                </div>
                <div>
                  <dt>좌석 / Seat</dt>
                  <dd className="tnum">{seat}</dd>
                </div>
                <div>
                  <dt>등급 / Class</dt>
                  <dd className="ko">완독</dd>
                </div>
                <div>
                  <dt>기록일 / Date</dt>
                  <dd className="tnum">{date}</dd>
                </div>
              </dl>
              {stops.length > 1 && (
                <p className="bp-stops tnum" aria-label="경유지">
                  {stops.join(' → ')}
                </p>
              )}
            </div>
            <div className="bp-perf" aria-hidden />
            <div className="bp-stub">
              <svg className="bp-bars" viewBox="0 0 232 40" preserveAspectRatio="none" aria-hidden>
                {bars.map((b, i) => (
                  <rect key={i} x={b.x} y="0" width={b.w} height="40" fill="currentColor" />
                ))}
              </svg>
              <div className="bp-serial tnum" aria-label={`일련번호 ${serial}`}>
                <span className="no">No.</span>
                {serial.split('').map((d, i) => (
                  <span key={i} className="reel" aria-hidden style={{ '--n': Number(d), '--i': i } as CSSProperties}>
                    <span>{'01234567890123456789'.split('').map((x, k) => <i key={k}>{x}</i>)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="bp-slogan ko">그 이야기는 어디쯤, 언제쯤</p>
        </div>

        <div className="actions bp-actions">
          <button type="button" className="action primary" onClick={board} disabled={!target || torn}>
            탑승하기 · 지도에서 보기
          </button>
          <button type="button" className="action" onClick={save} disabled={saving}>
            {saving ? '이미지 만드는 중…' : '스토리 이미지로 저장'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
