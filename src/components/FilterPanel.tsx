import { useEffect, useRef } from 'react';
import { CATEGORY_LABEL, DEFAULT_FILTERS, RELATION_LABEL, type Category, type Filters, type RelationType } from '../types';
import { ERA_LABEL, type EraBucket } from '../lib/util';

export function activeFilterCount(f: Filters) {
  return f.categories.length + f.relations.length + (f.era !== 'all' ? 1 : 0) + (f.includeUnknownEra ? 0 : 1) + (f.includeUnplaced ? 0 : 1);
}

export default function FilterPanel({ filters, onChange, onClose, hiddenUnknownEra }: { filters: Filters; onChange: (f: Filters) => void; onClose: () => void; hiddenUnknownEra: number }) {
  const first = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="filter-title" ref={box}
        onKeyDown={(e) => {
          if (e.key !== 'Tab' || !box.current) return;
          const f = box.current.querySelectorAll<HTMLElement>('button, input, select');
          const a = f[0], b = f[f.length - 1];
          if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
          else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 id="filter-title" style={{ flex: 1, margin: 0 }}>
            필터
          </h2>
          <button ref={first} type="button" className="icon-btn" aria-label="필터 닫기" onClick={onClose}>
            ✕
          </button>
        </div>
        <h3 className="eyebrow" style={{ margin: '20px 0 8px' }}>장르</h3>
        <div className="filter-row">
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={filters.categories.includes(c)} onClick={() => onChange({ ...filters, categories: toggle(filters.categories, c) })}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <h3 className="eyebrow" style={{ margin: '20px 0 8px' }}>연결 종류</h3>
        <div className="filter-row">
          {(Object.keys(RELATION_LABEL) as RelationType[]).map((r) => (
            <button key={r} type="button" className="chip" aria-pressed={filters.relations.includes(r)} onClick={() => onChange({ ...filters, relations: toggle(filters.relations, r) })}>
              {RELATION_LABEL[r]}
            </button>
          ))}
        </div>
        <h3 className="eyebrow" style={{ margin: '20px 0 8px' }}>시대</h3>
        <div className="filter-row">
          {(Object.keys(ERA_LABEL) as EraBucket[]).map((e) => (
            <button key={e} type="button" className="chip" aria-pressed={filters.era === e} onClick={() => onChange({ ...filters, era: e })}>
              {ERA_LABEL[e]}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', marginTop: 16 }}>
          <label className="check">
            <input type="checkbox" checked={filters.includeUnknownEra} onChange={(e) => onChange({ ...filters, includeUnknownEra: e.target.checked })} />
            시대 미상 기록도 보기
          </label>
          {!filters.includeUnknownEra && hiddenUnknownEra > 0 && <p className="help">시대를 모르는 책 {hiddenUnknownEra}권이 지금 숨겨져 있어요.</p>}
          <label className="check">
            <input type="checkbox" checked={filters.includeUnplaced} onChange={(e) => onChange({ ...filters, includeUnplaced: e.target.checked })} />
            지도에 핀이 없는 책도 목록에 보기
          </label>
        </div>
        <div className="actions" style={{ marginTop: 20 }}>
          <button type="button" className="action" onClick={() => onChange(DEFAULT_FILTERS)}>
            모두 지우기
          </button>
          <button type="button" className="action primary" onClick={onClose}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
