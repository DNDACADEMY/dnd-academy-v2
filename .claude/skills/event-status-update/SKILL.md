---
name: event-status-update
description: DND 홈페이지 상단에 노출되는 이벤트 상태(모집 시작/마감/활동 시작 일정과 status 라벨)를 수정할 때 사용합니다. 사용자가 "이벤트 상태 바꿔줘", "모집 일정 업데이트", "지원 마감일 바꿔", "status를 ACTIVE로", "applicationStartDateTime 수정" 같은 말을 하거나 `event_status.json`을 직접 언급하면 반드시 이 스킬을 사용하세요. 기수 시작/모집 오픈/마감 시점마다 호출되는 핵심 운영 작업이라 절대 직접 JSON을 손대지 말고 이 스킬을 거치세요.
---

# Event Status Update

홈페이지의 이벤트 모집 상태와 일정 4개 필드를 안전하게 수정합니다.

## 수정 대상 파일

`apps/web/src/lib/assets/data/event_status.json`

## 데이터 구조

타입 정의는 `packages/core/src/@types/event.ts`의 `EventStatus`를 따릅니다.

```ts
type EventStatusType = 'UPCOMING' | 'ONGOING' | 'ACTIVE' | 'INACTIVE' | 'HOT';

interface EventStatus {
  status: EventStatusType;
  applicationStartDateTime: string; // "YYYY/MM/DD HH:MM:SS"
  applicationEndDateTime: string; // "YYYY/MM/DD HH:MM:SS"
  applicantAcceptanceDateTime: string; // "YYYY/MM/DD HH:MM:SS"
  label?: string;
}
```

날짜 포맷은 슬래시 구분(`YYYY/MM/DD HH:MM:SS`)을 그대로 유지하세요. ISO 형식으로 바꾸지 마세요 — 프론트엔드 파서가 이 포맷 전제로 동작합니다.

### status 값이 의미하는 것

- `UPCOMING`: 다가오는 기수, 아직 지원 안 받음
- `ONGOING`: 지원 접수중
- `ACTIVE`: 활동중
- `INACTIVE`: 활동 종료/대기
- `HOT`: 마감 임박 등 강조 라벨

어떤 값을 써야 할지 애매하면 현재 시점과 일정을 종합해 추천하고 사용자 확인을 받으세요.

## 작업 순서

1. **현재 파일 읽기** — `event_status.json`을 먼저 읽어서 어떤 필드가 이미 채워져 있는지 사용자에게 보여주세요. 무엇을 바꾸려는지 알아야 누락된 필드만 물어볼 수 있습니다.

2. **변경할 필드 수집** — 사용자가 명시한 값만 변경합니다. 언급 안 한 필드는 절대 건드리지 마세요. 변경할 필드가 무엇인지 사용자가 말하지 않았다면 한 번에 물어보세요:
   - status (5개 중 하나)
   - applicationStartDateTime (지원 시작)
   - applicationEndDateTime (지원 마감)
   - applicantAcceptanceDateTime (활동 시작)
   - label (선택, 빈 값이면 생략)

3. **형식 검증** — 날짜 입력이 `YYYY/MM/DD HH:MM:SS`가 아니면 변환하세요. 예: "2025-12-07 23:59" → "2025/12/07 23:59:59". 시간을 안 알려주면 합리적 기본값(시작은 00:00:00, 마감은 23:59:59) 적용 후 사용자에게 확인.

4. **diff 미리보기** — 변경 전/후를 비교해 한 번 보여주고, 사용자가 OK 하면 저장.

5. **저장** — `Edit` 도구로 변경된 필드만 수정. 들여쓰기 2칸 유지. 파일 끝 개행 유지.

## 입력 예시

> "지원 시작 2025/11/17 0시, 마감 2025/12/07 자정까지, 활동 시작 12/21로 바꾸고 status는 ONGOING으로 해줘"

이런 요청이 오면 4개 필드 전부 갱신 후 diff 확인.

> "status만 ACTIVE로 바꿔"

이 경우는 status만 수정, 나머지는 그대로.

## 주의사항

- `label` 필드는 타입에서 optional이므로, 사용자가 빈 값을 원하면 JSON에서 키 자체를 제거하지 말고 `""`로 두지 말고 — 처음부터 없었다면 추가하지 마세요. 명시적으로 추가/제거 요청이 있을 때만 손대세요.
- 잘못된 status 값(예: "active" 소문자, "OPEN" 같은 임의 값)이 들어오면 거부하고 5개 정식 값 중 하나를 받으세요.
- 파일이 깨지면 홈페이지 전체가 영향을 받으니, 저장 전 JSON 유효성을 한 번 더 확인하세요.
