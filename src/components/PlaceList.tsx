import { Cover } from '../lib/covers';
import type { PlaceGroup } from '../lib/selectors';
import type { BookView } from '../store';
import { PRECISION_LABEL, RELATION_LABEL } from '../types';
import { formatAuthors } from '../lib/util';

interface Props {
  groups: PlaceGroup[];
  unmapped: BookView[];
  workCount: number;
  onOpenBook: (workId: string, linkId?: string) => void;
  onSelectPlace?: (placeId: string) => void;
  heading?: string;
}

/** 지도 핀과 같은 정보를 목록으로 — 지도를 못 쓰는 상황에서도 모든 장소·책에 접근 */
export default function PlaceList({ groups, unmapped, workCount, onOpenBook, onSelectPlace, heading = '장소별 목록' }: Props) {
  const sorted = [...groups].sort((a, b) => a.place.displayName.localeCompare(b.place.displayName, 'ko'));
  return (
    <div>
      <div className="list-head">
        <h2>{heading}</h2>
        <span className="meta tnum">
          책 {workCount}권 · 지도 위 장소 {groups.length}곳
        </span>
      </div>
      {sorted.map((g) => (
        <section key={g.place.id} className="place-group" aria-label={g.place.displayName}>
          <h3>
            {onSelectPlace ? (
              <button type="button" className="link-btn" style={{ minHeight: 32, fontWeight: 650, fontSize: 18 }} onClick={() => onSelectPlace(g.place.id)}>
                {g.place.displayName}
              </button>
            ) : (
              g.place.displayName
            )}
            <span className="meta">
              {g.place.country && g.place.country !== g.place.displayName ? `${g.place.country} · ` : ''}
              {PRECISION_LABEL[g.place.precision]}
            </span>
          </h3>
          <ul className="book-links">
            {g.items.map(({ book, link }) => (
              <li key={link.id}>
                <button type="button" className="has-cover" onClick={() => onOpenBook(book.work.id, link.id)}>
                  <Cover book={book} size="xs" />
                  <span className="bl-text">
                    <span className="t book-title">{book.work.canonicalTitle}</span>
                    <span className="s">
                      {formatAuthors(book.work.authors)} · {RELATION_LABEL[link.relationType]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {unmapped.length > 0 && (
        <section className="place-group" aria-label="지도에 핀이 없는 책">
          <h3>
            지도에 핀이 없는 책 <span className="meta">가상 장소 · 위치 없이 기록</span>
          </h3>
          <ul className="book-links">
            {unmapped.map((b) => (
              <li key={b.work.id}>
                <button type="button" className="has-cover" onClick={() => onOpenBook(b.work.id)}>
                  <Cover book={b} size="xs" />
                  <span className="bl-text">
                    <span className="t book-title">{b.work.canonicalTitle}</span>
                    <span className="s">{formatAuthors(b.work.authors)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
