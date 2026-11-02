/**
 * 사이트 전체 모션 — 쿼카 모션랩 원리를 앱 UI에 옮긴 것.
 *  - lp-bento-reveal  : [data-reveal] 요소가 화면에 들어올 때 차례로 떠오름
 *  - lp-stat-metric-row: 숫자가 임계 감쇠 스프링으로 0 → 목표 (넘치지 않음)
 *  - lp-bento-pearl-card / lp-bento-tilt-glare : 커서 쪽으로 기울고 반사광이 반대로 미끄러짐
 * 모두 ‘동작 줄이기’ 설정이면 꺼져요.
 */
import { useEffect, useRef, type PointerEvent as RPointerEvent } from 'react';

const reducedNow = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** [data-reveal] 요소를 지켜보다가 화면에 들어오면 .is-in (같이 들어온 것끼리 위→아래, 왼→오 순서로 지연) */
export function useReveal() {
  useEffect(() => {
    if (reducedNow() || typeof IntersectionObserver === 'undefined') return;
    const root = document.documentElement;
    root.classList.add('rv-on');
    const io = new IntersectionObserver(
      (entries) => {
        const ins = entries.filter((e) => e.isIntersecting);
        ins.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
        ins.forEach((e, k) => {
          const el = e.target as HTMLElement;
          el.style.setProperty('--rv', String(Math.min(k, 12)));
          el.classList.add('is-in');
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0.01 },
    );
    let raf = 0;
    const scan = () =>
      document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in):not([data-rv])').forEach((el) => {
        el.dataset.rv = '1';
        io.observe(el);
      });
    scan();
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
      root.classList.remove('rv-on');
    };
  }, []);
}

/** 지표 네 칸(lp-stat-metric-row)의 숫자: 화면에 보이면 delay 뒤 스프링으로 올라가요 */
export function CountUp({ value, delay = 0, format }: { value: number; delay?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString('ko-KR'));
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedNow() || typeof IntersectionObserver === 'undefined') {
      el.textContent = fmt(value);
      return;
    }
    el.textContent = fmt(0);
    let raf = 0;
    const k = 4.2;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now() + delay;
      const tick = (now: number) => {
        const tau = Math.max(0, (now - t0) / 1000);
        const x = 1 - (1 + k * tau) * Math.exp(-k * tau);
        if (x >= 0.998) {
          el.textContent = fmt(value);
          return;
        }
        el.textContent = fmt(value * x);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);
  return (
    <>
      <span ref={ref} className="tnum" aria-hidden>
        {fmt(value)}
      </span>
      <span className="sr-only">{fmt(value)}</span>
    </>
  );
}

/** 펄 은박 카드(lp-bento-pearl-card): 커서 쪽으로 rotateX(-fy·8°) rotateY(fx·10°), 띠는 반대로 */
export const tilt = {
  onPointerMove(e: RPointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse' || reducedNow()) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const fx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const fy = ((e.clientY - r.top) / r.height) * 2 - 1;
    el.style.setProperty('--fx', fx.toFixed(3));
    el.style.setProperty('--fy', fy.toFixed(3));
    el.classList.add('tilting');
  },
  onPointerLeave(e: RPointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.setProperty('--fx', '0');
    el.style.setProperty('--fy', '0');
    el.classList.remove('tilting');
  },
};
