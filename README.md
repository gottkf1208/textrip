# TEXTRIP · 텍스트립

> 그 이야기는 어디쯤, 언제쯤

읽은 책을 사진으로 남기면, 이야기와 사상이 **장소·시대·나의 메모**로 이어지는 개인 독서 지도예요.
JUST VUILD 2026 · TEXT-HIP · 그룹22 예시 작품입니다.

## 할 수 있는 일

| 기능 | 내용 |
|---|---|
| 읽은 책 등록 | 책장 사진을 찍으면 Claude가 책등을 읽어 후보를 보여 줘요. 잘못 읽힌 제목만 고치면 끝. 도서 검색·직접 입력도 돼요. |
| 독서 지도 | 이야기 배경·사상가 활동 배경·다루는 지역을 지도에서 봐요. 가상 장소는 좌표를 만들지 않고, 국가·도시 단위와 근거 상태를 함께 보여 줘요. |
| 나의 기록 | 책 전체 메모와 장소별 메모. 새로고침해도 남고, JSON으로 내보내고 가져올 수 있어요. |
| 세계정복 | 책으로 다녀온 나라·도시·대륙·시간 폭, 정복 지도, 원정 코스(내 책장 북큐레이션), 칭호. |

## 샘플 책장

두목쿼카의 실제 책장 사진 4장에서 판독한 완독 도서 70편(74권)이 들어 있어요. 장소·시대 연결은 확인한 출처가 있는 것만 ‘출처 있음’, 나머지는 ‘근거 확인 필요’로 표시해요. 흐린 책등은 ‘판독 확인 필요’로 남겨 두었어요.

## 사진 인식 연결

- **이 기기의 키**: 설정 → Claude API 키 저장. 키는 브라우저에만 저장되고 Anthropic으로만 전송돼요. 공용 PC에서는 쓰지 마세요.
- **서버 연결(권장)**: `worker/`의 Cloudflare Worker로 배포하면 키가 서버 비밀값에만 있어요.

```bash
npm run build
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY
# 선택: npx wrangler secret put CLAUDE_MODEL  (기본 claude-sonnet-5-5)
```

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 생성
```

`main`에 올리면 GitHub Actions가 GitHub Pages로 배포해요.

## 만든 재료

- 지도: MapLibre GL JS · 타일 OpenFreeMap · 데이터 © OpenStreetMap 기여자 · 나라 경계 world-atlas(Natural Earth)
- 글꼴: Pretendard v1.3.9 (SIL OFL 1.1)
- 모션: 쿼카 모션랩 759·842·845·819·739·765의 원리를 이 앱에 맞춰 구현
- 도서 검색: Google Books API
- 이미지 에셋: TEXTRIP 이미지 에셋 제작의뢰서 v1.0에 따라 Codex가 제작

## AI의 도움과 사람의 판단

기획 초안, 코드, 출처 조사는 AI(Claude·Codex)의 도움을 받았어요. 장소·시대 근거 확인, 기능 범위, 사용성 검수는 사람이 판단합니다.
