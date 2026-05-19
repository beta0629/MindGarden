# Shop·Reward 구현 상태 (planner·OPS용)

| 항목 | 내용 |
|------|------|
| 일자 | 2026-05-19 (SSOT 동기화 — R11 알림·푸시 P0, Maven 103/15, Expo jest 32) |
| 범위 | Shop P1 + P2 (web·admin·Expo·환불·fulfillment·ERP 훅·컴포넌트 게이트) |
| SSOT | [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md), [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §3 |
| 코드 수정 | **없음** (문서만) |
| 커밋 | 없음 |

---

## 0. R1/R2·핵심 기능 요약

| ID | 항목 | 상태 | 산출물 |
|----|------|------|--------|
| **R1** | PG 실환불 (어드민 PAID→REFUNDED) | **완료** | `AdminShopOrderRefundServiceImpl` — `PaymentGatewayService.refundPayment`, 포인트 복원·clawback, 4단위 테스트 |
| **R2** | ERP fulfillment 훅 (CONSULTATION) | **완료** | `ErpShopConsultationFulfillmentHook` → `AdminService.confirmPayment`; Flyway **006** `consultant_client_mapping_id` |
| **R3** | SKU 가격 이력 API + Flyway | **완료** | `V20260520_001`, `GET .../catalog-skus/{id}/price-history`, `AdminShopCatalogSkuServiceImpl` 이력 append |
| **R4** | hold TTL 배치 + `hold_ttl_minutes` | **완료 (코드)** | `ShopOrderHoldExpiryScheduler`, `ShopOrderHoldExpiryServiceImplTest` 4건; 스케줄러 통합·H5 E2E는 [SHOP_P2 §11](./SHOP_P2_INTEGRATION_TEST_REPORT.md) 잔여 |
| **R9** | OPS 컴포넌트 + Client 403 | **완료 (코드·스크립트)** | `scripts/ops/activate-shop-reward-tenant-components.sql`, `ClientShopController` `CLIENT_SHOP` 비활성 403 |
| R5 | Phase 3 통합 마켓 | 잔여 | [MULTI_TENANT §8](./MULTI_TENANT_SHOP_MARKETPLACE_SPEC.md) |
| R8 | 체크아웃 UI mapping 선택 | **완료 (웹+Expo)** | `ShopCheckoutPage`·`expo-app/.../checkout.tsx`·`GET /consultant-mappings`·`clientShopCheckout` Jest |
| R10 | Playwright catalog→cart | **잔여** | spec·testid 준비; 8080+전제 충족 시 passed 기대 — [§1.3](#13-playwright-e2e) |
| **R11** | 쇼핑·리워드 인앱·모바일 푸시 P0 (S1~S6) | **완료 (코드·단위)** | `ShopNotificationHelper`·`ShopNotificationCopy`·`MobilePushDispatchService` shop_*·Expo `pushScenarios`; [FULL_COMPLETION §3](./SHOP_REWARD_FULL_COMPLETION_ORCHESTRATION.md) |

---

## 1. 자동 테스트 현황

### 1.0 Tier A REG-01 · R10 (core-tester, 2026-05-19 14:42 KST)

| 게이트 | exit | passed | skipped | 판정 |
|--------|------|--------|---------|------|
| Maven **14클래스** (Tier A 목록, `ShopNotificationHelper` 포함) | **0** | **91** | 0 | **PASS** (`-DforkCount=0`) |
| Maven (위임 `mvn clean test … -DforkCount=1 test`) | **1** | — | — | **FAIL** (로컬 `target`/fork) |
| Expo Jest `pushScenarios\|clientShop` | **0** | **32** | 0 | **PASS** |
| frontend `build:ci` | **0** | — | — | **PASS** |
| Playwright R10 + admin smoke (chromium) | **0** | 0 | **2** | **SKIP** (8080 down) |

**Tier A**: REG-01 **GO** · R10 **잔여**. 상세: [SHOP_P2 §1.0](./SHOP_P2_INTEGRATION_TEST_REPORT.md). R11 확장 게이트(15클래스·103건)는 §1.1.

### 1.0.1 Tier A **(5)** R10 dev·Playwright 스모크 (core-tester, 2026-05-19 ~14:54 KST)

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| `verify-shop-reward-dev.sh` (`SKIP_HEALTH=0`, `TENANT_ID` 없음) | **2** | — | — | — | **SKIP** — `ERROR: TENANT_ID 환경 변수가 필요합니다` |
| dev health only (`curl` apex, TENANT_ID 불필) | — | — | — | — | **PASS** HTTP **200** (`https://dev.core-solution.co.kr/actuator/health`) |
| localhost `8080` health (`curl` 프로브) | — | — | — | — | **down** — 연결 실패 `000` |
| Playwright R10 client + admin smoke (chromium) | **0** | **0** | **2** | **0** | **SKIP** — `skipWhenLocalBackend8080Down` |
| dev-only 수동 스모크 (8080 down) | — | — | — | — | [E2E README §dev-only](../../tests/e2e/README.md) 5줄 |

**Tier A (5)**: **BLOCKED** — R10 **skipped** (8080 down), verify **exit 2** (`TENANT_ID` 필요). **GO** 조건: `TENANT_ID` + OPS activate/seed + (로컬) 8080+3000 후 Playwright **2 passed** 또는 dev 수동 스모크 PASS.

### 1.1 백엔드 Maven (`*Test.java`)

**실행 명령** (2026-05-19 통합 게이트, **15클래스·103건**):

```bash
mvn clean test -Dtest=AdminShopCatalogSkuServiceImplTest,AdminShopCatalogSkuControllerMvcTest,AdminPointTenantPolicyControllerMvcTest,AdminShopOrderControllerMvcTest,ClientShopControllerMvcTest,ClientShopCheckoutServiceImplTest,ClientPointWalletServiceImplTest,PointTenantPolicyServiceImplTest,TenantComponentActivationServiceImplTest,ShopOrderFulfillmentServiceImplTest,AdminShopOrderRefundServiceImplTest,ShopOrderHoldExpiryServiceImplTest,ClientShopConsultantMappingServiceImplTest,ShopNotificationHelperImplTest,MobilePushDispatchServiceImplTest -DforkCount=1 test
```

**권장**: `-DforkCount=1` (병렬 fork 시 `ClassNotFoundException` 회피). 최종 검증 2026-05-19: **103 passed**, BUILD SUCCESS (~50s).

**MockMvc slice 회귀** (코더 산출 후):

```bash
mvn -Dtest=ClientShopControllerMvcTest,AdminShopCatalogSkuControllerMvcTest test
```

| # | 클래스 | 유형 | Tests | 결과 |
|---|--------|------|-------|------|
| 1 | `TenantComponentActivationServiceImplTest` | 단위 | 3 | PASS |
| 2 | `AdminPointTenantPolicyControllerMvcTest` | MockMvc slice | 2 | PASS |
| 3 | `AdminShopOrderControllerMvcTest` | MockMvc slice | 3 | PASS |
| 4 | `ClientShopControllerMvcTest` | MockMvc slice | 8 | PASS |
| 5 | `AdminShopCatalogSkuControllerMvcTest` | MockMvc slice | 8 | PASS |
| 6 | `AdminShopOrderRefundServiceImplTest` | 단위 | 6 | PASS |
| 7 | `ClientShopCheckoutServiceImplTest` | 단위 | 22 | PASS |
| 8 | `AdminShopCatalogSkuServiceImplTest` | 단위 | 5 | PASS |
| 9 | `ShopOrderFulfillmentServiceImplTest` | 단위 | 4 | PASS |
| 10 | `PointTenantPolicyServiceImplTest` | 단위 | 2 | PASS |
| 11 | `ClientPointWalletServiceImplTest` | 단위 | 14 | PASS |
| 12 | `ShopOrderHoldExpiryServiceImplTest` | 단위 (hold TTL) | 4 | PASS |
| 13 | `ClientShopConsultantMappingServiceImplTest` | 단위 (R8 mapping API) | 3 | PASS |
| 14 | `ShopNotificationHelperImplTest` | 단위 (R11 S1~S6·S2/S4/S5) | 7 | PASS |
| 15 | `MobilePushDispatchServiceImplTest` | 단위 (shop push dispatch) | 12 | PASS |
| | **합계** | **15클래스** | **103** | **BUILD SUCCESS** |

소요: 약 50s (`mvn clean test`, `-DforkCount=1`, 2026-05-19 게이트).

**R11 커버**: `ShopNotificationHelperImplTest` — PAID·EARN·fulfillment·**S2 결제 실패·S4 hold 만료·S5 환불** 푸시; `ClientShopCheckoutServiceImplTest` — `notifyOrderPaid`·`notifyPointEarned`·S2/S4 연동 verify; `MobilePushDispatchServiceImplTest` — `dispatchShopOrderPaid` 등 shop canonical.

**R1 (PG refund) 커버**: `AdminShopOrderRefundServiceImplTest` 4건 — 복원·clawback·REFUNDED·멱등·PAID 아님 거부.

**R2 (ERP 훅) 커버**: `ShopOrderFulfillmentServiceImplTest` — CONSULTATION COMPLETED·훅 1회·멱등.

**EARN 커버**: `ClientShopCheckoutServiceImplTest`·`ClientPointWalletServiceImplTest` — `creditEarn`·cap·멱등.

**R3/R4/R9 커버**: price-history Service·MockMvc; `ShopOrderHoldExpiryServiceImplTest` 4건; `CLIENT_SHOP`/`CLIENT_REWARD`/`ADMIN_SHOP_CATALOG` 403 slice.

**미커버 (자동)**: Client web·Admin UI E2E, frontend Jest, hold TTL 스케줄·DB 통합(§11 H5).

**R8 커버**: `ClientShopConsultantMappingServiceImplTest` 3건; `ClientShopControllerMvcTest` `GET /consultant-mappings` slice 2건 포함(합계 8).

### 1.2 Expo 앱 Jest

| 파일 | 상태 | Tests |
|------|------|-------|
| `expo-app/src/utils/__tests__/clientShopCart.test.ts` | PASS | — |
| `expo-app/src/utils/__tests__/clientShopFormat.test.ts` | PASS | — |
| `expo-app/src/utils/__tests__/clientShopRoutes.test.ts` | PASS | — |
| `expo-app/src/utils/__tests__/clientShopCheckout.test.ts` | PASS | — |
| `expo-app/src/utils/__tests__/pushScenarios.test.ts` | PASS | 3 (R11 shop type·alias) |
| **합계** | **5/5 suite** | **32 passed** (로컬, 2026-05-19) |

`expo-app/package.json`에 `npm test` 스크립트 없음 — `npx jest --testPathPattern='clientShop|pushScenarios'` 로 실행.

### 1.3 Playwright E2E

| 파일 | 상태 | 비고 |
|------|------|------|
| `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts` | **SKIP** (8080 down) | R10 — chromium exit 0, 1 skipped |
| `tests/e2e/tests/admin/admin-shop-catalog-skus-smoke.spec.ts` | **SKIP** (8080 down) | admin catalog smoke — 동일 가드 |
| R10 Tier A (2026-05-19 14:42) | **2 skipped** / 0 passed | 8080+OPS·시드 후 **2 passed** 기대 |
| R10 Tier A **(5)** (2026-05-19 ~14:54) | **0 passed / 2 skipped / 0 failed** | localhost 8080 **down**; dev apex health **200**; `skipWhenLocalBackend8080Down` |

### 1.4 프론트엔드 web (React)

Shop 전용 `*.test.js` **없음**.

---

## 2. Flyway 마이그레이션 체크리스트

로컬·스테이징·운영 **반영 전** 적용·검증 필수.

| 버전 | 파일 | 내용 | 적용 확인 |
|------|------|------|-----------|
| V20260519_001 | `V20260519_001__salary_calculations_audit_columns_out_of_order.sql` | `salary_calculations` audit 컬럼 (Shop 무관) | ☐ |
| V20260519_002 | `V20260519_002__point_tenant_policies.sql` | `point_tenant_policies` 테이블 | ☐ |
| V20260519_003 | `V20260519_003__shop_reward_component_catalog_seed.sql` | CLIENT_SHOP·CLIENT_REWARD·ADMIN_SHOP_CATALOG 시드 | ☐ |
| V20260519_004 | `V20260519_004__shop_order_refunded_status.sql` | 주문 REFUNDED 상태 COMMENT | ☐ |
| V20260519_005 | `V20260519_005__shop_order_fulfillment_events.sql` | `shop_order_fulfillment_events` | ☐ |
| V20260519_006 | `V20260519_006__shop_order_line_mapping_link.sql` | `shop_client_order_lines.consultant_client_mapping_id` (ERP 훅) | ☐ |
| V20260519_007 | `V20260519_007__shop_catalog_category_column.sql` | `shop_catalog_skus.catalog_category` | ☐ |
| V20260520_001 | `V20260520_001__shop_catalog_sku_price_history.sql` | `shop_catalog_sku_price_history` (R3) | ☐ |
| V20260521_001 | `V20260521_001__lnb_admin_shop_reward_menus.sql` | LNB 「쇼핑·리워드」 메뉴 4건 (어드민) | ☐ |

**이력 주의**: 구버전 `V20260519_001__shop_catalog_category_column.sql` 로 이미 적용된 DB는 `catalog_category` 컬럼·`flyway_schema_history` 수동 확인 후 007 중복 적용 방지 ([SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) §1).

**적용 후 SQL 스모크**:

```sql
SELECT catalog_category FROM shop_catalog_skus LIMIT 1;
SHOW TABLES LIKE 'point_tenant_policies';
SHOW TABLES LIKE 'shop_order_fulfillment_events';
SELECT COLUMN_NAME FROM information_schema.COLUMNS
  WHERE TABLE_NAME = 'shop_client_order_lines' AND COLUMN_NAME = 'consultant_client_mapping_id';
SELECT component_code FROM component_catalog WHERE component_code IN ('CLIENT_SHOP','CLIENT_REWARD','ADMIN_SHOP_CATALOG');
```

---

## 3. 구현 범위 스냅샷 (로컬)

| 영역 | 내용 |
|------|------|
| **Backend** | catalog·cart·checkout·PG PAID→commit·**EARN**·ledger API·fulfillment·admin refund+clawback+**PG refund**·ERP 훅·mappingId |
| **Web client** | `/client/shop/*` PLP·cart·checkout·points·orders·PDP·`ClientTenantComponentGate` |
| **Web admin** | `/admin/shop/catalog-skus`, `point-policies`, `orders`+refund |
| **Expo** | `(client)/(shop)/` 7화면, 더보기 진입, `useTenantComponentFlags` — [EXPO_SHOP_REWARD_IMPLEMENTATION_STRATEGY.md](./EXPO_SHOP_REWARD_IMPLEMENTATION_STRATEGY.md) |

### 3.4 잔여 갭 (R3/R4/R8/R9 완료 · R6/R10·운영 QA 잔여)

| ID | 갭 | 상태·비고 |
|----|-----|-----------|
| ~~R3~~ | SKU 가격 이력 audit·어드민 API | **완료** — Flyway `V20260520_001`, `AdminShopCatalogSkuServiceImplTest` 5건, `AdminShopCatalogSkuControllerMvcTest` price-history 2건 |
| ~~R4~~ | hold TTL 만료 배치·자동 release | **완료** — 스케줄러·서비스·정책 키 `hold_ttl_minutes`; 단위 4건 PASS |
| ~~R9~~ | OPS 컴포넌트·Client API 게이트 | **완료 (코드·스크립트)** — `activate-shop-reward-tenant-components.sql`·`seed-shop-demo-catalog.sql`·403 slice; 환경별 실행·수동 QA는 [런북](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) |
| ~~R8~~ | 체크아웃 UI mapping 선택 | **완료 (웹+Expo)** — `ShopCheckoutPage`·Expo checkout·mapping API·`clientShopCheckout` Jest |
| R6 | ASSESSMENT fulfillment | **잔여** — Phase 3 ([ORCHESTRATION §3.4](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md)) |
| R10 | Playwright E2E catalog→cart | **잔여** — dev 배포·OPS·시드 후 재실행 ([§1.3](#13-playwright-e2e)) |
| ~~R11~~ | 인앱·모바일 푸시 P0 (S1~S6) | **완료 (코드·단위)** — [FULL_COMPLETION](./SHOP_REWARD_FULL_COMPLETION_ORCHESTRATION.md) §4 순서 1~3; 수동 스모크·커밋 잔여 |

상세 SSOT: [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §3.4.

---

## 4. 수동 QA 체크리스트

### 4.1 Admin API

**전제**: Flyway §2 적용, 어드민 JWT, `X-Tenant-ID`, `ADMIN`/`STAFF`, 컴포넌트 `ADMIN_SHOP_CATALOG` 활성.

| # | 영역 | 메서드·경로 | 기대 | ☐ |
|---|------|-------------|------|---|
| A1 | 카탈로그 | `GET /api/v1/admin/shop/catalog-skus` | `success=true`, 배열 | |
| A2 | 카탈로그 | `POST /catalog-skus` (신규 SKU) | `201`, `data.id` | |
| A3 | 카탈로그 | 동일 `skuCode` 재POST | `4xx` 중복 | |
| A4 | 카탈로그 | `PATCH .../catalog-visible` | PLP 노출 반영 | |
| A5 | 포인트 정책 | `GET /api/v1/admin/shop/point-policies` | MVP 키 6종 | |
| A6 | 포인트 정책 | `PATCH /point-policies` | GET과 일치 | |
| A7 | **주문** | `GET /api/v1/admin/shop/orders` | 최근 주문 목록 200 | |
| A8 | **주문** | `GET /api/v1/admin/shop/orders/{id}` | 상세·lines·fulfillmentEvents | |
| A9 | **환불 (R1)** | `POST .../orders/{id}/refund` (PAID) | `REFUNDED`, 포인트 복원/clawback·PG refund | |
| A10 | 보안 | Bearer 없음 / CLIENT 역할 | `401`/`403` | |

**UI**: `/admin/shop/catalog-skus`, `/admin/shop/point-policies`, `/admin/shop/orders`.

### 4.2 Client web

**전제**: 내담자 로그인, Flyway §2, `catalogVisible=true` SKU ≥1, `CLIENT_SHOP`·`CLIENT_REWARD` 활성.

| # | 경로 | 동작 | 기대 | ☐ |
|---|------|------|------|---|
| C1 | `/client/shop` | PLP·카테고리 탭 | SKU·가격·필터 | |
| C2 | PLP → cart | SKU 담기 | 수량·소계 | |
| C3 | `/client/shop/cart` | 수량 변경 | API 반영 | |
| C4 | checkout | 결제 화면 | 요약·포인트 입력 | |
| C5 | 카드 전액 | `pointsToRedeemMinor=0` | `nextStep=PAYMENT` | |
| C6 | 포인트 전액 | 가용 ≥ 소계 | `nextStep=DONE`, `PAID` | |
| C7 | `/client/shop/points` | 잔액·내역 | balance/ledger 일치 | |
| C8 | 주문 상세 | REFUNDED·fulfillment | 상태·이행 라인 표시 | |
| C9 | 회귀 | `/client/shop-catalog` | `/client/shop` 리다이렉트 | |

### 4.3 P1 회귀 (스테이징)

| # | 시나리오 | 기대 | ☐ |
|---|----------|------|---|
| QA-1 | 카드 전액 + PG 승인 | `PAID` + (정책) EARN | |
| QA-2 | 포인트 전액 | 즉시 `PAID` | |
| QA-3 | PG 실패 | hold 해제·`CREATED` | |

---

## 5. GO / NO-GO (planner 요약, 2026-05-19)

### 5.1 코드·자동 테스트 — **GO**

| 게이트 | 판정 |
|--------|------|
| Maven Shop **103건** (15클래스, `-DforkCount=1`, 2026-05-19) | **GO** |
| `frontend` `npm run build:ci` (2026-05-20) | **GO** |
| **R1~R4**·**R8 (웹+Expo)**·**R9**·**R11 P0** (코드·단위·MockMvc·OPS SQL) | **GO** |
| Flyway Shop P2 (`002`~`007`) + **V20260520_001** + **V20260521_001** (LNB) | **GO** (파일·코드); DB 적용은 배포 시 |
| Expo Jest **5 suite / 32건** (`clientShop` + `pushScenarios`) | **GO** (로컬) |
| Playwright catalog→cart (R10) | **조건부** (dev·OPS·시드 후) |

### 5.2 운영 반영 — **배포·OPS·QA 게이트** (2026-05-19, Tier A (5) 최종)

| 게이트 | 판정 | 비고 |
|--------|------|------|
| dev `actuator/health` (apex curl) | **GO** | HTTP **200** (`https://dev.core-solution.co.kr`) |
| OPS `activate` + (선택) `seed` + `verify-shop-reward-dev.sh` | **BLOCKED** | verify **exit 2** — `TENANT_ID` 미설정; [런북 §4.1](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md#41-배포-직후-10분-체크리스트) |
| Playwright R10 (client + admin smoke, chromium) | **BLOCKED** | **0 / 2 / 0** passed·skipped·failed — localhost **8080 down**; [§1.0.1](#101-tier-a-5-r10-devplaywright-스모크-core-tester-2026-05-19-1454-kst) |
| Admin·Client 수동 스모크 [§4](#4-수동-qa-체크리스트) | **NO-GO** | OPS·`catalogVisible` SKU 전제 미충족 |
| **Tier A (5) 종합** | **BLOCKED** | dev health **GO**; R10·verify·수동 QA는 `TENANT_ID` + OPS + (로컬) 8080 또는 [dev-only 수동 스모크](../../tests/e2e/README.md) |

**종합**: **코드·Maven·Expo·build:ci = GO**. **Tier A (5) = BLOCKED** — 사용자 입력 **`TENANT_ID=<dev-tenant-uuid>`** 후 verify·OPS·수동 QA·(선택) 로컬 8080+3000 Playwright 재실행.

---

*작성: core-planner SSOT 동기화 (2026-05-20) · 문서만 · 커밋 없음*
