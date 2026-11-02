/** 도서 메타데이터 검색(Google Books, 키 없이 호출). 제목·저자·ISBN·판본 정보만 얻는다 — 작품 속 장소·시대의 근거가 아니다. */
export interface BookHit {
  provider: 'google';
  providerBookId: string;
  title: string;
  authors: string[];
  isbn: string[];
  publisher: string | null;
  publishedDate: string | null;
  thumbnail: string | null;
  language: string | null;
}

export async function searchBooks(q: string, signal: AbortSignal): Promise<BookHit[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`;
  const r = await fetch(url, { signal });
  if (r.status === 429) throw new Error('검색 요청이 많아요. 잠시 뒤 다시 시도하거나 직접 입력해 주세요.');
  if (!r.ok) throw new Error('도서 검색에 실패했어요. 직접 입력할 수 있어요.');
  const j = await r.json();
  return ((j.items ?? []) as Record<string, unknown>[]).map((it) => {
    const v = (it.volumeInfo ?? {}) as Record<string, unknown>;
    const ids = (v.industryIdentifiers ?? []) as { type: string; identifier: string }[];
    const thumb = ((v.imageLinks ?? {}) as Record<string, string>).thumbnail ?? null;
    return {
      provider: 'google' as const,
      providerBookId: String(it.id),
      title: [v.title, v.subtitle].filter(Boolean).join(': ') as string,
      authors: (v.authors as string[]) ?? [],
      isbn: ids.filter((i) => /ISBN/.test(i.type)).map((i) => i.identifier),
      publisher: (v.publisher as string) ?? null,
      publishedDate: (v.publishedDate as string) ?? null,
      thumbnail: thumb ? thumb.replace(/^http:/, 'https:') : null,
      language: (v.language as string) ?? null,
    };
  });
}
