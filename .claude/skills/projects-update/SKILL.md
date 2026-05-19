---
name: projects-update
description: DND 기수 종료 후 신규 프로젝트들을 `projects.json`에 등록할 때 사용합니다. 사용자가 "프로젝트 등록", "이번 기수 프로젝트 추가", "projects.json 업데이트", "14기 프로젝트 넣어줘" 같은 말을 하거나 프로젝트 데이터가 담긴 CSV/TSV 파일 경로를 주면 반드시 이 스킬을 사용하세요. 기수마다 한 번씩 돌아가는 운영 작업이고, 직접 JSON을 손대면 ID 충돌이나 S3 경로 오타가 자주 발생하니 반드시 이 스킬을 거치세요.
---

# Projects Update

기수 종료 시 운영진이 모은 CSV/TSV에서 신규 프로젝트들을 `projects.json`에 추가합니다.

## 수정 대상 파일

`apps/web/src/lib/assets/data/projects.json`

## 데이터 구조

타입 정의: `packages/core/src/@types/project.ts`

```ts
interface Project {
  id: number;
  name: string;
  title: string;       // 한 줄 소개
  desc: string;        // 장문형 소개
  images?: string[];   // S3 경로 배열
  flag: string;        // "14기" 형식
  skill: string[];
  thumbnail: string;   // images[0]
  pdf: string | null;
  projectLinks: {
    github?: string[];
    appStore?: string;
    googlePlayStore?: string;
    youtube?: string;
    link?: string;
    figma?: string;
  };
}
```

## 입력

사용자에게 받을 정보:
1. **CSV/TSV 파일 경로** (필수) — 구글 폼/시트에서 export한 데이터
2. **기수 번호** (CSV에 없거나 애매하면 별도로 확인) — 예: 14

### CSV/TSV 컬럼 (탭 또는 쉼표 구분)

```
타임스탬프 | 프로젝트명 | 프로젝트 배너 파일 | 프로젝트 소개 파일(PDF) | 프로젝트 명 |
프로젝트 한 줄 소개 문구 | 프로젝트 장문형 소개 문구 | 프로젝트에서 사용한 기술 스택 |
프로젝트 관련 링크 | 개인 후기 | 기수 | 조 | 이름 | 직군 | DND 활동 후기 |
이메일 | 링크 | 이메일 주소
```

- 같은 프로젝트의 팀원이 여러 행으로 존재할 수 있습니다 → 프로젝트 단위로 그룹핑.
- 프로젝트 정보(배너/PDF/소개)는 보통 첫 번째 팀원 행에만 있거나 일부 행에만 채워져 있습니다.
- 일부 조는 프로젝트를 등록 안 할 수도 있습니다 → "프로젝트명" 또는 "프로젝트 명"이 빈 행은 프로젝트로 간주하지 마세요.

## 작업 순서

### 1단계: 파일 읽고 사전 분석

1. CSV/TSV 파일을 `Read`로 읽기 (한 번에 다 못 읽으면 chunk로).
2. 구분자 자동 판별 — 첫 줄에 탭이 많으면 TSV, 쉼표가 많으면 CSV.
3. 기수 번호 확인 — "기수" 컬럼에서 추출 (예: "14기" → 14). 행마다 다르면 사용자에게 알리고 통일된 값 요청.
4. 프로젝트명으로 그룹핑하면서 동시에 유사 이름 통일 검사:
   - 한글/영문 혼용 (예: "모각" / "Mocak") — 사용자에게 "이 둘은 같은 프로젝트인가요?" 확인.
   - 오타 의심 (편집거리 1~2) — 같은 조 번호면 같은 프로젝트일 가능성 높음.
   - 통일 결정 후 정식 표기 1개로 picks.
5. **`projects.json` 읽고 최대 ID 확인** → 신규 ID는 `maxId + 1`부터 순차 할당.

### 2단계: S3 경로 자동 생성

각 프로젝트의 images / pdf 경로를 미리 생성합니다. 실제 업로드는 운영진이 별도로 진행하지만 경로는 JSON에 들어가야 합니다.

```
images: https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/project/{기수}/{조}/{인덱스}.png
pdf:    https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/files/project/{기수}/{조}/{인덱스}.pdf
```

- `{인덱스}`는 이미지마다 1, 2, 3...
- 구글 드라이브 링크에서 정확한 이미지 개수를 알 수 없으면 기본 5장으로 가정하고 사용자에게 알려주세요 ("기본 5장으로 잡았는데 다르면 알려주세요").
- PDF가 없으면 `pdf: null`.
- `thumbnail`은 항상 `images[0]`.

### 3단계: 필드 매핑

