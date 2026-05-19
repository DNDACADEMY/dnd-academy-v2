---
name: recruitment-open
description: DND 신규 기수 모집을 오픈할 때 지원 폼 URL, 응답시트 ID, CURRENT_FLAG를 한꺼번에 업데이트합니다. 사용자가 "지원 폼 업데이트", "지원 링크 바꿔", "구글폼 새로 만들었어", "응답시트 ID 바꿔줘", "CURRENT_FLAG 올려", "15기 폼 연결", "다음 기수 모집 준비" 같은 말을 하거나 새 기수 구글폼/응답시트 정보를 주면 반드시 이 스킬을 사용하세요. constants/index.ts와 generate-applicant-count.ts 두 파일을 동시에 손대야 해서 직접 수정하면 한쪽만 바뀌어 지원자 수 집계가 깨질 가능성이 높습니다.
---

# Recruitment Open

신규 기수 모집을 오픈할 때 홈페이지의 지원 진입점 3종(현재 기수 번호, 지원 폼 URL, 응답시트 ID)을 묶어서 갱신합니다.

이 스킬은 보통 `event-status-update`(status를 `ONGOING`으로 전환) **직전**에 호출됩니다. 폼/시트 연결이 아직 안 된 상태에서 status만 ONGOING으로 바꾸면 홈페이지 "지원하기" 버튼이 이전 기수 폼으로 가버리니까 순서가 중요합니다.

## 수정 대상 파일

| 파일 | 항목 |
|---|---|
| `apps/web/src/lib/constants/index.ts` | `CURRENT_FLAG`, `DEVELOPER_APPLICATION_LINK`, `DESIGNER_APPLICATION_LINK` |
| `apps/web/scripts/generate-applicant-count.ts` | 개발자 `GoogleSpreadsheet` ID, 디자이너 `GoogleSpreadsheet` ID |

## 데이터 흐름 (왜 한 쌍으로 묶이는가)

- `DEVELOPER/DESIGNER_APPLICATION_LINK`: 홈페이지 "지원하기" 버튼이 가리키는 **구글폼 URL** (`https://forms.gle/...`)
- 응답시트 ID: 위 구글폼의 **응답이 누적되는 스프레드시트 ID**. `apps/web/scripts/generate-applicant-count.ts`가 이 시트의 row 수를 세서 `applicant-count.json`(홈페이지 실시간 지원자 수)을 만듭니다.

같은 구글폼이라도 응답시트는 운영진이 새로 연결할 수 있어서 두 값은 **항상 같이 움직이지는 않습니다**. 사용자에게 명확히 확인해야 합니다.

## 입력 패턴

사용자가 알려줘야 할 정보:

1. **새 `CURRENT_FLAG` 값** — 보통 기존 값 + 1. 코드에서 추정 가능하면 제안 후 확인만 받기.
2. **개발자 지원 폼 URL** — 새 폼이면 필수, 재사용이면 "그대로"라고 명시
3. **디자이너 지원 폼 URL** — 동일
4. **개발자 응답시트 ID** — 새 시트면 필수
5. **디자이너 응답시트 ID** — 동일

### 자주 나오는 실수

- 사용자가 "시트 ID 바꿔줘"라며 현재 코드에 있는 ID를 그대로 인용하는 경우가 있습니다. 새 ID인지, 그냥 현재 값을 보여준 건지 반드시 확인하세요. 14기 → 15기 전환 때 이 혼동이 한 번 있었습니다.
- "구글폼은 그대로 쓰고 시트만 새로 연결" 케이스가 실재합니다. 이 경우 URL은 유지, 시트 ID만 갱신.
- "구글폼은 새로 만들었는데 시트는 같은 거 재사용" 케이스도 있습니다. URL만 갱신.

추측하지 말고 두 값 각각을 개별로 확인하세요.

## 작업 순서

### 1단계: 현재 값 확인

두 파일을 읽어서 현재 값을 표로 보여주세요:

