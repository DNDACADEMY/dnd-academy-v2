---
name: total-count-update
description: DND 홈페이지 통계 카운터(누적 지원자/참여자/프로젝트/이탈자 수)를 갱신할 때 사용합니다. 사용자가 "지원수 업데이트", "통계 카운트 갱신", "이번 기수 N명 지원했어", "total_count_status.json" 같은 말을 하거나 기수 마감 후 합계 숫자를 알려주면 반드시 이 스킬을 사용하세요. 작은 파일이지만 홈페이지 상단 숫자에 직결되므로 직접 수정하지 말고 이 스킬을 거치세요.
---

# Total Count Update

기수 종료 후 누적 카운터를 갱신합니다. 절대값이 아니라 **이번 기수에 추가된 인원/프로젝트 수를 기존 값에 더하는** 방식입니다.

## 수정 대상 파일

`apps/web/src/lib/assets/data/total_count_status.json`

## 데이터 구조

타입 정의: `packages/core/src/@types/count.ts` 의 `TotalCountStatus`

```ts
interface TotalCountStatus {
  cumulativeApplicants: number; // 역대 누적 지원자 수
  totalParticipants: number; // 역대 누적 참여자 수 (선발된 인원)
  totalProjects: number; // 역대 누적 프로젝트 수
  dropouts: number; // 역대 누적 이탈자 수
}
```

## 입력

사용자에게 받아야 할 정보 — **모두 "이번 기수에 추가된" 값**:

- `+ 지원자 수` (이번 기수 지원한 인원)
- `+ 참여자 수` (이번 기수 실제 활동한 인원)
- `+ 프로젝트 수` (이번 기수에 등록된 프로젝트 수)
- `+ 이탈자 수` (이번 기수 중도 이탈자, 없으면 0)

사용자가 한꺼번에 다 알려줄 수도 있고, 일부만 줄 수도 있습니다.

## 작업 순서

### 1단계: 현재 값 확인

`total_count_status.json` 읽고 현재 값을 사용자에게 보여주세요:

```
현재 카운터:
- cumulativeApplicants: 6930
- totalParticipants: 768
- totalProjects: 108
- dropouts: 0
```

### 2단계: 추가할 값 받기

사용자가 명시한 필드만 받습니다. 모든 필드를 강제로 묻지 마세요 — 일부만 갱신하는 경우가 흔합니다.

값 확인 예시:

> "이번 기수 80명 지원, 60명 참여, 10개 프로젝트, 이탈 2명이야"

→ 다음 표로 정리해 보여주고 확인 받기:

```
이번 기수 추가:
- cumulativeApplicants: 6930 + 80 = 7010
- totalParticipants:    768 + 60 = 828
- totalProjects:        108 + 10 = 118
- dropouts:             0 + 2 = 2
```

### 3단계: 자동 추정 가능한 경우 (선택)

만약 `cohort-update` 오케스트레이터에서 호출되어 `projects-update` / `reviews-update`가 방금 끝났다면, 추가된 프로젝트/리뷰 개수를 이미 알 수 있습니다 — 그 숫자를 기본값으로 제안하세요:

```
projects-update에서 12개 프로젝트가 추가됐어요. totalProjects에 + 12 적용할까요? (Y/n)
reviews-update에서 65개 리뷰가 추가됐어요. totalParticipants에 + 65 적용할까요? (Y/n)
```

지원자 수와 이탈자 수는 자동 추정 어려우니 항상 사용자에게 묻기.

### 4단계: 저장

1. `Edit`로 변경할 필드만 수정 (다른 필드는 그대로).
2. 들여쓰기 2칸, 파일 끝 개행 유지.
3. JSON 유효성 확인.

### 5단계: 보고

```
✅ total_count_status.json 업데이트 완료

이전 → 이후
- cumulativeApplicants: 6930 → 7010 (+80)
- totalParticipants:    768  → 828  (+60)
- totalProjects:        108  → 118  (+10)
- dropouts:             0    → 2    (+2)
```

## 주의사항

- **이 값들은 "누적"입니다.** 이번 기수 숫자로 덮어쓰지 마세요. 항상 기존 값에 더해야 합니다.
- 사용자가 절대값을 주는 경우(예: "totalProjects를 120으로 해줘")도 있을 수 있습니다 — 이때는 "기존 값에 더하는 게 아니라 절대값으로 덮어쓰는 거 맞나요?" 한 번 확인.
- `dropouts`가 0인 상태가 오래 유지될 수 있으니, 사용자가 언급 안 했으면 그대로 두기 (자동으로 묻지 말 것).
- `applicant-count.json`(현재 모집중 카운터)과는 다른 파일입니다. 이 스킬은 누적용 `total_count_status.json`만 다룹니다.
