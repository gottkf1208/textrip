import { useRef, useState } from 'react';
import { Plus, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from './store';
import { useRoute, type Route } from './lib/util';
import { useReveal } from './lib/motion';
import Collection from './components/Collection';
import MapWorkspace from './components/MapWorkspace';
import Library from './components/Library';
import AddBook from './components/AddBook';
import Settings from './components/Settings';
import Conquest from './components/Conquest';
import { useToast } from './components/Toast';

export default function App() {
  const route = useRoute();
  const { mode, switchMode, copySampleToUser, books, error, ready } = useStore();
  const toast = useToast();
  const onMap = route.name === 'map' || route.name === 'book' || route.name === 'course';
  useReveal();

  return (
    <div className={`app${mode === 'sample' ? ' has-sample' : ''}${onMap ? ' map-page' : ''}`}>
      <a href="#main" className="sr-only">본문으로 건너뛰기</a>
      <header className="header">
        <div className="header-row">
          <a className="wordmark" href="#/">
            <img src={`${import.meta.env.BASE_URL}brand/textrip-wordmark.svg`} alt="TEXTRIP" width={115} height={20} />
          </a>
          <NavLinks route={route} onMap={onMap} className="nav" follow />
          <span className="header-spacer" />
          <a className="action primary small" href="#/add" style={{ minHeight: 40 }}>
            <Plus size={18} aria-hidden />
            <span className="add-label-long">읽은 책 추가</span>
            <span className="add-label-short">책 추가</span>
          </a>
          <a className="icon-btn" href="#/settings" aria-label="설정" aria-current={route.name === 'settings' ? 'page' : undefined}>
            <SettingsIcon size={20} aria-hidden />
          </a>
        </div>
        <NavLinks route={route} onMap={onMap} className="nav-mobile" />
        {mode === 'sample' && (
          <div className="sample-bar" role="note">
            <span>
              <strong>샘플 둘러보기</strong>
              <span className="sb-long"> · 두목쿼카의 책장 {books.length}편. 내 기록과 따로 저장돼요.</span>
              <span className="sb-short"> · {books.length}편</span>
            </span>
            <span className="actions">
              <button type="button" className="action small" onClick={async () => {
                const n = await copySampleToUser();
                toast({ message: n ? `샘플 ${n}편을 내 기록으로 가져왔어요` : '이미 모두 내 기록에 있어요' });
              }}><span><span className="sb-long">내 기록으로 </span>가져오기</span></button>
              <button type="button" className="action small ghost" onClick={() => switchMode('user')}><span><span className="sb-long">내 기록으로 </span>돌아가기</span></button>
            </span>
          </div>
        )}
      </header>
      <main id="main">
        {error && (
          <div className="page">
            <p className="notice alert" role="alert"><span className="prose">기록을 불러오지 못했어요 · {error}</span></p>
          </div>
        )}
        {!ready && !onMap && <div className="page"><p className="meta">불러오는 중</p></div>}
        {onMap && <MapWorkspace route={route} />}
        {ready && route.name === 'library' && <Library />}
        {route.name === 'add' && <AddBook key={location.hash} />}
        {route.name === 'settings' && <Settings />}
        {ready && route.name === 'conquest' && <Conquest />}
        {ready && route.name === 'collection' && <Collection tab={route.tab} />}
      </main>
    </div>
  );
}

const LINKS: { href: string; label: string; is: (r: Route, onMap: boolean) => boolean }[] = [
  { href: '#/', label: '나의 지도', is: (_r, m) => m },
  { href: '#/library', label: '내 책장', is: (r) => r.name === 'library' },
  { href: '#/collection', label: '수집함', is: (r) => r.name === 'collection' },
  { href: '#/conquest', label: '세계정복', is: (r) => r.name === 'conquest' },
];

/** 따라오는 칸(쿼카 모션랩 lp-nav-hover-follow): 메뉴 위에 커서를 올리면 옅은 칸이 미끄러져 따라가요 */
function NavLinks({ route, onMap, className, follow }: { route: Route; onMap: boolean; className: string; follow?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number; on: boolean }>({ x: 0, w: 0, on: false });
  const move = (el: HTMLElement) => setPill({ x: el.offsetLeft, w: el.offsetWidth, on: true });
  return (
    <nav ref={ref} className={className} aria-label="주 메뉴" onMouseLeave={follow ? () => setPill((p) => ({ ...p, on: false })) : undefined}>
      {follow && <span className={`nav-pill${pill.on ? ' on' : ''}`} style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} aria-hidden />}
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} aria-current={l.is(route, onMap) ? 'page' : undefined} onMouseEnter={follow ? (e) => move(e.currentTarget) : undefined} onFocus={follow ? (e) => move(e.currentTarget) : undefined}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}
