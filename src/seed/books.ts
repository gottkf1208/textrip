/*
 * 두목쿼카 책장 사진 4장(2026.11.02)에서 판독한 실제 완독 도서.
 * - 제목·저자·역자·출판사는 책등에 보이는 정보만 넣었다. 흐린 책등은 needsReview.
 * - 장소·시대 연결은 출처가 붙은 것만 curated, 나머지는 pending(근거 확인 필요).
 */
import type { Category, Certainty, RelationType, TemporalKind, TemporalPrecision, Verification } from '../types';

export interface SeedPlace {
  name: string;
  country?: string;
  reality: 'real' | 'fictional' | 'unknown';
  precision: 'country' | 'region' | 'city' | 'site' | 'unlocated';
  at?: [number, number]; // [lng, lat]
  historic?: string;
  /** ISO 3166-1 숫자 코드(정복 지도용) */
  code?: string;
}

export interface SeedTime {
  kind: TemporalKind;
  label: string;
  start?: number;
  end?: number;
  precision: TemporalPrecision;
  certainty: Certainty;
  ev?: string[];
}

export interface SeedLink {
  place: string | null;
  rel: RelationType;
  summary: string;
  status: Verification;
  ev?: string[];
  times?: SeedTime[];
  order?: number;
}

export interface SeedVolume {
  title: string;
  label?: string;
  series?: string;
  authors?: string[];
}

export interface SeedBook {
  key: string;
  title: string;
  original?: string;
  subtitle?: string;
  authors: string[];
  translators?: string[];
  publisher?: string;
  language?: string;
  category: Category;
  subjects?: string[];
  volumes?: SeedVolume[];
  series?: string;
  review?: string;
  questions?: { text: string; draft: boolean }[];
  links?: SeedLink[];
  times?: SeedTime[];
}

const ev = (title: string, url: string, sourceType: 'original' | 'encyclopedia' | 'academic', claim: string) => ({ title, url, sourceType, claim, accessedAt: '2026-11-02' });

export const SEED_EVIDENCE: Record<string, { title: string; url: string; sourceType: 'original' | 'encyclopedia' | 'academic'; claim: string; accessedAt: string }> = {
  R7: ev('Stendhal, Le Rouge et le Noir (Project Gutenberg 원문)', 'https://www.gutenberg.org/files/798/798-h/798-h.htm', 'original', '프랑슈콩테의 소도시 베리에르, 브장송 신학교, 2권의 파리로 이어지는 주요 배경'),
  R8: ev('Larousse 백과사전 · Le Rouge et le Noir', 'https://www.larousse.fr/encyclopedie/oeuvre/le_Rouge_et_le_Noir/141617', 'encyclopedia', '왕정복고기 사회를 그린 소설, 부제 “Chronique de 1830”'),
  R9: ev('Stanford Encyclopedia of Philosophy · Zhu Xi', 'https://plato.stanford.edu/entries/zhu-xi/', 'academic', '주희는 1130년 10월 푸젠 尤溪에서 태어난 남송의 대표 도학자. 진량(1143–94)과 논쟁'),
  RN_W: ev('The Red and the Black · Wikipedia', 'https://en.wikipedia.org/wiki/The_Red_and_the_Black', 'encyclopedia', '베리에르는 프랑슈콩테의 가상 마을. 브장송 신학교, 파리. 왕정복고 말기~1830'),
  RN_E: ev('EBSCO Research Starters · The Red and the Black: Setting', 'https://www.ebsco.com/research-starters/literature-and-writing/red-and-black-analysis-setting', 'encyclopedia', '베리에르는 실제 동명 마을과 대응하지 않는 가상 마을'),
  NANA: ev('Nana (novel) · Wikipedia', 'https://en.wikipedia.org/wiki/Nana_(novel)', 'encyclopedia', '1867년 4월~1870년 7월, 제2제정 말기 파리. 1880년 단행본'),
  ASSOM: ev("L'Assommoir · Wikipédia", 'https://fr.wikipedia.org/wiki/L%27Assommoir', 'encyclopedia', '파리 구트도르 지구가 무대. 1877년 단행본'),
  GERM_E: ev('EBSCO Research Starters · Germinal: Setting', 'https://www.ebsco.com/research-starters/literature-and-writing/germinal-analysis-setting', 'encyclopedia', '몽수는 가상의 탄광촌'),
  GERM_W: ev('Germinal (novel) · Wikipedia', 'https://en.wikipedia.org/wiki/Germinal_(novel)', 'encyclopedia', '1860년대 북프랑스 탄광 파업. 졸라는 앙쟁·드냉에서 취재. 1885년 출간'),
  GERM_S: ev('Schoolmouv · Fiche de lecture Germinal', 'https://www.schoolmouv.fr/fiches-de-lecture/germinal-emile-zola/fiche-de-lecture', 'encyclopedia', '“1866년 3월의 어느 밤”으로 시작'),
  BETE_F: ev('La Bête humaine · Wikipédia', 'https://fr.wikipedia.org/wiki/La_B%C3%AAte_humaine', 'encyclopedia', '파리 생라자르–르아브르 노선. 라크루아드모프라는 가상 지명'),
  BETE_S: ev('Schoolmouv · Fiche de lecture La Bête humaine', 'https://www.schoolmouv.fr/fiches-de-lecture/la-bete-humaine-emile-zola/fiche-de-lecture', 'encyclopedia', '1869년 2월 파리에서 시작, 루앙 법원 장면'),
  THER: ev('Thérèse Raquin · Wikipedia', 'https://en.wikipedia.org/wiki/Th%C3%A9r%C3%A8se_Raquin', 'encyclopedia', '파리 퐁뇌프 파사주의 잡화점. 1867년 연재·단행본'),
  THER_G: ev('Thérèse Raquin (Project Gutenberg 원문)', 'https://www.gutenberg.org/ebooks/7461', 'original', '라캥 부인은 베르농에서 잡화상을 했다'),
  JACC: ev("J'Accuse…! · Wikipedia", 'https://en.wikipedia.org/wiki/J%27Accuse%E2%80%A6!', 'encyclopedia', '1898년 1월 13일 파리 일간지 로로르 게재. 드레퓌스 혐의는 1894년'),
  GATS: ev('The Great Gatsby · Wikipedia', 'https://en.wikipedia.org/wiki/The_Great_Gatsby', 'encyclopedia', '1922년 롱아일랜드와 뉴욕. 웨스트에그·이스트에그는 가상 마을. 1925년 출간'),
  BEAU: ev('The Beautiful and Damned · Wikipedia', 'https://en.wikipedia.org/wiki/The_Beautiful_and_Damned', 'encyclopedia', '뉴욕, 1913년 시작~1921년 무렵. 1922년 출간'),
  STR_S: ev('SparkNotes · A Streetcar Named Desire: Setting', 'https://www.sparknotes.com/lit/streetcar/setting/', 'encyclopedia', '1940년대 후반, 프렌치 쿼터 옆 엘리시안 필즈 632번지'),
  STR_W: ev('A Streetcar Named Desire · Wikipedia', 'https://en.wikipedia.org/wiki/A_Streetcar_Named_Desire', 'encyclopedia', '벨 리브는 뒤부아 가문의 농장 저택. 1947년 12월 브로드웨이 초연'),
  AGE: ev('The Age of Innocence · Wikipedia', 'https://en.wikipedia.org/wiki/The_Age_of_Innocence', 'encyclopedia', '1870년대 뉴욕 상류사회, 뉴포트·세인트오거스틴 장면. 1920년 출간'),
  BEL_F: ev('Bel-Ami · Wikipédia', 'https://fr.wikipedia.org/wiki/Bel-Ami', 'encyclopedia', '파리가 무대. 뒤루아의 부모는 루앙 근처 캉틀뢰에서 여관을 함'),
  BEL_E: ev('EBSCO Research Starters · Bel-Ami', 'https://www.ebsco.com/research-starters/literature-and-writing/bel-ami-guy-de-maupassant', 'encyclopedia', '이야기 시기 1885년 무렵'),
  CANC: ev('Tropic of Cancer (novel) · Wikipedia', 'https://en.wikipedia.org/wiki/Tropic_of_Cancer_(novel)', 'encyclopedia', '1920년대 후반~1930년대 초 파리. 1934년 출간'),
  CAPR: ev('Tropic of Capricorn (novel) · Wikipedia', 'https://en.wikipedia.org/wiki/Tropic_of_Capricorn_(novel)', 'encyclopedia', '1920년대 뉴욕. 1939년 출간'),
  CALL_M: ev('Macmillan · Call Me by Your Name', 'https://read.macmillan.com/lp/call-name-andre-aciman', 'encyclopedia', '이탈리아 리비에라 절벽 위 저택'),
  CALL_C: ev('CBC Books · Call Me by Your Name', 'https://www.cbc.ca/1.4280536', 'encyclopedia', '1980년대, 이탈리아 리비에라'),
  CALL_W: ev('Call Me by Your Name (novel) · Wikipedia', 'https://en.wikipedia.org/wiki/Call_Me_by_Your_Name_(novel)', 'encyclopedia', '로마에서 보낸 사흘. 2007년 출간'),
  AMB: ev('The Ambassadors (novel) · Wikipedia', 'https://en.wikipedia.org/wiki/The_Ambassadors_(novel)', 'encyclopedia', '파리, 매사추세츠의 가상 마을 울렛. 1903년 출간'),
  ZARA: ev('Thus Spoke Zarathustra · Wikipedia', 'https://en.wikipedia.org/wiki/Thus_Spoke_Zarathustra', 'encyclopedia', '1883–1885 집필. 1부 라팔로, 3부 니스'),
  SILS: ev('Nietzsche-Haus Sils Maria · The second summer: 1883', 'https://nietzschehaus.ch/friedrich-nietzsche-in-sils-maria-en/the-second-summer-1883/', 'encyclopedia', '1883년 여름 질스마리아에서 2부 완성'),
  ZHU_W: ev('Zhu Xi · Wikipedia', 'https://en.wikipedia.org/wiki/Zhu_Xi', 'encyclopedia', '1130–1200, 푸젠 尤溪 출생, 남송'),
  CHEN: ev('宋史 卷436 · 維基文庫', 'https://zh.wikisource.org/wiki/%E5%AE%8B%E5%8F%B2/%E5%8D%B7436', 'original', '“陳亮，字同父，婺州永康人” — 진량은 무주 영강(융캉) 사람'),
  TUTU: ev('Publishers Weekly · No Future Without Forgiveness', 'https://publishersweekly.com/9780385496896', 'encyclopedia', '1999년 출간, 투투가 1996년부터 진실화해위원회 위원장'),
  TRC: ev('Truth and Reconciliation Commission (South Africa) · Wikipedia', 'https://en.wikipedia.org/wiki/Truth_and_Reconciliation_Commission_(South_Africa)', 'encyclopedia', '1996년 설립, 1998년 보고서 제출'),
  FOUC: ev('Critiques Libres · La peinture de Manet', 'https://www.critiqueslibres.com/livre/5443-la-peinture-de-manet-suivi-de-michel-foucault-un-regard-foucault-michel', 'encyclopedia', '푸코가 1971년 튀니스에서 한 마네 강연'),
  KEITH: ev('UPenn · Our Sense of Place · Elizabeth Keith', 'https://web.sas.upenn.edu/oursenseofplace/a-place-is/elizabeth-keith', 'academic', '1919년 3월 말 처음 한국 방문, 1922·1926년 한국 주제 판화'),
  PAIK: ev('Nam June Paik · Wikipedia', 'https://en.wikipedia.org/wiki/Nam_June_Paik', 'encyclopedia', '1932년 경성 출생, 1964년 뉴욕 이주, 2006년 별세'),
  CONAN: ev('名探偵コナン · Wikipedia (ja)', 'https://ja.wikipedia.org/wiki/名探偵コナン', 'encyclopedia', '주 무대는 도쿄도 안의 가상 마을, 베이카초는 가상 지명'),
};

