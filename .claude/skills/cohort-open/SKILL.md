---
name: cohort-open
description: DND 신규 기수 모집 오픈 시점에 지원 폼/시트 정보(constants/index.ts, generate-applicant-count.ts)와 이벤트 상태/일정(event_status.json)을 한 번에 묶어 업데이트할 때 사용합니다. 사용자가 "기수 오픈", "15기 모집 시작 준비", "모집 오픈 작업", "지원 폼이랑 일정 같이 갱신", "다음 기수 오픈해줘", "모집 오픈" 같은 말을 하거나 새 기수의 폼/시트 + 일정/상태를 함께 알려주면 반드시 이 스킬을 사용하세요. recruitment-open과 event-status-update를 따로 부르는 것보다 순서/일관성 보장 측면에서 안전합니다.
---

# Cohort Open (Orchestrator)

신규 기수 모집을 오픈할 때 처리해야 하는 두 가지 작업을 정해진 순서로 한 번에 처리합니다. `cohort-update`(기수 종료 처리)의 짝 개념으로, 이쪽은 **기수 시작/모집 오픈** 시점 작업입니다.

## 이 스킬이 묶는 작업

1. `recruitment-open` — 지원 폼/응답시트/CURRENT_FLAG 갱신
   - `apps/web/src/lib/constants/index.ts`
   - `apps/web/scripts/generate-applicant-count.ts`
2. `event-status-update` — 이벤트 상태와 모집/활동 일정 갱신
   - `apps/web/src/lib/assets/data/event_status.json`

`total-count-update`, `organizers-update`, `projects-update`, `reviews-update`는 모집 오픈 시점과 무관하므로 이 오케스트레이터에 포함하지 않습니다.

## 왜 순서가 중요한가

- **recruitment-open이 먼저**: 폼/시트가 새 기수 것으로 연결되지 않은 상태에서 status만 `ONGOING`으로 바꾸면 홈페이지 "지원하기" 버튼이 이전 기수 폼으로 가버립니다.
- **event-status-update가 마지막**: 폼/시트가 안전하게 새 기수에 연결된 뒤에야 status를 `ONGOING`으로 전환해야 사용자에게 노출되는 시점을 통제할 수 있습니다.

## 입력

사용자가 알려줘야 할 정보. 단, 사용자가 "일정만 바꿔" 같이 한쪽 작업만 명시하면 해당 단계만 돌리세요(아래 "부분 실행" 참고).

**recruitment-open 쪽 (선택적)**

- 새 `CURRENT_FLAG` 값 (기존 +1 추정 가능)
- 개발자/디자이너 지원 폼 URL
- 개발자/디자이너 응답시트 ID

**event-status-update 쪽 (선택적)**

- `status` (보통 모집 오픈 시점 → `ONGOING`)
- `applicationStartDateTime` (지원 시작)
- `applicationEndDateTime` (지원 마감)
- `applicantAcceptanceDateTime` (활동 시작)
- `label` (선택)

## 작업 순서

### 0단계: 사전 점검 및 범위 합의

1. 현재 git 브랜치 확인 — `develop`이면 작업 브랜치 분기 제안:
   ```bash
   git checkout -b chore/cohort-<N>-open
   ```
2. 사용자에게 두 작업 중 **어디까지 진행할지** 한 번 확인. 사용자 메시지에 이미 명확하면(예: "둘 다 해줘", "일정만 바꿔") 추측한 범위를 한 줄로 확인만 받고 넘어가세요. 그렇지 않으면 **`AskUserQuestion`** 도구로 단일 선택 질문을 띄우세요:

   ```json
   {
     "questions": [
       {
         "question": "이번 작업에서 어디까지 진행할까요?",
         "header": "작업 범위",
         "multiSelect": false,
         "options": [
           { "label": "둘 다", "description": "recruitment-open + event-status-update (권장)" },
           { "label": "recruitment-open만", "description": "폼/시트/CURRENT_FLAG만 먼저, 일정은 나중에" },
           { "label": "event-status-update만", "description": "이미 폼/시트 갱신 완료, 상태/일정만 갱신" }
         ]
       }
     ]
   }
   ```

3. 작업 계획 한 줄 요약:
   > "15기 모집 오픈 준비 진행할게요. recruitment-open → event-status-update 순서로 갑니다."

### 1단계: recruitment-open 실행 (해당하는 경우)

`.claude/skills/recruitment-open/SKILL.md`의 절차를 그대로 따릅니다. 핵심은:

