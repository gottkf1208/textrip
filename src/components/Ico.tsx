import type { CSSProperties } from 'react';

export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
/** CSS 변수 안의 url()은 사용하는 스타일시트 기준으로 풀리므로 절대 주소로 넘긴다 */
const absAsset = (p: string) => new URL(asset(p), document.baseURI).href;

/** public/icons/*.svg 를 마스크로 써서 글자색(currentColor)을 따른다. Codex 납품 파일로 교체 가능 */
export function Ico({ name, large, label }: { name: string; large?: boolean; label?: string }) {
  return (
    <span
      className={`ico${large ? ' lg' : ''}`}
      style={{ '--src': `url("${absAsset(`icons/${name}.svg`)}")` } as CSSProperties}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
