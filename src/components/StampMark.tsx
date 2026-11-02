import { type CSSProperties } from 'react';
import { formatStampYear, hash, type Stamp } from '../lib/passport';

/**
 * 입국 도장 한 개 (SVG).
 * 쿼카 모션랩 ‘동그라미 배지(sf-stamp-badge)’의 물결 테두리·잉크 고리 원리를 도장에 맞춰 옮겼어요.
 * 잉크가 번지고 닳은 느낌은 feTurbulence로 만들어요.
 */
const WAVE = (() => {
  const R = 46;
  let d = '';
  for (let k = 0; k <= 220; k++) {
    const a = (k / 220) * Math.PI * 2;
    const rr = R * (0.955 + 0.045 * Math.cos(a * 22));
    d += `${k ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)}`;
  }
  return d + 'Z';
})();

const fit = (name: string, max: number, width: number) => Math.min(max, Math.floor((width / Math.max(name.length, 1)) * 10) / 10);

export default function StampMark({ s, delay = 0, animate = false, isNew = false }: { s: Stamp; delay?: number; animate?: boolean; isNew?: boolean }) {
  const h = hash(s.id);
  const seed = h % 997;
  const fid = `worn-${s.id.replace(/[^a-z0-9-]/gi, '')}`;
  const year = formatStampYear(s.year);
  const name = s.name.length > 8 ? s.name.slice(0, 7) + '…' : s.name;
  const style = {
    '--rot': `${s.rot}deg`,
    '--jx': `${((h >> 4) % 13) - 6}%`,
    '--jy': `${((h >> 9) % 13) - 6}%`,
    '--d': `${delay}ms`,
    color: s.ink,
  } as CSSProperties;
  const arcTop = `${fid}-t`;
  const arcBot = `${fid}-b`;
  const T = { fill: 'currentColor', stroke: 'none', textAnchor: 'middle' as const };

  return (
    <span className={`stamp${animate ? ' stamp-in' : ''}`} style={style}>
      {animate && <span className="stamp-ring" aria-hidden />}
      <svg viewBox="-60 -60 120 120" aria-hidden focusable="false">
        <defs>
          <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed={seed + 7} result="s" />
            <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.55" result="m" />
            <feComposite in="d" in2="m" operator="in" />
          </filter>
          <path id={arcTop} d="M -35 0 A 35 35 0 0 1 35 0" />
          <path id={arcBot} d="M -42 0 A 42 42 0 0 0 42 0" />
        </defs>
        <g filter={`url(#${fid})`} fill="none" stroke="currentColor">
          {s.shape === 'circle' && (
            <>
              <path d={WAVE} strokeWidth="2.8" />
              <circle r="32.5" strokeWidth="1.1" />
              <text fontSize={fit(name, 10, 84)} fontWeight="800" letterSpacing="0.6" {...T}>
                <textPath href={`#${arcTop}`} startOffset="50%">{name}</textPath>
              </text>
              <text fontSize="7" fontWeight="700" letterSpacing="1.6" {...T}>
                <textPath href={`#${arcBot}`} startOffset="50%">{s.sub || 'ENTRY'}</textPath>
              </text>
              <circle cx="-38.5" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="38.5" r="1.6" fill="currentColor" stroke="none" />
              <text y="-13" fontSize="6.2" fontWeight="700" letterSpacing="1.8" {...T}>ENTRY</text>
              <text y="7" fontSize={year.length > 5 ? 14 : 17} fontWeight="800" letterSpacing="-0.3" {...T}>{year}</text>
              <line x1="-15" x2="15" y1="14" y2="14" strokeWidth="1.1" />
            </>
          )}
          {s.shape === 'rect' && (
            <>
              <rect x="-50" y="-34" width="100" height="68" rx="5" strokeWidth="2.8" />
              <rect x="-45" y="-29" width="90" height="58" rx="3" strokeWidth="0.9" />
              <text y="-15" fontSize="6.6" fontWeight="700" letterSpacing="2.2" {...T}>ENTRY · 입국</text>
              <text y="6" fontSize={fit(name, 16, 80)} fontWeight="800" {...T}>{name}</text>
              <text y="22" fontSize="10.5" fontWeight="700" letterSpacing="1" {...T}>{year}</text>
            </>
          )}
          {s.shape === 'oval' && (
            <>
              <ellipse rx="54" ry="36" strokeWidth="2.8" />
              <ellipse rx="47" ry="30" strokeWidth="0.9" strokeDasharray="2.4 2" />
              <text y="-10" fontSize="6.4" fontWeight="700" letterSpacing="2.2" {...T}>REGION</text>
              <text y="7" fontSize={fit(name, 14, 78)} fontWeight="800" {...T}>{name}</text>
              <text y="21" fontSize="9.5" fontWeight="700" letterSpacing="1" {...T}>{year}</text>
            </>
          )}
          {s.shape === 'fictional' && (
            <>
              <circle r="45" strokeWidth="2.2" strokeDasharray="5 4" />
              <circle r="36" strokeWidth="0.9" strokeDasharray="2 3" />
              <text y="-10" fontSize="18" fontWeight="800" {...T}>?</text>
              <text y="8" fontSize={fit(name, 12.5, 62)} fontWeight="800" {...T}>{name}</text>
              <text y="21" fontSize="6.4" fontWeight="700" letterSpacing="1.4" {...T}>FICTION · 가상</text>
            </>
          )}
        </g>
      </svg>
      {isNew && <span className="stamp-new">NEW</span>}
    </span>
  );
}

export function LockedStamp({ label }: { label: string }) {
  return (
    <span className="stamp locked">
      <svg viewBox="-60 -60 120 120" aria-hidden focusable="false">
        <circle r="44" fill="none" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 4" />
        <text y="-1" fontSize={fit(label, 11, 62)} fontWeight="700" textAnchor="middle" fill="currentColor">{label}</text>
        <text y="14" fontSize="6.6" fontWeight="700" textAnchor="middle" fill="currentColor" letterSpacing="1.5">NOT YET</text>
      </svg>
    </span>
  );
}
