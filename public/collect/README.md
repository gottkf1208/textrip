# TEXTRIP 컬렉션 에셋 v3

생성일: 2026-11-02 (Asia/Seoul)

총 59종. 내장 image_gen으로 각 에셋을 개별 생성했습니다. 파일 인코딩·색 정합·투명 여백·다이컷 선 정리는 Pillow / NumPy / SciPy로 수행했습니다.

## 적용

`public/collect/` 내용을 앱의 같은 경로로 복사하세요. `_masters/`는 수정·보관용 생성 원본 PNG이며 앱 배포 대상이 아닙니다. 원본 생성 해상도는 납품 WebP 해상도와 다를 수 있습니다. WebP가 실제 앱 규격입니다.

## 납품 규격

- 스티커 640×640, 흰 다이컷 선 14px, 최대 외곽 기준 약 7% 여백, 90,000 bytes 이하.
- 핀 512×512, 우표 360×440, 마스코트 800×800.
- 트렁크 2400×1600, 백팩 1600×2000, 각각 400,000 bytes 이하.
- 모든 WebP에 실제 알파 채널. 캔버스 외곽 네 변은 완전 투명.
- contact-sheet.png: 8열, 흰색/네이비 바탕으로 41종 비교.
- contact-sheet-64px.png: 실제 64px 썸네일 검수.
- contact-sheet-extras.png: 핀·우표·가방·마스코트 검수.
- manifest.json: 각 파일의 치수·용량·SHA-256.

## 제작 및 정리 사항

- 원본의 배경 알파를 기반으로 바깥쪽 작은 추출 흔적을 정리했습니다.
- 스티커의 흰 다이컷 선을 최종 크기 기준 14px로 통일하고 중앙에 배치했습니다.
- 지정 색상 계열에 맞춰 색면을 정리하고 안티앨리어싱으로 가장자리를 마감했습니다.
- 제주 귤은 금지색인 오렌지 대신 머스터드 골드로 표현했습니다.
- 지도는 알아볼 수 있도록 단순화한 그림이며 정밀 국경 자료가 아닙니다.
- GOLD/HOLO 효과, 소인, 획득·미획득 상태, 그림자는 에셋에 굽지 않았습니다. 앱 코드에서 적용합니다.
- 원본 PNG는 생성 결과를 그대로 보존합니다.

- 도시 시민권 핀의 불필요한 글자를 이미지 편집으로 제거했습니다.
- 예술 우표 상단의 흐린 얼룩을 이미지 편집으로 제거했습니다.
- 마스코트 볼터치를 로즈 색으로 정리하고 지구 핀의 알파 추출 구멍을 복구했습니다.
- 최종 검수: 스티커 최대 89,946 bytes, 트렁크 110,586 bytes, 백팩 170,392 bytes.
- 배포용 WebP 59개와 수정용 원본 PNG 59개를 파일명·크기·투명도 기준으로 검증했습니다.

## 생성 프롬프트

### stickers/p-paris.webp — 파리

```text
Use case: stylized-concept. Create ONE finished production illustration for TEXTRIP travel souvenir die-cut sticker, Paris. Subject: a rounded yet elegant Eiffel Tower as main subject, a small cafe awning at its foot, and one little cloud. No text anywhere. One composition, centered, 7% transparent margins on each side. Canvas square, intended final 640x640. Premium travel magazine spot illustration, warm and charming but sophisticated, thin consistent ink outlines #22201D about 3px at 640px, restrained FLAT colors with extremely subtle paper grain only. Palette strictly navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. No extra hues. A uniform pure WHITE die-cut border about 14px at 640px follows the entire illustration silhouette. Outside this white border is fully transparent alpha, no background shape. Orthographic front or slightly elevated three-quarter view, plump simplified proportions, main subject reads at 64px. No shadows, no glow, no gradients, no shine, no 3D, no lettering, no numerals, no logo, no flags, no faces, no character, no extra scenery. This is the style master of a coordinated 41 sticker collection.
```

