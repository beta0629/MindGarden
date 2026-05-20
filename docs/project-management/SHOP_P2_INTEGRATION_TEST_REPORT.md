# Shop P2 — 통합 검증 보고서 (web + admin + P1 보강)

| 항목 | 내용 |
|------|------|
| 일자 | 2026-05-20 (배치 **4/4** R10 재검증) · 2026-05-19 (**14:42 KST** REG-01) |
| 범위 | Shop P1 + P2-web + P2-admin + 환불·fulfillment·주문 MockMvc |
| SSOT | [SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md](./SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md), [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) |
| 코드 수정 | **없음** (core-tester 전체 Maven 검증·문서 갱신) |
| 커밋 | 없음 |

---

## 1. 판정 요약

### 1.0 Tier A — REG-01 · R10 (2026-05-19 14:42 KST)

| ID | 게이트 | exit | passed | skipped | failed | 판정 |
|----|--------|------|--------|---------|--------|------|
| **REG-01** | Maven Shop **14클래스** (`ShopNotificationHelperImplTest` 포함) | **0** (`-DforkCount=0`) | **91** | 0 | 0 | **PASS** |
| **REG-01** | Maven (위임 명령: `mvn clean test … -DforkCount=1 test`) | **1** | — | — | — | **FAIL** (testCompile `NoSuchFileException` / fork `ClassNotFoundException` — 로컬 `target` 경합) |
| **REG-01** | Expo Jest `pushScenarios\|clientShop` | **0** | **32** (5 suite) | 0 | 0 | **PASS** |
| **REG-01** | `frontend` `npm run build:ci` | **0** | — | — | — | **PASS** (eslint 경고만) |
| **R10** | Playwright `client-shop-catalog-to-cart` (chromium) | **0** | 0 | **1** | 0 | **SKIP** — `skipWhenLocalBackend8080Down` (8080 미기동) |
| **R10** | Playwright `admin-shop-catalog-skus-smoke` (chromium) | **0** | 0 | **1** | 0 | **SKIP** — 동일 |
| **R10** | Playwright 전 프로젝트 (firefox/webkit) | **1** | 0 | 2 | **4** | **환경** — `npx playwright install` 미실행 |

**Tier A 종합**: **REG-01 = GO** (자동 회귀). **R10 = 잔여** (8080·OPS·시드·Flyway 후 재실행).

### 1.0.1 Tier A — R10 배치 4/4 (2026-05-20 · `e52678ab7` 후)

| ID | 게이트 | exit | passed | skipped | failed | 판정 |
|----|--------|------|--------|---------|--------|------|
| **선행** | `GET https://dev.core-solution.co.kr/actuator/health` | — | — | — | — | **200** `{"status":"UP"}` |
| **R10-A** | Playwright (위임 명령: localhost:3000 + `E2E_TENANT_ID` only) | **0** | 0 | **2** | 0 | **BLOCKED** — `skipWhenLocalBackend8080Down` (로컬 **8080** 미기동; `curl :8080/actuator/health` 실패) |
| **R10-B** | Playwright (권장 dev 스택) | **0** | **2** | 0 | 0 | **PASS** — `BASE_URL=https://mindgarden.dev.core-solution.co.kr` + `E2E_API_BASE=https://dev.core-solution.co.kr` + `E2E_TENANT_ID=tenant-incheon-counseling-001`, chromium, ~5s |

**R10-A 명령** (배치 4 위임 · 로컬-only):

```bash
cd tests/e2e && env -u CI E2E_TENANT_ID=tenant-incheon-counseling-001 \
  npx playwright test client-shop-catalog-to-cart admin-shop-catalog-skus-smoke --project=chromium
```

**R10-B 명령** (배치 4 실측 · dev FE+API):

```bash
cd tests/e2e && env -u CI \
  E2E_TENANT_ID=tenant-incheon-counseling-001 \
  E2E_API_BASE=https://dev.core-solution.co.kr \
  BASE_URL=https://mindgarden.dev.core-solution.co.kr \
  npx playwright test client-shop-catalog-to-cart admin-shop-catalog-skus-smoke --project=chromium
```

**전제**: dev health **200**; `CLIENT_SHOP`·`ADMIN_SHOP_CATALOG` **ACTIVE** + 노출 SKU ≥1 (client 스펙 **게이트 skip 없음** → 활성·SKU 전제 충족으로 간주). 인천 테넌트 내담자·ERP 자격은 `erpAuth` 기본값(로컬 env).

