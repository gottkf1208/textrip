import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { getDraft, putDraft } from '../lib/db';
import { useToast } from './Toast';

const MAX = 2000;
type Status = 'idle' | 'typing' | 'draft' | 'saving' | 'saved' | 'error' | 'conflict' | 'over';

interface Props {
  entryId: string;
  linkId: string | null;
  label: string;
  placeholder: string;
  onTypingChange?: (typing: boolean) => void;
}

export default function MemoEditor({ entryId, linkId, label, placeholder, onTypingChange }: Props) {
  const { data, saveNote, deleteNote, restoreNote, mode } = useStore();
  const toast = useToast();
  const key = `${entryId}:${linkId ?? 'book'}`;
  const note = data.notes.find((n) => n.libraryEntryId === entryId && (n.contextLinkId ?? null) === linkId && !n.deletedAt);
  const [text, setText] = useState('');
  const [base, setBase] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [conflictBody, setConflictBody] = useState<string | null>(null);
  const [conflictRev, setConflictRev] = useState(0);
  const composing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const loadedKey = useRef<string | null>(null);
  const dirty = useRef(false);
  const textRef = useRef(text);
  textRef.current = text;
  const baseRef = useRef(base);
  baseRef.current = base;

  // 기록 전환 시: 초안 > 저장된 메모 순으로 불러온다
  useEffect(() => {
    let alive = true;
    loadedKey.current = null;
    dirty.current = false;
    setConflictBody(null);
    (async () => {
      const d = await getDraft(mode, key).catch(() => undefined);
      if (!alive) return;
      const saved = note?.body ?? '';
      if (d && d.body !== saved) {
        setText(d.body);
        setStatus('draft');
        dirty.current = true;
      } else {
        setText(saved);
        setStatus('idle');
      }
      setBase(note?.revision ?? 0);
      loadedKey.current = key;
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mode]);

  // 다른 탭에서 저장되어 내 편집이 없을 때는 새 내용을 반영
  useEffect(() => {
    if (loadedKey.current !== key || dirty.current) return;
    setText(note?.body ?? '');
    setBase(note?.revision ?? 0);
  }, [note?.revision, note?.body, key]);

  const writeDraft = useCallback(async () => {
    if (composing.current || !dirty.current || loadedKey.current !== key) return;
    try {
      await putDraft(mode, { id: key, body: textRef.current, baseRevision: baseRef.current, updatedAt: new Date().toISOString() });
      setStatus((s) => (s === 'typing' ? 'draft' : s));
    } catch {
      /* 초안 실패는 조용히 — 입력은 화면에 그대로 있다 */
    }
  }, [key, mode]);

  // 탭 이동·언마운트 때도 초안은 남긴다
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (dirty.current && loadedKey.current) putDraft(mode, { id: loadedKey.current, body: textRef.current, baseRevision: baseRef.current, updatedAt: new Date().toISOString() }).catch(() => undefined);
  }, [key, mode]);

  const schedule = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(writeDraft, 1000);
  };

  const onChange = (v: string) => {
    setText(v);
    dirty.current = true;
    setStatus(!composing.current && v.length > MAX ? 'over' : 'typing');
    onTypingChange?.(true);
    if (!composing.current) schedule();
  };

  const save = async (force = false) => {
    if (composing.current) return;
    if (text.length > MAX) {
      setStatus('over');
      return;
    }
    setStatus('saving');
    try {
      const res = await saveNote({ entryId, linkId, body: text, baseRevision: force ? conflictRev : base });
      if (res.status === 'conflict') {
        setConflictBody(res.current?.body ?? '');
        setConflictRev(res.current?.revision ?? 0);
        setStatus('conflict');
        return;
      }
      dirty.current = false;
      setBase(res.note.revision);
      setConflictBody(null);
      setStatus('saved');
      onTypingChange?.(false);
    } catch {
      setStatus('error');
    }
  };

  const remove = async () => {
    if (!note) return;
    await deleteNote(note.id);
    setText('');
    dirty.current = false;
    setStatus('idle');
    toast({ message: '메모를 삭제했어요', actionLabel: '실행 취소', onAction: () => restoreNote(note.id) });
  };

  const statusText: Record<Status, string> = {
    idle: note ? `저장된 메모 · ${new Date(note.updatedAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '아직 메모가 없어요',
    typing: '입력 중',
    draft: '초안 저장됨 · 아직 확정되지 않았어요',
    saving: '저장 중',
    saved: '저장됨',
    error: '저장하지 못했어요. 입력한 내용은 그대로 있어요.',
    conflict: '다른 탭에서 먼저 저장된 내용이 있어요.',
    over: `${MAX.toLocaleString()}자까지 쓸 수 있어요.`,
  };

  return (
    <div className="memo">
      <label className="memo-label" htmlFor={`memo-${key}`}>
        {label}
      </label>
      <textarea
        id={`memo-${key}`}
        value={text}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={(e) => {
          composing.current = false;
          onChange((e.target as HTMLTextAreaElement).value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
            e.preventDefault();
            save();
          }
        }}
        onFocus={() => onTypingChange?.(true)}
        onBlur={() => {
          onTypingChange?.(false);
          writeDraft();
        }}
        aria-describedby={`memo-status-${key}`}
        rows={6}
      />
      <div className="memo-bar">
        <span id={`memo-status-${key}`} className={`memo-status${status === 'error' || status === 'conflict' || status === 'over' ? ' err' : ''}`} aria-live="polite">
          {statusText[status]}
        </span>
        <span className="count">
          {text.length.toLocaleString()} / {MAX.toLocaleString()}
        </span>
        <div className="actions">
          {note && (
            <button type="button" className="action ghost small" onClick={remove}>
              메모 삭제
            </button>
          )}
          <button type="button" className="action primary" onClick={() => save()} disabled={status === 'saving' || (!dirty.current && status !== 'error')}>
            {status === 'error' ? '다시 저장' : '메모 저장'}
          </button>
        </div>
      </div>
      {status === 'conflict' && conflictBody !== null && (
        <div className="conflict" role="alert">
          <strong>먼저 저장된 메모</strong>
          <pre>{conflictBody || '(빈 메모)'}</pre>
          <p style={{ margin: '4px 0 8px' }}>지금 쓰고 있는 글은 초안으로 남아 있어요.</p>
          <div className="actions">
            <button type="button" className="action small" onClick={() => save(true)}>
              내 글로 저장
            </button>
            <button
              type="button"
              className="action small ghost"
              onClick={() => {
                setText(`${conflictBody}\n\n${text}`);
                setBase(conflictRev);
                setConflictBody(null);
                setStatus('typing');
              }}
            >
              두 글 합치기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
