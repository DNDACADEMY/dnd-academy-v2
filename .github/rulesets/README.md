# GitHub Branch Rulesets

`main`, `develop` 브랜치의 머지 정책을 GitHub Rulesets 로 강제합니다.

| 파일           | 적용 대상            | 허용 머지 방식        | 부가 보호        |
| -------------- | -------------------- | --------------------- | ---------------- |
| `main.json`    | `refs/heads/main`    | **merge commit only** | branch 삭제 금지 |
| `develop.json` | `refs/heads/develop` | **squash only**       | branch 삭제 금지 |

> 참고: GitHub 의 머지 방식 옵션(`Allow merge commits`, `Allow squash merging`, `Allow rebase merging`)은 **레포지토리 전역 설정**이라 브랜치별로 강제할 수 없습니다. 위 ruleset 의 `pull_request.allowed_merge_methods` 가 브랜치별 강제를 담당하므로, 레포 설정에서는 세 가지를 모두 켜둔 채로 두어도 ruleset 이 우선합니다.

## 최초 적용

GitHub CLI 로 적용합니다. `gh auth login` 으로 먼저 로그인하세요.

```bash
# 인증
gh auth login

# 적용 (레포 루트에서 실행)
gh api -X POST \
  -H "Accept: application/vnd.github+json" \
  /repos/DNDACADEMY/dnd-academy-v2/rulesets \
  --input .github/rulesets/main.json

gh api -X POST \
  -H "Accept: application/vnd.github+json" \
  /repos/DNDACADEMY/dnd-academy-v2/rulesets \
  --input .github/rulesets/develop.json
```

## 업데이트

ruleset ID 를 먼저 확인한 뒤 `PUT` 으로 덮어씁니다.

```bash
# 1) 현재 ruleset 목록과 ID 확인
gh api /repos/DNDACADEMY/dnd-academy-v2/rulesets

# 2) ID 를 채워 업데이트 (예: 12345)
gh api -X PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/DNDACADEMY/dnd-academy-v2/rulesets/12345 \
  --input .github/rulesets/main.json
```

## 권한

리포지토리의 **Admin** 권한이 있어야 적용 가능합니다.
