import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { computeStamps, getHolder, getSeen, passportNo, saveNodeAsImage, setHolder, setSeen, formatStampYear, type Stamp } from '../lib/passport';
import { hrefFor, useReducedMotion } from '../lib/util';
import StampMark, { LockedStamp } from './StampMark';
import { useToast } from './Toast';

const PER = 12;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

interface Props {
  missingContinents: string[];
  countries: number;
  continents: number;
  oldest: number | null;
  newest: number | null;
}

type Item = { kind: 'stamp'; s: Stamp } | { kind: 'locked'; label: string };

/** 독서 여권: 표지 → 펼치면 신원면 + 입국 도장 면. 도장은 실제 기록(장소 연결)에서만 만들어요. */
export default function Passport({ missingContinents, countries, continents, oldest, newest }: Props) {
  const { books, data, mode } = useStore();
  const toast = useToast();
  const reduced = useReducedMotion();
  const { stamps } = useMemo(() => computeStamps(books, data), [books, data]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState<'next' | 'prev' | null>(null);
  const [sel, setSel] = useState<Stamp | null>(null);
  const [holder, setH] = useState(() => getHolder(mode === 'sample' ? '두목쿼카' : '여행자'));
  const [saving, setSaving] = useState(false);
  const spreadRef = useRef<HTMLDivElement>(null);

  // 처음 연 순간의 ‘본 도장’ 목록을 붙잡아 두고, 그 뒤로 생긴 도장에만 NEW를 붙여요.
  const [snapshot] = useState(() => getSeen(mode));
  const firstTime = snapshot === null;
  const newIds = useMemo(() => (snapshot ? new Set(stamps.filter((s) => !snapshot.has(s.id)).map((s) => s.id)) : new Set<string>()), [snapshot, stamps]);

  useEffect(() => {
    if (open && stamps.length) setSeen(mode, stamps.map((s) => s.id));
  }, [open, stamps, mode]);

  const items: Item[] = useMemo(() => [...stamps.map((s) => ({ kind: 'stamp' as const, s })), ...missingContinents.map((label) => ({ kind: 'locked' as const, label }))], [stamps, missingContinents]);
  const pages = Math.max(1, Math.ceil(items.length / PER));
  const flip = (d: 1 | -1) => {
    setTurn(d > 0 ? 'next' : 'prev');
    setPage((p) => Math.min(pages - 1, Math.max(0, p + d)));
  };
  const cur = items.slice(page * PER, page * PER + PER);
  const years = cur.flatMap((it) => (it.kind === 'stamp' && it.s.year != null ? [it.s.year] : []));

  const no = passportNo(mode === 'sample' ? 'quoka-sample' : holder);
  const issued = useMemo(() => {
    const ts = books.map((b) => b.entry.addedAt).filter(Boolean).sort();
    const d = ts.length ? new Date(ts[0]) : new Date();
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }, [books]);
  const mrz1 = 'P<TXTREADER<<TEXTRIP'.padEnd(44, '<');
  const mrz2 = `${no}<${(stamps.length % 10).toString()}RDR${String(stamps.length).padStart(3, '0')}<<${String(countries).padStart(3, '0')}<${String(continents)}`.padEnd(44, '<').slice(0, 44);

  const openPassport = () => {
    setOpen(true);
    setPage(0);
    if (!reduced) window.setTimeout(() => spreadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  };

  const save = async () => {
    if (!spreadRef.current) return;
    setSaving(true);
    try {
      await saveNodeAsImage(spreadRef.current, `textrip-passport-${page + 1}.png`, '#f6f3ec');
    } catch {
      toast({ message: '이미지를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.' });
    } finally {
      setSaving(false);
    }
  };

  if (!open)
    return (
      <section className="passport-intro" aria-label="독서 여권">
        <button type="button" className="pp-cover" onClick={openPassport} aria-label={`독서 여권 펼치기 · 도장 ${stamps.length}개${newIds.size ? ` · 새 도장 ${newIds.size}개` : ''}`}>
          <CoverArt />
          {newIds.size > 0 && <span className="pp-cover-new">새 도장 {newIds.size}</span>}
        </button>
        <div className="pp-pitch">
          <div className="eyebrow">Reading passport</div>
          <h2 className="ko">책으로 다녀온 곳마다 도장이 찍혀요</h2>
          <p className="prose">
            이야기 속 장소마다 입국 도장 하나. 도장 날짜는 그 이야기가 흘러간 <strong>연도</strong>예요. 지금까지 <strong className="tnum">{stamps.length}개</strong>를 모았어요.
          </p>
          <div className="actions">
            <button type="button" className="action primary" onClick={openPassport}>
              여권 펼치기
            </button>
          </div>
        </div>
      </section>
    );

  return (
    <section className="passport" aria-label="독서 여권">
      <div className="pp-spread" ref={spreadRef}>
        <div className="pp-page pp-id">
          <div className="pp-head">
            <span>PASSPORT · 여권</span>
            <span>TEXTRIP</span>
          </div>
          <div className="pp-id-body">
            <div className="pp-photo" aria-hidden>
              <svg viewBox="0 0 512 512">
                <path fill="none" stroke="#6e1a2f" strokeWidth="66" d="m179.2 153.6 153.6 153.6m0-153.6L179.2 307.2" />
                <path fill="none" stroke="#1f3460" strokeWidth="30" d="M153.6 378.88h204.8" />
              </svg>
            </div>
            <dl className="pp-fields">
              <div>
                <dt>종류 / Type</dt>
                <dd>P</dd>
              </div>
              <div>
                <dt>발행 / Code</dt>
                <dd>TXT</dd>
              </div>
              <div className="wide">
                <dt>여권 번호 / Passport No.</dt>
                <dd className="tnum">{no}</dd>
              </div>
              <div className="wide">
                <dt>
                  <label htmlFor="pp-holder">성명 / Name</label>
                </dt>
                <dd>
                  <input
                    id="pp-holder"
                    className="pp-holder"
                    value={holder}
                    maxLength={20}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setH(e.target.value)}
                    onBlur={() => setHolder(holder || '여행자')}
                  />
                </dd>
              </div>
              <div>
                <dt>국적 / Nationality</dt>
                <dd>읽는 사람</dd>
              </div>
              <div>
                <dt>발급일 / Issued</dt>
                <dd className="tnum">{issued}</dd>
              </div>
              <div className="wide">
                <dt>기간 만료일 / Expiry</dt>
                <dd>다음 책을 펼칠 때까지</dd>
              </div>
            </dl>
          </div>
          <dl className="pp-stats">
            <div>
              <dt>도장</dt>
              <dd className="tnum">{stamps.length}</dd>
            </div>
            <div>
              <dt>나라</dt>
              <dd className="tnum">{countries}</dd>
            </div>
            <div>
              <dt>대륙</dt>
              <dd className="tnum">
                {continents}
                <small>/6</small>
              </dd>
            </div>
            <div className="span">
              <dt>시간 여행</dt>
              <dd className="tnum">{oldest != null && newest != null ? `${formatStampYear(oldest)} → ${formatStampYear(newest)}` : '—'}</dd>
            </div>
          </dl>
          <p className="pp-mrz" aria-hidden>
            {mrz1}
            <br />
            {mrz2}
          </p>
        </div>

        <div className="pp-page pp-visa">
          <div className="pp-head">
            <span>입국 기록 · VISAS</span>
            <span className="tnum">{years.length ? `${formatStampYear(Math.min(...years))} — ${formatStampYear(Math.max(...years))}` : ''}</span>
          </div>
          <ul className={`stamp-grid${turn ? ` turn-${turn}` : ''}`} key={page}>
            {cur.map((it, i) =>
              it.kind === 'stamp' ? (
                <li key={it.s.id}>
                  <button
                    type="button"
                    className="stamp-cell"
                    aria-pressed={sel?.id === it.s.id}
                    aria-label={`${it.s.name}${it.s.sub && it.s.sub !== '가상 입국' ? ` · ${it.s.sub}` : ''} 입국 도장 · ${formatStampYear(it.s.year)} · 책 ${it.s.books.length}권${newIds.has(it.s.id) ? ' · 새 도장' : ''}`}
                    onClick={() => setSel((v) => (v?.id === it.s.id ? null : it.s))}
                  >
                    <StampMark s={it.s} isNew={newIds.has(it.s.id)} animate={!reduced && (firstTime || newIds.has(it.s.id))} delay={Math.min(i * 90, 1400) + 200} />
                  </button>
                </li>
              ) : (
                <li key={`lock-${it.label}`}>
                  <span className="stamp-cell" aria-label={`${it.label} · 아직 도장 없음`}>
                    <LockedStamp label={it.label} />
                  </span>
                </li>
              ),
            )}
          </ul>
          <div className="pp-foot">
            <button type="button" className="pp-nav" onClick={() => flip(-1)} disabled={page === 0} aria-label="이전 면">
              ‹
            </button>
            <span className="tnum">
              {page + 1} / {pages}
            </span>
            <button type="button" className="pp-nav" onClick={() => flip(1)} disabled={page >= pages - 1} aria-label="다음 면">
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="pp-caption" aria-live="polite">
        {sel ? (
          <>
            <p className="ko">
              <strong>{sel.name}</strong> 입국 · <span className="tnum">{formatStampYear(sel.year)}</span>
              {sel.sub && sel.sub !== '가상 입국' && <span className="meta"> · {sel.sub}</span>}
            </p>
            <ul>
              {sel.books.map((b) => (
                <li key={b.workId}>
                  <a className="arrow-link" href={hrefFor({ name: 'book', bookId: b.workId, linkId: b.linkId })}>
                    {b.title} <span className="arrow swap" aria-hidden><span>→</span><span>→</span></span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="meta">도장을 누르면 그곳에 데려다준 책이 나와요. 도장은 이야기 속 시간 순서로 찍혀 있어요.</p>
        )}
      </div>

      <div className="actions">
        <button type="button" className="action" onClick={save} disabled={saving}>
          {saving ? '이미지 만드는 중…' : '이 면을 이미지로 저장'}
        </button>
        <button type="button" className="action ghost" onClick={() => { setOpen(false); setSel(null); }}>
          여권 덮기
        </button>
      </div>
    </section>
  );
}

function CoverArt() {
  return (
    <span className="pp-cover-art" aria-hidden>
      <svg viewBox="0 0 300 420" className="pp-cover-svg">
        <defs>
          <linearGradient id="pp-foil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b89a5a" />
            <stop offset="0.45" stopColor="#efe0b4" />
            <stop offset="0.6" stopColor="#c2a464" />
            <stop offset="1" stopColor="#e2cf9b" />
          </linearGradient>
        </defs>
        <text x="150" y="62" textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="7" fill="url(#pp-foil)">
          TEXTRIP
        </text>
        <g transform="translate(150 178) scale(0.36) translate(-256 -266)">
          <circle cx="256" cy="266" r="236" fill="none" stroke="url(#pp-foil)" strokeWidth="9" />
          <circle cx="256" cy="266" r="206" fill="none" stroke="url(#pp-foil)" strokeWidth="3" strokeDasharray="6 10" />
          <path fill="none" stroke="url(#pp-foil)" strokeWidth="58" d="m179.2 153.6 153.6 153.6m0-153.6L179.2 307.2" />
          <path fill="none" stroke="url(#pp-foil)" strokeWidth="27" d="M153.6 378.88h204.8" />
        </g>
        <text x="150" y="300" textAnchor="middle" fontSize="38" fontWeight="800" letterSpacing="6" fill="url(#pp-foil)">
          독서 여권
        </text>
        <text x="150" y="330" textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="6.5" fill="url(#pp-foil)">
          READING PASSPORT
        </text>
        <g transform="translate(150 382)" fill="none" stroke="url(#pp-foil)" strokeWidth="2">
          <rect x="-17" y="-11" width="34" height="22" rx="4" />
          <circle r="5.5" />
          <path d="M-17 0h11.5M5.5 0H17" />
        </g>
      </svg>
    </span>
  );
}
