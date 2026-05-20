# 시작하기

DND 아카데미 v2 레포를 처음 클론한 뒤 로컬에서 개발 환경을 셋업하는 가이드입니다. Node/Yarn/Lefthook 버전을 [mise](https://mise.jdx.dev/)로 관리합니다.

## 1. mise 설치

이미 설치돼 있다면 건너뛰셔도 됩니다.

```bash
# macOS (Homebrew)
brew install mise

# 또는 공식 인스톨러
curl https://mise.run | sh
```

설치 후 셸 통합을 활성화합니다. 사용하는 셸에 맞춰 한 줄을 rc 파일에 추가하세요.

```bash
# zsh
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc

# bash
echo 'eval "$(mise activate bash)"' >> ~/.bashrc

# fish
echo 'mise activate fish | source' >> ~/.config/fish/config.fish
```

새 셸을 열거나 `source ~/.zshrc`로 적용합니다.

## 2. `mise trust`

레포 루트의 `mise.toml`은 프로젝트별 도구 버전을 정의합니다. 보안상 mise는 처음 보는 설정 파일을 자동으로 신뢰하지 않고, 명시적인 승인을 요구합니다.

```bash
cd dnd-academy-v2
mise trust
```

이걸 안 거치면 `mise install` 시 "mise WARN ... mise.toml is not trusted" 경고와 함께 도구 버전이 적용되지 않습니다.

> `mise.toml` 내용을 직접 확인한 뒤 신뢰하세요. 본 레포에는 현재 Node, Yarn, Lefthook 세 가지만 정의돼 있습니다.

## 3. `mise install`

`mise.toml`에 핀된 모든 도구를 한 번에 설치합니다.

```bash
mise install
```

설치 후 버전을 확인합니다.

```bash
node --version    # v22.12.0
yarn --version    # 4.6.0
lefthook version  # 2.1.8
```

## 4. `yarn install`

의존성 설치와 함께 `prepare` 스크립트가 자동으로 lefthook 훅(`pre-commit`, `commit-msg`)을 `.git/hooks/`에 등록합니다.

```bash
yarn install
```

훅이 정상 등록됐는지 확인하려면:

```bash
yarn lefthook run pre-commit --no-tty
```

staged 파일이 없을 땐 모든 커맨드가 `(skip) no files for inspection`으로 표시되면 정상입니다.

## 5. 일상적인 사용

- 코드 수정 후 `git commit`을 하면 자동으로
  - 변경된 JS/TS 파일에 ESLint `--fix`
  - 변경된 SCSS 파일에 Stylelint `--fix`
  - 변경된 파일과 관련된 Jest 테스트 실행
  - 커밋 메시지에 commitlint 검사
- `--fix`로 자동 수정된 결과는 자동으로 재staging되어 같은 커밋에 들어갑니다.

## 트러블슈팅

- **`lefthook: command not found`**: mise 활성화가 안 됐을 가능성. 셸 rc에 `mise activate` 라인이 있고 새 셸로 열었는지 확인.
- **`mise.toml is not trusted`**: `mise trust` 한 번 실행.
- **pre-commit이 멈춤**: `yarn lefthook run pre-commit --verbose`로 어떤 명령에서 막혔는지 확인 가능.
- **훅을 일시적으로 우회해야 할 때**: `git commit --no-verify` (남용 금지).