### stickers/p-besancon.webp — 브장송

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Besancon: a hilltop citadel surrounded by a curved loop of river, with one small pocket watch with blank face (no numerals). Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A; only flowers may use rose #D9A7A0. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-lehavre.webp — 르아브르

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Le Havre: a compact harbor at sunrise with exactly two small sailboats, a muted mustard sun. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A; only flowers may use rose #D9A7A0. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-rouen.webp — 루앙

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Rouen: front facade of a Gothic cathedral with pointed spires and a large rose window; architectural rose window is a circular geometric pattern, no flowers. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A; only flowers may use rose #D9A7A0. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-nordbasin.webp — 노르 탄전 지대

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Nord coal basin: a steel mine winding headframe as main subject, with a small coal mine cart. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A; only flowers may use rose #D9A7A0. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-vernon.webp — 베르농

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Vernon: a rounded arched wooden footbridge over a pond with a few lily pads and one tiny rose-colored water lily. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A; only flowers may use rose #D9A7A0. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-nice.webp — 니스

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Nice: a blue folding chair on the seaside promenade, with one small palm tree and a simple hint of pale-blue sea. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A; only flowers may use rose #D9A7A0. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-orsay.webp — 오르세 미술관

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Musee d'Orsay: a huge round former railway station clock with elegant hands, subtle tick marks only and absolutely NO numerals or letters, in a compact architectural stone surround. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A; only flowers may use rose #D9A7A0. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-louvre.webp — 루브르 박물관

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Louvre: the glass pyramid as main subject and one small circular fountain, no other buildings. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. Do not add flowers, flowerpots, extra plants or ornamental decoration unless specifically named in the Subject. Use very few interior lines, eliminate tiny repetitive detail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-nyc.webp — 뉴욕

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: New York: cropped sculptural hand holding the Statue of Liberty torch as main subject, with a small cluster of simple New York building silhouettes behind. No face or whole person. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. Do not add flowers, flowerpots, extra plants or ornamental decoration unless specifically named in the Subject. Use very few interior lines, eliminate tiny repetitive detail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-neworleans.webp — 뉴올리언스

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: New Orleans: one vintage streetcar and a small facade of a wrought-iron balcony house behind, no signs or route numbers. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. Do not add flowers, flowerpots, extra plants or ornamental decoration unless specifically named in the Subject. Use very few interior lines, eliminate tiny repetitive detail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-newport.webp — 뉴포트

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Newport: coastal mansion on a rocky sea cliff with one small lighthouse. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. Do not add flowers, flowerpots, extra plants or ornamental decoration unless specifically named in the Subject. Use very few interior lines, eliminate tiny repetitive detail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-staugustine.webp — 세인트오거스틴

```text
Use case: stylized-concept. ONE production die-cut travel souvenir sticker, a unified TEXTRIP collection. Subject: Saint Augustine: an old Spanish fort with clearly STAR-SHAPED bastion walls, slightly elevated view, simple stone structure. Centered compact composition on a SQUARE transparent canvas; complete silhouette entirely inside canvas with a generous 10% clear margin, nothing clipped. Sophisticated travel magazine spot illustration, gently rounded plump proportions, crisp FLAT color fields, uniform fine ink outlines #22201D (3px at final 640px). Extremely subtle paper grain, almost solid flat colors. Strict palette: navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale-blue #9FB8D6, sage #9FB39A. Single dominant subject, maximum 1-2 small supporting props. Front or mildly elevated 3/4 view. Uniform PURE WHITE die-cut outline 14px at final 640px follows the joined outer silhouette. Outside this border fully transparent alpha. Clean hard silhouette, no stray pixels. Readable as a 64px thumbnail. Do not add flowers, flowerpots, extra plants or ornamental decoration unless specifically named in the Subject. Use very few interior lines, eliminate tiny repetitive detail. No text, numbers, letters, logos, flags, humans or cartoon characters; no gradients, cast shadows, glow, glossy texture, 3D or extra scenery. Don't draw a badge circle or rectangular background.
```