**Tier A (배치 4)**: **R10 = PASS** (dev FE+API 스택). 로컬-only 위임 명령은 **BLOCKED**.

권장 Maven (CI·로컬 게이트): `-DforkCount=0` 또는 `rm -rf target && mvn test -Dtest=… -DforkCount=1` (중복 `test` goal·동시 `clean` 금지).

| 게이트 | 결과 |
|--------|------|
| Shop 관련 Maven 테스트 **91건** | **PASS** (BUILD SUCCESS, **14클래스**, ~22s, `-DforkCount=0`; R11 `ShopNotificationHelperImplTest` **+7**) |
| hold TTL (R4) | **4건 PASS** — `ShopOrderHoldExpiryServiceImplTest` |
| Admin Controller slice | **13건 PASS** (카탈로그 **8** + 포인트 정책 2 + 주문 3) |
| Client API slice | **8건 PASS** (catalog·ledger·**컴포넌트 403**·주문 400·**consultant-mappings R8**) |
| 환불·fulfillment 단위 | **10건 PASS** (refund 6 + fulfillment 4) |
| P1 GAP T6 cross-tenant | **2건 반영** (`cancelOrder`·`preparePayment` 단위) |
| P1 GAP H4·I3 | **반영** — §4·§보강 결과 참고 |
| Playwright Shop E2E | **2 spec** (client R10 + admin smoke), chromium **2 skipped** (8080 미기동, exit 0) — §6.1 |
| Flyway P2 마이그레이션 | **5종 + V20260519_001 버전 충돌** — §7 |
| P2 통합 GO | **조건부 GO** — Flyway 적용 + §5·§6 수동 스모크 후 |

---

## 2. Maven 단위 테스트 실행

```bash
mvn test -Dtest=AdminShopCatalogSkuServiceImplTest,AdminShopCatalogSkuControllerMvcTest,AdminPointTenantPolicyControllerMvcTest,AdminShopOrderControllerMvcTest,ClientShopControllerMvcTest,ClientShopCheckoutServiceImplTest,ClientPointWalletServiceImplTest,PointTenantPolicyServiceImplTest,TenantComponentActivationServiceImplTest,ShopOrderFulfillmentServiceImplTest,AdminShopOrderRefundServiceImplTest,ShopOrderHoldExpiryServiceImplTest,ClientShopConsultantMappingServiceImplTest,ShopNotificationHelperImplTest -DforkCount=0
```

| 클래스 | Tests | Failures | Errors | Skipped | 결과 |
|--------|-------|----------|--------|---------|------|
| `TenantComponentActivationServiceImplTest` | 3 | 0 | 0 | 0 | PASS |
| `AdminPointTenantPolicyControllerMvcTest` | 2 | 0 | 0 | 0 | PASS |
| `AdminShopOrderControllerMvcTest` | 3 | 0 | 0 | 0 | PASS |
| `ClientShopControllerMvcTest` | 8 | 0 | 0 | 0 | PASS |
| `AdminShopCatalogSkuControllerMvcTest` | 8 | 0 | 0 | 0 | PASS |
| `AdminShopOrderRefundServiceImplTest` | 6 | 0 | 0 | 0 | PASS |
| `ShopOrderHoldExpiryServiceImplTest` | 4 | 0 | 0 | 0 | PASS |
| `ClientShopCheckoutServiceImplTest` | 22 | 0 | 0 | 0 | PASS |
| `AdminShopCatalogSkuServiceImplTest` | 5 | 0 | 0 | 0 | PASS |
| `ShopOrderFulfillmentServiceImplTest` | 4 | 0 | 0 | 0 | PASS |
| `ClientShopConsultantMappingServiceImplTest` | 3 | 0 | 0 | 0 | PASS |
| `PointTenantPolicyServiceImplTest` | 2 | 0 | 0 | 0 | PASS |
| `ClientPointWalletServiceImplTest` | 14 | 0 | 0 | 0 | PASS |
| **합계** | **84** | **0** | **0** | **0** | **BUILD SUCCESS** |

소요: 약 36s (2026-05-19 14:18 KST).

**재실행 주의**: 기본 병렬 fork 시 `ClassNotFoundException`(예: `ClientShopControllerMvcTest`)으로 BUILD FAILURE가 날 수 있음 — 위처럼 `-DforkCount=1` 또는 `mvn clean test` 권장.

### 2.0 MockMvc slice 회귀 (R10 — 코더 산출 후)

