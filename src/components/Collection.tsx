import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { DoorOpen, Globe, Hourglass, Key, Lamp, Lock, Plane, Search } from 'lucide-react';
import { useStore } from '../store';
import { CATEGORY_LABEL } from '../types';
import { computePins, computePostcards, computeStickers, type PinId, type Postcard, type Sticker } from '../lib/collection';
import { computeConquest } from '../lib/conquest';
import { computeStamps, formatStampYear, getSeen, saveNodeAsImage, setSeen } from '../lib/passport';
import { go, hrefFor, useMediaQuery, useReducedMotion } from '../lib/util';
import { CountUp, tilt } from '../lib/motion';
import { Cover } from '../lib/covers';
import { asset } from './Ico';
import Passport from './Passport';
import { useToast } from './Toast';

const TABS = [
  { id: 'trunk', label: '여행 가방' },
  { id: 'postcards', label: '엽서함' },
  { id: 'pins', label: '핀 배지' },
  { id: 'passport', label: '독서 여권' },
] as const;
type TabId = (typeof TABS)[number]['id'];
/** 마스코트 ‘립이’ — 탭마다 다른 자세 */
const MASCOT: Record<TabId, string> = { trunk: 'idle', postcards: 'postcard', pins: 'cheer', passport: 'stamp' };

const abs = (p: string) => new URL(asset(p), document.baseURI).href;

/** 이미지가 실제로 있는지 미리 확인 (에셋이 오기 전에는 점선·그림 없는 판으로) */
function useAsset(path: string | null) {
  const [ok, setOk] = useState<boolean | null>(path ? null : false);
  useEffect(() => {
    if (!path) return setOk(false);
    let alive = true;
    const img = new Image();
    img.onload = () => alive && setOk(true);
    img.onerror = () => alive && setOk(false);
    img.src = asset(path);
    return () => {
      alive = false;
    };
  }, [path]);
  return ok;
}

export default function Collection({ tab }: { tab?: string }) {
  const { books, data } = useStore();
  const active: TabId = (TABS.some((t) => t.id === tab) ? tab : 'trunk') as TabId;
  const st = useMemo(() => computeStickers(books, data), [books, data]);
  const cards = useMemo(() => computePostcards(books, data), [books, data]);
  const pins = useMemo(() => computePins(books, data), [books, data]);
  const conquest = useMemo(() => computeConquest(books, data), [books, data]);
  const stampCount = useMemo(() => computeStamps(books, data).stamps.length, [books, data]);
  const segRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  // 따라오는 칸(lp-nav-hover-follow): 고른 탭 아래 판이 미끄러져 따라가요
  useEffect(() => {
    const btn = segRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (btn) setPill({ x: btn.offsetLeft, w: btn.offsetWidth });
  }, [active]);

  const counts: Record<TabId, ReactNode> = {
    trunk: `${st.owned.length}/${st.total}`,
    postcards: cards.length,
    pins: `${pins.filter((p) => p.earned).length}/${pins.length}`,
    passport: stampCount,
  };

  return (
    <div className="page collection">
      <div className="eyebrow">Collection · 책으로 모은 것들</div>
      <h1 className="page-title" style={{ marginTop: 6 }}>
        수집함
      </h1>
      <p className="lede">읽은 책이 데려간 곳마다 스티커와 도장이 생기고, 책마다 엽서가 한 장씩 모여요. 메모를 쓰면 엽서 뒷면에 적혀요.</p>

      <dl className="stat-grid" data-reveal>
        <div>
          <dt>스티커</dt>
          <dd>
            <CountUp value={st.owned.length} delay={450} />
            <small>/{st.total}</small>
          </dd>
        </div>
        <div>
          <dt>엽서</dt>
          <dd>
            <CountUp value={cards.length} delay={570} />
          </dd>
        </div>
        <div>
          <dt>핀 배지</dt>
          <dd>
            <CountUp value={pins.filter((p) => p.earned).length} delay={690} />
            <small>/{pins.length}</small>
          </dd>
        </div>
        <div>
          <dt>입국 도장</dt>
          <dd>
            <CountUp value={stampCount} delay={810} />
          </dd>
        </div>
      </dl>

      <div className="seg-row">
      <div className="seg" role="tablist" aria-label="수집함 종류" ref={segRef}>
        {pill && <span className="seg-pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} aria-hidden />}
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" data-tab={t.id} aria-selected={active === t.id} aria-controls="col-panel" onClick={() => go({ name: 'collection', tab: t.id }, true)}>
            {t.label} <span className="seg-n tnum">{counts[t.id]}</span>
          </button>
        ))}
      </div>
      <img key={active} className="mascot" src={asset(`collect/mascot/${MASCOT[active]}.webp`)} alt="" aria-hidden onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
      </div>

      <div id="col-panel" role="tabpanel" className="col-panel" key={active}>
        {active === 'trunk' && <Trunk owned={st.owned} locked={st.locked} />}
        {active === 'postcards' && <PostcardBox cards={cards} />}
        {active === 'pins' && <PinBoard pins={pins} />}
        {active === 'passport' && (
          <Passport missingContinents={conquest.missingContinents} countries={conquest.countries.length} continents={conquest.continents.size} oldest={conquest.oldest} newest={conquest.newest} />
        )}
      </div>
    </div>
  );
}

