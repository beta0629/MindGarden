# Shop·Reward 구현 상태 (planner·OPS용)

| 항목 | 내용 |
|------|------|
| 일자 | 2026-05-19 (post-`544cc5039` B-3 재검증 · **BLOCKED**) |
| 범위 | Shop P1 + P2 + **MVP+** (어드민 전용 SKU 폼·대표 이미지·웹·Expo PLP/PDP 썸네일) |
| **MVP+ 한 줄** | 어드민 목록/등록·수정 전용 라우트 + SKU 자동 + `thumbnailUrl` 필수 업로드 + 내담자 웹·Expo 카탈로그 썸네일 (`V20260523_001`) |
| SSOT | [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md), [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §3 |
| 코드 수정 | **없음** (문서만) |
| 커밋 | post-`544cc5039` B-3 Playwright (§1.0.9) — develop HEAD `544cc5039` · FE deploy **success** |

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
| R10 | Playwright catalog→cart | **완료 (dev)** | MVP+ B-3 deploy 후 **2 passed** — [§1.0.8](#108-mvp-b-3-playwright-after-deploy-core-tester-2026-05-19) · [§1.3](#13-playwright-e2e) |
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

### 1.0.2 Tier A **(5)** R10 `tenant-incheon-counseling-001` (core-tester, 2026-05-19 ~15:05 KST)

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| dev `actuator/health` | — | — | — | — | **PASS** HTTP **200** |
| `verify-shop-reward-dev.sh` (`TENANT_ID=tenant-incheon-counseling-001`) | **0** | — | — | — | **PASS** (read-only 안내; DB·OPS SQL 미실행) |
| `E2E_TENANT_ID` in `erpAuth.ts` | — | — | — | — | **없음** — env만 설정·로그인은 `/login` 기본 테넌트(마인드가든) |
| Playwright R10 client + admin smoke (chromium) | **1** | **0** | **0** | **2** | **FAIL** — client `CLIENT_SHOP` 게이트; admin `ADMIN_SHOP_CATALOG` 비활성 토스트 |

**Tier A (5)**: **BLOCKED** — **OPS 필요** (`activate` + `seed` on dev DB for `tenant-incheon-counseling-001`) + **`erpAuth` `E2E_TENANT_ID` 로그인 URL** (coder) 후 R10 재실행.

### 1.0.3 Tier A **(4)(5)** R10 `tenant-incheon-counseling-001` 재검증 (core-tester, 2026-05-19 ~15:34 KST)

**전제**: dev SSH — Shop 3/3 ACTIVE + seed 완료 (OPS 반영 후).

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| dev `actuator/health` | — | — | — | — | **PASS** HTTP **200** |
| `verify-shop-reward-dev.sh` (`TENANT_ID=tenant-incheon-counseling-001`) | **0** | — | — | — | **PASS** (read-only 안내; Flyway·OPS SQL은 수동 확인) |
| Maven **14클래스** (`-DforkCount=0`, Tier A 목록) | **0** | **91** | 0 | 0 | **PASS** (2 batch, BUILD SUCCESS) |
| `E2E_TENANT_ID` → `buildLoginPath()` (`erpAuth.ts`) | — | — | — | — | **구현됨** — `/login?tenantId=` |
| Playwright R10 client + admin smoke (chromium, dev FE+API) | **1** | **0** | **0** | **2** | **FAIL** |

**Playwright 상세**:

| spec | 결과 | 관찰 |
|------|------|------|
| `client-shop-catalog-to-cart` | **FAIL** | `/client/shop` — `client-shop-catalog-page` 미노출; LNB에 쇼핑 메뉴 없음·`<main>` 빈 영역 (`CLIENT_SHOP` 게이트 추정) |
| `admin-shop-catalog-skus-smoke` | **FAIL** | `admin-shop-catalog-page`·제목·「상품 등록」 OK; 스냅샷에 `DEV-CONSULT-DEMO-01` SKU 테이블 노출 — line 62 `hasEmpty \|\| hasTable` assertion **FAIL** (locator·타이밍 의심) |

**Tier A (4) REG-01**: **GO** — Maven 14클래스 **91 passed** (`-DforkCount=0`).

**Tier A (5) 종합**: **BLOCKED** — R10 **0 / 0 / 2** (exit **1**). client `CLIENT_SHOP` 게이트 잔여; admin은 OPS·시드 반영 흔적(SKU 1건) 있으나 spec assertion 미통과. **후속**: client 컴포넌트 플래그·E2E client 계정 테넌트 매칭 확인; admin spec line 62 locator 보강(coder).

### 1.0.4 Tier A **(5)** R10 post-`5f1b44b99` (core-tester, 2026-05-19 ~16:04 KST)

**전제**: `5f1b44b99` fix catalog PLP — FE deploy **in_progress** (run `26081634547`).

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| dev `actuator/health` (`curl` apex) | — | — | — | — | **FAIL** HTTP **502** (×2 probe) |
| Playwright R10 client + admin smoke (chromium) | — | **0** | **0** | **0** | **BLOCKED** — health ≠200, 미실행 |
| `deploy-frontend-dev` (`5f1b44b99`) | — | — | — | — | **in_progress** (🎨 Frontend 개발 서버 배포) |

**Tier A (5)**: **BLOCKED** — dev API **502** → R10 Playwright **미실행**. **GO** 조건: health **200** + FE deploy **success** (`5f1b44b99`) 후 R10 재실행.

### 1.0.5 Tier A **(5)** R10 post-`5f1b44b99` 재실행 (core-tester, 2026-05-19 ~16:08 KST)

**전제**: dev health **200** 복구; BE·FE deploy `5f1b44b99` **success** (runs `26081634631`, `26081634547`).

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| dev `actuator/health` | — | — | — | — | **PASS** HTTP **200** |
| `deploy-frontend-dev` (`5f1b44b99`) | — | — | — | — | **success** (`26081634547`) |
| BE deploy (`5f1b44b99`) | — | — | — | — | **success** (`26081634631`) |
| Playwright R10 admin smoke | **—** | **1** | **0** | **0** | **PASS** (~4.5s) |
| Playwright R10 client catalog→cart | **—** | **0** | **0** | **1** | **FAIL** — `client-shop-catalog-page` 30s timeout; LNB 쇼핑 메뉴 없음·`<main>` 「불러오는 중…」 (`CLIENT_SHOP` 게이트·세션 로딩 추정) |
| Playwright **합계** (chromium) | **1** | **1** | **0** | **1** | **FAIL** |

**Tier A (5)**: **BLOCKED** — R10 **1 / 0 / 1** (admin **PASS**, client **FAIL**). **GO** 조건: client `CLIENT_SHOP` 게이트·PLP testid 노출 후 **2 passed**.

### 1.0.6 Tier A **(5)** R10 post-`c39272c6e` deploy (core-tester, 2026-05-19 ~16:45 KST)

**전제**: dev health **200**; FE deploy `c39272c6e` **success** (poll ~5min); BE deploy `c39272c6e` **미실행** (최신 BE `5f1b44b99`).

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| dev `actuator/health` (`curl` apex) | — | — | — | — | **PASS** HTTP **200** |
| FE `deploy-frontend-dev` (`c39272c6e`) | — | — | — | — | **success** |
| BE deploy (`c39272c6e`) | — | — | — | — | **미배포** (최신 `5f1b44b99`) |
| Playwright R10 admin smoke | **0** | **1** | **0** | **0** | **PASS** (~3.3s) |
| Playwright R10 client catalog→cart | **0** | **0** | **1** | **0** | **SKIP** — `client-tenant-component-gate--CLIENT_SHOP` 노출 (`tenantId=tenant-incheon-counseling-001`) |
| Playwright **합계** (chromium) | **0** | **1** | **1** | **0** | **BLOCKED** (2 passed 미달) |

**Tier A (5)**: **BLOCKED** — R10 **1 passed / 1 skipped / 0 failed** (exit **0**). admin **PASS**; client **SKIP** — `CLIENT_SHOP` 게이트·테넌트 컴포넌트 미활성 추정. **GO** 조건: **2 passed**.

### 1.0.7 Shop Catalog UX MVP+ **B-3** (core-tester, 2026-05-19 ~18:06 KST)

**전제**: develop pushed — BE `05f2c2510` · FE `92b89bb44` · Expo `b7a2f8e77`. SSOT: [SHOP_CATALOG_UX_MVP_PLUS_TEST_PLAN.md](./SHOP_CATALOG_UX_MVP_PLUS_TEST_PLAN.md).

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| Maven MVP+ slice (4클래스, `-DforkCount=0`) | **0** | **28** | 0 | 0 | **PASS** |
| Maven Tier A (14클래스, `-DforkCount=0`) | **0** | **97** | 0 | 0 | **PASS** |
| frontend `build:ci` | **0** | — | — | — | **PASS** |
| Expo Jest `clientShop` | **0** | **35** | 0 | 0 | **PASS** |
| dev `actuator/health` (`E2E_API_BASE`) | — | — | — | — | **FAIL** HTTP **502** |
| Playwright admin + client (chromium, dev FE+API) | **0** | **0** | **2** | **0** | **SKIP** — `skipWhenLocalBackend8080Down` (8080 down + dev health ≠200) |

**MVP+ B-3 종합** (§1.0.7 시점): **BLOCKED** — 자동 단위·빌드 **GO**; Playwright **0 / 2 / 0** (미실행·스킵). **후속**: deploy 후 **GO** — [§1.0.8](#108-mvp-b-3-playwright-after-deploy-core-tester-2026-05-19).

### 1.0.8 MVP+ B-3 Playwright after deploy (core-tester, 2026-05-19)

**전제**: deployer BE/FE **success**; `curl` dev `actuator/health` → **200**.

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| dev `actuator/health` (`E2E_API_BASE`) | — | — | — | — | **PASS** HTTP **200** |
| Playwright `admin-shop-catalog-skus-smoke` | **0** | **1** | **0** | **0** | **PASS** (~4.1s) — catalog-skus 셸·빈 목록 허용 |
| Playwright `client-shop-catalog-to-cart` | **0** | **1** | **0** | **0** | **PASS** (~5.0s) — 첫 SKU 담기·장바구니 소계 |
| Playwright **합계** (chromium) | **0** | **2** | **0** | **0** | **PASS** |

**MVP+ B-3 종합**: **GO** — Playwright **2 / 0 / 0** (exit **0**). **coder 위임**: 없음.

상세 표: [§3.5](#35-shop-catalog-ux-mvp--b-3-게이트-core-tester-2026-05-19).

### 1.0.9 MVP+ B-3 post-`544cc5039` FE deploy (core-tester, 2026-05-19)

**전제**: develop HEAD `544cc5039`; **FE deploy (frontend paths) success**; `E2E_API_BASE`+`BASE_URL` dev.

| 게이트 | exit | passed | skipped | failed | 판정 |
|--------|------|--------|---------|--------|------|
| dev `actuator/health` (`E2E_API_BASE`) | — | — | — | — | **PASS** HTTP **200** |
| Playwright `admin-shop-catalog-skus-smoke` | — | **1** | **0** | **0** | **PASS** (~3.1s) |
| Playwright `admin-shop-catalog-sku-create-smoke` | — | **0** | **0** | **1** | **FAIL** — `loginErpUser` 후 URL 전환 25s timeout (`/login?tenantId=tenant-incheon-counseling-001`) |
| Playwright `client-shop-catalog-to-cart` | — | **0** | **0** | **1** | **FAIL** — `react130ConsoleGate`: `console.error` 리소스 **404** (장바구니·소계 UI는 스냅샷상 도달) |
| Playwright **합계** (3 spec, chromium, `--timeout=90000`) | **1** | **1** | **0** | **2** | **FAIL** |

**MVP+ B-3 종합** (§1.0.9): **BLOCKED** — Playwright **1 / 0 / 2** (exit **1**). **GO** 조건: 3-spec **3 / 0 / 0** 또는 기존 2-spec **2 / 0 / 0** + create spec PASS. **후속**: admin ERP 로그인·`E2E_TENANT_ID` 병렬 간섭·client 썸네일 404(coder).

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
| `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts` | **SKIP** | R10 post-`c39272c6e` (2026-05-19 ~16:45) — `client-tenant-component-gate--CLIENT_SHOP` 노출; `tenant-incheon-counseling-001` |
| `tests/e2e/tests/admin/admin-shop-catalog-skus-smoke.spec.ts` | **PASS** | R10 post-`c39272c6e` (2026-05-19 ~16:45, ~3.3s) — catalog-skus 셸·빈 목록 허용 assertion 통과 |
| R10 Tier A (2026-05-19 14:42) | **2 skipped** / 0 passed | (이전) 8080 down · `skipWhenLocalBackend8080Down` |
| R10 Tier A **(5)** (2026-05-19 dev 재실행) | **0 passed / 0 skipped / 2 failed** (exit **1**) | `E2E_API_BASE`+`BASE_URL` dev; localhost **8080 down**; `E2E_API_BASE` health **200** → 8080 가드 **미스킵**; `skipWhenCiMissingE2eCredentials` **미발생** (`CI≠true`) |
| R10 `tenant-incheon-counseling-001` (2026-05-19 ~15:05 KST) | **0 / 0 / 2** passed·skipped·failed (exit **1**) | (이전) client `CLIENT_SHOP` 게이트; admin 비활성 토스트; **`E2E_TENANT_ID` 미연동** |
| R10 `tenant-incheon-counseling-001` **(4)(5) 재검증** (2026-05-19 ~15:34 KST) | **0 / 0 / 2** (exit **1**) | dev FE+API; `E2E_TENANT_ID` **연동됨**; OPS·seed 전제 — client 게이트 잔여; admin SKU 노출·assertion FAIL |
| R10 post-`5f1b44b99` **(5)** (2026-05-19 ~16:04 KST) | **BLOCKED** — **0 / 0 / 0** | dev health **502**; Playwright **미실행**; FE deploy `26081634547` **in_progress** |
| R10 post-`5f1b44b99` **(5) 재실행** (2026-05-19 ~16:08 KST) | **1 / 0 / 1** (exit **1**) | health **200**·BE+FE deploy **success**; admin smoke **PASS**; client `client-shop-catalog-page` timeout·`CLIENT_SHOP` 게이트 잔여 |
| R10 post-`c39272c6e` **(5)** (2026-05-19 ~16:45 KST) | **1 / 1 / 0** (exit **0**) | health **200**·FE deploy **success**; admin **PASS**; client **SKIP** — `CLIENT_SHOP` 게이트 (`tenant-incheon-counseling-001`); BE `c39272c6e` **미배포** |
| MVP+ B-3 post-deploy **(4c/4)** (2026-05-19) | **2 / 0 / 0** (exit **0**) | health **200**·BE/FE deploy **success**; `E2E_TENANT_ID=tenant-incheon-counseling-001`; admin·client smoke **PASS** — [§1.0.8](#108-mvp-b-3-playwright-after-deploy-core-tester-2026-05-19) |

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
| V20260522_001 | `V20260522_001__shop_reward_activate_tenant_components_backfill.sql` | Shop 3종 tenant_components 백필 | ☐ |
| V20260522_002 | `V20260522_002__shop_reward_default_components_onboarding.sql` | 온보딩 기본 컴포넌트 | ☐ |
| V20260523_001 | `V20260523_001__shop_catalog_sku_thumbnail_url.sql` | `shop_catalog_skus.thumbnail_url` (MVP+ PLP/PDP) | ☐ |

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
| **MVP+** | 어드민 전용 등록/수정 폼·SKU 자동·`thumbnailUrl` 필수·웹·Expo PLP/PDP 썸네일 — Flyway `V20260523_001` · B-3 **GO** ([§3.5](#35-shop-catalog-ux-mvp--b-3-게이트-core-tester-2026-05-19)) |

### 3.5 Shop Catalog UX MVP+ — B-3 게이트 (core-tester, 2026-05-19)

| # | 게이트 | exit | p | f | s | 판정 | 비고 |
|---|--------|------|---|---|---|------|------|
| 1 | Maven MVP+ slice (`AdminShopCatalogSkuServiceImplTest`, `AdminShopCatalogSkuControllerMvcTest`, `ClientShopControllerMvcTest`, `ClientShopCatalogServiceImplTest`) | 0 | 28 | 0 | 0 | **PASS** | hero·skuCode·`heroImageUrl` 시나리오 포함 |
| 2 | Maven Tier A 14클래스 (`-DforkCount=0`) | 0 | 97 | 0 | 0 | **PASS** | REG-01 회귀 (+6 vs §1.0.3, MVP+ 테스트 추가) |
| 3 | frontend `build:ci` | 0 | — | — | — | **PASS** | eslint 경고만, 빌드 성공 |
| 4 | Expo Jest `--testPathPattern=clientShop` | 0 | 35 | 0 | 0 | **PASS** | 5 suites |
| 5 | Playwright `admin-shop-catalog-skus-smoke` + `client-shop-catalog-to-cart` (dev, chromium) | 0 | 2 | 0 | 0 | **PASS** | deploy 후 health **200**; admin ~4.1s · client ~5.0s — [§1.0.8](#108-mvp-b-3-playwright-after-deploy-core-tester-2026-05-19) |
| 6 | Playwright 3-spec (+ `admin-shop-catalog-sku-create-smoke`, post-`544cc5039`) | 1 | 1 | 0 | 2 | **FAIL** | health **200**; [§1.0.9](#109-mvp-b-3-post-544cc5039-fe-deploy-core-tester-2026-05-19) |

**B-3 판정** (§3.5·§1.0.8): **GO** — Playwright **2 / 0 / 0** (exit **0**). **§1.0.9 재검증**: **BLOCKED** — **1 / 0 / 2**; **coder 위임**: admin 로그인·client 404.

### 3.4 잔여 갭 (R3/R4/R8/R9 완료 · R6/R10·운영 QA 잔여)

| ID | 갭 | 상태·비고 |
|----|-----|-----------|
| ~~R3~~ | SKU 가격 이력 audit·어드민 API | **완료** — Flyway `V20260520_001`, `AdminShopCatalogSkuServiceImplTest` 5건, `AdminShopCatalogSkuControllerMvcTest` price-history 2건 |
| ~~R4~~ | hold TTL 만료 배치·자동 release | **완료** — 스케줄러·서비스·정책 키 `hold_ttl_minutes`; 단위 4건 PASS |
| ~~R9~~ | OPS 컴포넌트·Client API 게이트 | **완료 (코드·스크립트)** — `activate-shop-reward-tenant-components.sql`·`seed-shop-demo-catalog.sql`·403 slice; 환경별 실행·수동 QA는 [런북](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) |
| ~~R8~~ | 체크아웃 UI mapping 선택 | **완료 (웹+Expo)** — `ShopCheckoutPage`·Expo checkout·mapping API·`clientShopCheckout` Jest |
| R6 | ASSESSMENT fulfillment | **잔여** — Phase 3 ([ORCHESTRATION §3.4](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md)) |
| ~~R10~~ | Playwright E2E catalog→cart | **완료 (dev)** — MVP+ B-3 deploy 후 **2 passed** ([§1.0.8](#108-mvp-b-3-playwright-after-deploy-core-tester-2026-05-19)) |
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
| Playwright catalog→cart (R10) | **GO** — MVP+ B-3 deploy 후 **2 / 0 / 0** ([§1.0.8](#108-mvp-b-3-playwright-after-deploy-core-tester-2026-05-19)) |

### 5.2 운영 반영 — **배포·OPS·QA 게이트** (2026-05-19, Tier A **(4)(5)** · `tenant-incheon-counseling-001`)

| 게이트 | 판정 | 비고 |
|--------|------|------|
| dev `actuator/health` (apex curl) | **GO** | HTTP **200** (`https://dev.core-solution.co.kr`) |
| Maven Tier A **14클래스** (`-DforkCount=0`) | **GO** | **91 passed**, exit **0** — [§1.0.3](#103-tier-a-45-r10-tenant-incheon-counseling-001-재검증-core-tester-2026-05-19-1534-kst) |
| OPS `activate` + `seed` + `verify-shop-reward-dev.sh` | **조건부 GO** | SSH 전제 Shop 3/3 ACTIVE + seed; verify helper **exit 0**; admin E2E 스냅샷 `DEV-CONSULT-DEMO-01` — 시드 반영 흔적; client `CLIENT_SHOP` 게이트 잔여 |
| Playwright R10 (client + admin smoke, chromium) | **GO** | **2 / 0 / 0** (exit **0**); [§1.0.8](#108-mvp-b-3-playwright-after-deploy-core-tester-2026-05-19) — MVP+ B-3 deploy 후 admin·client **PASS** |
| Admin·Client 수동 스모크 [§4](#4-수동-qa-체크리스트) | **조건부** | R10 E2E **GO**; §4 체크리스트는 미체크 |
| **Tier A (4) REG-01** | **GO** | Maven 14클래스 **91 passed** |
| **MVP+ B-3** | **BLOCKED** | §1.0.8 **GO** (2 spec); post-`544cc5039` §1.0.9 **1 / 0 / 2** — create·client **FAIL** |
| **Tier A (5) 종합** | **BLOCKED** | post-`544cc5039` Playwright 3-spec 미달; §1.0.8 이력 **GO** 유지 |

**종합**: **코드·Maven·Expo·build:ci = GO**. **MVP+ B-3 (post-`544cc5039`) = BLOCKED** ([§1.0.9](#109-mvp-b-3-post-544cc5039-fe-deploy-core-tester-2026-05-19)). 수동 QA §4는 잔여.

---

*작성: core-planner SSOT 동기화 (2026-05-20) · 문서만 · 커밋 없음*
