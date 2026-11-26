# 합격 조회와 CMS 프리뷰 운영

홈페이지와 Passboard 프리뷰는 실제 16기 명단과 분리한 개발 Supabase에 연결한다. 16기 설정은 2026년 12월 19일 00:00 KST를 사용한다. 프리뷰에서 발표 시각 전후를 검증할 때는 별도의 가상 기수·이벤트를 현재 이벤트로 선택한다. 테스트는 DB의 실제 시각을 사용한다.

## 개발 환경

- Supabase 마이그레이션은 `supabase/migrations` 순서로 적용한다. 호스팅 프로젝트에서는 Auth의 신규 사용자 가입 허용을 끈다. 관리자 이메일은 Auth에 먼저 등록하고 `admin_accounts.active`와 `admin_permissions`의 `admissions` 또는 `content` 권한을 지정한다. 퇴임이나 권한 변경 시 해당 행을 비활성화하거나 권한 행을 삭제한다.
- 홈페이지 프리뷰에는 `DND_SUPABASE_URL`, `DND_SUPABASE_PUBLISHABLE_KEY`, `DND_SUPABASE_SERVICE_KEY`, `DND_APP_ENCRYPTION_KEY`, `DND_APP_SEARCH_KEY`, `DND_CMS_CONTENT=enabled`, `DND_PASSBOARD_ORIGINS`, `NEXT_PUBLIC_DND_PASSBOARD_URL`를 설정한다. 암호화 키와 검색 키는 환경별로 독립적인 32바이트 base64 값이다. 비밀값은 Vercel의 Preview 환경에만 등록한다. Storage 요청에 JWT가 필요한 개발 프로젝트는 서버 전용 `service_role` 키를 사용한다.
- Passboard 프로젝트의 루트는 `services/passboard`다. 홈페이지 프리뷰 주소를 Passboard 서버의 `DND_ADMISSIONS_API_URL`에 설정한다. 보호된 홈페이지 프리뷰에 연결할 경우 Passboard 서버에만 `DND_ADMISSIONS_VERCEL_BYPASS`를 설정한다. 프록시를 거치는 요청의 제한 기준을 유지하려면 두 프로젝트에 같은 `DND_ADMISSIONS_PROXY_KEY`를 설정한다.
- 개발 Storage 버킷은 `cms-drafts`와 `cms-public`이다. 전자는 비공개, 후자는 게시 파일을 담는다. `DND_CMS_UPLOAD_LIMIT_BYTES`를 프로젝트의 상한과 맞춘다. 20 MiB 초과 PDF는 관리자가 기기에서 최적화한 후보를 올리기 전에 페이지별 추출 텍스트와 링크를 비교한다. 한글 검색과 확대 화질은 두 미리보기에서 확인한다. 후보가 비교를 통과하지 못하면 프로젝트 상한 안에서 원본을 고를 수 있다. 6 MiB 초과 파일은 TUS로 전송하며 전송 중 일시 중지와 재개를 지원한다.
- PDF.js는 관리자 브라우저에서 후보 비교에 필요할 때 로드한다. 압축 엔진 채택 전까지 압축 후보는 로컬 PDF 도구에서 생성한다.
- 공개 중단은 홈페이지와 사이트맵에서 게시본을 숨긴다. 이미 공유한 공개 파일 주소의 회수는 별도 작업이다. Storage 복사 성공 후 DB 게시가 실패한 경우 같은 작업은 동일한 키를 재검증한다. 미연결 파일을 정리할 때는 초안·현재·이전 판본 및 이관 매핑의 참조를 먼저 조회한다.

## 홈페이지 이관과 대조

```sh
python3 scripts/import-cms.py dry-run
python3 scripts/import-cms.py sql | psql -X -v ON_ERROR_STOP=1
python3 scripts/import-cms.py verify | psql -X -v ON_ERROR_STOP=1
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/admissions-cms.sql
```

`psql`은 대상 개발 DB의 연결 설정을 사용한다. 이관은 프로젝트 109건, 운영진 48명, 후기 185건을 숫자 ID 그대로 등록하고 시퀀스를 맞춘다. 다시 실행하면 같은 원본으로 이관된 행을 건너뛴다. 겹치는 미이관 ID가 있으면 트랜잭션이 중단된다. 별도 누적 프로젝트 지표는 113이다. 미연결 후기 12건과 기수 미상 2건을 보존한다. 후기 20번은 5기, 참조 프로젝트 26번은 3기다. 후기 이메일 열은 현재 소스에서 제거했다. 과거 Git 커밋의 기록은 저장소 관리 범위에서 별도로 다룬다.

