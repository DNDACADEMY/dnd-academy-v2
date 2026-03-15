---
name: update-generation
description: Updates DND Academy generation data from CSV. Automatically generates S3 paths, creates projects and reviews in JSON files, then guides admin to upload images to S3. Use when updating new cohort data from CSV files.
disable-model-invocation: true
---

# DND 후기 업데이트 Skill

이 skill은 DND의 기수가 끝날 때마다 리뷰와 프로젝트 데이터를 업데이트하는 데 사용됩니다.

## 전체 워크플로우 요약

```
1. CSV 제공
   ↓
2. 커맨드 실행 (/update-generation)
   ↓
3. 0단계: CSV 분석 및 기수 파악
   ↓
4. 기수별 브랜치 자동 생성 (예: feature/cohort-14-update)
   ↓
5. 1단계: 프로젝트 등록 (이미지 URL은 예상 경로로 자동 생성)
   ↓
6. 2단계: 리뷰 등록
   ↓
7. 3단계: 완료 및 S3 업로드 안내
   ↓
8. 운영진이 안내된 경로에 이미지 업로드
```

## 업데이트 대상 파일

1. **Reviews 파일**: `/apps/web/src/lib/assets/data/reviews.json`
   - 각 참여자의 리뷰 정보

2. **Projects 파일**: `/apps/web/src/lib/assets/data/projects.json`
   - 각 팀의 프로젝트 정보

## CSV 파일 형식

CSV 파일은 다음 컬럼을 포함합니다:
- 타임스탬프
- 프로젝트명
- 프로젝트 배너 파일 (Google Drive 링크)
- 프로젝트 소개 파일(PDF) (Google Drive 링크)
- 프로젝트 명
- 프로젝트 한 쥴 소개 문구
- 프로젝트 장문형 소개 문구
- 프로젝트에서 사용한 기술 스택
- 개인 후기 (홈페이지 업로드 예시)
- 기수
- 조
- 이름
- 직군
- 이메일
- 링크 (GitHub, 링크드인, 블로그 등 여러 링크가 쉼표/개행으로 구분)
- 이메일 주소

**중요 사항**:
- 같은 프로젝트에 여러 팀원이 있을 수 있습니다 (각각 행으로 존재)
- 프로젝트 정보(배너, PDF, 소개)는 첫 번째 팀원의 행에만 있거나, 여러 행에 반복될 수 있습니다
- 모든 조가 프로젝트를 등록하는 것은 아닙니다
- 개인 링크는 "링크" 컬럼에서 파싱합니다

## 작업 순서

### 0단계: CSV 분석 및 브랜치 생성

1. CSV 파일 읽기 및 파싱
2. **기수 정보 파악**
   - "기수" 컬럼에서 기수 번호 추출 (예: "14기" → 14)
   - 모든 행의 기수가 동일한지 확인
3. **기수별 브랜치 자동 생성**
   - 브랜치명: `feature/cohort-{기수번호}-update`
   - 예: 14기 → `feature/cohort-14-update`
   - 다음 명령어를 실행:
     ```bash
     git checkout -b feature/cohort-14-update
     ```
4. 프로젝트 정보가 있는 행만 필터링
   - "프로젝트명"가 있는 경우만 프로젝트로 간주
5. 프로젝트별로 데이터 그룹화
6. 조번호 파악 및 S3 경로 자동 생성
   - 기존 projects.json의 마지막 ID를 확인하여 다음 번호부터 순차적으로 할당
   - 각 프로젝트의 S3 경로를 미리 생성, 14기 1팀의 경우
      - 예: `https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/project/14/1/1.png`
      - 예: `https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/files/project/14/1/1.pdf`

### 1단계: 프로젝트 등록

1. 기존 projects.json 읽기
2. 최대 ID 확인
3. 새로운 프로젝트 데이터 생성:
   - name: "프로젝트 명" 컬럼
   - title: "프로젝트 소개 문구"의 첫 줄 (부제)
   - desc: "프로젝트 소개 문구"의 나머지 부분
   - flag: "기수" 컬럼 (예: "14기")
   - **images**: 0단계에서 생성한 S3 경로 배열
   - **thumbnail**: 첫 번째 이미지 S3 경로
   - **pdf**: PDF S3 경로
   - skill: "프로젝트 소개 문구"에서 추출한 기술 스택 배열 (여러 줄 형식 자동 처리)
   - projectLinks: 팀원들의 GitHub 링크 수집
4. projects.json에 추가 및 저장
5. 생성된 프로젝트 목록 확인

### 2단계: 리뷰 등록

1. CSV의 모든 행 (모든 팀원) 처리
2. 기존 reviews.json 읽기
3. 최대 ID 확인
4. 각 팀원에 대해:
   - name: "이름" 컬럼
   - flag: "기수" 컬럼
   - project: "프로젝트 명" 컬럼
   - projectId: 1단계에서 생성된 프로젝트 ID (없으면 null)
   - position: "직군" 컬럼
   - review: "개인 후기 (홈페이지 업로드 예시)" 또는 "DND 활동 후기" 컬럼
   - email: "이메일" 또는 "이메일 주소" 컬럼
   - links: "링크" 컬럼 파싱
5. reviews.json에 추가 및 저장
6. 결과 검증 및 보고

### 3단계: 완료 보고 및 S3 업로드 안내

JSON 파일 업데이트가 완료된 후, 다음 형식으로 보고:

```
================================
✅ JSON 업데이트 완료!
================================

기수: 14기
브랜치: feature/cohort-14-update

추가된 프로젝트: 5개
추가된 리뷰: 23개
projectId가 null인 리뷰: 2개

프로젝트별 팀원 수:
- [1조] 프로젝트A: 3명
- [2조] 프로젝트B: 4명
- [3조] 프로젝트C: 5명
...

총 프로젝트 수: 150개
총 리뷰 수: 550개

================================
📦 이제 S3에 이미지를 업로드해주세요
================================

[1조] 프로젝트A
--------------------------------
Google Drive 이미지:
- https://drive.google.com/open?id=xxxxx

업로드할 S3 경로:
- https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/project/14/1/1.png

Google Drive PDF:
- https://drive.google.com/open?id=yyyyy

업로드할 S3 경로:
- https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/files/project/14/1/1.pdf

[2조] 프로젝트B
--------------------------------
Google Drive 이미지:
- https://drive.google.com/open?id=zzzzz

업로드할 S3 경로:
- https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/project/14/2/2.png

(PDF 없음)

... (모든 프로젝트)

================================
📋 다음 단계
================================
1. Google Drive 링크에서 파일을 다운로드하세요
2. 위에 표시된 S3 경로에 파일을 업로드하세요
3. 파일명은 반드시 경로와 일치해야 합니다
4. S3 업로드 완료 후:
   git add .
   git commit -m "chore: 14기 후기 및 프로젝트 업데이트"
   git push origin feature/cohort-14-update
5. PR 생성:
   - Base: develop
   - Compare: feature/cohort-14-update
   - Title: "chore: 14기 후기 및 프로젝트 업데이트"
```

## 데이터 구조

### Reviews
```json
{
  "id": number,
  "name": string,
  "flag": string,
  "project": string,
  "projectId": number | null,
  "position": string,
  "review": string,
  "email": string,
  "links": {
    "github": string,
    "velog": string,
    "linkedin": string,
    "link": string,
    "medium": string
  }
}
```

### Projects
```json
{
  "id": number,
  "name": string,
  "title": string,
  "desc": string,
  "images": string[],
  "flag": string,
  "skill": string[],
  "thumbnail": string,
  "pdf": string,
  "projectLinks": {
    "appStore": string,
    "github": string[],
    "googlePlayStore": string,
    "youtube": string,
    "link": string
  }
}
```

## 주의사항

### 필수 규칙
- 기존 데이터를 절대 삭제하거나 수정하지 마세요
- ID는 반드시 중복되지 않게 할당하세요
- flag 값은 일관된 형식을 유지하세요 (예: "14기")
- JSON 형식이 깨지지 않도록 주의하세요

### 링크 파싱
"링크" 컬럼의 다양한 형식을 처리:
- "깃헙 - URL" 또는 "GitHub - URL"
- "링크드인 - URL" 또는 "LinkedIn - URL"
- "블로그 - URL" 또는 "velog - URL"
- "https://..." (단독 URL은 link 필드에)
- 쉼표, 개행, 공백 등 다양한 구분자 고려

### 기술 스택 추출
**단일 줄 형식**:
- 쉼표로 구분된 기술들을 찾아 배열로 변환
- 예: "React, Spring Boot, Figma" → ["React", "Spring Boot", "Figma"]

**여러 줄 형식 (카테고리 포함)**:
- 여러 줄에 걸쳐 있는 기술 스택을 하나로 합침
- 카테고리 레이블 제거 (디자인:, iOS:, Back-end: 등)
- 모든 기술을 하나의 배열로 통합
- 예:
  ```
  디자인: Figma, Midjourney, UXUI, Illustrator
  iOS: UIKit, SnapKit, SPM, Alamofire, Combine
  Back-end: Spring Boot 4.1, PostgreSQL, AWS, Github Actions
  ```
  → ["Figma", "Midjourney", "UXUI", "Illustrator", "UIKit", "SnapKit", "SPM", "Alamofire", "Combine", "Spring Boot 4.1", "PostgreSQL", "AWS", "Github Actions"]

**파싱 방법**:
1. 개행(\n)으로 분리
2. 각 줄에서 콜론(:) 뒤의 내용만 추출 (콜론 있는 경우)
3. 쉼표로 분리하여 기술명 추출
4. 앞뒤 공백 제거
5. 모든 기술을 하나의 배열로 합침

### 조번호 파악
- CSV에는 조번호가 없을 수 있음
- 프로젝트 순서대로 조번호 할당 (기존 마지막 ID + 1부터)
- 또는 사용자에게 각 프로젝트가 몇 조인지 확인

### projectId null 처리
- 프로젝트 정보가 없는 팀원은 projectId를 null로 설정
- null 항목이 있으면 사용자에게 보고

### 기수 형식 및 브랜치 생성
- CSV에서 "14기" 또는 "14" 형식일 수 있음
- 일관되게 "14기" 형식으로 통일
- **브랜치 자동 생성**:
  - 기수 번호를 추출하여 브랜치명 생성
  - 형식: `feature/cohort-{기수번호}-update`
  - 예시:
    - 14기 → `feature/cohort-14-update`
    - 15기 → `feature/cohort-15-update`
  - 0단계에서 자동으로 브랜치를 생성하고 체크아웃합니다

### GitHub 링크 수집
- 같은 프로젝트의 모든 팀원 GitHub 링크를 수집
- projectLinks.github 배열에 중복 없이 추가

## 작업 전 확인사항

1. CSV 파일이 올바른 형식인지 확인
2. 어떤 기수의 데이터인지 확인
3. 현재 브랜치가 develop인지 확인
   - 스킬이 자동으로 기수별 브랜치를 생성합니다
   - 형식: `feature/cohort-{기수번호}-update`
4. 백업 필요 시 git commit 권장
