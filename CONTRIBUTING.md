# Contributing

## 브랜치 전략

```
feature/* ─┐
fix/*      ├─(Squash & Merge)─▶ develop ─(Create a merge commit)─▶ main
chore/*    ┘
```

- **메인 브랜치는 `main`** — 항상 배포 가능한 상태
- **개발 브랜치는 `develop`** — 모든 작업 브랜치의 통합 지점
- **작업 브랜치**: `feature/*`, `fix/*`, `chore/*`, `refactor/*` 등 목적 prefix 사용

## 머지 정책

### 작업 브랜치 → `develop`

- **Squash and merge 만 허용**
- 커밋 제목 형식: `<type>: <description> (#<PR번호>)` (GitHub이 자동 생성)
- PR 하나 = `develop` 위 커밋 하나로 정리되어 히스토리가 깨끗하게 유지됩니다.

### `develop` → `main`

- **Create a merge commit 만 허용** (rebase, squash 금지)
- 머지 커밋이 "이 시점에 배포된 묶음"을 표시 → 릴리스 단위 추적·롤백이 쉬워집니다.
- 머지 커밋 메시지는 기본값(`Merge pull request #N from DNDACADEMY/develop`) 유지.

## 금지 사항

`main`/`develop` 히스토리를 보호하기 위해 아래는 금지합니다.

- `main` 에 **직접 push** 또는 **작업 브랜치 PR**
- `main` → `develop` 역머지 (hotfix 포함, 아래 hotfix 흐름을 따를 것)
- `develop` 에 force push, rebase merge
- merge commit 메시지 자유 편집 (자동 메시지 유지)

## Hotfix 절차

긴급 패치도 `main` 에 직접 작업하지 않습니다.

1. `develop` 에서 `fix/hotfix-*` 브랜치 생성
2. PR 을 `develop` 으로 올리고 **Squash & Merge**
3. `develop` → `main` PR 을 즉시 생성하고 **Create a merge commit**

## 커밋 메시지 컨벤션

PR 제목(= squash 커밋 제목) 기준으로 다음 prefix 를 사용합니다.

- `feat:` 새 기능
- `fix:` 버그 수정
- `chore:` 빌드/설정/정보 업데이트
- `refactor:` 리팩터링
- `docs:` 문서
- `style:` 코드 스타일 (포맷팅 등)
- `test:` 테스트