### stickers/p-usa.webp — 미국

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 미국 미국 지도 실루엣 + 끝없이 뻗은 길 하나 나라. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-liguria.webp — 이탈리아 리비에라

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 이탈리아 리비에라 바닷가 절벽에 층층이 붙은 색색의 작은 집 지역. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-rome.webp — 로마

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 로마 콜로세움과 사이프러스 나무. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-rapallo.webp — 라팔로

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 라팔로 바다 위 작은 성채와 산책길 난간. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-italy.webp — 이탈리아

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 이탈리아 장화 모양 지도 실루엣 + 올리브 가지 나라. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-silsmaria.webp — 실스마리아

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 실스마리아 알프스 호숫가의 큰 바위와 눈 덮인 봉우리. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-spain.webp — 스페인

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 스페인 스페인 지도 실루엣 + 접힌 부채 나라. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-prado.webp — 프라도 미술관

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 프라도 미술관 신고전 양식 건물 정면과 빈 금색 액자. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-tunis.webp — 튀니스

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 튀니스 흰 벽에 둥근 파란 문, 부겐빌레아 한 가지. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-southafrica.webp — 남아프리카공화국

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 남아프리카공화국 지도 실루엣 + 테이블 마운틴 + 프로테아 꽃 나라. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-china.webp — 중국

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 중국 지도 실루엣 + 붓과 먹 나라. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-fujian.webp — 푸젠

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 푸젠 둥근 흙집 토루와 차밭 지역. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-yongkang.webp — 융캉

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 융캉 붉은 바위 산과 작은 정자. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-qufu.webp — 취푸

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 취푸 옛 사당의 겹지붕과 죽간 한 묶음. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-tokyo.webp — 도쿄

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 도쿄 도쿄 타워와 벚꽃 한 가지. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-bali.webp — 발리

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 발리 갈라진 사원 문과 계단식 논 지역. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-peninsula.webp — 한반도

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 한반도 한반도 지도 실루엣 + 올리브 잎을 문 비둘기 지역. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-korea.webp — 대한민국

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 대한민국 지도 실루엣 + 무궁화 한 송이 나라. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-seoul.webp — 서울

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 서울 남산서울타워와 한옥 지붕. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-jeju.webp — 제주도

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 제주도 돌하르방과 귤 두 알 지역. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. The mandarins must be MUSTARD GOLD, never orange. The dol hareubang stone statue may have its traditional sculpted facial features.
```

### stickers/p-busan.webp — 부산

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 부산 광안대교와 갈매기. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-verrieres.webp — 베리에르

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 베리에르 (적과 흑) 산골 마을 제재소와 물레방아 가상 · HOLO. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-montsou.webp — 몽수

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 몽수 (제르미날) 불 켜진 광부용 안전등 가상 · HOLO. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-croixmaufras.webp — 라크루아드모프라

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 라크루아드모프라 (인간 짐승) 철도 건널목 차단기와 증기기관차 앞모습 가상 · HOLO. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-westegg.webp — 웨스트에그

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 웨스트에그 (위대한 개츠비) 밤바다 부두 끝의 작은 초록 불빛과 저택 실루엣 가상 · HOLO. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. Allow exactly one small #7FA37A green light dot, no glow.
```

### stickers/p-bellereve.webp — 벨 리브

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 벨 리브 (욕망이라는 이름의 전차) 하얀 기둥의 남부 저택과 목련 꽃 가상 · HOLO. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-woollett.webp — 울렛

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 울렛 (대사들) 뉴잉글랜드 흰 교회 첨탑과 봉인된 편지 가상 · HOLO. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### stickers/p-beika.webp — 베이카

```text
Use case: stylized-concept. One TEXTRIP die-cut travel souvenir sticker. 베이카 (명탐정 코난) 돋보기와 골목길 발자국 (캐릭터 금지) 가상 · HOLO. Compact elegant travel-magazine spot illustration with slightly rounded proportions, front or mild 3/4 view. Thin uniform ink outline #22201D, flat color, very subtle grain. Strict palette navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, mustard gold #C2A464, pale blue #9FB8D6, sage #9FB39A. Rose #D9A7A0 only for explicitly requested flowers. Use only the subject and its specified props, no added flowers or scenery. Simple large shapes, minimal interior details, readable at 64px. Square transparent background. Complete image centered with 10% margin. Uniform pure white die-cut border 14px at final 640px follows silhouette; outside border fully transparent. No text, letters, numerals, labels, flags, logos, people, existing characters, shadows, glow, gradients, gloss, 3D. Do not print the place name. 
```

### pins/citizen.webp — 도시 시민권

```text
Use case: precise-object-edit. Edit this enamel key pin. Remove ALL lettering from the ribbon, including the word TEXTRIP. The ribbon must be completely BLANK paper-colored enamel. Keep the city-key shape, gold metal outline, city skyline, colors and one white highlight. Flat colors, no gradients. Clean transparent background: remove all red/yellow stray extraction speckles outside the gold silhouette. No new letters, numbers, symbols, logo or text anywhere.
```