```
현재 설정:
- CURRENT_FLAG: 14
- DEVELOPER_APPLICATION_LINK: https://forms.gle/XWCQkdCRfw8pNam97
- DESIGNER_APPLICATION_LINK:  https://forms.gle/drzbsk1TDunck8Xu6
- 개발자 응답시트 ID: 1OLzUsZ1TBmKeEJh-...
- 디자이너 응답시트 ID: 1KrwSZoUY3i6asMW...
```

### 2단계: 변경할 값 수집

사용자에게 5개 항목을 **각각** 물어보세요. "URL 2개랑 시트 ID 2개 주면 되지?" 같은 두루뭉술한 질문은 위에서 언급한 혼동을 유발합니다.

권장 질문 형식:

```
1. CURRENT_FLAG: 14 → ? (15로 갈까요?)
2. 개발자 지원 폼 URL: 새 URL 있나요? (없으면 "유지")
3. 디자이너 지원 폼 URL: 새 URL? (없으면 "유지")
4. 개발자 응답시트 ID: 새 ID? (없으면 "유지")
5. 디자이너 응답시트 ID: 새 ID? (없으면 "유지")
```

### 3단계: 값 검증

- **구글폼 URL**: `https://forms.gle/` 또는 `https://docs.google.com/forms/d/` 로 시작해야 함. 그 외 도메인이면 거부.
- **스프레드시트 ID**: `1`로 시작하는 44자 내외 영숫자/하이픈/언더스코어. 정규식 `^[a-zA-Z0-9_-]{20,}$` 정도로 검증.
- **CURRENT_FLAG**: 정수, 기존 값보다 크거나 같아야 함. 더 작으면 거부, 같으면 "변경 없는데 진행할까요?" 확인.

### 4단계: diff 미리보기

변경할 두 파일의 before/after를 함께 보여주세요. 사용자가 OK 하면 저장.

### 5단계: 저장

- `Edit` 도구로 변경 필드만 수정.
- 들여쓰기/공백 그대로 유지.
- TypeScript 파일이라 ESLint/Prettier 영향 받을 수 있으니, 가능하면 동일 라인 구조 유지 (작은따옴표, 세미콜론).

### 6단계: 보고 및 다음 단계 안내

```
✅ recruitment-open 업데이트 완료

constants/index.ts:
- CURRENT_FLAG: 14 → 15
- DEVELOPER_APPLICATION_LINK: ...(변경됨/유지)
- DESIGNER_APPLICATION_LINK: ...(변경됨/유지)

generate-applicant-count.ts:
- 개발자 시트 ID: ...(변경됨/유지)
- 디자이너 시트 ID: ...(변경됨/유지)

다음 단계 안내:
- 모집 시작 시점에 event-status-update 스킬로 status를 ONGOING으로 전환
- 응답시트 ID를 바꿨다면 서비스 계정(GOOGLE_CLIENT_EMAIL)이 새 시트에
  공유돼 있는지 운영진에게 확인 요청 (안 그러면 generate-applicant-count
  스크립트가 권한 에러로 실패)
```

## 주의사항

- **두 파일은 항상 같은 PR/커밋으로 묶기.** 한쪽만 머지되면 "지원하기 버튼은 15기 폼인데 카운터는 14기 시트를 카운트"하는 잘못된 상태가 됩니다.
- 시트 ID는 평범한 문자열이지만 **노출돼도 무방한 값**입니다 (구글 스프레드시트 접근에는 별도 권한 필요). 단, 폼 URL은 운영진 외부에 공개되면 안 되는 경우가 있으니, 미공개 상태 폼이면 PR 머지 전 운영진과 협의.
- `CURRENT_FLAG`만 단독으로 올려야 하는 경우(예: 회고용)는 거의 없습니다. 사용자가 그렇게 요청하면 "지원 폼/시트도 같이 갱신해야 하지 않을까요?" 한 번 확인하세요. 단독 변경이 명확하면 그대로 진행.
- `NEXT_FLAG`는 `CURRENT_FLAG + 1` 파생값이라 자동 갱신됩니다. 직접 수정하지 마세요.
- 이 스킬은 `event_status.json`을 손대지 않습니다. 모집 시작/마감 일정 변경은 `event-status-update` 스킬을 쓰세요.
