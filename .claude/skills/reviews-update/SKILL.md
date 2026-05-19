---
name: reviews-update
description: DND 기수 종료 후 참여자들의 개인 후기를 `reviews.json`에 등록할 때 사용합니다. 사용자가 "리뷰 추가", "이번 기수 후기 등록", "reviews.json 업데이트", "참여자 후기 넣어줘" 같은 말을 하거나 후기가 담긴 CSV/TSV 파일 경로를 주면 반드시 이 스킬을 사용하세요. 기수마다 한 번씩 돌아가는 운영 작업이고, projects-update와 짝으로 진행되는 경우가 많습니다.
---

# Reviews Update

기수 종료 시 운영진이 모은 CSV/TSV에서 참여자 후기들을 `reviews.json`에 추가합니다.

## 수정 대상 파일

`apps/web/src/lib/assets/data/reviews.json`

## 데이터 구조

타입 정의: `packages/core/src/@types/review.ts`

```ts
interface Review {
  id: number;
  flag: string;        // "14기"
  email: string;
  name: string;
  position: ReviewPosition;
  links: Partial<Record<LogoType, string>>;  // github, velog, linkedin, medium, link 등
  project: string;     // 프로젝트 이름 (없으면 빈 문자열)
  projectId: number | null;  // projects.json의 id (못 찾으면 null)
  review: string;
}

type ReviewPosition =
  | '백엔드 개발자'
  | '프론트엔드 개발자'
  | '프로덕트 디자이너'
  | 'Android Developer'
  | 'iOS Developer';
```

## 입력

1. **CSV/TSV 파일 경로** (필수)
2. **기수 번호** (CSV에 없으면 별도로 확인)

### CSV/TSV 컬럼

`projects-update`와 동일한 파일 형식을 공유합니다. 리뷰 등록에 쓰는 컬럼은:

```
기수 | 조 | 이름 | 직군 | 개인 후기 | DND 활동 후기 | 이메일 | 링크 | 이메일 주소 | 프로젝트명/프로젝트 명
```

- 모든 행이 1명의 참여자 — 프로젝트 등록 안 한 조도 후기는 등록.
- 같은 사람이 여러 행에 있으면(예: 폼 재제출) **타임스탬프가 가장 최신인 행**만 사용.

## 작업 순서

### 1단계: 파일 읽고 분석

1. CSV/TSV 읽기 (구분자 자동 판별 — 탭 vs 쉼표).
2. 기수 번호 확인 후 통일된 `flag`("14기") 결정.
3. 중복 응답자 처리: 이메일 또는 이름+기수 기준으로 중복이면 타임스탬프 최신만.
4. `reviews.json` 읽고 최대 `id` 확인 → 신규 ID는 `maxId + 1`부터.
5. `projects.json` 읽어두기 — 프로젝트 이름 → id 매핑용.

### 2단계: position 매핑

CSV "직군" 컬럼은 자유 입력이라 `ReviewPosition` 정식 값으로 매핑 필요:

| CSV 입력 예시 | 매핑 결과 |
|---|---|
| "백엔드", "백엔드 개발자", "BE", "서버" | `백엔드 개발자` |
| "프론트", "프론트엔드", "FE", "프론트엔드 개발자" | `프론트엔드 개발자` |
| "디자이너", "프로덕트 디자이너", "UX/UI", "디자인" | `프로덕트 디자이너` |
| "iOS", "iOS 개발자", "iOS Developer" | `iOS Developer` |
| "안드로이드", "Android", "Android Developer" | `Android Developer` |

애매하면(예: "기획자") 사용자에게 어디로 매핑할지 묻기. 새로운 직군이 등장했다면 타입 자체를 확장해야 하니 사용자에게 보고하세요.

### 3단계: projectId 매핑

각 후기에 대해:

1. CSV의 "프로젝트명" 또는 "프로젝트 명" 값과 `projects.json`의 `name`을 비교.
2. 정확히 매칭되는 게 있으면 `projectId = <그 id>`.
3. 없으면 `projectId = null`. 이름이 비슷한데 다르면 사용자에게 보여주고 매핑 확인.
4. `projects-update`로 방금 추가된 프로젝트들도 반드시 포함되도록 — projects.json을 최신 상태로 읽으세요.

### 4단계: review 본문 선택

- 우선순위: "개인 후기" → 비어있으면 "DND 활동 후기".
- 둘 다 있으면 "개인 후기" 사용 (홈페이지 노출용으로 작성된 것).
- 둘 다 비어있으면 사용자에게 알리고 해당 행을 스킵할지 확인.

### 5단계: links 파싱

"링크" 컬럼은 자유 형식이라 다양한 패턴이 옵니다:

```
깃헙 - https://github.com/...
GitHub: https://github.com/...
링크드인 - https://linkedin.com/...
velog - https://velog.io/@...
https://medium.com/@...   (단독 URL)
```

키워드 → LogoType 매핑:

| 키워드 / 도메인 | LogoType |
|---|---|
| "깃헙", "github", github.com | `github` |
| "링크드인", "linkedin", linkedin.com | `linkedin` |
| "벨로그", "velog", velog.io | `velog` |
| "미디엄", "medium", medium.com | `medium` |
| "브런치", "brunch", brunch.co.kr | `brunch` |
| "티스토리", "tistory", tistory.com | `tistory` |
| "네이버 블로그", "naver blog", blog.naver.com | `naverBlog` |
| "인스타", "instagram" | `instagram` |
| "페이스북", "facebook" | `facebook` |
| "로켓펀치", "rocketpunch" | `rocketpunch` |
| 단독 URL, 위 어디에도 안 맞음 | `link` |

분류 불가하면 사용자 확인. 빈 값이면 해당 키 자체를 추가하지 마세요(또는 빈 문자열로 둘지 — 기존 데이터 컨벤션 보고 결정. 기존에 빈 문자열이 많으면 빈 문자열 유지).

### 6단계: reviews.json 저장

1. 기존 배열에 신규 리뷰 push.
2. 들여쓰기 2칸 유지.
3. JSON 유효성 확인.

### 7단계: 보고

```
✅ reviews.json 업데이트 완료

기수: 14기
추가된 리뷰: N개
projectId 매핑됨: M개
projectId가 null인 리뷰: K개   (← 0이 아니면 어떤 사람인지 명시)

직군 분포:
- 백엔드 개발자: a명
- 프론트엔드 개발자: b명
- 프로덕트 디자이너: c명
- iOS Developer: d명
- Android Developer: e명

projectId null 리뷰 (확인 필요):
- 김OO ("프로젝트XXX" → 매칭 안됨)
- ...
```

## 주의사항

- **기존 데이터 절대 수정 금지** — 신규 항목만 append.
- **ID 중복 금지** — 기존 max + 1부터 연속.
- 같은 폼을 두 번 제출한 사람이 자주 있으니 타임스탬프 최신 기준으로 dedupe.
- `projectId`는 매핑이 확실할 때만 채우고, 애매하면 null + 사용자 보고.
- `position`이 정의된 5개 값 중 어디에도 안 맞는 새 직군이 나타나면, 임의로 매핑하지 말고 사용자에게 보고 — 필요하면 `review.ts`의 타입을 같이 확장해야 합니다.
- 이번 작업은 보통 `projects-update`가 먼저 끝난 뒤 실행됩니다. 순서가 반대면 `projectId`가 다 null이 되어버립니다.
