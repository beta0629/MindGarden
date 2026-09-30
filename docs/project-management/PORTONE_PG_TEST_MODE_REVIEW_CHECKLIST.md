# PortOne PG 테스트 모드 — 심사·연동 체크리스트

PortOne V2 Hybrid B(테넌트↔PG 직접) 테스트 결제·카드사 온보딩 리뷰용 절차입니다.
storeId/channelKey 는 **절대 코드에 하드코딩하지 않습니다.** 테넌트 PG 설정 UI·DB(`tenant_pg_configurations`)만 사용합니다.

## 0. 이용기간·결제유형 SSOT (P0 카피)

제품 SSOT (리더 확정) — 공개 상품·샵 PDP·체크아웃·약관에 동일 문구:

| 항목 | PASS 기준 문구 |
|------|----------------|
| 이용기간 | 단회기: 결제일부터 **2개월** 내 소진 · 패키지(최대 20회기): 결제일부터 **1년** 내 소진 · **무제한 유효기간 없음** |
| 결제 유형 | **일시불만** (정기결제·구독 없음) |

상수 SSOT: `CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE`, `CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE` (`frontend/src/constants/legalPublic.js`).

### MindGarden 고객 구매 스모크 URL

개발 (테넌트 서브도메인 `mindgarden` 예):

- https://mindgarden.dev.core-solution.co.kr/legal/products
- https://mindgarden.dev.core-solution.co.kr/client/shop (로그인 + `CLIENT_SHOP` 기능 ON)
- https://mindgarden.dev.core-solution.co.kr/client/shop/sku/{skuCode} → 장바구니 → `/client/shop/checkout`

운영 호스트 패턴 (동일 경로):

- https://mindgarden.core-solution.co.kr/... (`*.core-solution.co.kr`, 개발은 `*.dev.core-solution.co.kr`)

다른 테넌트도 `{sub}.dev.core-solution.co.kr` / `{sub}.core-solution.co.kr` 동일 경로를 사용합니다.

### 배포·연동 메모

- PortOne **테스트 모드 BE** (#1061) 는 `release/dev` 반영 가정.
- 샵 체크아웃 FE는 `@portone/browser-sdk` 핫픽스 배포가 **별도**일 수 있음 — 본 카피 작업과 중복하지 않음.
- **storeId / channelKey 하드코딩 금지.**

| 단계 | 내용 | PASS / FAIL |
|------|------|-------------|
| 0-1 | `/legal/products` 에 이용기간(2개월/1년) + 일시불 고지 표시 | |
| 0-2 | 샵 SKU 상세·체크아웃에 동일 SSOT 표시 | |
| 0-3 | 약관 제8조·환불 「이용기간과의 관계」가 SSOT와 일치 | |

## 1. 테넌트 PG 설정 (결제 연결)

| 단계 | 내용 | PASS / FAIL |
|------|------|-------------|
| 1-1 | 테넌트 포털 → PG 설정 → 제공자 **아임포트(포트원 결제모듈 V2)** 선택 | |
| 1-2 | **storeId**, **API Secret(시크릿 키)** 입력 | |
| 1-3 | **채널 키(운영/라이브)** · **채널 키(테스트)** 입력 (`settings_json` 키: `portoneChannelKey` / `portoneChannelKeyTest`) | |
| 1-4 | 심사·테스트 시 **테스트 모드 ON** → 결제에 테스트 채널 키 사용 | |
| 1-5 | (필수·backup) 웹훅 시크릿 `portoneWebhookSecret` 입력 — 미설정 시 웹훅 403, Path B 백업 복구 불가 | |
| 1-6 | 저장 후 승인 대기(PENDING) 상태 확인 | |

## 2. Ops 승인 + 활성화 (필수)

웹훅·ACTIVE 결제 경로는 **ACTIVE** 설정만 사용합니다.

| 단계 | 내용 | PASS / FAIL |
|------|------|-------------|
| 2-1 | Ops → PG 승인 관리에서 해당 설정 **승인** | |
| 2-2 | 승인 직후 자동 활성화 시도. 실패 시 상세 모달 **활성화** 버튼으로 ACTIVE 전환 | |
| 2-3 | 테넌트 상세에서 status=`ACTIVE`, approval=`APPROVED` 확인 | |

**Ops 승인·활성화 필요: YES**

## 3. 테스트 결제 실행

### A) 상세 페이지 스모크 (모듈 호출만)

| 단계 | 내용 | PASS / FAIL |
|------|------|-------------|
| 3A-1 | IAMPORT + testMode + ACTIVE 상세에서 **테스트 결제 모듈 호출** | |
| 3A-2 | PortOne 결제창/모듈이 뜨는지 확인 (금액 100 KRW, paymentId=`test_{timestamp}`) | |
| 3A-3 | 결과 모달/알림으로 성공·오류 코드 확인 | |

### B) 쇼핑 결제 경로

| 단계 | 내용 | PASS / FAIL |
|------|------|-------------|
| 3B-1 | 클라이언트 샵에서 주문 → prepare-payment | |
| 3B-2 | ACTIVE IAMPORT 가 있으면 provider=IAMPORT, 응답에 `storeId`+`channelKey` | |
| 3B-3 | 브라우저 `requestPayment` 후 `/api/v1/payments/{id}/verify` (PortOne REST PAID 검증) | |
| 3B-4 | 웹훅 `POST /api/v1/payments/webhooks/portone/v2` 도 ACTIVE 설정으로 동작 | |

## 4. 센터 운영 체크

| 항목 | PASS 기준 | PASS / FAIL |
|------|-----------|-------------|
| 이용약관 / 전자금융거래 안내 | 센터 사이트·앱 노출 | |
| 판매 상품·가격 표기 | 실결제 가능 상품 + `/legal/products` | |
| 이용기간 고지 | 단회기 2개월 · 패키지(최대 20회기) 1년 · 무제한 유효기간 없음 | |
| 결제 유형 고지 | 일시불만 (정기·구독 없음) | |
| 환불·취소 정책 | 고객 안내·운영 프로세스 + `/legal/refund` | |

## 5. 차단 요인 (Blocker)

- **포트원 콘솔에서 발급한 실제 storeId / 테스트·라이브 channelKey / API Secret 이 없으면** E2E 결제·모듈 호출은 불가합니다. CI 단위 테스트는 mock HTTP만 사용하며 실자격증명을 요구하지 않습니다.
- ACTIVE 미설정 시 웹훅은 `스토어 PG 설정 없음`, 클라이언트 설정 API는 channelKey/ACTIVE 오류를 반환합니다.
- 샵 체크아웃 FE `@portone/browser-sdk` 핫픽스가 미배포면 모듈 호출만 실패할 수 있음(카피·BE 테스트 모드와 별개).

## 6. 참고 API

- `GET /api/v1/tenants/{tenantId}/pg-configurations/active/portone-client-config` — 시크릿 미포함
- `POST /api/v1/clients/me/shop/orders/{orderPublicId}/prepare-payment` — IAMPORT 시 storeId/channelKey 포함
- `POST /api/v1/payments/{paymentId}/verify?amount=` — PortOne REST 검증 후 APPROVED
- `POST /api/v1/ops/pg-configurations/{configId}/activate` — APPROVED → ACTIVE
