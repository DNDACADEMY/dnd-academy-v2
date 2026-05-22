---
name: sponsors-update
description: DND 홈페이지 후원사 섹션(`SponsorSection/index.tsx`)에 후원사를 추가/제거/수정할 때 사용합니다. 사용자가 "후원사 추가", "후원사 등록", "후원사 빼줘", "후원사 제거", "후원사 업데이트", "후원사 로고 교체", "SponsorSection 수정", "스폰서 추가/삭제" 같은 말을 하거나 후원사 이름/URL/로고 파일을 주면 반드시 이 스킬을 사용하세요. 후원사 데이터가 JSON이 아니라 TSX 배열에 인라인으로 들어있고 로고 PNG 파일을 별도 폴더에 두는 이원 구조라, 직접 손대면 배열에는 추가했는데 로고는 빠지거나(404 발생) 반대로 로고만 남고 노출이 안 되는 사고가 자주 납니다.
---

# Sponsors Update

DND 홈페이지 하단 "후원사" 섹션에 노출되는 후원사 목록과 로고 파일을 함께 관리합니다.

## 수정 대상

후원사는 **두 곳**을 함께 손대야 합니다. 한쪽만 바뀌면 화면이 깨집니다.

1. **배열 정의** — `apps/web/src/components/organisms/SponsorSection/index.tsx`
   - 컴포넌트 내부 `const sponsors = [...]` 배열에 항목이 인라인으로 들어있음.
2. **로고 이미지** — `apps/web/public/assets/logos/sponsors/`
   - 각 항목의 `image` 필드는 이 폴더 안의 파일명을 가리킴.
   - Next `Image` 컴포넌트가 `/assets/logos/sponsors/<image>` 경로로 자동 매핑.

## 데이터 구조

```ts
type Sponsor = {
  sponsor: string; // kebab-case slug, 영문/숫자/하이픈만
  url: string; // 후원사 사이트. 링크 없으면 '#'
  image: string; // 파일명 (확장자 포함). 보통 `${sponsor}.png`
};
```

현재 등록 예시:

```ts
{ sponsor: 'wanted', url: 'https://www.wanted.co.kr', image: 'wanted.png' },
{ sponsor: 'witi',   url: '#',                         image: 'witi.png' },
```

## 지원 작업

후원사 작업은 크게 세 가지입니다. 사용자 의도를 먼저 분류한 뒤 해당 절차를 따르세요.

- **추가** — 신규 후원사 등록
- **제거** — 기존 후원사 빼기
- **수정** — URL이나 로고 교체

## 1. 추가 (Add)

### 필요한 입력값 (사용자에게 요청)

사용자가 후원사 추가를 요청했고 정보가 부족하면, 다음 3가지를 한 번에 묶어 질문하세요:

1. **후원사 식별자(slug)** — 영문 kebab-case. (예: `wanted`, `naver-d2`, `f-lab`)
   - 사용자가 한글 회사명만 줬다면 추천안 제시 후 확인. (예: "원티드" → `wanted`)
   - 기존 항목과 중복 금지.
2. **후원사 URL** — `https://...` 풀 URL. 링크가 없으면 명시적으로 `#`로 둘 거라고 안내.
3. **로고 파일 경로** — 로컬 경로 (예: `~/Downloads/wanted.png`).
   - 파일이 이미 `apps/web/public/assets/logos/sponsors/` 안에 있다면 그 파일명만 알려달라고 해도 됨.
   - 확장자는 png 권장 (기존이 전부 png). svg/jpg가 와도 일단 받되, png로 변환 가능한지 사용자에게 한 번 확인.

질문 예시:

```
후원사 추가를 위해 다음 정보가 필요합니다:
1. 후원사 식별자(영문 slug) — 예: 'wanted', 'naver-d2'
2. 후원사 사이트 URL — 링크가 없으면 '#'로 처리
3. 로고 파일 경로 — png 권장
```

### 작업 순서

1. `SponsorSection/index.tsx` 읽어 현재 sponsors 배열 파악, slug 중복 여부 확인.
2. 로고 파일 처리:
   - 로컬 경로를 받은 경우 → `apps/web/public/assets/logos/sponsors/<slug>.png`로 복사. 원본 파일명이 다르면 slug 기준으로 리네임.
   - 이미 폴더에 있는 파일명을 받은 경우 → 그대로 사용.
   - 복사 후 파일 존재 확인 (`ls` 등).
3. `sponsors` 배열 끝에 새 항목 추가:
   ```ts
   { sponsor: '<slug>', url: '<url>', image: '<filename>' },
   ```
   기존 항목 순서는 건드리지 마세요 (의도된 노출 순서일 수 있음).
4. 배열 항목 수가 3의 배수가 아니어도 OK — CSS grid가 자동 정렬.
5. 보고 (아래 형식).

## 2. 제거 (Remove)

### 작업 순서

1. 사용자가 지칭한 후원사 slug 확정.
   - 모호하면 현재 배열을 보여주고 어떤 항목인지 확인.
2. `sponsors` 배열에서 해당 줄만 제거. **나머지 항목 줄 위치/포맷은 그대로 둡니다.**
3. 로고 파일 처리는 사용자 선택:
   - 기본: 파일은 그대로 두기 (히스토리 보존, 재등록 가능성).
   - 사용자가 "파일도 같이 지워줘"라고 명시한 경우에만 `public/assets/logos/sponsors/<filename>` 삭제.
4. 보고.

## 3. 수정 (Update)

URL 변경, 로고 교체 등.

- **URL만 변경**: 해당 항목의 `url` 필드만 수정.
- **로고만 교체**: 같은 파일명으로 덮어쓰기. 파일명이 바뀌면 배열의 `image`도 같이 갱신 (이전 파일은 사용자 확인 후 정리).
- **slug 변경**: 슬러그는 식별자라 가급적 바꾸지 않음. 꼭 필요하면 배열 + 로고 파일명을 동시에 바꿔야 한다는 점을 사용자에게 환기시킨 뒤 진행.

## 작업 후 보고 형식

```
✅ SponsorSection 업데이트 완료

[추가] N개
  - wanted (https://www.wanted.co.kr, image: wanted.png)
  - ...

[제거] N개
  - zighang

[수정] N개
  - elice: url 변경 (https://eliceold.io → https://elice.io/ko)

수정 파일:
  - apps/web/src/components/organisms/SponsorSection/index.tsx
  - apps/web/public/assets/logos/sponsors/<...>  (추가/제거된 파일이 있는 경우만)
```

## 주의사항

- **배열 + 로고 폴더는 항상 짝**입니다. 한쪽만 바꾸지 마세요.
  - 추가 후에는 `ls apps/web/public/assets/logos/sponsors/`로 새 파일이 존재하는지 반드시 확인.
- **slug는 영문 kebab-case**로 통일 (`naver-d2`, `easys-publishing`, `f-lab`처럼 하이픈 사용). 한글/공백/대문자 금지.
- **링크 없는 후원사**는 `url: '#'`로 둡니다 (예: 현재 `witi`). 가짜 URL을 임의로 만들어 넣지 마세요.
- **기존 항목 순서는 의미가 있을 수 있음** — 정렬 요청이 없으면 새 항목은 배열 끝에 append.
- 로고 이미지는 png가 표준. svg/jpg를 그대로 넣어야 하는 상황이면 사용자에게 한 번 더 확인.
- 이 컴포넌트는 동시에 하단 "후원 문의하기" Notion 링크도 갖고 있는데, 그 링크는 후원사 데이터와 무관하니 손대지 마세요.