### pins/continents.webp — 대륙 횡단자

```text
Use case: stylized-concept. One enamel pin badge for TEXTRIP: a globe with a dotted route around it. Front view, rounded clean silhouette, entire badge centered occupying 80% of square canvas. Transparent background. MUSTARD GOLD #C2A464 metal outline and internal dividers, flat enamel in only 2-3 of navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, sage #9FB39A, pale blue #9FB8D6. Exactly one short white highlight stroke near top. Sophisticated charming travel-journal collectible, crisp minimal detail readable at 64px. No white sticker border. No text, letters, numerals, logo, face, shadows, glow, gradients, 3D or photoreal metallic shine. Intended 512x512.
```

### pins/time.webp — 시간여행자

```text
Use case: stylized-concept. One enamel pin badge illustration: a winged hourglass. Front view, rounded clean silhouette, entire badge centered occupying 80% of square canvas. Transparent background. MUSTARD GOLD #C2A464 metal outline and internal dividers, flat enamel in only 2-3 of navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, sage #9FB39A, pale blue #9FB8D6. Exactly one short white highlight stroke near top. Sophisticated charming travel-journal collectible, crisp minimal detail readable at 64px. No white sticker border. No text, letters, numerals, logo, face, shadows, glow, gradients, 3D or photoreal metallic shine. Intended 512x512.
```

### pins/fiction.webp — 가상 세계 탐험가

```text
Use case: stylized-concept. One enamel pin badge illustration: a slightly open door revealing one shining star. Front view, rounded clean silhouette, entire badge centered occupying 80% of square canvas. Transparent background. MUSTARD GOLD #C2A464 metal outline and internal dividers, flat enamel in only 2-3 of navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, sage #9FB39A, pale blue #9FB8D6. Exactly one short white highlight stroke near top. Sophisticated charming travel-journal collectible, crisp minimal detail readable at 64px. No white sticker border. No text, letters, numerals, logo, face, shadows, glow, gradients, 3D or photoreal metallic shine. Intended 512x512.
```

### pins/thinkers.webp — 사상의 순례자

```text
Use case: stylized-concept. One enamel pin badge illustration: a small lit lantern. Front view, rounded clean silhouette, entire badge centered occupying 80% of square canvas. Transparent background. MUSTARD GOLD #C2A464 metal outline and internal dividers, flat enamel in only 2-3 of navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, sage #9FB39A, pale blue #9FB8D6. Exactly one short white highlight stroke near top. Sophisticated charming travel-journal collectible, crisp minimal detail readable at 64px. No white sticker border. No text, letters, numerals, logo, face, shadows, glow, gradients, 3D or photoreal metallic shine. Intended 512x512.
```

### pins/sources.webp — 출처 탐정

```text
Use case: stylized-concept. One enamel pin badge illustration: an open book with a magnifying glass and one checkmark. Front view, rounded clean silhouette, entire badge centered occupying 80% of square canvas. Transparent background. MUSTARD GOLD #C2A464 metal outline and internal dividers, flat enamel in only 2-3 of navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, sage #9FB39A, pale blue #9FB8D6. Exactly one short white highlight stroke near top. Sophisticated charming travel-journal collectible, crisp minimal detail readable at 64px. No white sticker border. No text, letters, numerals, logo, face, shadows, glow, gradients, 3D or photoreal metallic shine. Intended 512x512.
```

### pins/antipode.webp — 지구 반대편까지

```text
Use case: stylized-concept. One enamel pin badge illustration: a paper airplane circling a globe. Front view, rounded clean silhouette, entire badge centered occupying 80% of square canvas. Transparent background. MUSTARD GOLD #C2A464 metal outline and internal dividers, flat enamel in only 2-3 of navy #1F3460, burgundy #6E1A2F, paper #F6F3EC, sage #9FB39A, pale blue #9FB8D6. Exactly one short white highlight stroke near top. Sophisticated charming travel-journal collectible, crisp minimal detail readable at 64px. No white sticker border. No text, letters, numerals, logo, face, shadows, glow, gradients, 3D or photoreal metallic shine. Intended 512x512.
```

### stamps/literature.webp — 문학