- **사용자가 어떤 필드를 바꿀지 먼저 묻고**, 선택된 필드만 새 값을 수집.
- 선택되지 않은 필드는 묻지도 수정하지도 않음.
- 작업 완료 후 어떤 필드가 변경됐는지 간단히 메모(최종 보고에 사용).
- 사용자에게 짧게 보고 후 "다음으로 event_status.json 작업 진행할게요" 안내.

이 단계 중 사용자가 멈춰달라고 하면 즉시 중단하고 1단계까지의 변경만 보고. 자동으로 2단계로 넘어가지 마세요.

### 2단계: event-status-update 실행 (해당하는 경우)

`.claude/skills/event-status-update/SKILL.md`의 절차를 그대로 따릅니다. 핵심은:

- 사용자가 명시한 필드만 변경. 언급 안 한 필드는 그대로 둔다.
- 모집 오픈 시점이면 `status: UPCOMING → ONGOING` 전환을 제안.
- 날짜는 `YYYY/MM/DD HH:MM:SS` 슬래시 포맷으로 입력/저장.
- 작업 완료 후 어떤 필드가 변경됐는지 간단히 메모.

### 3단계: 최종 보고

두 단계 결과를 합쳐서 한 번 보고. 변경되지 않은 필드는 적지 않습니다.

```
🎉 15기 모집 오픈 작업 완료

[recruitment-open]
  CURRENT_FLAG: 14 → 15
  DEVELOPER_APPLICATION_LINK: https://forms.gle/old → https://forms.gle/new
  개발자 응답시트 ID: 1OLz... → 1ABc...
  (다른 필드는 유지)

[event-status-update]
  status: UPCOMING → ONGOING
  applicationStartDateTime: 2026/05/19 00:00:00
  applicationEndDateTime: 2026/06/08 23:59:59
  applicantAcceptanceDateTime: 2026/06/22 00:00:00

📦 후속 작업:
1. 응답시트 ID를 바꿨다면 새 스프레드시트 2개(개발자/디자이너)에 서비스 계정을
   **뷰어(읽기) 이상 권한으로 공유(초대)** 했는지 운영진에게 확인 요청.
   - 공유할 계정(GOOGLE_CLIENT_EMAIL):
     dnd-academy@dnd-academy-admin-429806.iam.gserviceaccount.com
   - 각 스프레드시트 우상단 [공유] → 위 이메일 추가 → 뷰어 권한으로 저장
   - 안 그러면 generate-applicant-count 스크립트가 권한 에러로 실패해
     홈페이지 실시간 지원자 수 집계가 깨짐
2. 커밋 & PR
   git add apps/web/src/lib/constants/index.ts \
           apps/web/scripts/generate-applicant-count.ts \
           apps/web/src/lib/assets/data/event_status.json
   git commit -m "chore: 15기 모집 오픈"
   git push
   → PR base: develop
```

## 부분 실행

- 사용자가 "폼만 바꿔" → 1단계만 실행하고 보고. 2단계는 건너뜀.
- 사용자가 "일정만 바꿔" → 1단계 건너뛰고 2단계만 실행.
- 한쪽만 실행했더라도 마지막 보고 형식은 유지하되, 실행 안 한 단계는 섹션 자체를 생략.

## 주의사항

- 각 하위 스킬의 `SKILL.md`를 **실제로 읽어서** 그 규칙을 따르세요. 이 오케스트레이터는 순서와 입력 분배만 담당하고, 세부 검증/저장 규칙은 각 스킬에 있습니다.
- 중간 단계에서 사용자가 멈춰달라고 하면 즉시 중단하고 현재까지 적용된 내용을 보고. 자동으로 다음 단계로 넘어가지 마세요 — 각 단계 끝날 때 짧게 확인 받기.
- recruitment-open과 event-status-update를 같은 PR로 묶는 것이 일반적이지만, 운영 상황에 따라 분리해야 할 수 있습니다(예: 폼만 먼저 갱신해 두고 모집 오픈일에 status만 전환). 0단계에서 사용자 의도를 확인해 두면 마지막 커밋/PR 안내가 깔끔해집니다.
- 다른 운영 데이터(`organizers.json`, `total_count_status.json`, `projects.json`, `reviews.json`)는 이 오케스트레이터의 책임이 아닙니다. 사용자가 같이 해달라고 요청해도 별도 스킬로 안내하세요.
