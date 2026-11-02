import { Plus, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from './store';
import { useRoute } from './lib/util';
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

  return (
    <div className={`app${mode === 'sample' ? ' has-sample' : ''}${onMap ? ' map-page' : ''}`}>
      <a href="#main" className="sr-only">본문으로 건너뛰기</a>
      <header className="header">
        <div className="header-row">
          <a className="wordmark" href="#/">
            <img src={`${import.meta.env.BASE_URL}brand/textrip-wordmark.svg`} alt="TEXTRIP" width={115} height={20} />
          </a>
          <nav className="nav" aria-label="주 메뉴">
            <a href="#/" aria-current={onMap ? 'page' : undefined}>나의 지도</a>
            <a href="#/library" aria-current={route.name === 'library' ? 'page' : undefined}>내 책장</a>
            <a href="#/conquest" aria-current={route.name === 'conquest' ? 'page' : undefined}>세계정복</a>
          </nav>
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
        <nav className="nav-mobile" aria-label="주 메뉴">
          <a href="#/" aria-current={onMap ? 'page' : undefined}>나의 지도</a>
          <a href="#/library" aria-current={route.name === 'library' ? 'page' : undefined}>내 책장</a>
          <a href="#/conquest" aria-current={route.name === 'conquest' ? 'page' : undefined}>세계정복</a>
        </nav>
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
      </main>
    </div>
  );
}