```text
Use case: stylized-concept. One portrait postage stamp illustration, final aspect ratio 360x440. Subject centered: a fountain pen nib and an open book. Elegant simple woodcut-like drawing using ONLY navy #1F3460, burgundy #6E1A2F, mustard gold #C2A464 and paper #F6F3EC, only 2-3 inks. Paper-colored serrated perforated edge with consistent semicircular notches on all four sides. Thin dark ink #22201D inner rectangular picture frame. Complete stamp centered, small transparent margin, fully transparent outside. No text, no letters, no numbers, no denomination, no cancellation, no logos, no cast shadow, no glow, no gradient, no 3D.
```

### stamps/philosophy.webp — 철학·윤리

```text
Use case: stylized-concept. One portrait postage stamp illustration, final aspect ratio 360x440. Subject centered: a small owl on a stack of books. Elegant simple woodcut-like drawing using ONLY navy #1F3460, burgundy #6E1A2F, mustard gold #C2A464 and paper #F6F3EC, only 2-3 inks. Paper-colored serrated perforated edge with consistent semicircular notches on all four sides. Thin dark ink #22201D inner rectangular picture frame. Complete stamp centered, small transparent margin, fully transparent outside. No text, no letters, no numbers, no denomination, no cancellation, no logos, no cast shadow, no glow, no gradient, no 3D.
```

### stamps/art.webp — 예술

```text
Use case: precise-object-edit. Edit this art postage stamp. Remove the blurry gray smudge / faint ghost objects above the paint palette: restore that entire empty upper space to clean uniform paper #F6F3EC. Keep the brush and palette woodcut, thin rectangular picture border and perforated edges exactly. Clean up stray pixels outside stamp, fully transparent alpha outside stamp. No text, no numbers, no shadow, no gradient. Do not add any new artwork.
```

### stamps/travel.webp — 여행·지역

```text
Use case: stylized-concept. One portrait postage stamp illustration, final aspect ratio 360x440. Subject centered: one compass rose with no letters. Elegant simple woodcut-like drawing using ONLY navy #1F3460, burgundy #6E1A2F, mustard gold #C2A464 and paper #F6F3EC, only 2-3 inks. Paper-colored serrated perforated edge with consistent semicircular notches on all four sides. Thin dark ink #22201D inner rectangular picture frame. Complete stamp centered, small transparent margin, fully transparent outside. No text, no letters, no numbers, no denomination, no cancellation, no logos, no cast shadow, no glow, no gradient, no 3D.
```

### stamps/other.webp — 기타

```text
Use case: stylized-concept. One portrait postage stamp illustration, final aspect ratio 360x440. Subject centered: a paper airplane and one cloud. Elegant simple woodcut-like drawing using ONLY navy #1F3460, burgundy #6E1A2F, mustard gold #C2A464 and paper #F6F3EC, only 2-3 inks. Paper-colored serrated perforated edge with consistent semicircular notches on all four sides. Thin dark ink #22201D inner rectangular picture frame. Complete stamp centered, small transparent margin, fully transparent outside. No text, no letters, no numbers, no denomination, no cancellation, no logos, no cast shadow, no glow, no gradient, no 3D.
```

### trunk.webp — 여행 트렁크

```text
Use case: stylized-concept. A small isolated 2D clip-art vintage navy suitcase, floating alone in the CENTER of a transparent canvas with LARGE empty transparent margins on ALL FOUR SIDES. The suitcase occupies only 70% of the canvas width. Wide rectangular trunk with gently rounded corners, straight orthographic FRONT view. Navy #1F3460 flat front panel, thin ink #22201D outline, brown #6B4A2B corner pads and small top carrying handle, two small mustard gold #C2A464 latches at top edge, tiny gold rivets around edge. The center is a very large completely empty NAVY RECTANGLE to attach stickers, occupying 80% of trunk front. ONE suitcase only. Outside the silhouette is fully transparent, including the hole under the handle. NO brown or colored rectangular background, NO scene, NO backdrop, NO glow, NO shadow, NO gradients, NO shine, NO perspective, NO floor. Flat illustration rather than product render. No text, no logo, no label, no white sticker border. Entire item fits with lots of empty space. Landscape 3:2 composition.
```

### backpack.webp — 캔버스 백팩