각 프로젝트마다:

| Project 필드 | CSV 컬럼 / 규칙 |
|---|---|
| `id` | maxId + 1부터 순차 |
| `name` | "프로젝트 명" 또는 "프로젝트명" 중 채워진 값 |
| `title` | "프로젝트 한 줄 소개 문구" |
| `desc` | "프로젝트 장문형 소개 문구" |
| `flag` | "14기" 같은 형식 |
| `images` | 2단계에서 만든 S3 배열 |
| `thumbnail` | `images[0]` |
| `pdf` | 2단계 S3 경로 or null |
| `skill` | "프로젝트에서 사용한 기술 스택" 파싱 (아래 참고) |
| `projectLinks.github` | 같은 프로젝트 모든 팀원의 GitHub 링크 수집 (중복 제거) |
| `projectLinks.{others}` | "프로젝트 관련 링크"에서 파싱 |

### 4단계: 기술 스택 파싱

여러 형식이 들어오니 유연하게 처리:

**단일 줄 (쉼표 구분)**
```
React, Spring Boot, Figma
→ ["React", "Spring Boot", "Figma"]
```

**여러 줄 + 카테고리 라벨**
```
디자인: Figma, Midjourney, UXUI
iOS: UIKit, SnapKit, Alamofire
Back-end: Spring Boot, PostgreSQL, AWS
```
→ 카테고리 라벨(`디자인:`, `iOS:`, `Back-end:` 등) 제거 후 모든 기술을 하나의 평탄 배열로:
```
["Figma", "Midjourney", "UXUI", "UIKit", "SnapKit", "Alamofire", "Spring Boot", "PostgreSQL", "AWS"]
```

**파싱 순서**: 개행으로 split → 각 줄에서 `:` 뒤만 추출(있을 때) → `,` split → trim → 빈 문자열 제거 → 평탄화.

### 5단계: 프로젝트 링크 파싱

"프로젝트 관련 링크" 컬럼은 자유 형식이라 다음 키워드로 분류:

- `appStore` ← "App Store", "앱스토어", apps.apple.com URL
- `googlePlayStore` ← "Play Store", "구글플레이", play.google.com URL
- `youtube` ← youtube.com / youtu.be URL
- `figma` ← figma.com URL
- `github` ← github.com URL (배열, "링크" 컬럼에서도 모든 팀원 것 수집해 합치기, 중복 제거)
- `link` ← 위 어디에도 안 맞는 단독 URL

분류 불가하면 사용자에게 보여주고 결정 받으세요.

### 6단계: projects.json 저장

1. 기존 배열에 신규 프로젝트들을 push (기존 항목 절대 수정 금지).
2. 들여쓰기 2칸, 끝에 개행 1줄 유지.
3. JSON 유효성 확인 (저장 후 `node -e "JSON.parse(require('fs').readFileSync('...'))"` 또는 동등한 방법으로 검증).

### 7단계: 보고

다음 형식으로 한 번에 보고:

```
✅ projects.json 업데이트 완료

기수: 14기
추가된 프로젝트: N개

[1조] 프로젝트A (id: 152)
  - thumbnail: <S3 경로>
  - images: 5장
  - pdf: <S3 경로 or "없음">
  - skill: React, ...

[2조] 프로젝트B (id: 153)
  ...

📦 S3 업로드 필요한 경로:
- /images/project/14/1/1.png ... /5.png
- /files/project/14/1/2.pdf
- ...

원본 구글드라이브 링크 (다운로드용):
- 프로젝트A 이미지: <drive URL>
- 프로젝트A PDF: <drive URL>
...
```

이 보고가 끝나면 사용자가 S3 업로드를 할 수 있어야 합니다.

## 주의사항

- **기존 데이터 절대 수정 금지** — 신규 항목만 append.
- **ID 중복 절대 금지** — 반드시 기존 max + 1부터.
- `flag`는 항상 `"14기"` 형식 (숫자 + "기"). 입력이 "14"만 들어오면 "14기"로 변환.
- 한 프로젝트에 여러 팀원이 있어도 프로젝트 행은 1개. (리뷰는 `reviews-update`에서 처리)
- 유사 이름 통일은 추정만 하지 말고 항상 사용자 확인 받으세요. "이거 같은 프로젝트?" 한 줄이면 충분합니다.
- 조 번호를 모르면(`조` 컬럼이 비었으면) 사용자에게 묻기. S3 경로 만들 때 반드시 필요합니다.
- 이번 작업은 reviews-update와 짝으로 진행되는 경우가 많습니다 — 작업 끝나고 "이제 reviews-update로 리뷰도 추가하시겠어요?" 안내.
