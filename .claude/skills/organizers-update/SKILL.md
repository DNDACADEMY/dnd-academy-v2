---
name: organizers-update
description: 신규 운영진을 `organizers.json`에 등록할 때 사용합니다. 사용자가 "운영진 추가", "operators/organizers 업데이트", "이번 기수 운영진 등록", "운영진 폼 응답 넣어줘" 같은 말을 하거나 운영진 정보가 담긴 CSV/TSV 파일 경로를 주면 반드시 이 스킬을 사용하세요. 직군 매핑 규칙과 ID 자동 채번 때문에 직접 JSON을 수정하면 데이터 깨질 가능성이 높습니다.
---

# Organizers Update

운영진 폼(구글 폼) 응답으로부터 `organizers.json`에 신규 운영진을 추가합니다.

## 수정 대상 파일

`apps/web/src/lib/assets/data/organizers.json`

## 데이터 구조

타입 정의: `packages/core/src/@types/organizer.ts`

```ts
interface Organizer {
  id: number;
  name: string;
  thumbnail?: string;
  author: string;
  dndPosition: '개발' | '디자인' | '마케팅' | '운영' | '마스코트';
  technicalStack: string[];
  oneLineIntroduction: string;
  links: Partial<Record<LogoType, string>>;
  career: {
    now: string[];
    previous: string[];
  };
  mbti: string;
  questions: {
    whatIsYourRoleInDnd: string;
    whyDoYouRecommendDnd: string;
    whatIsYourInterests: string;
    whatYouWantToShare: string[];
  };
  isArchived: boolean;
  emoji?: string;
}
```

## 입력

1. **CSV/TSV 파일 경로** (필수) — 운영진용 구글 폼 export
2. 필요시 추가 정보(없는 필드)는 사용자에게 보조 질문

### CSV/TSV 컬럼

```
타임스탬프 | 이메일 주소 | 성함 | 연락처 | 이메일 | 경력 (지금까지의 경력을 모두 작성해주세요) |
현재 직무 | 현재 하고있는 운영진 포지션을 선택해주세요 | 나를 소개하는 한 줄 |
지원자들에게 DND를 왜 추천하나요? | OOO님이 관심있고, 행복해하는 것은? |
프로필상 추가하고자 하는 연관 링크를 넣어주세요 | MBTI |
DND에서 어떤 업무를 맡고 있으신가요? | 사용하는 기술 스택, 역할등을 남겨주세요
```

폼 항목 명칭은 기수마다 조금씩 다를 수 있으니 헤더를 한 번 확인하고 매핑을 정리한 뒤 진행하세요.

## 작업 순서

### 1단계: 파일 읽고 분석

1. CSV/TSV 읽기 (구분자 자동 판별).
2. 같은 사람이 여러 행으로 들어왔으면(폼 재제출) **타임스탬프 최신 행만** 사용.
3. `organizers.json` 읽고 최대 `id` 확인 → 신규 ID는 `maxId + 1`부터.
4. 이미 등록된 운영진(이름 + 이메일 기준)인지 확인 — 같은 사람이 이미 있으면 사용자에게 알리고 update할지 skip할지 묻기.

### 2단계: dndPosition 매핑 (가장 자주 틀리는 지점)

CSV의 "운영진 포지션"은 자유 입력에 가까워서 다양한 표현이 옵니다. 정식 5개 값으로 매핑:

| CSV 입력 예시 | dndPosition |
|---|---|
| "개발", "Developer", "백엔드", "프론트엔드", "iOS", "Android" | `개발` |
| "디자인", "디자인(브랜드, 프로덕트[ui/ux])", "디자이너", "UX/UI" | `디자인` |
| "마케팅", "Marketing", "PR" | `마케팅` |
| "운영", "교육PM", "PM", "Operations", "Operation" | `운영` |
| "마스코트" | `마스코트` |

규칙:
- 괄호 안 부연 설명은 무시하고 큰 카테고리만 추출 (예: "디자인(브랜드, 프로덕트[ui/ux])" → `디자인`).
- "교육PM" / "PM" 류는 `운영`으로 매핑.
- 매핑 자신 없으면 사용자에게 확인 ("이 사람 포지션은 5개 중 뭘로 할까요?").

### 3단계: 필드 매핑