`python3 scripts/import-cms.py media-keys`는 S3 키 293개의 후보 목록을 만든다. 미디어 이관의 입력 JSON 배열에는 `source_key`, `source_sha256`, `output_sha256`, 매니페스트 기준 상대 파일 경로인 `output`, 변환 방법인 `conversion`, `quality_approved`를 기록한다. 원본 그대로 복사한 PDF의 변환 방법은 `copy`다. 검수한 산출물을 넣은 뒤 `python3 scripts/import-cms-media.py MANIFEST --source-keys KEYS`를 실행하면 원본·로컬 산출물·공개 Storage의 해시와 바이트를 검증하고 연결 SQL을 생성한다. 생성한 SQL을 같은 개발 DB에 적용한다. 검증을 기다리는 참조는 기존 공개 S3 주소를 사용한다.

## 운영 지원자 원본 대조

과거 MySQL은 읽기 전용 일관 스냅샷, 이벤트 시간대, 암복호화 구성에 대한 접근이 필요하다. 16기는 담당자가 확정한 직군별 원본 명단과 발표 결과를 사용한다. 별도 개발 리허설에서 동의한 범위의 데이터만 처리한다.

1. Spring의 이벤트·지원자·결과를 기수와 이벤트 ID로 매핑한다. 직군·상태별 원본 건수와 누락·중복·이벤트 없는 행을 확인한다. Spring은 이름과 이메일의 공백·대소문자를 변경하지 않고 UTF-8을 HMAC 입력에 사용한다.
2. 구 암호문을 권한 제한 환경에서 복호화한다. 새 환경의 암호화 키와 HMAC으로 다시 저장하며 명단 등록과 결과 반영을 독립적으로 검증한다. 동일 조회 키에 직군이 충돌하거나 서로 다른 결과가 있으면 담당자 확인까지 보류한다.
3. 저장 전후 상태별 건수, 동일 키 중복, 새 암복호화 왕복, 공개 기간 오류, 일치·불일치와 네 가지 계약 응답을 대조한다. 별도 계정·갱신 토큰과 제출 프로젝트·멤버 후기·제출 링크는 보존 범위를 별도로 확정한다.

기수와 지원자 엑셀은 `ExcelImport` 인터페이스와 관리자 준비 상태를 제공한다. 양식 확정 후 실제 파서를 연결한다. 개별 심사 결과 및 결과 CSV 반영은 모집 관리에서 처리한다.

### AWS 미디어 전송

개발 프리뷰는 기존 `assets.dnd.ac`가 연결된 S3 버킷을 공유합니다. CMS 전송은 `s3/cms/drafts/`와 `s3/cms/published/`를 사용합니다. 기존 CloudFront 접근 정책에 초안 접두어의 읽기 거부를 추가하고, 관리자 프리뷰의 정확한 Origin에만 CMS 업로드 헤더와 서명 조회를 허용합니다. 오래된 미완료 멀티파트 업로드의 정리 규칙도 초안 접두어에 적용합니다.

[`infra/dnd-cms-media-preview.yml`](../infra/dnd-cms-media-preview.yml)의 IAM 역할은 지정한 Vercel 프로젝트의 Preview OIDC 주체와 두 접두어만 허용합니다. Preview 환경에 `DND_CMS_UPLOAD_PROVIDER=s3`, `DND_CMS_S3_BUCKET`, `DND_CMS_S3_REGION`, `DND_CMS_AWS_ROLE_ARN`, `DND_CMS_MEDIA_CDN_ORIGIN=https://assets.dnd.ac` 및 해당 환경의 `DND_CMS_UPLOAD_LIMIT_BYTES`를 설정합니다. AWS에는 Vercel OIDC 제공자를 등록합니다. 장기 AWS 키는 Vercel에 등록할 필요가 없습니다.

콘텐츠 권한이 있는 운영자만 `POST /api/admin/media`의 `upload` 요청으로 UUID 기반 초안 키와 만료되는 서명 URL을 받습니다. 소형 파일은 선언한 길이·MIME·캐시 헤더를 서명한 단일 PUT을 사용합니다. 6 MiB를 초과하면 같은 API의 `resume`으로 누락 조각의 URL을 받아 전송을 재개합니다. `verify`는 예약 소유자와 실제 크기·형식·해시를 검사합니다. PNG·JPEG는 브라우저에서 WebP로 변환한 다음 전송하고, WebP의 실제 형식은 서버에서도 확인합니다. 초안 응답은 `private, no-store`이며, 게시 파일은 새 객체 키로 복사해 `public, max-age=31536000, immutable`을 적용합니다. 기존 Supabase 미디어는 원래 키에서 계속 읽습니다.
