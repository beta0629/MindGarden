# 공공데이터 공통 API (국세청·도로명주소)

개발(`release/dev`)·운영 공통. classpath Flyway 로 스키마를 맞춘다.

## 범위

- 국세청 사업자 상태조회 `POST /status`, 진위확인 `POST /validate` (`api.odcloud.kr`, `serviceKey`).
- 도로명주소 검색 `business.juso.go.kr/addrlink/addrLinkApi.do` (`confmKey`).
- 외부 HTTP, 키, 타임아웃, 재시도, 실패 시 `미확인` 은 `KrPublicDataClient` / `KrPublicDataService` / `BusinessRegistrationVerifier` 가 담당한다.

## 공통 엔드포인트

| 경로 | 인증 | 용도 |
| --- | --- | --- |
| `GET/POST /api/v1/public/kr-public-data/**` | `permitAll`. IP 분당 20회 (`kr_public_data`) | 비로그인 온보딩, Ops 다시 확인 |
| `GET/POST /api/v1/kr-public-data/**` | `isAuthenticated()` | 코어 `/tenant/merchant-legal` |

하위 경로: `GET /capabilities`, `GET /addresses?keyword=`, `POST /business-registration/lookup`.

신청 제출과 가맹 저장은 HTTP 로 자신을 부르지 않고, 트랜잭션 시작 전에 서비스를 직접 호출한다.

## 온보딩 게이트

`KrPublicDataService.enrichOnboardingChecklist` → `BusinessRegistrationVerifier.assertOnboardingAllowed`:

| 결과 | 등록 |
| --- | --- |
| 계속사업자 + 진위 일치 (`MATCH`) | 허용 |
| 휴업 + 진위 일치 (`SUSPENDED`) | 허용 + 경고 |
| 진위 불일치 (`MISMATCH`) | **차단** |
| 폐업 (`CLOSED`) | **차단** |
| 미등록 (`UNREGISTERED`) | **차단** |
| 키 미설정·타임아웃·장애 (`UNCONFIRMED`) | 허용(미확인). 관리자 재확인 |

차단 문구는 `content/kr-public-data-messages.properties` (`gate.*`, `warning.suspended`).

## 저장

컬럼 (Flyway `V20261016_001__tenant_business_verification_fields.sql`):

- `tenants` / `onboarding_request`:
  - `business_verification_status` — MATCH / MISMATCH / UNCONFIRMED / UNREGISTERED / CLOSED / SUSPENDED
  - `business_verified_at` — 확인 시각
  - `business_verification_result_code` — 예: `b_stt_cd=01;valid=01`
  - `opening_date` — 개업일(신규 신청·저장만. 기존 row heal/backfill 없음)

부가:

- 온보딩: `onboarding_request.checklist_json.merchantLegal` (`openingDate`, `businessVerification`).
- 테넌트: `tenants.settings_json.krPublicData` (기존). 객체가 아니면 병합하지 않는다.
- 기존 컬럼(`business_registration_number`, `representative_name`, `business_address`)은 그대로다.
- 승인 시 `copyMerchantLegalFromOnboardingRequest` 가 검증 컬럼도 신규 테넌트에 복사한다. 기존 테넌트 UPDATE/heal 금지.

## 시크릿

| 이름 | 없으면 |
| --- | --- |
| `NTS_BIZ_API_SERVICE_KEY` | (우선) 사업자 조회 결과 `미확인`. data.go.kr 디코딩 키. |
| `DATA_GO_KR_SERVICE_KEY` | `NTS_BIZ` 가 비었을 때 fallback. 둘 다 비면 미확인. |
| `JUSO_CONFM_KEY` | 주소 검색 UI 를 숨긴다. 수기 입력은 유지한다. |

Spring: `mindgarden.kr-public-data.nts.api-key: ${NTS_BIZ_API_SERVICE_KEY:${DATA_GO_KR_SERVICE_KEY:}}`.

개발 배포는 `.github/workflows/deploy-backend-dev.yml` 이 `/etc/mindgarden/dev.env` 에 `NTS_BIZ_API_SERVICE_KEY`·`DATA_GO_KR_SERVICE_KEY`·`JUSO_CONFM_KEY` 를 넣는다. 사업자 키와 주소 키가 모두 비면 배포는 성공하고 갱신을 skip 한다.

운영 배포는 `.github/workflows/deploy-production.yml` 이 동일 키를 `/etc/mindgarden/prod.env` 에 sync 한다(`skip_when=all_missing`). 예시: `deployment/mindgarden.prod-env.example`.

`dev` 프로필이고 `mindgarden.kr-public-data.stub.enabled` 가 켜져 있으면(`KR_PUBLIC_DATA_STUB_ENABLED`, 개발 기본값 true) 키가 없는 조회만 `KrPublicDataService` 가 성공으로 대체한다. 샘플은 `content/kr-public-data-stub.properties`. 키가 있으면 실제 클라이언트다. `prod`·`production` 프로필에서는 플래그와 무관하게 스텁하지 않는다.

키 값은 로그·커밋에 남기지 않는다.

## 화면

- 온보딩 Trinity `StepMerchantLegal`(SSOT): 공개 API 로 확인 결과(overallStatus, businessStatus, checkedAt, 휴업 경고) 표시. 제출 실패 시 서버 게이트 문구.
- 코어 `MerchantLegalSettings`: 인증 API.
- Ops 신청 상세: 저장된 결과를 사실 목록에 표시. 다시 확인은 코어 공개 조회를 호출하고 저장하지 않는다.

## TODO

과학기술정보통신부 '모두의 AI' 공식 오픈(12월) 이후 공공 AI 검색과 추가로 개방된 API 연동을 검토한다. 지금은 구현하지 않는다.