export const SEED_PLACES: Record<string, SeedPlace> = {
  paris: { name: '파리', country: '프랑스', reality: 'real', precision: 'city', at: [2.3522, 48.8566], code: '250' },
  besancon: { name: '브장송', country: '프랑스', reality: 'real', precision: 'city', at: [6.0241, 47.2378], code: '250' },
  verrieres: { name: '베리에르', country: '프랑스', reality: 'fictional', precision: 'unlocated', code: '250' },
  lehavre: { name: '르아브르', country: '프랑스', reality: 'real', precision: 'city', at: [0.1079, 49.4944], code: '250' },
  rouen: { name: '루앙', country: '프랑스', reality: 'real', precision: 'city', at: [1.0993, 49.4431], code: '250' },
  nordbasin: { name: '노르 탄전 지대', country: '프랑스', reality: 'real', precision: 'region', at: [3.4, 50.38], code: '250' },
  montsou: { name: '몽수', country: '프랑스', reality: 'fictional', precision: 'unlocated', code: '250' },
  croixmaufras: { name: '라크루아드모프라', country: '프랑스', reality: 'fictional', precision: 'unlocated', code: '250' },
  vernon: { name: '베르농', country: '프랑스', reality: 'real', precision: 'city', at: [1.485, 49.0927], code: '250' },
  nice: { name: '니스', country: '프랑스', reality: 'real', precision: 'city', at: [7.262, 43.7102], code: '250' },
  orsay: { name: '오르세 미술관', country: '프랑스 파리', reality: 'real', precision: 'site', at: [2.3266, 48.86], code: '250' },
  louvre: { name: '루브르 박물관', country: '프랑스 파리', reality: 'real', precision: 'site', at: [2.3376, 48.8606], code: '250' },
  nyc: { name: '뉴욕', country: '미국', reality: 'real', precision: 'city', at: [-74.006, 40.7128], code: '840' },
  westegg: { name: '웨스트에그', country: '미국', reality: 'fictional', precision: 'unlocated', code: '840' },
  neworleans: { name: '뉴올리언스', country: '미국', reality: 'real', precision: 'city', at: [-90.0715, 29.9511], code: '840' },
  bellereve: { name: '벨 리브', country: '미국', reality: 'fictional', precision: 'unlocated', code: '840' },
  newport: { name: '뉴포트', country: '미국', reality: 'real', precision: 'city', at: [-71.3128, 41.4901], code: '840' },
  staugustine: { name: '세인트오거스틴', country: '미국', reality: 'real', precision: 'city', at: [-81.3145, 29.8946], code: '840' },
  woollett: { name: '울렛', country: '미국', reality: 'fictional', precision: 'unlocated', code: '840' },
  usa: { name: '미국', country: '미국', reality: 'real', precision: 'country', at: [-98.6, 39.8], code: '840' },
  liguria: { name: '이탈리아 리비에라', country: '이탈리아', reality: 'real', precision: 'region', at: [8.75, 44.35], code: '380' },
  rome: { name: '로마', country: '이탈리아', reality: 'real', precision: 'city', at: [12.4964, 41.9028], code: '380' },
  rapallo: { name: '라팔로', country: '이탈리아', reality: 'real', precision: 'city', at: [9.231, 44.3505], code: '380' },
  italy: { name: '이탈리아', country: '이탈리아', reality: 'real', precision: 'country', at: [12.6, 42.8], code: '380' },
  silsmaria: { name: '실스마리아', country: '스위스', reality: 'real', precision: 'city', at: [9.7653, 46.4295], code: '756' },
  spain: { name: '스페인', country: '스페인', reality: 'real', precision: 'country', at: [-3.7, 40.0], code: '724' },
  prado: { name: '프라도 미술관', country: '스페인 마드리드', reality: 'real', precision: 'site', at: [-3.6921, 40.4138], code: '724' },
  tunis: { name: '튀니스', country: '튀니지', reality: 'real', precision: 'city', at: [10.1815, 36.8065], code: '788' },
  southafrica: { name: '남아프리카공화국', country: '남아프리카공화국', reality: 'real', precision: 'country', at: [24.0, -29.0], code: '710' },
  china: { name: '중국', country: '중국', reality: 'real', precision: 'country', at: [104.0, 34.0], code: '156' },
  fujian: { name: '푸젠', country: '중국', reality: 'real', precision: 'region', at: [118.0, 26.1], code: '156' },
  yongkang: { name: '융캉', country: '중국 저장성', reality: 'real', precision: 'city', at: [120.04, 28.89], code: '156' },
  qufu: { name: '취푸', country: '중국 산둥성', reality: 'real', precision: 'city', at: [116.991, 35.5965], historic: '노(魯)나라', code: '156' },
  tokyo: { name: '도쿄', country: '일본', reality: 'real', precision: 'city', at: [139.6503, 35.6762], code: '392' },
  beika: { name: '베이카', country: '일본', reality: 'fictional', precision: 'unlocated', code: '392' },
  bali: { name: '발리', country: '인도네시아', reality: 'real', precision: 'region', at: [115.1889, -8.4095], code: '360' },
  peninsula: { name: '한반도', country: '한반도', reality: 'real', precision: 'region', at: [127.5, 37.6], code: '410' },
  korea: { name: '대한민국', country: '대한민국', reality: 'real', precision: 'country', at: [127.8, 36.4], code: '410' },
  seoul: { name: '서울', country: '대한민국', reality: 'real', precision: 'city', at: [126.978, 37.5665], code: '410' },
  jeju: { name: '제주도', country: '대한민국', reality: 'real', precision: 'region', at: [126.55, 33.38], code: '410' },
  busan: { name: '부산', country: '대한민국', reality: 'real', precision: 'city', at: [129.0756, 35.1796], code: '410' },
};