| Organizer 필드 | CSV / 규칙 |
|---|---|
| `id` | maxId + 1부터 순차 |
| `name` | "성함" |
| `thumbnail` | **항상 `"{주소 입력 필요}"` 문자열** (실제 이미지는 운영진이 별도로 S3 업로드 후 직접 갱신) |
| `author` | 별도 input 필요 — 보통 영문 표기 (예: "HyeonseokLee", "Gidong"). 사용자에게 영문 표기를 어떻게 할지 물어보세요. 기본 추천: 이름의 로마자 표기. |
| `dndPosition` | 2단계에서 매핑한 값 |
| `technicalStack` | "사용하는 기술 스택, 역할등" 파싱 (아래) |
| `oneLineIntroduction` | "나를 소개하는 한 줄" |
| `links` | "프로필상 추가하고자 하는 연관 링크" 파싱 (아래) |
| `career.now` | "경력" 또는 "현재 직무"에서 현재 진행중인 항목 추출. 줄바꿈으로 분리. |
| `career.previous` | "경력"에서 과거 항목 추출. 비어있으면 `[]`. |
| `mbti` | "MBTI" (4자 대문자로 정규화, 예: "intp" → "INTP") |
| `questions.whatIsYourRoleInDnd` | "DND에서 어떤 업무를 맡고 있으신가요?" |
| `questions.whyDoYouRecommendDnd` | "지원자들에게 DND를 왜 추천하나요?" |
| `questions.whatIsYourInterests` | "OOO님이 관심있고, 행복해하는 것은?" |
| `questions.whatYouWantToShare` | 보통 빈 배열 `[]` — 이미지 URL 모음이라 폼에는 없음. 사용자가 별도로 주면 그때 추가. |
| `isArchived` | 새로 추가하는 운영진은 **`false`** (현역). |
| `emoji` | 폼에 없음. 사용자가 명시할 때만 추가. 보통 생략. |

### 4단계: technicalStack 파싱

자유 형식 입력. 운영진은 "역할 + 기술" 혼합 응답이 많습니다 (예: "백엔드 개발자, AWS, Spring Boot, PostgreSQL"). 다음 규칙으로:

1. 줄바꿈/콤마/세미콜론으로 split.
2. 직무 라벨(예: "백엔드 개발자")은 빼고 순수 기술 스택만 추출 — 단, 디자이너의 경우 도구명(Figma, Adobe 등) 포함.
3. 마케팅/운영은 비어있을 수 있음 → 빈 배열 `[]` 가능.
4. 애매한 항목은 사용자 확인.

### 5단계: links 파싱

"프로필상 추가하고자 하는 연관 링크" 컬럼. `reviews-update`와 동일한 매핑 규칙을 따릅니다:

| 키워드 / 도메인 | LogoType |
|---|---|
| github.com, "깃헙" | `github` |
| linkedin.com | `linkedin` |
| velog.io, "벨로그" | `velog` |
| medium.com, "미디엄" | `medium` |
| brunch.co.kr | `brunch` |
| tistory.com | `tistory` |
| blog.naver.com | `naverBlog` |
| instagram, "인스타" | `instagram` |
| facebook | `facebook` |
| rocketpunch | `rocketpunch` |
| 그 외 단독 URL | `link` |

사용자가 "없음", "따로 없습니다" 등 명시적으로 거부했다면 `links: {}`로 두기.

### 6단계: organizers.json 저장

1. 기존 배열에 신규 운영진 push.
2. 들여쓰기 2칸, 파일 끝 개행 유지.
3. JSON 유효성 확인.

### 7단계: 보고

```
✅ organizers.json 업데이트 완료

추가된 운영진: N명

[id: 25] 이여진 (author: ?, position: 운영)
  - thumbnail: "{주소 입력 필요}"  ← S3 업로드 후 직접 수정 필요
  - technicalStack: 비어있음
  - links: linkedin

[id: 26] 강민석 (author: ?, position: 개발)
  - thumbnail: "{주소 입력 필요}"
  - technicalStack: ...
  - links: github

⚠️ 후속 작업 안내:
- 각 운영진의 프로필 사진을 S3에 업로드한 뒤 thumbnail 필드를 실제 URL로 교체해주세요.
- author 필드가 비어있는 경우 직접 추가해주세요.
```

## 주의사항

- **기존 데이터 절대 수정 금지** — 동일 인물 갱신은 사용자가 명시한 경우에만.
- **thumbnail은 반드시 `"{주소 입력 필요}"` 문자열로 둡니다.** 임의로 URL 추정하지 마세요.
- `isArchived: false`로 시작 (현역 운영진). 활동 종료된 운영진을 추가하는 게 아니라면.
- `author`는 폼에 없는 경우가 많아 사용자에게 한 번 물어보거나 임시로 비워두고 후속 안내.
- 폼 응답 헤더가 기수마다 미묘하게 다르니, 매핑 전에 실제 헤더를 사용자에게 보여주고 한 번 확인받으면 안전합니다.
- MBTI는 소문자/공백 있어도 모두 4자 대문자로 정규화.
