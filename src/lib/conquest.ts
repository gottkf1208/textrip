/**
 * 세계정복 — 내 책장의 실제 기록으로만 계산한다. 추천·추정 수치를 만들지 않는다.
 */
import type { BookView } from '../store';
import type { ContextLink, DataSet, Place, TemporalContext } from '../types';
import { timesFor } from './selectors';

export const CONTINENTS = ['유럽', '아시아', '아프리카', '북아메리카', '남아메리카', '오세아니아'] as const;
export type Continent = (typeof CONTINENTS)[number];

/** ISO 숫자 코드 → 대륙·이름 (샘플·주요 국가) */
const COUNTRY: Record<string, { name: string; continent: Continent }> = {
  '250': { name: '프랑스', continent: '유럽' },
  '380': { name: '이탈리아', continent: '유럽' },
  '724': { name: '스페인', continent: '유럽' },
  '756': { name: '스위스', continent: '유럽' },
  '826': { name: '영국', continent: '유럽' },
  '276': { name: '독일', continent: '유럽' },
  '643': { name: '러시아', continent: '유럽' },
  '840': { name: '미국', continent: '북아메리카' },
  '124': { name: '캐나다', continent: '북아메리카' },
  '484': { name: '멕시코', continent: '북아메리카' },
  '076': { name: '브라질', continent: '남아메리카' },
  '032': { name: '아르헨티나', continent: '남아메리카' },
  '170': { name: '콜롬비아', continent: '남아메리카' },
  '788': { name: '튀니지', continent: '아프리카' },
  '710': { name: '남아프리카공화국', continent: '아프리카' },
  '818': { name: '이집트', continent: '아프리카' },
  '156': { name: '중국', continent: '아시아' },
  '392': { name: '일본', continent: '아시아' },
  '360': { name: '인도네시아', continent: '아시아' },
  '410': { name: '대한민국', continent: '아시아' },
  '408': { name: '북한', continent: '아시아' },
  '356': { name: '인도', continent: '아시아' },
  '036': { name: '오스트레일리아', continent: '오세아니아' },
  '554': { name: '뉴질랜드', continent: '오세아니아' },
};

export interface CourseStep {
  book: BookView;
  link: ContextLink;
  place: Place | null;
  time: TemporalContext | null;
}
export interface Course {
  id: string;
  kind: 'city' | 'era' | 'thinker' | 'fictional';
  title: string;
  subtitle: string;
  steps: CourseStep[];
}
export interface Title {
  name: string;
  earned: boolean;
  why: string;
}

const yearOf = (t: TemporalContext | null) => (t?.startYear ?? Number.POSITIVE_INFINITY);
export const formatYear = (y: number) => (y < 0 ? `기원전 ${-y}년` : `${y}년`);