const pub = (label: string, start?: number, end?: number): SeedTime => ({
  kind: 'publication',
  label,
  start,
  end: end ?? start,
  precision: start !== undefined && (end === undefined || end === start) ? 'exact' : 'range',
  certainty: 'estimated',
});

export const SEED_BOOKS: SeedBook[] = [
  /* ───── 세계문학 칸 ───── */
  {
    key: 'rouge-noir', title: '적과 흑', original: 'Le Rouge et le Noir', authors: ['스탕달'], category: 'literature',
    subjects: ['프랑스 문학', '19세기 소설'], language: 'en', publisher: 'Penguin Classics',
    volumes: [{ title: 'The Red and the Black' }],
    links: [
      { place: 'verrieres', rel: 'story', order: 1, status: 'curated', ev: ['R7', 'RN_W', 'RN_E'], summary: '쥘리앵 소렐의 이야기가 시작되는 프랑슈콩테 지방의 소도시. 실제 동명 마을과 대응하지 않는 가상 장소라 지도에 좌표를 찍지 않는다.' },
      { place: 'besancon', rel: 'story', order: 2, status: 'curated', ev: ['R7', 'RN_W'], summary: '쥘리앵이 신학교에 들어가는 도시.' },
      { place: 'paris', rel: 'story', order: 3, status: 'curated', ev: ['R7', 'RN_W'], summary: '라몰 후작가의 비서가 되어 상류 사회로 들어가는 무대.' },
    ],
    times: [
      { kind: 'story', label: '왕정복고기 프랑스 · 1820년대 후반(추정)', start: 1825, end: 1830, precision: 'decade', certainty: 'estimated', ev: ['R8', 'RN_W'] },
      pub('1830년 출간', 1830),
    ],
  },
  {
    key: 'nana', title: '나나', original: 'Nana', authors: ['에밀 졸라'], category: 'literature', publisher: '문학동네',
    subjects: ['프랑스 문학', '루공마카르 총서'], series: '문학동네 세계문학전집 120',
    links: [{ place: 'paris', rel: 'story', status: 'curated', ev: ['NANA'], summary: '배우 나나가 제2제정기 파리의 극장과 사교계를 휘젓는 무대.' }],
    times: [{ kind: 'story', label: '제2제정 말기 · 1867년 4월–1870년 7월', start: 1867, end: 1870, precision: 'range', certainty: 'confirmed', ev: ['NANA'] }, pub('1880년 출간', 1880)],
  },
  {
    key: 'assommoir', title: '목로주점', original: "L'Assommoir", authors: ['에밀 졸라'], category: 'literature', publisher: '문학동네',
    subjects: ['프랑스 문학', '루공마카르 총서'],
    volumes: [{ title: '목로주점 1', label: '1', series: '문학동네 세계문학전집 083' }, { title: '목로주점 2', label: '2', series: '문학동네 세계문학전집 084' }],
    links: [{ place: 'paris', rel: 'story', status: 'curated', ev: ['ASSOM'], summary: '세탁부 제르베즈가 살아가는 파리 북부 노동자 구역 구트도르.' }],
    times: [{ kind: 'story', label: '제2제정기 · 1850–1860년대', start: 1850, end: 1869, precision: 'range', certainty: 'estimated' }, pub('1877년 출간', 1877)],
  },
  {
    key: 'germinal', title: '제르미날', original: 'Germinal', authors: ['에밀 졸라'], category: 'literature', publisher: '문학동네',
    subjects: ['프랑스 문학', '루공마카르 총서', '노동'],
    volumes: [{ title: '제르미날 1', label: '1', series: '문학동네 세계문학전집 121' }, { title: '제르미날 2', label: '2', series: '문학동네 세계문학전집 122' }],
    links: [
      { place: 'montsou', rel: 'story', status: 'curated', ev: ['GERM_E'], summary: '광부들의 파업이 벌어지는 탄광촌 몽수. 가상 지명이므로 실제 좌표로 바꾸지 않는다.' },
      { place: 'nordbasin', rel: 'story', status: 'curated', ev: ['GERM_W'], summary: '몽수가 놓인 프랑스 북부 탄전 지대. 졸라는 앙쟁 일대를 취재했다. 지역 범위만 표시한다.' },
    ],
    times: [{ kind: 'story', label: '제2제정기 · 1866년 3월부터', start: 1866, end: 1867, precision: 'range', certainty: 'confirmed', ev: ['GERM_S'] }, pub('1885년 출간', 1885)],
  },
  {
    key: 'bete-humaine', title: '인간 짐승', original: 'La Bête humaine', authors: ['에밀 졸라'], category: 'literature', publisher: '문학동네',
    subjects: ['프랑스 문학', '루공마카르 총서', '철도'], series: '문학동네 세계문학전집 115',
    links: [
      { place: 'paris', rel: 'story', status: 'curated', ev: ['BETE_F', 'BETE_S'], summary: '생라자르역을 오가는 기관사와 철도 사람들.' },
      { place: 'rouen', rel: 'story', status: 'curated', ev: ['BETE_S'], summary: '파리–르아브르 노선 중간의 도시. 법원 장면이 나온다.' },
      { place: 'lehavre', rel: 'story', status: 'curated', ev: ['BETE_F'], summary: '파리–르아브르 철도 노선의 끝, 항구 도시.' },
      { place: 'croixmaufras', rel: 'story', status: 'curated', ev: ['BETE_F'], summary: '선로 옆 외딴집이 있는 곳. 가상 지명.' },
    ],
    times: [{ kind: 'story', label: '제2제정 말기 · 1869년 2월–1870년', start: 1869, end: 1870, precision: 'range', certainty: 'confirmed', ev: ['BETE_S'] }, pub('1890년 출간', 1890)],
  },
  {
    key: 'therese', title: '테레즈 라캥', original: 'Thérèse Raquin', authors: ['에밀 졸라'], translators: ['박이문'], category: 'literature', publisher: '문학동네',
    subjects: ['프랑스 문학', '자연주의'],
    links: [
      { place: 'paris', rel: 'story', status: 'curated', ev: ['THER'], summary: '퐁뇌프 파사주의 어두운 잡화점.' },
      { place: 'vernon', rel: 'story', status: 'curated', ev: ['THER_G'], summary: '라캥 부인이 잡화상을 하며 테레즈와 카미유를 키운 센강 변 소도시.' },
    ],
    times: [{ kind: 'story', label: '제2제정기 · 1860년대(추정)', start: 1860, end: 1867, precision: 'decade', certainty: 'estimated' }, pub('1867년 출간', 1867)],
  },
  {
    key: 'jaccuse', title: '나는 고발한다', original: "J'accuse…!", authors: ['에밀 졸라'], category: 'other', publisher: '책세상',
    subjects: ['공개서한', '드레퓌스 사건', '지식인'], series: '책세상문고·고전의 세계 047',
    links: [{ place: 'paris', rel: 'discussed_region', status: 'curated', ev: ['JACC'], summary: '드레퓌스 사건을 고발한 공개서한이 신문 『로로르』 1면에 실린 도시.' }],
    times: [{ kind: 'discussion', label: '드레퓌스 사건 · 1894–1898', start: 1894, end: 1898, precision: 'range', certainty: 'confirmed', ev: ['JACC'] }, pub('1898년 1월 13일 발표', 1898)],
  },
  {
    key: 'gatsby', title: '위대한 개츠비', original: 'The Great Gatsby', authors: ['F. 스콧 피츠제럴드'], category: 'literature', publisher: '문학동네',
    subjects: ['미국 문학', '재즈 시대'], series: '문학동네 세계문학전집 007',
    links: [
      { place: 'westegg', rel: 'story', status: 'curated', ev: ['GATS'], summary: '개츠비 저택이 있는 롱아일랜드의 가상 마을(그레이트넥이 모델).' },
      { place: 'nyc', rel: 'story', status: 'curated', ev: ['GATS'], summary: '닉과 개츠비 일행이 오가는 맨해튼.' },
    ],
    times: [{ kind: 'story', label: '1922년 봄–여름', start: 1922, end: 1922, precision: 'exact', certainty: 'confirmed', ev: ['GATS'] }, pub('1925년 출간', 1925)],
  },
  {
    key: 'beautiful-damned', title: '아름답고 저주받은 사람들', original: 'The Beautiful and Damned', authors: ['F. 스콧 피츠제럴드'], category: 'literature',
    subjects: ['미국 문학', '재즈 시대'],
    links: [{ place: 'nyc', rel: 'story', status: 'curated', ev: ['BEAU'], summary: '유산을 기다리는 앤서니와 글로리아 부부의 뉴욕.' }],
    times: [{ kind: 'story', label: '1913년–1921년 무렵', start: 1913, end: 1921, precision: 'range', certainty: 'confirmed', ev: ['BEAU'] }, pub('1922년 출간', 1922)],
  },
  {
    key: 'streetcar', title: '욕망이라는 이름의 전차', original: 'A Streetcar Named Desire', authors: ['테네시 윌리엄스'], category: 'literature', publisher: '민음사',
    subjects: ['미국 희곡'], series: '민음사 세계문학전집 161',
    links: [
      { place: 'neworleans', rel: 'story', status: 'curated', ev: ['STR_S'], summary: '프렌치 쿼터 바로 옆 엘리시안 필즈 632번지. 블랑시가 동생 스텔라의 집에 머문다.' },
      { place: 'bellereve', rel: 'story', status: 'pending', ev: ['STR_W'], summary: '블랑시가 잃어버린 뒤부아 가문의 농장 저택. 가상 장소이며 정확한 위치는 확인하지 못했다.' },
    ],
    times: [{ kind: 'story', label: '1940년대 후반', start: 1945, end: 1949, precision: 'decade', certainty: 'confirmed', ev: ['STR_S'] }, pub('1947년 12월 초연', 1947)],
  },
  {
    key: 'innocence', title: '순수의 시대', original: 'The Age of Innocence', authors: ['이디스 워튼'], category: 'literature', publisher: '민음사',
    subjects: ['미국 문학'], series: '민음사 세계문학전집 183',
    links: [
      { place: 'nyc', rel: 'story', status: 'curated', ev: ['AGE'], summary: '관습과 체면이 지배하는 뉴욕 상류 사회.' },
      { place: 'newport', rel: 'story', status: 'curated', ev: ['AGE'], summary: '상류층의 여름 휴양지 장면.' },
      { place: 'staugustine', rel: 'story', status: 'curated', ev: ['AGE'], summary: '뉴랜드가 약혼녀 메이를 찾아가는 플로리다 장면.' },
    ],
    times: [{ kind: 'story', label: '1870년대', start: 1870, end: 1879, precision: 'decade', certainty: 'confirmed', ev: ['AGE'] }, pub('1920년 출간', 1920)],
  },
  {
    key: 'bel-ami', title: '벨아미', original: 'Bel-Ami', authors: ['기 드 모파상'], category: 'literature', publisher: '민음사',
    subjects: ['프랑스 문학', '언론'], series: '민음사 세계문학전집 223',
    links: [
      { place: 'paris', rel: 'story', status: 'curated', ev: ['BEL_F'], summary: '신문사를 발판 삼아 출세하는 조르주 뒤루아의 파리.' },
      { place: 'rouen', rel: 'story', status: 'curated', ev: ['BEL_F'], summary: '뒤루아의 부모가 여관을 하는 루앙 근교 캉틀뢰.' },
    ],
    times: [{ kind: 'story', label: '1880년대(1885년 무렵)', start: 1880, end: 1889, precision: 'decade', certainty: 'estimated', ev: ['BEL_E'] }, pub('1885년 출간', 1885)],
  },
  {
    key: 'tropics', title: '북회귀선/남회귀선', original: 'Tropic of Cancer / Tropic of Capricorn', authors: ['헨리 밀러'], translators: ['오정환'], category: 'literature',
    publisher: '동서문화사', subjects: ['미국 문학'], series: '동서문화사 세계문학전집 089',
    links: [
      { place: 'paris', rel: 'story', status: 'curated', ev: ['CANC'], summary: '『북회귀선』 — 1920년대 후반~1930년대 초 파리의 가난한 예술가들.', times: [{ kind: 'story', label: '1920년대 후반–1930년대 초 (북회귀선)', start: 1927, end: 1934, precision: 'range', certainty: 'confirmed', ev: ['CANC'] }] },
      { place: 'nyc', rel: 'story', status: 'curated', ev: ['CAPR'], summary: '『남회귀선』 — 1920년대 뉴욕 맨해튼과 브루클린.', times: [{ kind: 'story', label: '1920년대 (남회귀선)', start: 1920, end: 1929, precision: 'decade', certainty: 'confirmed', ev: ['CAPR'] }] },
    ],
    times: [pub('1934·1939년 출간', 1934, 1939)],
  },
  {
    key: 'call-me', title: '그해, 여름 손님', original: 'Call Me by Your Name', authors: ['안드레 애치먼'], translators: ['정지현'], category: 'literature',
    subjects: ['미국 문학', '성장'],
    links: [
      { place: 'liguria', rel: 'story', status: 'curated', ev: ['CALL_M', 'CALL_C'], summary: '이탈리아 리비에라 해안 절벽 위 저택에서 보낸 여름. 작가는 마을 이름을 밝히지 않는다.' },
      { place: 'rome', rel: 'story', status: 'curated', ev: ['CALL_W'], summary: '후반부, 로마에서 보낸 사흘.' },
    ],
    times: [{ kind: 'story', label: '1980년대', start: 1980, end: 1989, precision: 'decade', certainty: 'confirmed', ev: ['CALL_C'] }, pub('2007년 출간', 2007)],
  },
  {
    key: 'ambassadors', title: '대사들', original: 'The Ambassadors', authors: ['헨리 제임스'], category: 'literature', language: 'en',
    subjects: ['미국 문학'], volumes: [{ title: 'The Ambassadors' }],
    links: [
      { place: 'paris', rel: 'story', status: 'curated', ev: ['AMB'], summary: '스트레더가 채드를 데려오려고 간 파리.' },
      { place: 'woollett', rel: 'story', status: 'curated', ev: ['AMB'], summary: '스트레더가 떠나온 매사추세츠의 가상 소도시.' },
    ],
    times: [{ kind: 'story', label: '1900년 무렵(추정)', start: 1895, end: 1903, precision: 'range', certainty: 'estimated' }, pub('1903년 출간', 1903)],
  },
  {
    key: 'zarathustra', title: '차라투스트라는 이렇게 말했다', original: 'Also sprach Zarathustra', authors: ['프리드리히 니체'], category: 'philosophy', publisher: '민음사',
    subjects: ['철학', '문학 형식'], series: '민음사 세계문학전집 94',
    questions: [{ text: '신이 죽었다고 말한 뒤, 인간은 무엇을 기준으로 자기 자신을 넘어설 수 있는가?', draft: true }],
    links: [
      { place: 'rapallo', rel: 'thinker_activity', status: 'curated', ev: ['ZARA'], summary: '제1부를 쓴 리구리아 해안 도시.' },
      { place: 'silsmaria', rel: 'thinker_activity', status: 'curated', ev: ['SILS'], summary: '1883년 여름 제2부를 완성한 알프스 마을.' },
      { place: 'nice', rel: 'thinker_activity', status: 'curated', ev: ['ZARA'], summary: '제3부를 쓴 겨울 체류지.' },
    ],
    times: [{ kind: 'thinker_activity', label: '1883–1885 집필', start: 1883, end: 1885, precision: 'range', certainty: 'confirmed', ev: ['ZARA'] }, pub('1883–1885년 출간', 1883, 1885)],
  },

  /* ───── 예술·여행 칸 ───── */
  {
    key: 'orsay-guide', title: 'A Fuller Understanding of the Paintings at the Orsay Museum', authors: [], category: 'art', language: 'en', publisher: 'Artlys',
    subjects: ['미술', '미술관 안내'],
    links: [{ place: 'orsay', rel: 'art_travel', status: 'pending', summary: '센강 변 옛 기차역을 고친 미술관의 회화 안내서.' }],
  },
  {
    key: 'prado-guide', title: 'The Prado Guide', authors: [], category: 'art', language: 'en', publisher: 'Museo Nacional del Prado',
    subjects: ['미술', '미술관 안내'],
    links: [{ place: 'prado', rel: 'art_travel', status: 'pending', summary: '마드리드 프라도 미술관이 펴낸 소장품 안내서.' }],
  },
  {
    key: 'old-korea', title: '영국화가 엘리자베스 키스의 올드 코리아', original: 'Old Korea', authors: ['엘리자베스 키스', '엘스펫 키스 로버트슨 스콧'], translators: ['송영달'],
    category: 'art', publisher: '책과함께', subjects: ['미술', '근대 한국'],
    links: [{ place: 'peninsula', rel: 'art_travel', status: 'curated', ev: ['KEITH'], summary: '1919년 처음 한국을 찾은 영국 화가가 그린 풍속화와 기록.', times: [{ kind: 'discussion', label: '1919년 첫 방문 이후 (1946년 출간)', start: 1919, end: 1946, precision: 'range', certainty: 'estimated', ev: ['KEITH'] }] }],
  },
  {
    key: 'louvre-orsay', title: '루브르와 오르세 명화 산책', authors: ['김영숙'], category: 'art', publisher: '마로니에북스', subjects: ['미술', '미술관'],
    volumes: [{ title: '루브르와 오르세 명화 산책', label: '2nd Edition' }],
    links: [
      { place: 'louvre', rel: 'art_travel', status: 'pending', summary: '루브르 박물관의 명화를 따라 걷는다.' },
      { place: 'orsay', rel: 'art_travel', status: 'pending', summary: '오르세 미술관의 명화를 따라 걷는다.' },
    ],
  },
  {
    key: 'kpop-humanities', title: '케이팝 인문학', subtitle: '한국대중음악, 철학으로 듣는다', authors: ['박성건', '이호건'], category: 'art', publisher: '미디어샘', subjects: ['음악', '대중문화', '철학'],
    links: [{ place: 'korea', rel: 'discussed_region', status: 'pending', summary: '한국 대중음악과 그 문화.' }],
  },
  {
    key: 'italy-drive', title: '이탈리아 자동차 여행', authors: ['이정운', '김기현'], category: 'travel', publisher: '꿈의지도', series: '크레이지 홀리데이 07',
    subjects: ['여행'],
    links: [{ place: 'italy', rel: 'art_travel', status: 'pending', summary: '자동차로 이탈리아 곳곳을 도는 여행 안내.' }],
  },
  {
    key: 'manet', title: '마네의 회화', original: 'La Peinture de Manet', authors: ['미셸 푸코 외'], translators: ['오트르망'], category: 'art', publisher: '그린비',
    subjects: ['미술', '철학'],
    links: [
      { place: 'paris', rel: 'thinker_activity', status: 'pending', summary: '마네(1832–1883)가 활동한 도시.', times: [{ kind: 'discussion', label: '19세기 중후반 (마네의 회화)', start: 1850, end: 1883, precision: 'range', certainty: 'estimated' }] },
      { place: 'tunis', rel: 'thinker_activity', status: 'curated', ev: ['FOUC'], summary: '푸코가 마네의 회화 13점을 분석한 강연을 한 도시.', times: [{ kind: 'thinker_activity', label: '1971년 강연', start: 1971, end: 1971, precision: 'exact', certainty: 'confirmed', ev: ['FOUC'] }] },
    ],
  },
  {
    key: 'now-bali', title: '지금, 발리', subtitle: '신들이 사랑한 지상낙원의 섬', authors: ['송지헌'], category: 'travel', publisher: '플래닝북스', series: '지금 시리즈', subjects: ['여행'],
    links: [{ place: 'bali', rel: 'art_travel', status: 'pending', summary: '발리 여행 안내서.' }],
  },
  { key: 'spanish-verbs', title: '스페인어 필수 동사', authors: ['유연창'], category: 'other', publisher: 'HUiNE', subjects: ['어학', '스페인어'] },
  { key: 'enjoy-spanish', title: 'ENJOY 여행 스페인어', authors: ['넥서스콘텐츠개발팀'], category: 'other', publisher: '넥서스', subjects: ['어학', '스페인어', '여행'] },
  {
    key: 'paik', title: '나의 사랑 백남준', subtitle: '아내 구보타 시게코가 들려주는 백남준의 삶과 사랑, 예술', authors: ['구보타 시게코', '남정호'], category: 'art', publisher: 'arte(아르테)',
    subjects: ['미술', '비디오 아트'],
    links: [
      { place: 'nyc', rel: 'thinker_activity', status: 'curated', ev: ['PAIK'], summary: '1964년부터 백남준이 근거지로 삼은 뉴욕.' },
      { place: 'seoul', rel: 'thinker_activity', status: 'curated', ev: ['PAIK'], summary: '백남준이 태어난 도시(1932년 경성).' },
    ],
    times: [{ kind: 'thinker_activity', label: '1964년 뉴욕 이주–2006년', start: 1964, end: 2006, precision: 'range', certainty: 'confirmed', ev: ['PAIK'] }],
  },
  {
    key: 'peace-tour', title: '대한민국 평화기행', authors: ['권기봉', '김진환', '한모니까'], category: 'travel', publisher: '창비교육', subjects: ['평화', '통일', '기행'],
    links: [{ place: 'peninsula', rel: 'discussed_region', status: 'pending', summary: '분단과 평화의 현장을 찾아가는 국내 기행.' }],
  },
  {
    key: 'jeju-unification', title: '통일의 눈으로 제주를 다시 보다', authors: ['강동완', '고성준'], category: 'travel', publisher: '너나드리', subjects: ['통일', '평화', '제주'],
    links: [{ place: 'jeju', rel: 'discussed_region', status: 'pending', summary: '통일과 평화의 시선으로 다시 보는 제주.' }],
  },
  {
    key: 'busan-unification', title: '통일의 눈으로 부산을 다시 보다', subtitle: '통일아, 노올~~자', authors: ['강동완'], category: 'travel', publisher: '너나드리', subjects: ['통일', '평화', '부산'],
    links: [{ place: 'busan', rel: 'discussed_region', status: 'pending', summary: '통일과 평화의 시선으로 다시 보는 부산.' }],
  },
  {
    key: 'film-unification', title: '공동관람구역', subtitle: '영화로 통일을 읽다', authors: ['전병길'], category: 'other', publisher: '책마루', subjects: ['영화', '분단', '통일'],
    links: [{ place: 'peninsula', rel: 'discussed_region', status: 'pending', summary: '분단과 통일을 다룬 영화를 통해 읽는 한반도.' }],
  },
  { key: 'nojatdon', title: '노잣돈 갚기 프로젝트', authors: ['김진희'], category: 'literature', publisher: '문학동네', series: '보름달문고 62', subjects: ['아동문학'] },
  { key: 'earth', title: '교양 지구의 이해', authors: ['윤마병', '김희수', '김학성', '남기수'], category: 'other', publisher: '교육과학사', subjects: ['지구과학'] },
  { key: 'museum-humanities-1', title: '미술관 옆 인문학', authors: ['박홍순'], category: 'art', publisher: '서해문집', subjects: ['미술', '인문학'] },
  { key: 'museum-humanities-2', title: '미술관 옆 인문학 2', authors: ['박홍순'], category: 'art', publisher: '서해문집', subjects: ['미술', '인문학'] },
  {
    key: 'spain-museum', title: '스페인 미술관 산책', authors: ['최경화'], category: 'art', publisher: '시공아트', subjects: ['미술', '미술관'],
    links: [{ place: 'spain', rel: 'art_travel', status: 'pending', summary: '스페인 여러 도시의 미술관을 걷는 안내.' }],
  },
  {
    key: 'conan', title: '명탐정 코난 100', authors: ['아오야마 고쇼'], category: 'other', publisher: '서울미디어코믹스', subjects: ['만화'],
    review: '책등 일부만 보여요. 도서 검색으로는 『명탐정 코난 SDB: 100 PLUS』 또는 본편 100권으로 보여요.',
    links: [
      { place: 'tokyo', rel: 'story', status: 'curated', ev: ['CONAN'], summary: '이야기의 주 무대인 도쿄.' },
      { place: 'beika', rel: 'story', status: 'curated', ev: ['CONAN'], summary: '주인공이 사는 도쿄의 가상 동네 베이카초.' },
    ],
  },

  /* ───── 동양철학·윤리 칸 ───── */
  {
    key: 'confucian-meditation', title: '유가 명상의 이론과 교육방법', authors: ['김병환', '이슬희'], category: 'philosophy', publisher: '교육과학사',
    subjects: ['유학', '명상', '도덕교육'],
    questions: [{ text: '유가 전통의 수양과 명상을 오늘의 도덕교육에서 어떻게 가르칠 수 있는가?', draft: true }],
  },
  {
    key: 'zhuxi-thought', title: '주희의 사유세계', subtitle: '주자학의 패권', authors: ['호이트 틸만'], translators: ['김병환'], category: 'philosophy', publisher: '교육과학사',
    subjects: ['성리학', '송대 사상'],
    links: [
      { place: 'china', rel: 'thinker_activity', status: 'curated', ev: ['R9'], summary: '주희가 활동한 남송 시대 중국. 사상가의 배경이며 책의 출간 시기가 아니다.', times: [{ kind: 'thinker_activity', label: '남송 · 12세기 (주희 1130–1200)', start: 1130, end: 1200, precision: 'range', certainty: 'confirmed', ev: ['R9', 'ZHU_W'] }] },
      { place: 'fujian', rel: 'thinker_activity', status: 'curated', ev: ['R9'], summary: '주희가 태어난 지역(尤溪, 1130년).' },
    ],
  },
  {
    key: 'neo-confucian-lecture', title: '김병환 교수의 신유학 강의', authors: ['김병환'], category: 'philosophy', publisher: '휴먼북스', subjects: ['신유학'],
    questions: [{ text: '송·명 시대 신유학은 우주와 마음, 도덕을 어떻게 하나로 설명했는가?', draft: true }],
    links: [{ place: 'china', rel: 'discussed_region', status: 'pending', summary: '송·명 시대 중국의 신유학.', times: [{ kind: 'discussion', label: '송·명 시대', start: 960, end: 1644, precision: 'era', certainty: 'estimated' }] }],
  },
  {
    key: 'east-ethics-lecture', title: '김병환 교수의 동양윤리사상 강의', authors: ['김병환'], category: 'philosophy', publisher: '새문사', subjects: ['동양윤리'],
    questions: [{ text: '유가·도가·불교 윤리는 좋은 삶을 각각 어떻게 그리는가?', draft: true }],
  },
  {
    key: 'zhuxi-history', title: '주희의 역사세계', authors: ['위잉스'], category: 'philosophy', subjects: ['성리학', '송대 정치문화'],
    volumes: [{ title: '주희의 역사세계 上', label: '上' }, { title: '주희의 역사세계 下', label: '下' }],
    review: '책등에 저자·출판사 표기가 없어요. 도서 검색으로 판본을 확인해 주세요.',
    links: [
      { place: 'china', rel: 'thinker_activity', status: 'curated', ev: ['R9'], summary: '주희가 활동한 남송 시대 중국. 사상가의 배경이며 이 책의 저자나 출간 시기가 아니다.', times: [{ kind: 'thinker_activity', label: '남송 · 12세기 (주희 1130–1200)', start: 1130, end: 1200, precision: 'range', certainty: 'confirmed', ev: ['R9', 'ZHU_W'] }] },
      { place: 'fujian', rel: 'thinker_activity', status: 'curated', ev: ['R9'], summary: '주희가 태어난 지역(尤溪, 1130년).' },
    ],
  },
  {
    key: 'utilitarian-confucianism', title: '공리주의 유가', subtitle: '주희에 대한 진량의 도전', authors: ['호이트 틸만'], translators: ['김병환', '임명희'],
    category: 'philosophy', publisher: '교육과학사', subjects: ['송대 사상', '사공학'],
    questions: [{ text: '도덕적 동기와 실제 결과 가운데 정치의 기준은 무엇이어야 하는가?', draft: true }],
    links: [{ place: 'yongkang', rel: 'thinker_activity', status: 'curated', ev: ['CHEN'], summary: '주희와 논쟁한 진량의 고향 무주 영강(오늘날 저장성 융캉).', times: [{ kind: 'thinker_activity', label: '남송 · 12세기 (진량 1143–1194)', start: 1143, end: 1194, precision: 'range', certainty: 'confirmed', ev: ['R9'] }] }],
  },
  { key: 'meditation-foundation', title: '명상의 철학적 기초', authors: ['한자경'], category: 'philosophy', publisher: '이화여자대학교출판부', subjects: ['불교철학', '명상'] },
  {
    key: 'cartier-bresson', title: '앙리 카르티에 브레송과의 대화 1951–1998', original: 'Voir est un tout', authors: ['클레망 셰루(엮음)', '쥘리 존스(엮음)'], translators: ['정재곤'], category: 'art', publisher: '열화당', subjects: ['사진', '앙리 카르티에 브레송'],
    links: [{ place: 'paris', rel: 'thinker_activity', status: 'pending', summary: '사진가의 주요 활동 근거지.' }],
    times: [{ kind: 'discussion', label: '1951–1998 (대화 시기)', start: 1951, end: 1998, precision: 'range', certainty: 'confirmed' }],
  },
  {
    key: 'liberals-communitarians', title: '자유주의와 공동체주의', original: 'Liberals and Communitarians', authors: ['스테판 뮬홀', '애덤 스위프트'], translators: ['김해성', '조영달'],
    category: 'philosophy', publisher: '한울아카데미', series: '한울아카데미 413', subjects: ['정치철학', '시민성'],
    questions: [{ text: '개인의 권리와 공동체의 좋음 가운데 무엇을 정치의 출발점으로 삼아야 하는가?', draft: true }],
  },
  { key: 'civic-friendship', title: '시민성, 시민적 우정과 의무', original: 'Virtues in the Public Sphere', authors: ['제임스 아서'], translators: ['이기연', '김형렬', '김하연', '양해성', '허윤회', '정창우'], category: 'philosophy', publisher: '교육과학사', subjects: ['시민교육'] },
  { key: 'big-five-citizenship', title: 'Big Five 시민성 교육론', authors: ['추병완 외'], category: 'philosophy', publisher: '한국문화사', series: '한국문화사 시민교육 시리즈', subjects: ['시민교육'] },
  {
    key: 'civic-inquiry', title: '시민교육 탐구', authors: ['추병완', '김병환', '이경무', '이영문', '정창우', '추정완', '박보람', '변순용', '류지한', '이범웅', '김진선'],
    category: 'philosophy', publisher: '한국문화사', series: '한국문화사 시민교육 시리즈', subjects: ['시민교육'],
  },
  {
    key: 'hoffman', title: 'Empathy and Moral Development', authors: ['Martin L. Hoffman'], category: 'philosophy', language: 'en', publisher: 'Cambridge University Press',
    subjects: ['도덕심리학', '공감'],
    questions: [{ text: '공감은 어떻게 발달하며 도덕적 행동과 정의로 이어지는가?', draft: true }],
  },
  { key: 'identity', title: '존중받지 못하는 자들을 위한 정치학', original: 'Identity', authors: ['프랜시스 후쿠야마'], translators: ['이수경'], category: 'philosophy', publisher: '한국경제신문', subjects: ['정치학', '정체성'] },
  { key: 'intellectual-history', title: '지성사란 무엇인가?', subtitle: '역사가가 텍스트를 읽는 방법', original: 'What is Intellectual History?', authors: ['리처드 왓모어'], translators: ['이우창'], category: 'philosophy', subjects: ['지성사', '역사학'] },
  {
    key: 'confucius-hour', title: '공자와 한 시간', authors: ['김병환'], category: 'philosophy', publisher: '한올출판사', subjects: ['유학', '논어'],
    review: '거꾸로 꽂힌 책등이에요. 도서 검색 결과로 제목을 맞췄으니 한 번 확인해 주세요.',
    links: [{ place: 'qufu', rel: 'thinker_activity', status: 'pending', summary: '공자가 태어나 제자를 가르친 노(魯)나라, 오늘날 산둥성 취푸 일대.', times: [{ kind: 'thinker_activity', label: '춘추시대 · 기원전 6–5세기', start: -551, end: -479, precision: 'century', certainty: 'estimated' }] }],
  },
  {
    key: 'no-future', title: '용서 없이 미래 없다', original: 'No Future without Forgiveness', authors: ['데스몬드 투투'], translators: ['홍종락'], category: 'philosophy',
    subjects: ['회복적 정의', '화해'],
    questions: [{ text: '정의를 세우는 일과 용서하는 일은 함께 갈 수 있는가?', draft: true }],
    links: [{ place: 'southafrica', rel: 'discussed_region', status: 'curated', ev: ['TUTU', 'TRC'], summary: '투투가 위원장을 맡은 진실화해위원회가 활동한 남아프리카공화국.', times: [{ kind: 'discussion', label: '진실화해위원회 · 1996–1998', start: 1996, end: 1998, precision: 'range', certainty: 'confirmed', ev: ['TRC'] }] }],
    times: [pub('1999년 출간', 1999)],
  },
  {
    key: 'biomedical-ethics', title: '생명의료윤리의 원칙들', original: 'Principles of Biomedical Ethics', authors: ['톰 L. 비첨', '제임스 F. 칠드리스'],
    translators: ['박찬구', '최경석', '김수정', '인선호', '조선우', '추정완'], category: 'philosophy', subjects: ['생명윤리'],
    volumes: [{ title: '생명의료윤리의 원칙들', label: 'Sixth Edition' }],
  },
  { key: 'pojman-ethics', title: '윤리학', original: 'Ethics: Discovering Right and Wrong', authors: ['루이스 포이만', '제임스 피저'], category: 'philosophy', subjects: ['윤리학'] },

  /* ───── 도덕교육 칸 ───── */
  { key: 'edu-stats', title: '학위논문 작성을 위한 교육연구 및 통계분석', authors: ['백순근'], category: 'other', publisher: '교육과학사', subjects: ['교육연구', '통계'], volumes: [{ title: '학위논문 작성을 위한 교육연구 및 통계분석', label: '수정판' }] },
  { key: 'gibbs', title: '도덕 발달과 실재', subtitle: '콜버그, 호프만, 하이트 이론을 넘어서', authors: ['존 깁스'], translators: ['정창우', '이인태', '김윤경'], category: 'philosophy', publisher: '교육과학사', subjects: ['도덕심리학', '도덕교육'] },
  { key: 'moral-textbook', title: '도덕과 교재 연구 및 지도법', authors: ['정창우', '김혜진', '김하연', '이인태', '오유진', '이혜진'], category: 'philosophy', publisher: '교육과학사', subjects: ['도덕교육'] },
  { key: 'transformative-moral', title: '변혁적 도덕 역량 증진을 위한 도덕교육론', authors: ['정창우'], category: 'philosophy', publisher: '교육과학사', subjects: ['도덕교육'] },
  { key: 'empathy-studies', title: '공감학 어제와 오늘', authors: ['박성희'], category: 'philosophy', publisher: '학지사', subjects: ['공감', '상담'] },
  {
    key: 'ethics-moral-ed', title: '윤리학과 도덕교육', authors: ['박병기', '추병완'], category: 'philosophy', publisher: '인간사랑', subjects: ['윤리학', '도덕교육'],
    volumes: [
      { title: '윤리학과 도덕교육 1', label: '1' },
      { title: '윤리학과 도덕교육 2 (개정증보판)', label: '2', authors: ['박병기', '추병완', '이경원', '변종헌'] },
    ],
  },
  { key: 'behavioral-ethics', title: '행동 윤리학', original: 'Behavioral Business Ethics: Shaping an Emerging Field', authors: ['데이비드 드 크리머', '앤 텐브런셀'], translators: ['추병완'], category: 'philosophy', subjects: ['윤리학', '경영윤리'] },
  {
    key: 'righteous-mind', title: '바른 마음', original: 'The Righteous Mind', authors: ['조너선 하이트'], translators: ['왕수민'], category: 'philosophy', publisher: '웅진지식하우스',
    subjects: ['도덕심리학'],
    questions: [{ text: '나의 옳음과 그들의 옳음은 왜 다른가', draft: false }],
  },
  {
    key: 'coddling', title: '나쁜 교육', original: 'The Coddling of the American Mind', authors: ['조너선 하이트', '그레그 루키아노프'], translators: ['왕수민'], category: 'philosophy',
    publisher: '프시케의숲', subjects: ['교육', '사회심리'],
    questions: [{ text: '덜 너그러운 세대와 편협한 사회는 어떻게 만들어지는가', draft: false }],
    links: [{ place: 'usa', rel: 'discussed_region', status: 'pending', summary: '미국 대학 캠퍼스와 사회의 변화.', times: [{ kind: 'discussion', label: '2010년대', start: 2010, end: 2019, precision: 'decade', certainty: 'estimated' }] }],
  },
  { key: 'messy-morality', title: '너절한 도덕', original: 'Messy Morality: The Challenge of Politics', authors: ['C. A. J. 코디'], category: 'philosophy', publisher: '서광사', subjects: ['정치윤리'] },
  { key: 'moral-ed-research', title: '도덕교육 연구 및 실천의 방향과 과제', authors: ['정창우'], category: 'philosophy', publisher: '교육과학사', subjects: ['도덕교육'], review: '부제가 가려져 있어 전체 제목 확인이 필요해요.' },
  { key: 'character-ed', title: '인성교육의 이해와 실천', authors: ['정창우'], category: 'philosophy', publisher: '교육과학사', subjects: ['인성교육'] },
  { key: 'character-frame', title: '21세기 인성교육 프레임', authors: ['정창우'], category: 'philosophy', publisher: '교육과학사', subjects: ['인성교육'] },
  { key: 'concept-inquiry', title: '초등 개념 기반 탐구학습 설계와 실천 이야기', subtitle: '백워드 설계로 생각하는 교실을 열어가는', authors: ['김병일(설계)', '이승하 외(실천)'], category: 'other', subjects: ['교육과정', '탐구학습'] },
];