```text
Use case: stylized-concept. ONE canvas backpack, absolutely straight FRONT view, tall portrait canvas final 1600x2000. Transparent background. Ivory #EFE6D2 canvas body, navy #1F3460 shoulder straps visible subtly behind at sides and narrow navy edge binding, one plain burgundy #6E1A2F leather patch low near bottom. Large wide flat EMPTY UPPER TWO THIRDS OF FRONT for seven pin badges; no pocket, flap, zipper, straps or seam across upper front. Slightly rounded top and full simple shape. Complete backpack inside canvas with small clear margins. Premium travel-journal illustration with thin ink #22201D outlines, flat colors, extremely subtle canvas grain. No text, logo, pins, extra decorations, shadows, gradient, glow, shine, 3D, or white sticker border.
```

### mascot/idle.webp — 립이 · 인사

```text
Use case: stylized-concept. One pose of an original book traveler mascot: a small traveler whose BODY IS A BURGUNDY #6E1A2F CLOSED HARDCOVER BOOK, with visible paper #F6F3EC page edges, two black dot eyes and tiny muted rose blush on book cover, short plump navy arms and legs, mustard gold #C2A464 bookmark ribbon hanging like a tail, small navy #1F3460 backpack. Two open paper pages flutter behind like a short cape. Warm charming but sophisticated, thin consistent #22201D outlines, flat palette only, very subtle grain. Square 800x800 composition, character centered with 10% margins, same proportions across poses. Transparent background. No text, letters, logos, shadows, gradients, glow, 3D or shine. POSE: standing and waving one hand
```

### mascot/stamp.webp — 립이 · 도장

```text
Use case: stylized-concept. One pose of an original book traveler mascot: a small traveler whose BODY IS A BURGUNDY #6E1A2F CLOSED HARDCOVER BOOK, with visible paper #F6F3EC page edges, two black dot eyes and tiny muted rose blush on book cover, short plump navy arms and legs, mustard gold #C2A464 bookmark ribbon hanging like a tail, small navy #1F3460 backpack. Two open paper pages flutter behind like a short cape. Warm charming but sophisticated, thin consistent #22201D outlines, flat palette only, very subtle grain. Square 800x800 composition, character centered with 10% margins, same proportions across poses. Transparent background. No text, letters, logos, shadows, gradients, glow, 3D or shine. POSE: holding one large stamp with both hands and pressing it downward, a plain blank stamp base, no printed symbols Use the attached image as the strict character design reference: match the same burgundy book proportions, gold book-cover frame, page cape, dot eyes, navy backpack and limbs. Change only the pose and necessary prop. Do not add lettering.
```

### mascot/postcard.webp — 립이 · 엽서

```text
Use case: stylized-concept. One pose of an original book traveler mascot: a small traveler whose BODY IS A BURGUNDY #6E1A2F CLOSED HARDCOVER BOOK, with visible paper #F6F3EC page edges, two black dot eyes and tiny muted rose blush on book cover, short plump navy arms and legs, mustard gold #C2A464 bookmark ribbon hanging like a tail, small navy #1F3460 backpack. Two open paper pages flutter behind like a short cape. Warm charming but sophisticated, thin consistent #22201D outlines, flat palette only, very subtle grain. Square 800x800 composition, character centered with 10% margins, same proportions across poses. Transparent background. No text, letters, logos, shadows, gradients, glow, 3D or shine. POSE: holding a blank postcard with both hands and reading it Use the attached image as the strict character design reference: match the same burgundy book proportions, gold book-cover frame, page cape, dot eyes, navy backpack and limbs. Change only the pose and necessary prop. Do not add lettering.
```

### mascot/cheer.webp — 립이 · 축하

```text
Use case: stylized-concept. One pose of an original book traveler mascot: a small traveler whose BODY IS A BURGUNDY #6E1A2F CLOSED HARDCOVER BOOK, with visible paper #F6F3EC page edges, two black dot eyes and tiny muted rose blush on book cover, short plump navy arms and legs, mustard gold #C2A464 bookmark ribbon hanging like a tail, small navy #1F3460 backpack. Two open paper pages flutter behind like a short cape. Warm charming but sophisticated, thin consistent #22201D outlines, flat palette only, very subtle grain. Square 800x800 composition, character centered with 10% margins, same proportions across poses. Transparent background. No text, letters, logos, shadows, gradients, glow, 3D or shine. POSE: jumping joyfully with both arms raised Use the attached image as the strict character design reference: match the same burgundy book proportions, gold book-cover frame, page cape, dot eyes, navy backpack and limbs. Change only the pose and necessary prop. Do not add lettering.
```