Controller slice만 빠르게 돌릴 때:

```bash
mvn -Dtest=ClientShopControllerMvcTest,AdminShopCatalogSkuControllerMvcTest test
```

| 클래스 | Tests | 기대 | 비고 |
|--------|-------|------|------|
| `ClientShopControllerMvcTest` | 8 | PASS | catalog·ledger·`CLIENT_SHOP`/`CLIENT_REWARD` 403·주문 없음 400·**consultant-mappings (R8)** |
| `AdminShopCatalogSkuControllerMvcTest` | 8 | PASS | 목록·tenant 스코프·401/403·**`ADMIN_SHOP_CATALOG` 비활성 403**·price-history·PATCH catalog-visible |

부트스트랩: `ClientShopControllerMvcTestApplication`, `AdminShopCatalogSkuControllerMvcTestApplication` (`src/test/java/com/coresolution/integrationtest/shop/`).

### 2.0.1 hold TTL (R4)

```bash
mvn -Dtest=ShopOrderHoldExpiryServiceImplTest test
```

| @DisplayName | 검증 |
|--------------|------|
| 만료 대상 주문을 expireOrderHold로 처리 | `expireStaleHoldsForTenant` → `expireOrderHold` 1회 |
| 이미 종료된 주문은 expireOrderHold false로 카운트 제외 | 멱등 스킵, count=0 |
| hold_ttl_minutes=0이면 조회·만료 미실행 | repository·checkout 미호출 |
| PAID 등은 repository 조회 대상에서 제외(만료 0건) | 빈 목록 |

**미커버 (§11 시나리오 초안)**: 스케줄러·멀티테넌트 배치 통합, `expireOrderHold` → `EXPIRED`·`releaseHold` DB 연동.

**식별된 Shop 관련 `*Test.java` (12건, R10 suite)**:

1. `src/test/java/com/coresolution/consultation/integration/AdminShopCatalogSkuControllerMvcTest.java`
2. `src/test/java/com/coresolution/consultation/integration/AdminPointTenantPolicyControllerMvcTest.java`
3. `src/test/java/com/coresolution/consultation/integration/AdminShopOrderControllerMvcTest.java`
4. `src/test/java/com/coresolution/consultation/integration/ClientShopControllerMvcTest.java`
5. `src/test/java/com/coresolution/consultation/service/impl/AdminShopCatalogSkuServiceImplTest.java`
6. `src/test/java/com/coresolution/consultation/service/impl/AdminShopOrderRefundServiceImplTest.java`
7. `src/test/java/com/coresolution/consultation/service/impl/ClientShopCheckoutServiceImplTest.java`
8. `src/test/java/com/coresolution/consultation/service/impl/ClientPointWalletServiceImplTest.java`
9. `src/test/java/com/coresolution/consultation/service/impl/PointTenantPolicyServiceImplTest.java`
10. `src/test/java/com/coresolution/consultation/service/impl/ShopOrderFulfillmentServiceImplTest.java`
11. `src/test/java/com/coresolution/core/service/impl/TenantComponentActivationServiceImplTest.java`
12. `src/test/java/com/coresolution/consultation/service/impl/ShopOrderHoldExpiryServiceImplTest.java`

### 2.1 P2-admin (`AdminShopCatalogSkuServiceImplTest` — **5건**)

| @DisplayName | 검증 내용 |
|--------------|-----------|
| patchCatalogVisible — 존재하지 않으면 EntityNotFoundException | tenant·id 스코프 조회 실패 |
| create — skuCode 중복이면 IllegalArgumentException | 테넌트 내 skuCode 유일 |
| patchCatalogVisible — catalogVisible 반영 | 노출 플래그 저장 |
| update — unit_price_minor 변경 시 이력 1건 저장 | **R3** `ShopCatalogSkuPriceHistory` 저장 |
| update — unit_price_minor 동일하면 이력 skip | **R3** 이력 미저장 |

**미커버**: `list` / `get` 정상 경로, `catalog_category` 필드, 타 테넌트 id.

### 2.2 P1 checkout·wallet (P1 GAP 보강 반영)

