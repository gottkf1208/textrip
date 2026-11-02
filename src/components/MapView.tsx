import { useEffect, useRef, useState } from 'react';
import type { Map as MLMap, Marker } from 'maplibre-gl';
import type maplibregl from 'maplibre-gl';
import type { PlaceGroup } from '../lib/selectors';
import { PRECISION_LABEL } from '../types';
import { asset } from './Ico';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export interface Padding { top: number; right: number; bottom: number; left: number }

interface Props {
  groups: PlaceGroup[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  padding: Padding;
  initialView?: { lng: number; lat: number; zoom: number } | null;
  onViewChange: (v: { lng: number; lat: number; zoom: number }) => void;
  reduceMotion: boolean;
  freeze: boolean;
  onShowList: () => void;
  /** 이야기 순서 등에서 강제로 이동할 때 증가 */
  focusNonce: number;
  /** 정복 지도: 칠할 나라의 ISO 숫자 코드 */
  conquestCodes: string[] | null;
}

type Status = 'loading' | 'ready' | 'tile-failed' | 'failed';

export default function MapView(p: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLButtonElement }>());
  const dropIdx = useRef(0);
  const ML = useRef<typeof import('maplibre-gl') | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const props = useRef(p);
  props.current = p;
  const tileErrors = useRef(0);

  // 지도 인스턴스는 한 번만 만든다
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mod] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl.css')]);
        if (cancelled || !box.current) return;
        ML.current = mod;
        const v = props.current.initialView;
        const m = new mod.Map({
          container: box.current,
          style: STYLE_URL,
          center: v ? [v.lng, v.lat] : [40, 30],
          zoom: v ? v.zoom : 1.3,
          minZoom: 0.8,
          maxZoom: 16,
          attributionControl: { compact: true },
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          renderWorldCopies: true,
          localIdeographFontFamily: "'Pretendard Variable', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        });
        m.touchZoomRotate.disableRotation();
        m.addControl(new mod.NavigationControl({ showCompass: false }), window.matchMedia('(max-width: 767px)').matches ? 'top-right' : 'bottom-right');
        (window as unknown as { __textripMap?: MLMap }).__textripMap = m;
        map.current = m;
        m.on('load', () => {
          if (cancelled) return;
          // 지명은 한국어 이름을 먼저, 없으면 현지 이름
          for (const layer of m.getStyle().layers) {
            if (layer.type !== 'symbol') continue;
            const tf = m.getLayoutProperty(layer.id, 'text-field');
            if (!tf || !JSON.stringify(tf).includes('name')) continue;
            m.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:ko'], ['get', 'name']]);
          }
          setStatus('ready');
        });
        m.on('error', (e) => {
          const msg = String((e as { error?: { message?: string } }).error?.message ?? '');
          if (/tile|source|Failed to fetch|NetworkError|style/i.test(msg) || (e as { sourceId?: string }).sourceId) {
            tileErrors.current++;
            if (tileErrors.current >= 3 || !m.isStyleLoaded()) setStatus('tile-failed');
          }
        });
        let t: ReturnType<typeof setTimeout>;
        m.on('moveend', () => {
          clearTimeout(t);
          t = setTimeout(() => {
            const c = m.getCenter();
            props.current.onViewChange({ lng: +c.lng.toFixed(4), lat: +c.lat.toFixed(4), zoom: +m.getZoom().toFixed(2) });
          }, 400);
        });
        // 스타일이 끝내 안 오면 목록으로 대체
        setTimeout(() => {
          if (!cancelled && !m.isStyleLoaded()) setStatus((s) => (s === 'loading' ? 'tile-failed' : s));
        }, 12000);
      } catch {
        if (!cancelled) setStatus('failed');
      }
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.current.clear();
    };
  }, []);

  // 핀 갱신 — 화면에서 가까운 핀은 묶음(클러스터)으로. 선택한 장소는 묶지 않는다
  const render = useRef<() => void>(() => undefined);
  render.current = () => {
    const m = map.current;
    const mod = ML.current;
    if (!m || !mod) return;
    const pr = props.current;
    const placed = pr.groups.filter((g) => g.place.geometry);
    const pts = placed.map((g) => ({ g, pt: m.project([g.place.geometry!.lng, g.place.geometry!.lat]) }));
    pts.sort((a, b) => b.g.items.length - a.g.items.length);
    const R = 38;
    const clusters: { members: typeof pts; x: number; y: number }[] = [];
    for (const it of pts) {
      if (it.g.place.id === pr.selectedPlaceId) {
        clusters.push({ members: [it], x: it.pt.x, y: it.pt.y });
        continue;
      }
      const c = clusters.find((c) => c.members[0].g.place.id !== pr.selectedPlaceId && Math.hypot(c.x - it.pt.x, c.y - it.pt.y) < R);
      if (c) c.members.push(it);
      else clusters.push({ members: [it], x: it.pt.x, y: it.pt.y });
    }
    const seen = new Set<string>();
    const ensure = (key: string, lngLat: [number, number], onClick: () => void) => {
      let rec = markers.current.get(key);
      if (!rec) {
        const el = document.createElement('button');
        el.type = 'button';
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          (el as HTMLButtonElement & { _go?: () => void })._go?.();
        });
        const marker = new mod.Marker({ element: el, anchor: 'bottom' }).setLngLat(lngLat).addTo(m);
        rec = { marker, el };
        // 핀이 처음 생길 때 위에서 톡 떨어져 자리 잡아요 (쿼카 모션랩 photo-drop의 낙하·안착 원리)
        if (!props.current.reduceMotion) {
          const k = Math.min(dropIdx.current++, 24);
          el.style.setProperty('--dd', `${k * 45}ms`);
          el.classList.add('drop-in');
          window.setTimeout(() => el.classList.remove('drop-in'), 900 + k * 45);
        }
        markers.current.set(key, rec);
      }
      (rec.el as HTMLButtonElement & { _go?: () => void })._go = onClick;
      seen.add(key);
      return rec;
    };
    for (const c of clusters) {
      if (c.members.length === 1) {
        const g = c.members[0].g;
        const selected = g.place.id === pr.selectedPlaceId;
        const rec = ensure(`p:${g.place.id}`, [g.place.geometry!.lng, g.place.geometry!.lat], () => props.current.onSelectPlace(g.place.id));
        const area = g.place.precision === 'country' || g.place.precision === 'region';
        const src = selected ? 'map/pin-selected.svg' : area ? 'map/pin-area.svg' : g.pendingOnly ? 'map/pin-city-pending.svg' : 'map/pin-city.svg';
        rec.el.classList.add('pin-marker');
        rec.el.classList.toggle('area', area && !selected);
        rec.el.classList.toggle('selected', selected);
        rec.el.classList.remove('cluster');
        rec.marker.setOffset(area && !selected ? [0, 10] : [0, 0]);
        const n = new Set(g.items.map((i) => i.book.work.id)).size;
        rec.el.setAttribute('aria-label', `${g.place.displayName} · ${PRECISION_LABEL[g.place.precision]} · 책 ${n}권${g.pendingOnly ? ' · 근거 확인 필요' : ''}`);
        rec.el.setAttribute('aria-pressed', String(selected));
        rec.el.innerHTML = `<img alt="" src="${asset(src)}">${n > 1 ? `<span class="badge">${n}</span>` : ''}${selected ? `<span class="pin-label"></span>` : ''}`;
        if (selected) (rec.el.querySelector('.pin-label') as HTMLElement).textContent = g.place.displayName;
        rec.el.style.zIndex = selected ? '5' : '1';
      } else {
        const ids = c.members.map((x) => x.g.place.id).sort();
        const center = m.unproject([c.x, c.y]);
        const books = new Set(c.members.flatMap((x) => x.g.items.map((i) => i.book.work.id))).size;
        const names = c.members.map((x) => x.g.place.displayName);
        const rec = ensure(`c:${ids.join('|')}`, [center.lng, center.lat], () => {
          const b = new mod.LngLatBounds();
          c.members.forEach((x) => b.extend([x.g.place.geometry!.lng, x.g.place.geometry!.lat]));
          const pad = props.current.padding;
          m.fitBounds(b, { padding: { top: pad.top + 40, right: pad.right + 40, bottom: pad.bottom + 40, left: pad.left + 40 }, maxZoom: 13, duration: props.current.reduceMotion ? 0 : 400 });
        });
        rec.marker.setLngLat([center.lng, center.lat]);
        rec.marker.setOffset([0, 4]);
        rec.el.className = rec.el.className.replace(/\b(area|selected)\b/g, '');
        rec.el.classList.add('pin-marker', 'cluster');
        rec.el.setAttribute('aria-label', `${names.slice(0, 3).join(', ')}${names.length > 3 ? ` 외 ${names.length - 3}곳` : ''} · 장소 ${names.length}곳 · 책 ${books}권 · 눌러서 확대`);
        rec.el.removeAttribute('aria-pressed');
        rec.el.innerHTML = `<span class="cluster-dot">${names.length}</span>`;
        rec.el.style.zIndex = '2';
      }
    }
    for (const [id, rec] of markers.current) {
      if (!seen.has(id)) {
        rec.marker.remove();
        markers.current.delete(id);
      }
    }
  };

  useEffect(() => {
    render.current();
  }, [p.groups, p.selectedPlaceId, status]);

  useEffect(() => {
    const m = map.current;
    if (!m || status !== 'ready') return;
    const on = () => render.current();
    m.on('zoomend', on);
    m.on('moveend', on);
    return () => {
      m.off('zoomend', on);
      m.off('moveend', on);
    };
  }, [status]);

  // 정복 지도 — 책과 연결된 나라를 옅게 칠한다(빨강은 쓰지 않음)
  const conquestKey = p.conquestCodes ? p.conquestCodes.join(',') : null;
  useEffect(() => {
    const m = map.current;
    if (!m || status !== 'ready') return;
    let cancelled = false;
    (async () => {
      const codes = props.current.conquestCodes;
      const show = (v: 'visible' | 'none') => ['conquest-fill', 'conquest-line'].forEach((id) => m.getLayer(id) && m.setLayoutProperty(id, 'visibility', v));
      if (!codes) return show('none');
      if (!m.getSource('countries')) {
        const [{ feature }, topo] = await Promise.all([import('topojson-client'), import('world-atlas/countries-110m.json')]);
        if (cancelled || m.getSource('countries')) return;
        const t = topo.default as unknown as Parameters<typeof feature>[0] & { objects: { countries: Parameters<typeof feature>[1] } };
        const fc = feature(t, t.objects.countries);
        m.addSource('countries', { type: 'geojson', data: fc as unknown as GeoJSON.FeatureCollection });
        const before = m.getStyle().layers.find((l) => l.type === 'symbol')?.id;
        m.addLayer({ id: 'conquest-fill', type: 'fill', source: 'countries', paint: { 'fill-color': '#171717', 'fill-opacity': 0.13 } }, before);
        m.addLayer({ id: 'conquest-line', type: 'line', source: 'countries', paint: { 'line-color': '#171717', 'line-width': 1.2, 'line-opacity': 0.55 } }, before);
      }
      const filter = ['in', ['to-string', ['id']], ['literal', codes]] as unknown as maplibregl.FilterSpecification;
      m.setFilter('conquest-fill', filter);
      m.setFilter('conquest-line', filter);
      show('visible');
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [conquestKey, status]);

  // 선택한 장소로 카메라 이동 (패널·시트 폭을 padding으로 반영)
  useEffect(() => {
    const m = map.current;
    if (!m || status !== 'ready' || !p.selectedPlaceId || p.freeze) return;
    const g = p.groups.find((x) => x.place.id === p.selectedPlaceId);
    if (!g?.place.geometry) return;
    const zoom = { country: 3.2, region: 5.2, city: 9.5, site: 13, unlocated: 3 }[g.place.precision];
    const opts = { center: [g.place.geometry.lng, g.place.geometry.lat] as [number, number], zoom: Math.max(m.getZoom() > zoom ? Math.min(m.getZoom(), zoom + 2) : zoom, 2), padding: p.padding };
    if (p.reduceMotion) m.jumpTo(opts);
    else m.easeTo({ ...opts, duration: 400, easing: (t) => 1 - Math.pow(1 - t, 3) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.selectedPlaceId, status, p.focusNonce]);

  // 처음 들어왔고 저장된 화면이 없으면 기록 전체가 보이게
  const fitted = useRef(false);
  useEffect(() => {
    const m = map.current;
    const mod = ML.current;
    if (!m || !mod || status !== 'ready' || fitted.current || p.initialView || p.selectedPlaceId) return;
    const pts = p.groups.filter((g) => g.place.geometry).map((g) => [g.place.geometry!.lng, g.place.geometry!.lat] as [number, number]);
    if (pts.length < 2) return;
    fitted.current = true;
    const b = new mod.LngLatBounds(pts[0], pts[0]);
    pts.forEach((pt) => b.extend(pt));
    m.fitBounds(b, { padding: { top: p.padding.top + 60, right: p.padding.right + 40, bottom: p.padding.bottom + 40, left: p.padding.left + 40 }, maxZoom: 4, duration: 0 });
  }, [status, p.groups, p.initialView, p.selectedPlaceId, p.padding]);

  useEffect(() => {
    map.current?.resize();
  });

  return (
    <div className="map-canvas" aria-label="독서 지도">
      <div ref={box} style={{ position: 'absolute', inset: 0 }} />
      {status !== 'ready' && (
        <div className="map-status" role={status === 'loading' ? undefined : 'alert'}>
          {status === 'loading' && <p style={{ margin: 0 }}>지도를 불러오고 있어요</p>}
          {(status === 'tile-failed' || status === 'failed') && (
            <>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>지도를 불러오지 못했어요</p>
              <p className="help" style={{ marginBottom: 12 }}>책 목록과 메모는 그대로 쓸 수 있어요.</p>
              <button type="button" className="action" onClick={p.onShowList}>
                목록으로 보기
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
