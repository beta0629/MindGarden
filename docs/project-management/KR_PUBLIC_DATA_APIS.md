# 공공데이터 공통 API (국세청·도로명주소)

개발(`release/dev`) 전용. 운영 워크플로와 `release/prod` 는 이 문서의 후속 항목으로만 남긴다.

## 범위

- 국세청 사업자 상태조회 `POST /status`, 진위확인 `POST /validate` (`api.odcloud.kr`, `serviceKey`).
- 도로명주소 검색 `business.juso.go.kr/addrlink/addrLinkApi.do` (`confmKey`).
- 외부 HTTP, 키, 타임아웃, 재시도, 실패 시 `미확인` 은 `KrPublicDataClient` / `KrPublicDataService` 만 담당한다.

## 공통 엔드포인트

| 경로 | 인증 | 용도 |
| --- | --- | --- |
| `GET/POST /api/v1/public/kr-public-data/**` | `permitAll`. IP 분당 20회 (`kr_public_data`) | 비로그인 온보딩, Ops 다시 확인 |
| `GET/POST /api/v1/kr-public-data/**` | `isAuthenticated()` | 코어 `/tenant/merchant-legal` |

하위 경로: `GET /capabilities`, `GET /addresses?keyword=`, `POST /business-registration/lookup`.

신청 제출과 가맹 저장은 HTTP 로 자신을 부르지 않고, 트랜잭션 시작 전에 서비스를 직접 호출한다.

## 저장

새 컬럼 없음.

- 온보딩: `onboarding_request.checklist_json.merchantLegal` (`openingDate`, `businessVerification`).
- 테넌트: `tenants.settings_json.krPublicData`. 객체가 아니면 병합하지 않는다.
- 기존 컬럼(`business_registration_number`, `representative_name`, `business_address`)은 그대로다.

## 시크릿

| 이름 | 없으면 |
| --- | --- |
| `DATA_GO_KR_SERVICE_KEY` | 사업자 조회 결과 `미확인`. data.go.kr 디코딩 키를 넣는다. |
| `JUSO_CONFM_KEY` | 주소 검색 UI 를 숨긴다. 수기 입력은 유지한다. |

개발 배포는 `.github/workflows/deploy-backend-dev.yml` 만 `/etc/mindgarden/dev.env` 에 넣는다. 둘 다 비면 배포는 성공하고 기능만 꺼진다.

## 화면

- 온보딩 `StepMerchantLegal`: 공개 API.
- 코어 `MerchantLegalSettings`: 인증 API.
- Ops 신청 상세: 저장된 결과를 사실 목록에 표시. 다시 확인은 코어 공개 조회를 호출하고 저장하지 않는다. Ops 백엔드 개발 배포 워크플로가 없어 코어 공개 경로를 쓴다.

## 운영에 나중에 필요한 것

구현하지 않음. `DATA_GO_KR_SERVICE_KEY`, `JUSO_CONFM_KEY` 를 production GitHub environment, `/etc/mindgarden/prod.env`, `deploy-production.yml` 의 env·SSH 동기화에 같은 방식으로 연결한다.

## TODO

과학기술정보통신부 '모두의 AI' 공식 오픈(12월) 이후 공공 AI 검색과 추가로 개방된 API 연동을 검토한다. 지금은 구현하지 않는다.