| 클래스 | 신규·보강 @DisplayName | 검증 |
|--------|------------------------|------|
| `ClientShopCheckoutServiceImplTest` | 포인트 전액 체크아웃 시 즉시 PAID·hold·commit | H4: `PAID`, `hold`+`commitHold`+`creditEarn`, `paymentService`·`paymentRepository` 미호출 |
| `ClientShopCheckoutServiceImplTest` | 다른 tenantId로 preparePayment 시 주문 없음 거부 | T6+: cross-tenant not found |
| `ClientPointWalletServiceImplTest` | hold / releaseHold 멱등 키 중복 시 no-op | I3: `lock`·`save` 미호출 |
| `ClientPointWalletServiceImplTest` | creditEarn·commitHold 멱등 (기존) | EARN·COMMIT 멱등 |

**EARN suite 포함**: `creditEarn_increasesAvailableAndPersistsLedger`, `creditEarn_duplicateIdempotency_skips`, `completeOrderOnPaymentApproved_creditsEarnOnCashDue`, `completeOrderOnPaymentApproved_earnCapApplied`, `checkout_pointsOnly_paidImmediately`(creditEarn verify) — 위 7클래스 35건에 **포함·PASS**.

### 2.3 Admin Controller slice

| 항목 | 상태 |
|------|------|
| `AdminShopCatalogSkuController` MockMvc slice | **8건** — 목록·tenant·401/403·**`ADMIN_SHOP_CATALOG` 비활성 403**·CLIENT 403·price-history 200/403·PATCH catalog-visible |
| `AdminPointTenantPolicyController` slice | **2건** — `AdminPointTenantPolicyControllerMvcTest` (GET 200·MVP 키, TenantContext tenant 스코프) |
| `AdminShopOrderController` slice | **3건** — `AdminShopOrderControllerMvcTest` (GET 목록·GET 상세·POST refund 200·REFUNDED) |
| `ClientShopController` MockMvc slice | **6건** — catalog·ledger·**`CLIENT_SHOP`/`CLIENT_REWARD` 비활성 403**·타 tenant 주문 **400** |
| 부트스트랩 | `AdminShopCatalogSkuControllerMvcTestApplication`, `AdminPointTenantPolicyControllerMvcTestApplication`, `AdminShopOrderControllerMvcTestApplication`, `ClientShopControllerMvcTestApplication` |

**추가 권장**(차단 아님): Client 세션 없음 401 slice.

### 2.4 환불·이행(fulfillment) 단위

| 클래스 | @DisplayName | 검증 |
|--------|--------------|------|
| `AdminShopOrderRefundServiceImplTest` | PAID 전액 환불 — 복원·clawback·REFUNDED | `restoreRedeemOnRefund`·`clawbackEarn`·`save` |
| `AdminShopOrderRefundServiceImplTest` | PAID→REFUNDED — clawback 멱등(0 반환) | wallet 중복 키 시 `pointsClawedBackMinor=0`, 주문 **REFUNDED** |
| `AdminShopOrderRefundServiceImplTest` | 이미 REFUNDED면 멱등 no-op | wallet·`save` 미호출 |
| `AdminShopOrderRefundServiceImplTest` | PAID가 아니면 환불 불가 | `IllegalArgumentException` |
| `ShopOrderFulfillmentServiceImplTest` | CONSULTATION — COMPLETED·훅 1회 | 이벤트 저장·`onConsultationPackagePaid` |
| `ShopOrderFulfillmentServiceImplTest` | 동일 주문 재호출 — 멱등 스킵 | line 조회·save·훅 미호출 (**추가 생략**) |
| `ShopOrderFulfillmentServiceImplTest` | ASSESSMENT — PENDING, 훅 미호출 | PENDING 이벤트만 |

**연계**: `ClientPointWalletServiceImplTest.clawbackEarn_duplicateIdempotency_skips` — wallet 레이어 clawback 멱등(I3 확장).

---

## 3. P2 범위 vs 테스트 커버리지

| 영역 | 구현(로컬) | 자동 테스트 | 비고 |
|------|------------|-------------|------|
| PLP 카테고리·SKU 카드 | O (`catalog_category`, FE 탭) | 없음 | Flyway 001 후 API 확인 |
| 어드민 SKU CRUD·노출·가격 이력 | O | Service 5건 + MockMvc 8건 | E2E 없음 |
| 어드민 포인트 정책 GET/PATCH | O | Controller slice 2건 | PATCH·401은 수동 §5.2 |
| 내담자 PLP→cart→checkout→points | O (라우트·서비스) | P1 checkout 5건만 | 수동 §6 |
| PG·포인트 commit/hold (P1) | O | 17건 | SSOT §2 |
| 어드민 주문 목록·상세·환불 API | O | Controller slice 3건 + refund 단위 4건 | Flyway 004·005 |
| PAID 후 fulfillment | O | 단위 3건 | `shop_order_fulfillment_events` |

