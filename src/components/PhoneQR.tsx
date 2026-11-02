import { useEffect, useRef, useState } from 'react';
import { QrCode, X } from 'lucide-react';

/** 데스크톱에서 ‘폰으로 보기’: 지금 화면 주소를 QR로. 샘플을 보고 있으면 폰에서도 샘플 책장으로 열려요. */
export default function PhoneQR({ sample }: { sample: boolean }) {
  const [open, setOpen] = useState(false);
  const [svg, setSvg] = useState('');
  const [url, setUrl] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const u = new URL(location.href);
    u.search = sample ? '?sample=1' : '';
    const target = u.toString();
    setUrl(target);
    let alive = true;
    import('qrcode-generator').then(({ default: qrcode }) => {
      if (!alive) return;
      const q = qrcode(0, 'M');
      q.addData(target);
      q.make();
      setSvg(q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }));
    });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [open, sample]);

  return (
    <div className="phone-qr" ref={box}>
      <button type="button" className="action small ghost qr-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <QrCode size={18} aria-hidden />
        <span>폰으로 보기</span>
      </button>
      {open && (
        <div className="qr-pop" role="dialog" aria-label="휴대폰으로 열기">
          <button type="button" className="icon-btn qr-close" aria-label="닫기" onClick={() => setOpen(false)}>
            <X size={18} aria-hidden />
          </button>
          <div className="eyebrow">Mobile</div>
          <p className="qr-title ko">휴대폰 카메라로 찍어 보세요</p>
          <div className="qr-code" aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="meta prose">지금 보는 화면이 폰에서 열려요.{sample ? ' 샘플 책장으로 열려요.' : ' 내 기록은 이 기기에만 있어서 폰에는 따로 쌓여요.'}</p>
          <p className="qr-url">{url.replace(/^https:\/\//, '')}</p>
        </div>
      )}
    </div>
  );
}
