import { useState } from 'react';
import { useStore, type BookView } from '../store';
import { RELATION_LABEL, VERIFICATION_LABEL } from '../types';
import { useToast } from './Toast';

/** S5 연결 검토: 채택은 학술적 검증과 별개 — 근거 상태는 바꾸지 않는다 */
export default function LinkReview({ book, onAdded }: { book: BookView; onAdded: (linkId: string) => void }) {
  const { data, byId, reviewLink, addUserLink } = useStore();
  const toast = useToast();
  const all = data.links.filter((l) => l.workId === book.work.id);
  const places = data.places.filter((p) => !p.deletedAt).sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'));
  const [placeId, setPlaceId] = useState('');
  const [newName, setNewName] = useState('');
  const [summary, setSummary] = useState('');
  const [err, setErr] = useState('');

  const add = async () => {
    if (!placeId && !newName.trim()) return setErr('장소를 고르거나 이름을 적어 주세요.');
    if (!summary.trim()) return setErr('이 장소를 연결한 이유를 한 줄로 적어 주세요.');
    setErr('');
    try {
      const id = await addUserLink({ workId: book.work.id, placeId: placeId || null, newPlaceName: placeId ? null : newName, summary });
      setPlaceId('');
      setNewName('');
      setSummary('');
      toast({ message: '내가 연결한 장소를 추가했어요' });
      onAdded(id);
    } catch {
      setErr('저장하지 못했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <p className="meta prose" style={{ marginBottom: 8 }}>
        채택하면 내 지도에 확정해 두지만, 출처가 없으면 ‘근거 확인 필요’ 표시는 그대로 남아요.
      </p>
      <ul className="place-cards">
        {all.map((l) => {
          const p = l.placeId ? byId.place.get(l.placeId) : null;
          return (
            <li key={l.id} style={{ border: '1px solid var(--panel-line)', borderRadius: 8, padding: 12, opacity: l.deletedAt ? 0.55 : 1 }}>
              <div style={{ fontWeight: 650 }}>{p?.displayName ?? '위치 없음'}</div>
              <div className="meta">
                {RELATION_LABEL[l.relationType]} · {VERIFICATION_LABEL[l.verificationStatus]}
                {l.userAcceptedAt ? ' · 채택함' : ''}
                {l.deletedAt ? ' · 제외됨' : ''}
              </div>
              <div className="actions" style={{ marginTop: 8 }}>
                {!l.deletedAt && !l.userAcceptedAt && (
                  <button type="button" className="action small" onClick={() => reviewLink(l.id, 'accept')}>
                    채택
                  </button>
                )}
                {!l.deletedAt ? (
                  <button
                    type="button"
                    className="action small ghost"
                    onClick={async () => {
                      await reviewLink(l.id, 'exclude');
                      toast({ message: '연결을 제외했어요', actionLabel: '실행 취소', onAction: () => reviewLink(l.id, 'restore') });
                    }}
                  >
                    제외
                  </button>
                ) : (
                  <button type="button" className="action small ghost" onClick={() => reviewLink(l.id, 'restore')}>
                    되돌리기
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <h4 style={{ margin: '20px 0 8px', fontSize: 18 }}>내가 연결한 장소 추가</h4>
      <div style={{ display: 'grid', gap: 10 }}>
        <label className="field">
          <span>기록에 있는 장소</span>
          <select className="input" value={placeId} onChange={(e) => setPlaceId(e.target.value)} style={{ background: '#1b1b1b', color: '#fff', borderColor: '#6b6b6b' }}>
            <option value="">새 장소 이름으로 적기</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
                {p.country && p.country !== p.displayName ? ` (${p.country})` : ''}
              </option>
            ))}
          </select>
        </label>
        {!placeId && (
          <label className="field">
            <span>새 장소 이름</span>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: 내가 이 책을 읽은 카페" style={{ background: '#1b1b1b', color: '#fff', borderColor: '#6b6b6b' }} />
            <span className="meta">새 장소는 좌표 없이 ‘위치 없이 기록’으로 저장돼요.</span>
          </label>
        )}
        <label className="field">
          <span>연결한 이유</span>
          <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="예: 이 장면이 떠오른 곳" style={{ background: '#1b1b1b', color: '#fff', borderColor: '#6b6b6b' }} />
        </label>
        {err && (
          <p className="memo-status err" role="alert">
            {err}
          </p>
        )}
        <div className="actions">
          <button type="button" className="action primary" onClick={add}>
            장소 연결
          </button>
        </div>
      </div>
    </div>
  );
}