---

## 4. P1 GAP 보강 제안 (core-coder 위임 — 코드 수정 없음)

SSOT [SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md](./SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md) §2·§4 기준. **구현은 이미 존재**, 단위 테스트만 보강.

### 4.1 교차 tenant (T6)

| 항목 | 상태 |
|------|------|
| 반영 | `cancelOrder_crossTenant_throwsNotFound`, `preparePayment_crossTenant_throwsNotFound` — `findByTenantIdAndPublicId` 빈 결과 → `IllegalArgumentException`("주문을 찾을 수 없습니다."), PG `createPayment`/`getPayment` 미호출 |
| 반영(slice) | `ClientShopControllerMvcTest` — `getOrder` 주문 없음 시 **400** (`IllegalArgumentException`·GlobalExceptionHandler). 404는 서비스가 `EntityNotFoundException`을 던질 때만 |
| 우선순위 | — (P3 slice 완료) |

### 4.2 포인트 전액 checkout (H4)

| 항목 | 상태 |
|------|------|
| 반영 | `checkout_pointsOnly_paidImmediately` — `PAID`, `nextStep=DONE`, `hold`+`commitHold`+`creditEarn`, `paymentService`·`paymentRepository` 미호출 |
| 클래스 | `ClientShopCheckoutServiceImplTest` |

### 4.3 hold / releaseHold 멱등 (I3)

| 항목 | 상태 |
|------|------|
| 반영 | `hold_duplicateIdempotency_skips`, `releaseHold_duplicateIdempotency_skips` — `lock`·`save` 미호출 |
| 클래스 | `ClientPointWalletServiceImplTest` |

### 4.4 부가 GAP (P1 SSOT, P2에서 선택)

| ID | 제안 테스트 | 우선순위 |
|----|-------------|----------|
| H3 | `releaseOrderHoldOnPaymentFailure_alreadyPaid_noRelease` — PAID 시 `releaseHold`·`save` 미호출 | **완료** |
| I5 | `checkout_idempotencyKey_mapsToPointHoldKey` — PG mix hold에 `pointHoldKey(idemKey)` | **완료** |
| T2~T3 | 장바구니·preparePayment clientId 소유 검증 | P3 |

---

## 5. Admin API 스모크 체크리스트

**전제**: Flyway §7 적용, 어드민 JWT, `X-Tenant-ID`, `ADMIN` 또는 `STAFF` 역할.

### 5.1 카탈로그 SKU (`/api/v1/admin/shop/catalog-skus`)

| # | 메서드·경로 | 요청 | 기대 |
|---|-------------|------|------|
| A1 | `GET /catalog-skus` | — | `success=true`, 배열(빈 배열 허용) |
| A2 | `POST /catalog-skus` | `skuCode`, `title`, `unitPriceMinor`, `currency`, `catalogVisible`, `active`, `sortOrder` | `201`, `data.id` 존재 |
| A3 | `POST` 동일 `skuCode` | A2와 동일 tenant | `4xx`, 중복 메시지 |
| A4 | `GET /catalog-skus/{id}` | A2의 id | 상세 필드 일치 |
| A5 | `PUT /catalog-skus/{id}` | `title` 등 수정 | `200`, 반영 |
| A6 | `PATCH /catalog-skus/{id}/catalog-visible` | `{ "catalogVisible": false }` | `200`; 내담자 PLP에서 비노출 |
| A7 | 타 tenant SKU id | 다른 `X-Tenant-ID` | `404` / not found |
| A8 | 역할 없음 | Bearer 없음 또는 CLIENT | `401`/`403` |

**UI**: `/admin/shop/catalog-skus` — 목록·생성·수정·노출 토글이 A1~A6과 동일 동작.

### 5.2 포인트 정책 (`/api/v1/admin/shop/point-policies`)

| # | 메서드·경로 | 요청 | 기대 |
|---|-------------|------|------|
| B1 | `GET /point-policies` | — | MVP 키 6종 (`earn_rate`, `earn_cap_per_order`, `min_order_for_redeem`, `max_redeem_per_order`, `allow_pg_mix`, `allow_points_only`) |
| B2 | `PATCH /point-policies` | `{ "policies": { "min_order_for_redeem": { "amountMinor": 10000 } } }` | `200`, GET과 일치 |
| B3 | `PATCH` 알 수 없는 키 | `{ "policies": { "unknown": {} } }` | `4xx` |
| B4 | 빈 policies | `{ "policies": {} }` | validation `4xx` |

