export const SCHEMA_VERSION = 1;

export type Category = 'literature' | 'philosophy' | 'art' | 'travel' | 'other';
export type RelationType = 'story' | 'thinker_activity' | 'discussed_region' | 'art_travel' | 'user_linked';
export type Reality = 'real' | 'fictional' | 'unknown';
export type Precision = 'country' | 'region' | 'city' | 'site' | 'unlocated';
export type Verification = 'curated' | 'pending' | 'disputed' | 'user_authored';
export type TemporalKind = 'story' | 'discussion' | 'thinker_activity' | 'publication';
export type TemporalPrecision = 'exact' | 'range' | 'decade' | 'century' | 'era' | 'unknown';
export type Certainty = 'confirmed' | 'estimated' | 'unknown';

interface Base {
  id: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  deletedAt?: string | null;
}

export interface Work extends Base {
  canonicalTitle: string;
  subtitle?: string | null;
  originalTitle?: string | null;
  authors: string[];
  category: Category;
  subjects: string[];
  /** 철학책: 이 책이 다루는 질문 (초안 여부 표시) */
  questions?: { text: string; draft: boolean }[];
}

export interface Edition extends Base {
  workId: string;
  displayTitle: string;
  language?: string | null;
  isbn: string[];
  publisher?: string | null;
  publishedDate?: string | null;
  volumeLabel?: string | null;
  coverUrl?: string | null;
  translators?: string[];
  /** 권마다 저자가 다를 때 */
  editionAuthors?: string[];
  series?: string | null;
  /** spine: 책등 판독 / search: 도서 검색 / user: 직접 입력 / photo: 사진 인식 */
  metadataSource: 'spine' | 'search' | 'user' | 'photo';
  /** 책등이 흐려 제목·저자 판독을 다시 확인해야 함 */
  needsReview?: boolean;
  reviewNote?: string | null;
}

export interface LibraryEntry extends Base {
  workId: string;
  editionIds: string[];
  readStatus: 'read';
  completedAt?: string | null;
  addedAt: string;
}

export interface Place extends Base {
  displayName: string;
  historicName?: string | null;
  modernName?: string | null;
  country?: string | null;
  reality: Reality;
  precision: Precision;
  /** 대표 좌표. 실제 사건 현장이 아니라 화면을 맞추는 위치 */
  geometry?: { lng: number; lat: number } | null;
  geocodeSource?: string | null;
  /** ISO 3166-1 숫자 코드 */
  countryCode?: string | null;
}

export interface ContextLink extends Base {
  workId: string;
  placeId?: string | null;
  relationType: RelationType;
  summary: string;
  verificationStatus: Verification;
  userAcceptedAt?: string | null;
  evidenceIds: string[];
  temporalContextIds: string[];
  /** 주요 배경의 흐름 순서 (검증된 경우만) */
  narrativeOrder?: number | null;
}

export interface TemporalContext extends Base {
  workId: string;
  kind: TemporalKind;
  label: string;
  startYear?: number | null;
  endYear?: number | null;
  precision: TemporalPrecision;
  certainty: Certainty;
  evidenceIds: string[];
}

export interface Evidence extends Base {
  title: string;
  url?: string | null;
  sourceType: 'original' | 'publisher' | 'academic' | 'library' | 'encyclopedia' | 'user';
  locator?: string | null;
  accessedAt: string;
  supportedClaim: string;
  shortSummary?: string | null;
}

export interface Note extends Base {
  libraryEntryId: string;
  contextLinkId?: string | null;
  scope: 'book' | 'place';
  body: string;
  revision: number;
}

export interface UserSettings {
  id: 'settings';
  mapView?: { lng: number; lat: number; zoom: number } | null;
  filters?: Filters | null;
  reduceMotionOverride?: boolean | null;
  /** 샘플 책장 데이터 버전 */
  seedVersion?: number;
  schemaVersion: number;
}

export interface Filters {
  categories: Category[]; // empty = 전체
  relations: RelationType[]; // empty = 전체
  era: 'all' | 'ancient' | 'premodern' | 'c19' | 'c20' | 'c21';
  includeUnknownEra: boolean;
  includeUnplaced: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  relations: [],
  era: 'all',
  includeUnknownEra: true,
  includeUnplaced: true,
};

export interface DataSet {
  works: Work[];
  editions: Edition[];
  entries: LibraryEntry[];
  places: Place[];
  links: ContextLink[];
  temporals: TemporalContext[];
  evidence: Evidence[];
  notes: Note[];
}

export const STORE_NAMES = ['works', 'editions', 'entries', 'places', 'links', 'temporals', 'evidence', 'notes'] as const;
export type StoreName = (typeof STORE_NAMES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  literature: '문학',
  philosophy: '철학·윤리',
  art: '예술',
  travel: '여행·지역',
  other: '기타',
};

export const RELATION_LABEL: Record<RelationType, string> = {
  story: '이야기 배경',
  thinker_activity: '사상가 활동 배경',
  discussed_region: '책에서 다루는 지역',
  art_travel: '예술·여행 대상',
  user_linked: '내가 연결한 장소',
};

export const RELATION_ICON: Record<RelationType, string> = {
  story: 'rel-story',
  thinker_activity: 'rel-thinker',
  discussed_region: 'rel-region',
  art_travel: 'rel-art-travel',
  user_linked: 'rel-user',
};

export const REALITY_LABEL: Record<Reality, string> = {
  real: '실재 장소',
  fictional: '가상 장소',
  unknown: '실재 여부 미확인',
};

export const PRECISION_LABEL: Record<Precision, string> = {
  country: '국가 단위',
  region: '지역 단위',
  city: '도시 단위',
  site: '특정 지점',
  unlocated: '위치 없음',
};

export const VERIFICATION_LABEL: Record<Verification, string> = {
  curated: '출처 있음',
  pending: '근거 확인 필요',
  disputed: '해석이 나뉨',
  user_authored: '직접 입력',
};

export const VERIFICATION_ICON: Record<Verification, string> = {
  curated: 'ev-curated',
  pending: 'ev-pending',
  disputed: 'ev-disputed',
  user_authored: 'ev-user',
};

export const TEMPORAL_KIND_LABEL: Record<TemporalKind, string> = {
  story: '이야기 속 시대',
  discussion: '다루는 시대',
  thinker_activity: '사상가 활동 시기',
  publication: '출간',
};