/* ───────── 여행 가방 ───────── */

const RARITY_LABEL = {
  normal: '기본',
  gold: '금박 · 단골 도시',
  holo: '홀로그램 · 가상 장소',
} as const;

function Trunk({ owned, locked }: { owned: Sticker[]; locked: { placeId: string; name: string }[] }) {
  const { mode } = useStore();
  const reduced = useReducedMotion();
  const wide = useMediaQuery('(min-width: 900px)');
  const art = useAsset('collect/trunk.webp');
  const [sel, setSel] = useState<Sticker | null>(null);
  const [snapshot] = useState(() => getSeen(mode, 'Stickers'));
  const first = snapshot === null;
  const fresh = useMemo(() => new Set(snapshot ? owned.filter((s) => !snapshot.has(s.id)).map((s) => s.id) : []), [snapshot, owned]);
  useEffect(() => {
    if (owned.length)
      setSeen(
        mode,
        owned.map((s) => s.id),
        'Stickers',
      );
  }, [owned, mode]);
  const useArt = art && wide && owned.length + locked.length <= 44;

  return (
    <section aria-label="여행 가방 스티커">
      <div className={`trunk${useArt ? ' has-art' : ''}`} style={useArt ? { backgroundImage: `url("${abs('collect/trunk.webp')}")` } : undefined}>
        {!useArt && (
          <>
            <span className="tk-handle" aria-hidden />
            <span className="tk-corner tl" aria-hidden />
            <span className="tk-corner tr" aria-hidden />
            <span className="tk-corner bl" aria-hidden />
            <span className="tk-corner br" aria-hidden />
            <span className="tk-latch l" aria-hidden />
            <span className="tk-latch r" aria-hidden />
          </>
        )}
        <ul className="trunk-face">
          {owned.map((s, i) => {
            const drop = !reduced && (first ? i < 40 : fresh.has(s.id));
            return (
              <li key={s.id}>
                <StickerItem s={s} drop={drop} delay={first ? 120 + i * 60 : 300} isNew={fresh.has(s.id)} selected={sel?.id === s.id} onPick={() => setSel((v) => (v?.id === s.id ? null : s))} />
              </li>
            );
          })}
          {locked.map((l) => (
            <li key={l.placeId}>
              <span className="sticker-slot" aria-label={`${l.name} · 아직 못 얻은 스티커`}>
                <span>?</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pp-caption" aria-live="polite">
        {sel ? (
          <>
            <p className="ko">
              <strong>{sel.name}</strong> <span className={`rarity r-${sel.rarity}`}>{RARITY_LABEL[sel.rarity]}</span>
              {sel.sub && <span className="meta"> · {sel.sub}</span>}
              {sel.year != null && <span className="meta tnum"> · {formatStampYear(sel.year)}</span>}
            </p>
            <ul>
              {sel.books.map((b) => (
                <li key={b.workId}>
                  <a
                    className="arrow-link"
                    href={hrefFor({
                      name: 'book',
                      bookId: b.workId,
                      linkId: b.linkId,
                    })}
                  >
                    {b.title} <Arrow />
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="meta">
            스티커를 누르면 그곳에 데려다준 책이 나와요. 같은 곳에 책 3권이 모이면 <b className="rarity r-gold">금박</b>, 작품 속 가상 장소는 <b className="rarity r-holo">홀로그램</b>이에요.
          </p>
        )}
      </div>
    </section>
  );
}

function StickerItem({ s, drop, delay, isNew, selected, onPick }: { s: Sticker; drop: boolean; delay: number; isNew: boolean; selected: boolean; onPick: () => void }) {
  const [bad, setBad] = useState(!s.art);
  const j = s.rot * 7919;
  const style = {
    '--rot': `${s.rot * 1.6}deg`,
    '--jx': `${(Math.abs(j) % 11) - 5}%`,
    '--jy': `${(Math.abs(j >> 3) % 11) - 5}%`,
    '--dd': `${delay}ms`,
    '--spin': `${s.rot > 0 ? 4 : -4}deg`,
  } as CSSProperties;
  const mask =
    !bad && s.art
      ? ({
          WebkitMaskImage: `url("${abs(s.art)}")`,
          maskImage: `url("${abs(s.art)}")`,
        } as CSSProperties)
      : undefined;
  return (
    <button
      type="button"
      className={`sticker r-${s.rarity}${drop ? ' drop' : ''}${bad ? ' no-art' : ''}`}
      style={style}
      aria-pressed={selected}
      aria-label={`${s.name} 스티커 · ${RARITY_LABEL[s.rarity]} · 책 ${s.books.length}권${isNew ? ' · 새로 얻음' : ''}`}
      onClick={onPick}
      {...tilt}
    >
      <span className="sk-body">
        {!bad && s.art ? (
          <img src={asset(s.art)} alt="" loading="lazy" decoding="async" onError={() => setBad(true)} />
        ) : (
          <span className="sk-fallback">
            <b>{s.name}</b>
            <small>{s.rarity === 'holo' ? '가상 장소' : s.sub.split(' ')[0]}</small>
          </span>
        )}
        {s.rarity !== 'normal' && <span className="sk-foil" style={mask} aria-hidden />}
      </span>
      {isNew && <span className="sk-new">NEW</span>}
    </button>
  );
}

/* ───────── 엽서함 ───────── */

function PostcardBox({ cards }: { cards: Postcard[] }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(12);
  const withMemo = cards.filter((c) => c.memo).length;
  if (!cards.length) return <p className="notice">장소가 연결된 책이 생기면 엽서가 도착해요.</p>;
  return (
    <section aria-label="책 엽서">
      <p className="help" style={{ margin: '0 0 14px' }}>
        엽서를 누르면 뒤집혀요. 뒷면에는 내 책 메모가 적혀요 · 메모 있는 엽서 <b className="tnum">{withMemo}</b>장
      </p>
      <ul className="postcards">
        {cards.slice(0, limit).map((c) => (
          <li key={c.workId} data-reveal>
            <PostcardItem
              c={c}
              flipped={flipped.has(c.workId)}
              onFlip={() =>
                setFlipped((prev) => {
                  const n = new Set(prev);
                  if (n.has(c.workId)) n.delete(c.workId);
                  else n.add(c.workId);
                  return n;
                })
              }
            />
          </li>
        ))}
      </ul>
      {limit < cards.length && (
        <div className="actions" style={{ justifyContent: 'center', marginTop: 20 }}>
          <button type="button" className="action" onClick={() => setLimit((n) => n + 12)}>
            엽서 더 보기 <span className="meta tnum">{cards.length - limit}장 남음</span>
          </button>
        </div>
      )}
    </section>
  );
}

function PostcardItem({ c, flipped, onFlip }: { c: Postcard; flipped: boolean; onFlip: () => void }) {
  const toast = useToast();
  const [bad, setBad] = useState(!c.art);
  const stampOk = useAsset(`collect/stamps/${c.category}.webp`);
  const frontRef = useRef<HTMLSpanElement>(null);
  const backRef = useRef<HTMLSpanElement>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const node = flipped ? backRef.current : frontRef.current;
    if (!node) return;
    setSaving(true);
    try {
      await saveNodeAsImage(node, `textrip-postcard-${c.place.displayName}-${flipped ? 'back' : 'front'}.png`, '#f6f3ec', { transform: 'none', position: 'relative', inset: 'auto' });
    } catch {
      toast({ message: '이미지를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="pc-wrap">
      <button
        type="button"
        className={`postcard${flipped ? ' flipped' : ''}`}
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={`‘${c.title}’ 엽서 · ${c.place.displayName} · ${flipped ? '뒷면' : '앞면'} · 눌러서 뒤집기`}
        {...tilt}
      >
        <span className="pc-tilt">
          <span className="pc-inner">
            <span className="pc-face pc-front" ref={frontRef}>
              <span className="pc-sheet">
                <span className="pc-art">
                  <Cover book={c.book} size="fill" className="pc-cover" />
                  {!bad && c.art && <img className="pc-sticker" src={asset(c.art)} alt="" loading="lazy" decoding="async" onError={() => setBad(true)} />}
                </span>
                <span className="pc-text">
                  <span className="pc-greet">Greetings from</span>
                  <b className="pc-place ko">{c.place.displayName}</b>
                  <span className="pc-title ko">『{c.title}』</span>
                  <span className="pc-year tnum">{c.year != null ? formatStampYear(c.year) : ''}</span>
                </span>
              </span>
              {c.rarity === 'holo' && <span className="pc-holo" aria-hidden />}
              <span className="pc-glare" aria-hidden />
            </span>
            <span className="pc-face pc-back" ref={backRef}>
              <span className={`pc-memo ko${c.memo ? '' : ' empty'}`}>{c.memo || '아직 메모가 없어요.\n책 메모를 쓰면 이 엽서에 적혀요.'}</span>
              <span className="pc-right">
                <span className="pc-stamp">{stampOk ? <img src={asset(`collect/stamps/${c.category}.webp`)} alt="" /> : <span className="pc-stamp-fallback">{CATEGORY_LABEL[c.category]}</span>}</span>
                <Postmark place={c.place.displayName} date={c.date} />
                <span className="pc-to ko">To. 다음 책을 펼칠 나에게</span>
                <span className="pc-lines" aria-hidden />
              </span>
              <span className="pc-glare" aria-hidden />
            </span>
          </span>
        </span>
      </button>
      <div className="pc-actions">
        <a className="arrow-link" href={hrefFor({ name: 'book', bookId: c.workId, linkId: c.linkId })}>
          책 보기 <Arrow />
        </a>
        <button type="button" className="link-btn" onClick={save} disabled={saving}>
          {saving ? '만드는 중…' : `${flipped ? '뒷면' : '앞면'} 저장`}
        </button>
      </div>
    </div>
  );
}

function Postmark({ place, date }: { place: string; date: string }) {
  const id = useMemo(() => `pm-${Math.random().toString(36).slice(2, 8)}`, []);
  const name = place.length > 8 ? place.slice(0, 7) + '…' : place;
  return (
    <svg className="pc-postmark" viewBox="0 0 150 70" aria-hidden>
      <defs>
        <path id={id} d="M 13 35 A 22 22 0 0 1 57 35" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="35" cy="35" r="30" strokeWidth="1.6" />
        <circle cx="35" cy="35" r="24" strokeWidth="0.8" />
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M70 ${20 + k * 10} q 10 -5 20 0 t 20 0 t 20 0 t 18 0`} strokeWidth="1.4" />
        ))}
      </g>
      <text fontSize="7.5" fontWeight="700" fill="currentColor" textAnchor="middle">
        <textPath href={`#${id}`} startOffset="50%">
          {name}
        </textPath>
      </text>
      <text x="35" y="40" fontSize="8" fontWeight="800" fill="currentColor" textAnchor="middle">
        {date}
      </text>
      <text x="35" y="52" fontSize="5.5" fontWeight="700" fill="currentColor" textAnchor="middle" letterSpacing="1.2">
        TEXTRIP
      </text>
    </svg>
  );
}

/* ───────── 핀 배지 ───────── */

const PIN_ICON: Record<PinId, typeof Key> = {
  citizen: Key,
  continents: Globe,
  time: Hourglass,
  fiction: DoorOpen,
  thinkers: Lamp,
  sources: Search,
  antipode: Plane,
};
const PIN_TONE: Record<PinId, string> = {
  citizen: '#6e1a2f',
  continents: '#1f3460',
  time: '#6e1a2f',
  fiction: '#1f3460',
  thinkers: '#6e1a2f',
  sources: '#1f3460',
  antipode: '#6e1a2f',
};

function PinBoard({ pins }: { pins: ReturnType<typeof computePins> }) {
  const art = useAsset('collect/backpack.webp');
  const [sel, setSel] = useState<string | null>(null);
  const cur = pins.find((p) => p.id === sel) ?? null;
  return (
    <section aria-label="칭호 핀 배지">
      <div className={`backpack${art ? ' has-art' : ''}`} style={art ? { backgroundImage: `url("${abs('collect/backpack.webp')}")` } : undefined}>
        {!art && (
          <>
            <span className="bp-strap l" aria-hidden />
            <span className="bp-strap r" aria-hidden />
            <span className="bp-patch" aria-hidden />
          </>
        )}
        <ul className="pin-grid">
          {pins.map((p, i) => (
            <li key={p.id} style={{ '--pi': i } as CSSProperties}>
              <button
                type="button"
                className={`pin ${p.earned ? 'earned' : 'locked'}`}
                aria-pressed={sel === p.id}
                aria-label={`${p.name} 핀 · ${p.earned ? '획득' : '아직 못 얻음'} · ${p.why}`}
                onClick={() => setSel((v) => (v === p.id ? null : p.id))}
                {...tilt}
              >
                <PinArt id={p.id} art={p.art} />
                {!p.earned && (
                  <span className="pin-lock" aria-hidden>
                    <Lock size={14} />
                  </span>
                )}
              </button>
              <span className="pin-name ko">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pp-caption" aria-live="polite">
        {cur ? (
          <p className="ko">
            <strong>{cur.name}</strong> · {cur.earned ? <span>획득 · {cur.why}</span> : <span className="meta">조건 · {cur.why}</span>}
          </p>
        ) : (
          <p className="meta">칭호를 따면 백팩에 핀이 꽂혀요. 잠긴 핀을 누르면 조건이 보여요.</p>
        )}
      </div>
    </section>
  );
}

function PinArt({ id, art }: { id: PinId; art: string }) {
  const ok = useAsset(art);
  const Icon = PIN_ICON[id];
  if (ok)
    return (
      <>
        <img className="pin-img" src={asset(art)} alt="" />
        <span className="pin-shine" style={{ WebkitMaskImage: `url("${abs(art)}")`, maskImage: `url("${abs(art)}")` } as CSSProperties} aria-hidden />
      </>
    );
  return (
    <span className="pin-fallback" style={{ '--tone': PIN_TONE[id] } as CSSProperties}>
      <Icon size={30} strokeWidth={2} aria-hidden />
    </span>
  );
}

function Arrow() {
  return (
    <span className="arrow swap" aria-hidden>
      <span>→</span>
      <span>→</span>
    </span>
  );
}