**UI**: `/admin/shop/point-policies` — 조회·일부 키 수정·저장 후 B1 재조회.

### 5.3 온라인 주문 (`/api/v1/admin/shop/orders`)

| # | 메서드·경로 | 요청 | 기대 |
|---|-------------|------|------|
| C1 | `GET /orders?limit=50` | — | `success=true`, 최근 주문 배열 |
| C2 | `GET /orders/{orderPublicId}` | PAID 주문 id | 라인·`fulfillmentEvents` 포함 상세 |
| C3 | `POST /orders/{orderPublicId}/refund` | `{ "reasonCode": "CUSTOMER_REQUEST" }` | `200`, `status=REFUNDED`, `pointsRestoredMinor`·`pointsClawedBackMinor` |
| C4 | `POST` refund 재호출 | C3 동일 주문 | 멱등: `REFUNDED` 유지, 이중 clawback 없음 |
| C5 | `POST` refund — CREATED 주문 | — | `4xx` (PAID만 허용) |
| C6 | 컴포넌트 비활성 | `ADMIN_SHOP_CATALOG` off | `403` |

**자동화**: C1~C3 happy path — `AdminShopOrderControllerMvcTest` 3건 PASS. C4~C6은 수동 또는 P3 slice.

---

## 6. Client web 플로우 체크리스트 (수동)

**전제**: 내담자 로그인, Flyway §7, 어드민에서 `catalogVisible=true` SKU 1건 이상, 포인트 잔액 시드(전액 결제 시).

| # | 경로 | 동작 | 기대 |
|---|------|------|------|
| C1 | `/client/shop` | PLP 로드, 카테고리 탭 전환 | SKU 목록·가격 표시, 탭별 필터 |
| C2 | PLP | SKU 담기 → 장바구니 | 수량 반영 |
| C3 | `/client/shop/cart` | 수량 변경·삭제 | `PUT /cart` 반영, 소계 갱신 |
| C4 | 장바구니 → 결제 | `/client/shop/checkout` 이동 | 요약·포인트 입력·약관 |
| C5 | 카드 전액 | `pointsToRedeemMinor=0`, 체크아웃 | `nextStep=PAYMENT`, PG 준비 가능 (P1 QA-1) |
| C6 | 포인트 전액 | 가용 ≥ 소계, 전액 사용 | `nextStep=DONE`, 주문 `PAID` (P1 QA-2) |
| C7 | `/client/shop/points` | 잔액·내역 | `GET points/balance`와 UI 일치 |
| C8 | 테넌트 배너 | — | 플레이스홀더 또는 설정 연동 카피 (미연동 시 상수 문구) |

**회귀**: 레거시 `/client/shop-catalog` 등 → `/client/shop` 리다이렉트.

### 6.1 Playwright E2E

| 항목 | 상태 |
|------|------|
| `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts` | **스펙 준비·전제 문서화** (PLP → cart) |
| 전제 체크리스트 | [`tests/e2e/README.md`](../../tests/e2e/README.md) §「내담자 쇼핑 (CLIENT_SHOP)」 — Flyway·SKU·`CLIENT_SHOP` 활성 |
| skip 가드 | `skipWhenCiMissingE2eCredentials` + `skipWhenLocalBackend8080Down` (beforeEach) |
| R10 로컬 (2026-05-19 **14:42** KST) | **2 skipped** (chromium) — `client-shop-catalog-to-cart` + `admin-shop-catalog-skus-smoke`; 8080 down, exit **0** |
| R10 dev (2026-05-20 **배치 4/4**) | **2 passed** (chromium, ~5s) — `mindgarden.dev` + `E2E_API_BASE` + `tenant-incheon-counseling-001`; `CLIENT_SHOP` 게이트 미노출 |
| R10 localhost only (배치 4) | **2 skipped** (chromium, exit **0**) — **8080** 미기동 → `skipWhenLocalBackend8080Down` (**BLOCKED**) |
| admin smoke spec | `tests/e2e/tests/admin/admin-shop-catalog-skus-smoke.spec.ts` — R10과 동일 skip 가드 |
| 통과 조건 | **(A)** 8080+3000 로컬 또는 **(B)** `BASE_URL` dev FE + `E2E_API_BASE` health 200 + OPS·노출 SKU·자격 |

**재실행**: `cd tests/e2e && npx playwright test client-shop-catalog-to-cart --project=chromium`

