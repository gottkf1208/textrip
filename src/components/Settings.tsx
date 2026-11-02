import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { SCHEMA_VERSION, STORE_NAMES, type DataSet } from '../types';
import { checkServer, getDeviceKey, getModel, setDeviceKey, setModel } from '../lib/recognize';
import { DEFAULT_MODEL } from '../lib/recognitionCore';
import { useToast } from './Toast';

export default function Settings() {
  const store = useStore();
  const toast = useToast();
  const [server, setServer] = useState<{ ok: boolean; model?: string } | null>(null);
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(Boolean(getDeviceKey()));
  const [model, setModelState] = useState(getModel());
  const [test, setTest] = useState<string>('');
  const [preview, setPreview] = useState<{ data: DataSet; counts: Record<string, number>; dupCount: number } | null>(null);
  const [importErr, setImportErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkServer(true).then(setServer);
  }, []);

  const saveKey = () => {
    if (!/^sk-ant-/.test(key.trim())) {
      setTest('Claude API 키는 보통 sk-ant- 로 시작해요. 다시 확인해 주세요.');
      return;
    }
    setDeviceKey(key);
    setKey('');
    setHasKey(true);
    setTest('');
    toast({ message: '이 기기에 API 키를 저장했어요' });
  };

  const testKey = async () => {
    setTest('확인 중');
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': getDeviceKey() ?? '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: getModel(), max_tokens: 8, messages: [{ role: 'user', content: 'ping' }] }),
      });
      if (r.ok) setTest(`연결됐어요 · ${getModel()}`);
      else if (r.status === 401) setTest('키가 맞지 않아요.');
      else if (r.status === 404 || r.status === 400) setTest(`모델 이름(${getModel()})을 확인해 주세요. (HTTP ${r.status})`);
      else setTest(`연결하지 못했어요. (HTTP ${r.status})`);
    } catch {
      setTest('네트워크 연결을 확인해 주세요.');
    }
  };

  const doExport = () => {
    const json = JSON.stringify(store.exportData(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `textrip-${store.mode === 'sample' ? 'sample' : 'my'}-records-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const onImportFile = async (f: File | undefined) => {
    setImportErr('');
    setPreview(null);
    if (!f) return;
    try {
      if (f.size > 20 * 1024 * 1024) throw new Error('파일이 너무 커요.');
      const j = JSON.parse(await f.text());
      if (j?.app !== 'TEXTRIP' || typeof j.schemaVersion !== 'number' || !j.data) throw new Error('TEXTRIP에서 내보낸 파일이 아니에요.');
      if (j.schemaVersion > SCHEMA_VERSION) throw new Error('더 새 버전에서 내보낸 파일이에요. 앱을 새로고침한 뒤 다시 시도해 주세요.');
      const data = {} as DataSet;
      const counts: Record<string, number> = {};
      for (const s of STORE_NAMES) {
        const rows = j.data[s] ?? [];
        if (!Array.isArray(rows) || rows.some((r: unknown) => !r || typeof (r as { id?: unknown }).id !== 'string')) throw new Error(`${s} 항목 형식이 맞지 않아요.`);
        (data as unknown as Record<string, unknown>)[s] = rows;
        counts[s] = rows.length;
      }
      const have = new Set(store.data.entries.map((e) => e.id));
      const dupCount = data.entries.filter((e) => have.has(e.id)).length;
      setPreview({ data, counts, dupCount });
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : '파일을 읽지 못했어요.');
    }
  };

  const applyImport = async (strategy: 'skip' | 'copy') => {
    if (!preview) return;
    try {
      const r = await store.importData(preview.data, strategy);
      toast({ message: `${r.added}권을 가져왔어요${r.skipped ? ` · 이미 있는 ${r.skipped}권은 건너뜀` : ''}` });
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setImportErr('가져오는 중 문제가 생겼어요. 기존 기록은 그대로예요.');
    }
  };

  const deletedNotes = store.data.notes.filter((n) => n.deletedAt);

  return (
    <div className="page">
      <h1 className="page-title">설정</h1>
      <p className="lede">사진 인식 연결, 기록 내보내기·가져오기, 휴지통을 관리해요.</p>

      <h2 className="section-title">사진 인식 연결</h2>
      <div className="card">
        <dl className="kv" style={{ marginBottom: 12 }}>
          <dt>서버 연결</dt>
          <dd>{server === null ? '확인 중' : server.ok ? `연결됨 · ${server.model ?? DEFAULT_MODEL}` : '없음 (정적 배포)'}</dd>
          <dt>이 기기의 키</dt>
          <dd>{hasKey ? '저장됨' : '없음'}</dd>
          <dt>지금 쓰는 방식</dt>
          <dd>{server?.ok ? '서버 연결(키는 서버에만 있음)' : hasKey ? '이 기기의 API 키로 직접 호출' : '연결 안 됨 · 직접 입력만 가능'}</dd>
        </dl>
        {!server?.ok && (
          <>
            <p className="notice" role="note">
              <span className="prose">
                키는 <strong>이 브라우저에만</strong> 저장되고 Anthropic으로만 보내요. 공용 컴퓨터에서는 넣지 말고, 시연이 끝나면 지워 주세요. 여러 사람이 쓰는 운영 환경이라면 키를 서버 비밀값으로 두는 서버 연결을 쓰세요.
              </span>
            </p>
            <div className="grid-2" style={{ marginTop: 12 }}>
              <label className="field">
                <span>Claude API 키</span>
                <input className="input" type="password" name="textrip-claude-api-key" autoComplete="new-password" spellCheck={false} data-lpignore="true" data-1p-ignore="true" value={key} onChange={(e) => setKey(e.target.value)} placeholder={hasKey ? '저장된 키가 있어요 · 바꾸려면 새로 입력' : 'sk-ant-…'} />
              </label>
              <label className="field">
                <span>모델</span>
                <input className="input" value={model} onChange={(e) => setModelState(e.target.value)} onBlur={() => setModel(model)} />
                <span className="help">기본값 {DEFAULT_MODEL}. 계정에서 쓸 수 있는 모델 ID로 바꿀 수 있어요.</span>
              </label>
            </div>
            <div className="actions" style={{ marginTop: 12 }}>
              <button type="button" className="action primary" onClick={saveKey} disabled={!key.trim()}>
                키 저장
              </button>
              <button type="button" className="action" onClick={testKey} disabled={!hasKey}>
                연결 확인
              </button>
              {hasKey && (
                <button
                  type="button"
                  className="action ghost"
                  onClick={() => {
                    setDeviceKey(null);
                    setHasKey(false);
                    setTest('');
                    toast({ message: '이 기기에서 키를 지웠어요' });
                  }}
                >
                  키 지우기
                </button>
              )}
            </div>
            {test && (
              <p className="help" aria-live="polite">
                {test}
              </p>
            )}
          </>
        )}
      </div>

      <h2 className="section-title">기록 보관</h2>
      <div className="card">
        <p className="prose" style={{ marginTop: 0 }}>
          기록은 이 브라우저에만 저장돼요. 기기나 브라우저를 바꾸거나 사이트 데이터를 지우면 사라지니, 가끔 내보내 두세요. 내보낸 파일에는 원본 사진과 API 키가 들어가지 않아요.
        </p>
        <div className="actions">
          <button type="button" className="action" onClick={doExport}>
            JSON 내보내기
          </button>
          <label className="action">
            JSON 가져오기
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onImportFile(e.target.files?.[0])} />
          </label>
        </div>
        {importErr && (
          <p className="error-text" role="alert">
            {importErr}
          </p>
        )}
        {preview && (
          <div className="notice" style={{ display: 'block' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>가져오기 전에 확인해 주세요</p>
            <p className="prose" style={{ margin: '0 0 8px' }}>
              책 {preview.counts.entries}권 · 장소 연결 {preview.counts.links}개 · 메모 {preview.counts.notes}개. 이 가운데 {preview.dupCount}권은 이미 책장에 있어요. 기존 기록은 지우지 않아요.
            </p>
            <div className="actions">
              <button type="button" className="action primary" onClick={() => applyImport('skip')}>
                이미 있는 책은 건너뛰고 가져오기
              </button>
              <button type="button" className="action" onClick={() => applyImport('copy')}>
                파일 내용으로 덮어쓰기
              </button>
              <button type="button" className="action ghost" onClick={() => setPreview(null)}>
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      <h2 className="section-title">샘플 책장</h2>
      <div className="card">
        <p className="prose" style={{ marginTop: 0 }}>
          두목쿼카의 실제 책장 사진 4장에서 판독한 완독 도서예요. 샘플은 내 기록과 따로 저장돼요.
        </p>
        <div className="actions">
          {store.mode === 'user' ? (
            <button type="button" className="action" onClick={() => store.switchMode('sample')}>
              샘플 둘러보기
            </button>
          ) : (
            <button type="button" className="action" onClick={() => store.switchMode('user')}>
              내 기록으로 돌아가기
            </button>
          )}
          <button
            type="button"
            className="action"
            onClick={async () => {
              const n = await store.copySampleToUser();
              toast({ message: n ? `샘플 ${n}권을 내 기록으로 가져왔어요` : '이미 모두 내 기록에 있어요' });
            }}
          >
            샘플을 내 기록으로 가져오기
          </button>
          <button
            type="button"
            className="action ghost"
            onClick={async () => {
              await store.resetSample();
              toast({ message: '샘플 책장을 처음 상태로 되돌렸어요' });
            }}
          >
            샘플 초기화
          </button>
        </div>
      </div>

      <h2 className="section-title">휴지통</h2>
      <div className="card">
        <p className="help" style={{ marginTop: 0 }}>
          지운 책과 메모는 7일 동안 여기서 되살릴 수 있어요.
        </p>
        {!store.trash.length && !deletedNotes.length && <p className="meta">비어 있어요.</p>}
        <ul className="book-links">
          {store.trash.map((b) => (
            <li key={b.work.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderTop: '1px solid var(--line)', padding: '8px 0' }}>
              <span className="ko" style={{ flex: 1, minWidth: '12em', fontWeight: 600 }}>
                {b.work.canonicalTitle}
              </span>
              <span className="meta">{b.entry.deletedAt?.slice(0, 10)} 삭제</span>
              <button type="button" className="action small" onClick={() => store.restoreBook(b.work.id)}>
                되살리기
              </button>
            </li>
          ))}
          {deletedNotes.map((n) => (
            <li key={n.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderTop: '1px solid var(--line)', padding: '8px 0' }}>
              <span className="ko memo-body" style={{ flex: 1, minWidth: '12em' }}>
                메모 · {n.body.slice(0, 60)}
                {n.body.length > 60 ? '…' : ''}
              </span>
              <button type="button" className="action small" onClick={() => store.restoreNote(n.id)}>
                되살리기
              </button>
            </li>
          ))}
        </ul>
      </div>

      <h2 className="section-title">정보</h2>
      <dl className="kv">
        <dt>지도</dt>
        <dd>
          MapLibre GL JS · 타일 <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · 데이터 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> 기여자
        </dd>
        <dt>도서 검색</dt>
        <dd>Google Books API (제목·저자·판본 정보만)</dd>
        <dt>글꼴</dt>
        <dd>
          Pretendard v1.3.9 · <a href={`${import.meta.env.BASE_URL}fonts/Pretendard-LICENSE.txt`}>SIL OFL 1.1</a>
        </dd>
        <dt>모션</dt>
        <dd>쿼카 모션랩 759·842·845·819·739·765의 움직임 원리를 이 앱에 맞춰 구현</dd>
      </dl>
    </div>
  );
}
