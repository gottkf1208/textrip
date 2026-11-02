import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
}

type Show = (t: { message: string; actionLabel?: string; onAction?: () => void; duration?: number }) => void;
const Ctx = createContext<Show>(() => undefined);
export const useToast = () => useContext(Ctx);

/** M4 실행 취소 토스트: 160ms 등장, 기본 10초, 포커스·호버 중에는 멈춤 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const show: Show = useCallback((t) => {
    setItems((prev) => {
      const rest = prev.filter((p) => p.message !== t.message); // 같은 알림은 쌓지 않는다
      return [...rest.slice(-2), { id: ++seq.current, message: t.message, actionLabel: t.actionLabel, onAction: t.onAction, duration: t.duration ?? (t.onAction ? 10000 : 4000) }];
    });
  }, []);
  const remove = useCallback((id: number) => setItems((p) => p.filter((x) => x.id !== id)), []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {items.map((t) => (
          <Toast key={t.id} item={t} onDone={() => remove(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function Toast({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(item.duration);
  const startedAt = useRef(Date.now());
  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const t = setTimeout(onDone, left.current);
    return () => {
      clearTimeout(t);
      left.current -= Date.now() - startedAt.current;
    };
  }, [paused, onDone]);
  return (
    <div
      className="toast"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="msg">{item.message}</span>
      {item.onAction && (
        <button
          type="button"
          onClick={() => {
            item.onAction?.();
            onDone();
          }}
        >
          {item.actionLabel ?? '실행 취소'}
        </button>
      )}
      <button type="button" aria-label="알림 닫기" onClick={onDone} style={{ textDecoration: 'none' }}>
        ✕
      </button>
      {item.onAction && <i className="timer" style={{ animationDuration: `${item.duration}ms`, animationPlayState: paused ? 'paused' : 'running' }} />}
    </div>
  );
}
