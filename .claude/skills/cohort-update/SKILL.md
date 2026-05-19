---
name: cohort-update
description: DND 기수가 종료된 후 한 번에 프로젝트, 리뷰, 누적 카운터를 함께 업데이트할 때 사용합니다. 사용자가 "기수 종료 후 업데이트", "14기 마무리 작업", "기수 데이터 한꺼번에 업데이트", "cohort 마감 처리" 같은 말을 하거나 운영자가 기수 종료 보고서 + 폼 응답 CSV를 함께 주면 반드시 이 스킬을 사용하세요. 개별 스킬을 따로 부르는 것보다 순서/일관성 보장 측면에서 안전합니다.
---

# Cohort Update (Orchestrator)

기수 종료 시 진행해야 할 데이터 업데이트를 정해진 순서로 한 번에 처리합니다.

## 이 스킬이 묶는 작업

1. `projects-update` — 신규 프로젝트 등록 (`projects.json`)
2. `reviews-update` — 참여자 후기 등록 (`reviews.json`)
3. `total-count-update` — 누적 카운터 갱신 (`total_count_status.json`)

`event-status-update`와 `organizers-update`는 보통 별도 시점에 돌리므로 이 오케스트레이터에 포함하지 않습니다.

## 왜 순서가 중요한가

- **projects → reviews 순서**: 리뷰의 `projectId`는 `projects.json`의 id를 참조합니다. 프로젝트가 먼저 등록되어 있어야 매핑이 정확합니다.
- **count는 맨 마지막**: 프로젝트/리뷰 개수가 확정된 뒤에 누적 카운터를 더해야 자동 추정 값을 활용할 수 있습니다.

## 입력

1. **참여자 폼 CSV/TSV 파일 경로** (필수) — 프로젝트와 리뷰가 같은 파일에 들어있음.
2. **기수 번호** (CSV에서 추출되거나 사용자에게 확인).
3. **이번 기수 지원자 수** (count 단계에서 사용, 폼에는 없을 수 있어 사용자에게 받음).
4. **이번 기수 이탈자 수** (선택, 없으면 0).

## 작업 순서

### 0단계: 사전 점검

1. 현재 git 브랜치 확인 — `develop`이 아니면 알려주기.
2. 입력 파일이 존재하는지 확인.
3. 작업 브랜치 생성 제안 (사용자 동의 받은 뒤):
   ```bash
   git checkout -b feature/cohort-<N>-update
   ```
4. 사용자에게 작업 계획 한 줄 요약:
   > "14기 데이터 업데이트 진행할게요. projects → reviews → total-count 순서로 갑니다."

### 1단계: projects-update 실행

`.claude/skills/projects-update/SKILL.md`의 절차를 그대로 따릅니다.

- 동일 파일 경로 + 기수 번호 전달.
- 작업 완료 후 추가된 프로젝트 개수와 새 ID 범위를 메모리에 기록 (다음 단계에서 사용).
- 사용자에게 중간 보고 후 "다음으로 reviews 작업 진행할게요" 안내.

### 2단계: reviews-update 실행

`.claude/skills/reviews-update/SKILL.md`의 절차를 그대로 따릅니다.

- 1단계 직후 갱신된 `projects.json`을 사용해 `projectId` 매핑.
- 작업 완료 후 추가된 리뷰 개수와 직군 분포 메모리에 기록.
- `projectId`가 null인 리뷰가 있으면 강조해서 사용자에게 보고 (다음 단계로 넘어가기 전에).

### 3단계: total-count-update 실행

`.claude/skills/total-count-update/SKILL.md`의 절차를 그대로 따르되, 다음 값을 자동 제안:

- `totalProjects += <1단계 추가 개수>`
- `totalParticipants += <2단계 추가 개수>`
- `cumulativeApplicants += ?` — 사용자에게 묻기 (폼 응답 수보다 보통 많음)
- `dropouts += ?` — 사용자에게 묻기 (없으면 0)

사용자가 확인한 뒤 저장.

### 4단계: 최종 보고

```
🎉 14기 데이터 업데이트 전체 완료

[Projects]
  추가: N개 (id 152 ~ 162)

[Reviews]
  추가: M개
  projectId 매핑: M-K개
  projectId null: K개  (확인 필요)

[Total Count]
  cumulativeApplicants: 6930 → 7010 (+80)
  totalParticipants:    768  → 828  (+60)
  totalProjects:        108  → 118  (+10)
  dropouts:             0    → 2    (+2)

📦 후속 작업:
1. S3 업로드
   - /images/project/14/... (각 프로젝트 이미지)
   - /files/project/14/... (각 프로젝트 PDF)
2. 커밋 & PR
   git add apps/web/src/lib/assets/data/
   git commit -m "chore: 14기 후기 및 프로젝트 업데이트"
   git push origin feature/cohort-14-update
   → PR base: develop
```

## 주의사항

- 각 하위 스킬의 `SKILL.md`를 실제로 읽어서 그 규칙을 따르세요. 이 오케스트레이터는 순서를 제공할 뿐 세부 규칙은 각 스킬에 있습니다.
- 중간 단계에서 사용자가 멈춰달라고 하면 즉시 중단하고 현재까지 적용된 내용 보고. 자동으로 다음 단계로 넘어가지 마세요 — 각 단계가 끝날 때 짧게 확인 받기.
- `event-status-update`(모집 일정)와 `organizers-update`(운영진)는 다른 시점이라 이 워크플로우에 포함하지 않습니다. 사용자가 같이 해달라고 하면 그때 별도로 호출.
- 작업 도중 JSON이 깨질 위험이 있으니, 1단계 시작 전 백업 커밋(`git commit -am "backup before cohort-14 update"`)을 권장하고 사용자 동의 받기.