---

## 7. Flyway 적용 (필수)

로컬·스테이징·운영 반영 **전** 아래 마이그레이션 미적용 시 P2 기능 오류 가능.

| 버전 | 파일 | 내용 | 영향 |
|------|------|------|------|
| V20260519_001 | `V20260519_001__shop_catalog_category_column.sql` | `shop_catalog_skus.catalog_category` | PLP 카테고리 탭·필터 |
| V20260519_002 | `V20260519_002__point_tenant_policies.sql` | `point_tenant_policies` 테이블 | 어드민 정책 GET/PATCH |
| V20260519_003 | `V20260519_003__shop_reward_component_catalog_seed.sql` | 컴포넌트 카탈로그 시드 | 테넌트 컴포넌트 활성 |
| V20260519_004 | `V20260519_004__shop_order_refunded_status.sql` | `shop_client_orders.status`에 **REFUNDED** | 어드민 전액 환불 |
| V20260519_005 | `V20260519_005__shop_order_fulfillment_events.sql` | `shop_order_fulfillment_events` | PAID 후 이행 이벤트·멱등 |

**블로커**: `V20260519_001__salary_calculations_audit_columns_out_of_order.sql` 과 **동일 Flyway 버전 충돌** — migrate 전 core-coder 재번호 필요.

```bash
# 예: 애플리케이션 기동 시 Flyway 자동 적용 또는 운영 절차에 따른 migrate
# 적용 후 확인
# SELECT catalog_category FROM shop_catalog_skus LIMIT 1;
# SHOW TABLES LIKE 'point_tenant_policies';
# SHOW TABLES LIKE 'shop_order_fulfillment_events';
# DESCRIBE shop_client_orders;  -- status COMMENT에 REFUNDED 포함
```

---

## 8. P1 수동 QA 연계 (스테이징)

P2 통합 후에도 P1 게이트 3건은 **재확인 권장** (SSOT §3):

1. **QA-1** 카드 전액 — C5 + PG 승인 → `PAID`
2. **QA-2** 포인트 전액 — C6
3. **QA-3** PG 실패 — hold 해제·`CREATED` 복귀

---

## 9. core-coder 위임 요약

| 우선순위 | 항목 | 유형 |
|----------|------|------|
| P2 | `ClientShopCheckoutServiceImplTest` 포인트 전액 H4 | **완료** |
| P2 | `ClientPointWalletServiceImplTest` hold/releaseHold 멱등 I3 | **완료** |
| P2 | Admin Shop·Point Policy MockMvc slice 4건 | **완료** |
| P2 | `preparePayment` cross-tenant T6+ | **완료** |
| P3 | Client API slice (catalog·ledger·주문 없음 400) | **완료** |
| P3 | Admin Shop slice (401/403·PATCH catalog-visible) | **완료** |
| P3 | H3·I5 checkout 단위 | **완료** |
| P3 | Playwright `client-shop-catalog-to-cart` 1 시나리오 | E2E |
| P2 | Admin 주문 list·detail·refund slice + refund·fulfillment 단위 | **완료** |

---

## 10. 최종 권고 (GO / NO-GO)

**판정: 조건부 GO.** Maven Shop **13클래스 84건 BUILD SUCCESS**(약 36s, R8 mapping·hold TTL·컴포넌트 403 slice 포함)로 백엔드 자동화 게이트는 통과. Flyway **007 재번호로 001 충돌 해소**, Expo clientShop Jest **19건 PASS**. Flyway **002~007·V20260520_001·V20260521_001(LNB) 미적용**, 수동 스모크·Playwright **스킵/미완** — **운영 GO 불가**.

---

## 보강 결과 (P2/P3 GAP 배치, 2026-05-19)