export function computeConquest(books: BookView[], data: DataSet) {
  const places = new Map(data.places.filter((p) => !p.deletedAt).map((p) => [p.id, p]));
  const temporals = new Map(data.temporals.filter((t) => !t.deletedAt).map((t) => [t.id, t]));

  const byCountry = new Map<string, Set<string>>();
  const byPlace = new Map<string, CourseStep[]>();
  const cities = new Set<string>();
  const fictional: CourseStep[] = [];
  const thinkers: CourseStep[] = [];
  const allSteps: CourseStep[] = [];
  let oldest = Number.POSITIVE_INFINITY;
  let newest = Number.NEGATIVE_INFINITY;
  let curated = 0;
  const unmapped = new Set<string>();

  for (const book of books) {
    let mapped = false;
    for (const link of book.links) {
      const place = link.placeId ? places.get(link.placeId) ?? null : null;
      const times = timesFor(link, temporals).filter((t) => t.kind !== 'publication');
      const time = [...times].sort((a, b) => yearOf(a) - yearOf(b))[0] ?? null;
      for (const t of times) {
        if (t.startYear != null) oldest = Math.min(oldest, t.startYear);
        const end = t.endYear ?? t.startYear;
        if (end != null) newest = Math.max(newest, end);
      }
      if (link.verificationStatus === 'curated') curated++;
      const step: CourseStep = { book, link, place, time };
      allSteps.push(step);
      if (place?.countryCode) {
        const set = byCountry.get(place.countryCode) ?? new Set();
        set.add(book.work.id);
        byCountry.set(place.countryCode, set);
      }
      if (place?.reality === 'fictional') fictional.push(step);
      if (place?.geometry) {
        mapped = true;
        if (place.precision === 'city' || place.precision === 'site') cities.add(place.id);
        byPlace.set(place.id, [...(byPlace.get(place.id) ?? []), step]);
      }
      if (link.relationType === 'thinker_activity' && place?.geometry) thinkers.push(step);
    }
    if (!mapped) unmapped.add(book.work.id);
  }

  const countries = [...byCountry.entries()]
    .map(([code, set]) => ({ code, name: COUNTRY[code]?.name ?? code, continent: COUNTRY[code]?.continent ?? null, books: set.size }))
    .sort((a, b) => b.books - a.books);
  const continents = new Set(countries.map((c) => c.continent).filter(Boolean) as Continent[]);

  // 원정 코스 — 한 작품당 한 걸음, 시대순
  const uniqByBook = (steps: CourseStep[]) => {
    const seen = new Set<string>();
    return steps.filter((s) => (seen.has(s.book.work.id) ? false : (seen.add(s.book.work.id), true)));
  };
  const byYear = (a: CourseStep, b: CourseStep) => yearOf(a.time) - yearOf(b.time) || a.book.work.canonicalTitle.localeCompare(b.book.work.canonicalTitle, 'ko');
  const courses: Course[] = [];
  for (const [pid, steps] of byPlace) {
    const s = uniqByBook(steps).sort(byYear);
    if (s.length < 3) continue;
    const p = places.get(pid)!;
    const dated = s.filter((x) => x.time?.startYear != null);
    courses.push({
      id: `city-${pid}`,
      kind: 'city',
      title: `${p.displayName}, 시대를 건너며`,
      subtitle: `${s.length}권 · ${dated.length ? `${formatYear(dated[0].time!.startYear!)} → ${formatYear(dated[dated.length - 1].time!.startYear!)}` : '시대 확인 중'}`,
      steps: s,
    });
  }
  courses.sort((a, b) => b.steps.length - a.steps.length);
  const eraCourse = (id: string, title: string, lo: number, hi: number) => {
    const s = uniqByBook(allSteps.filter((x) => x.place?.geometry && x.time?.startYear != null && x.time.startYear <= hi && (x.time.endYear ?? x.time.startYear) >= lo)).sort(byYear);
    if (s.length >= 3) courses.push({ id, kind: 'era', title, subtitle: `${s.length}권 · ${new Set(s.map((x) => x.place!.countryCode)).size}개 나라`, steps: s });
  };
  eraCourse('era-c19', '19세기 세계 일주', 1800, 1899);
  eraCourse('era-c20', '20세기 세계 일주', 1900, 1999);
  const th = uniqByBook(thinkers).sort(byYear);
  if (th.length >= 3) courses.push({ id: 'thinkers', kind: 'thinker', title: '사상가의 발자취', subtitle: `${th.length}명의 활동 무대 · 시대순`, steps: th });
  if (fictional.length >= 2) courses.push({ id: 'fictional', kind: 'fictional', title: '지도에 없는 곳들', subtitle: `가상 장소 ${fictional.length}곳 · 좌표 없이 걷는 순례`, steps: fictional });

  // 칭호 — 실제 기록 조건
  const titles: Title[] = [];
  const bigCities = [...byPlace.entries()].map(([pid, s]) => ({ p: places.get(pid)!, n: new Set(s.map((x) => x.book.work.id)).size })).filter((x) => x.p.precision === 'city').sort((a, b) => b.n - a.n);
  const top = bigCities[0];
  titles.push(top && top.n >= 5 ? { name: `${top.p.displayName} 시민권`, earned: true, why: `${top.p.displayName}과 연결된 책 ${top.n}권` } : { name: '도시 시민권', earned: false, why: '한 도시와 연결된 책 5권' });
  titles.push({ name: '대륙 횡단자', earned: continents.size >= 3, why: `대륙 ${continents.size}/3곳` });
  const span = Number.isFinite(oldest) && Number.isFinite(newest) ? newest - oldest : 0;
  titles.push({ name: '시간여행자', earned: span >= 1000, why: span ? `${formatYear(oldest)}부터 ${formatYear(newest)}까지 · ${span.toLocaleString()}년` : '1,000년 넘는 시간 폭' });
  titles.push({ name: '가상 세계 탐험가', earned: fictional.length >= 3, why: `가상 장소 ${fictional.length}/3곳` });
  titles.push({ name: '사상의 순례자', earned: th.length >= 5, why: `사상가 활동 무대 ${th.length}/5곳` });
  titles.push({ name: '출처 탐정', earned: curated >= 20, why: `출처를 확인한 연결 ${curated}/20개` });
  titles.push({ name: '지구 반대편까지', earned: countries.some((c) => ['036', '554', '076', '032', '170'].includes(c.code)), why: '남아메리카나 오세아니아 책 1권' });

  return {
    countries,
    countryCodes: countries.map((c) => c.code),
    continents,
    missingContinents: CONTINENTS.filter((c) => !continents.has(c)),
    cityCount: cities.size,
    oldest: Number.isFinite(oldest) ? oldest : null,
    newest: Number.isFinite(newest) ? newest : null,
    unmappedCount: unmapped.size,
    courses,
    titles,
  };
}