| ID | 산출물 | 결과 |
|----|--------|------|
| H4 | `checkout_pointsOnly_paidImmediately` + PG 미호출 verify | PASS |
| I3 | `hold_duplicateIdempotency_skips`, `releaseHold_duplicateIdempotency_skips` | PASS |
| T6+ | `preparePayment_crossTenant_throwsNotFound` | PASS |
| H3 | `releaseOrderHoldOnPaymentFailure_alreadyPaid_noRelease` | PASS — PAID 시 `releaseHold`·`save` 미호출, 반환값 `true`(멱등 no-op) |
| I5 | `checkout_idempotencyKey_mapsToPointHoldKey` | PASS — PG mix 시 `hold(..., pointHoldKey(idemKey))` |
| T6 slice | `ClientShopControllerMvcTest.getOrder_crossTenant_returnsBadRequest` | PASS — **400** (주문 없음 메시지, 404 아님) |
| Admin | `AdminPointTenantPolicyControllerMvcTest` ×2 | PASS |
| Admin P3 | `AdminShopCatalogSkuControllerMvcTest` +3 — 인증 없음 401/403·CLIENT 403·PATCH catalog-visible 200 | PASS |
| Client P3 | `ClientShopControllerMvcTest` ×4 — catalog 빈/데이터·ledger 200 | PASS |
| EARN | `creditEarn_*`·`completeOrderOnPaymentApproved_*earn*`·checkout creditEarn verify | 60건 suite **포함·PASS** |
| Refund | `refundPaidOrder_clawbackIdempotentZero_stillRefunded` | PASS — PAID→REFUNDED, clawback 0 반환 시에도 REFUNDED |
| Refund 멱등 | `refundPaidOrder_alreadyRefunded_idempotent` | PASS |
| Fulfillment | CONSULTATION·ASSESSMENT·주문 멱등 스킵 | 3건 PASS (CONSULTATION 멱등 **기존**, 추가 생략) |
| Admin 주문 API | `AdminShopOrderControllerMvcTest` GET list·GET detail·POST refund | 3건 PASS |
| — | Shop Maven **13클래스 84건** | BUILD SUCCESS (~36s, `-DforkCount=1`) |
| R4 hold TTL | `ShopOrderHoldExpiryServiceImplTest` ×4 | PASS |
| R8 mapping | `ClientShopConsultantMappingServiceImplTest` ×3 + Client slice +2 | PASS |
| R10 slice | `ClientShopControllerMvcTest` 8·`AdminShopCatalogSkuControllerMvcTest` 8 | PASS |

신규·수정 테스트 파일 (환불·fulfillment·R10):

- `ShopOrderHoldExpiryServiceImplTest` — hold TTL 배치 단위 4건 (**R4**)
- `AdminShopCatalogSkuControllerMvcTest` — 컴포넌트 403·price-history (+3)
- `ClientShopControllerMvcTest` — `CLIENT_SHOP`/`CLIENT_REWARD` 403 (+2)

이전 (환불·fulfillment 배치):

- `AdminShopOrderRefundServiceImplTest` — refund 4건 (clawback 멱등 0 반환 **신규**)
- `ShopOrderFulfillmentServiceImplTest` — fulfillment 3건
- `AdminShopOrderControllerMvcTest` + `AdminShopOrderControllerMvcTestApplication` — list·get·refund slice 3건

이전 배치 (P3):

- `ClientShopControllerMvcTest`, `ClientShopControllerMvcTestApplication`
- `AdminShopCatalogSkuControllerMvcTest` — 인증·PATCH
- `ClientShopCheckoutServiceImplTest` — H3·I5·H4·T6
- `AdminPointTenantPolicyControllerMvcTest`

---

## 11. hold TTL — 미커버 시나리오 초안 (core-coder, R4 후속)

P1 SSOT [SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md](./SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md) **H5**. 단위 4건은 `ShopOrderHoldExpiryServiceImplTest` **PASS**; 아래는 통합·배치 권장.

| ID | 시나리오 | Given | When | Then |
|----|----------|-------|------|------|
| H5-1 | TTL 경과 `PENDING_PAYMENT` | `hold_ttl_minutes=30`, `createdAt` 31분 전, 포인트 hold 존재 | `expireStaleHoldsForTenant` 또는 스케줄러 1회 | `EXPIRED`(또는 `CREATED`), `releaseHold` 1회, PG 미호출 |
| H5-2 | TTL 미경과 | 10분 전 주문 | 동일 | 만료 0건, `expireOrderHold` 미호출 |
| H5-3 | `hold_ttl_minutes=0` | 정책 0 | 배치 | 조회·만료 전부 스킵 (단위 **PASS**) |
| H5-4 | 멱등 재배치 | 이미 `EXPIRED` | 재실행 | `expireOrderHold` false, clawback·이중 release 없음 |
| H5-5 | cross-tenant | tenant A 주문 | tenant B 배치 | A 주문 미처리 |

---

| 2026-05-20 | **배치 4/4** — dev health **200**; R10-B **2 passed** (~5s); R10-A 위임 **2 skipped** (**BLOCKED** — 8080 미기동) |

*작성: core-tester · R10 문서·검증 · 커밋 없음*
