# Shop·Reward 구현 상태 (초안 — planner용)

| 항목 | 내용 |
|------|------|
| 일자 | 2026-05-19 (갱신 12:02 KST) |
| 범위 | Shop P1 + P2 (web·admin·환불·fulfillment·컴포넌트 게이트) |
| SSOT | [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md) |
| 코드 수정 | Expo `clientShopConstants.ts` TS2322 (타입만) · 문서 갱신 |
| 커밋 | 없음 |

---

## 1. 자동 테스트 현황

### 1.1 백엔드 Maven (`*Test.java`)

**실행 명령** (2026-05-19 12:02 KST):

```bash
mvn -Dtest=AdminShopCatalogSkuServiceImplTest,AdminShopCatalogSkuControllerMvcTest,AdminPointTenantPolicyControllerMvcTest,AdminShopOrderControllerMvcTest,ClientShopControllerMvcTest,ClientShopCheckoutServiceImplTest,ClientPointWalletServiceImplTest,PointTenantPolicyServiceImplTest,ShopOrderFulfillmentServiceImplTest,AdminShopOrderRefundServiceImplTest,TenantComponentActivationServiceImplTest test
```

| # | 클래스 | 유형 | Tests | 결과 |
|---|--------|------|-------|------|
| 1 | `TenantComponentActivationServiceImplTest` | 단위 | 3 | PASS |
| 2 | `AdminPointTenantPolicyControllerMvcTest` | MockMvc slice | 2 | PASS |
| 3 | `AdminShopOrderControllerMvcTest` | MockMvc slice | 3 | PASS |
| 4 | `ClientShopControllerMvcTest` | MockMvc slice | 4 | PASS |
| 5 | `AdminShopCatalogSkuControllerMvcTest` | MockMvc slice | 5 | PASS |
| 6 | `AdminShopOrderRefundServiceImplTest` | 단위 | 6 | PASS |
| 7 | `ClientShopCheckoutServiceImplTest` | 단위 | 19 | PASS |
| 8 | `AdminShopCatalogSkuServiceImplTest` | 단위 | 3 | PASS |
| 9 | `ShopOrderFulfillmentServiceImplTest` | 단위 | 4 | PASS |
| 10 | `PointTenantPolicyServiceImplTest` | 단위 | 2 | PASS |
| 11 | `ClientPointWalletServiceImplTest` | 단위 | 14 | PASS |
| | **합계** | **11클래스** | **65** | **BUILD SUCCESS** |

소요: 약 28s.

**`ClientShopCheckoutServiceImplTest` 보강 (checkout·mapping)**:

| @DisplayName | 검증 |
|--------------|------|
| checkout Idempotency-Key가 pointHoldKey로 hold에 전달된다 | I5: `pointHoldKey(idemKey)` |
| CONSULTATION 라인 — 활성 매핑이 있으면 consultantClientMappingId 설정 | ERP 매핑 링크 |
| CONSULTATION 라인 — 활성 매핑 없으면 consultantClientMappingId null | 매핑 없음 시 null |

**Admin 주문 API slice (`AdminShopOrderControllerMvcTest`)**:

| @DisplayName | 검증 |
|--------------|------|
| GET 목록 — ADMIN·컴포넌트 활성 시 200 | `GET /api/v1/admin/shop/orders`, `listRecentOrders(tenantId, 50)` |
| GET 상세 — ADMIN·컴포넌트 활성 시 200 | `GET /api/v1/admin/shop/orders/{orderPublicId}` |
| POST refund — ADMIN·컴포넌트 활성 시 200·REFUNDED | `POST .../refund`, `AdminShopOrderRefundService` 위임 |

**미커버 (자동)**: Admin orders 401/403·컴포넌트 비활성 403, Client web·Admin UI E2E, frontend Jest.

### 1.2 Expo 앱 Jest

**실행** (2026-05-19 12:01 KST): `npx jest --testPathPattern=clientShop`

| 파일 | 상태 | Tests |
|------|------|-------|
| `expo-app/src/utils/__tests__/clientShopCart.test.ts` | PASS | 6 |
| `expo-app/src/utils/__tests__/clientShopFormat.test.ts` | PASS | 8 |
| `expo-app/src/utils/__tests__/clientShopRoutes.test.ts` | PASS | 5 |
| **합계** | **3/3 suite** | **19 passed** |

**TS2322 수정**: `clientShopConstants.ts` `resolvePointLedgerLabel` — Record 인덱스 접근을 중간 변수·truthy 가드로 분리 (테스트·타입만).

### 1.3 Playwright E2E

| 파일 | 상태 | 비고 |
|------|------|------|
| `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts` | **미실행** (이번 배치) | 로컬 기록: API 미기동 시 login 타임아웃 FAIL |

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
| V20260519_004 | `V20260519_004__shop_order_refunded_status.sql` | 주문 REFUNDED 상태 | ☐ |
| V20260519_005 | `V20260519_005__shop_order_fulfillment_events.sql` | `shop_order_fulfillment_events` | ☐ |
| V20260519_006 | `V20260519_006__shop_order_line_mapping_link.sql` | `shop_client_order_lines.consultant_client_mapping_id` | ☐ |
| V20260519_007 | `V20260519_007__shop_catalog_category_column.sql` | `shop_catalog_skus.catalog_category` | ☐ |

**V20260519_001 충돌 해소 (core-coder)**: shop `catalog_category` DDL이 **`V20260519_007`로 재번호** — `V20260519_001`은 salary 전용. 구버전 `V20260519_001__shop_catalog_category_column.sql` 로 이미 적용된 DB는 `flyway_schema_history`·컬럼 존재 여부 확인 후 007 중복 적용 방지 ([SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) §1).

**적용 후 SQL 스모크**:

```sql
SELECT catalog_category FROM shop_catalog_skus LIMIT 1;
SHOW TABLES LIKE 'point_tenant_policies';
SHOW TABLES LIKE 'shop_order_fulfillment_events';
SELECT consultant_client_mapping_id FROM shop_client_order_lines LIMIT 1;
SELECT component_code FROM component_catalog WHERE component_code IN ('CLIENT_SHOP','CLIENT_REWARD','ADMIN_SHOP_CATALOG');
```

---

## 3. 수동 QA 체크리스트

### 3.1 Admin API

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
| A9 | **환불** | `POST .../orders/{id}/refund` (PAID) | `REFUNDED`, 포인트 복원/clawback | |
| A10 | 보안 | Bearer 없음 / CLIENT 역할 | `401`/`403` | |

**UI**: `/admin/shop/catalog-skus`, `/admin/shop/point-policies`, `/admin/shop/orders`.

### 3.2 Client web

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
| C8 | 주문 상세 | REFUNDED 주문 | fulfillment·상태 표시 | |
| C9 | 회귀 | `/client/shop-catalog` | `/client/shop` 리다이렉트 | |

### 3.3 P1 회귀 (스테이징)

| # | 시나리오 | 기대 | ☐ |
|---|----------|------|---|
| QA-1 | 카드 전액 + PG 승인 | `PAID` | |
| QA-2 | 포인트 전액 | 즉시 `PAID` | |
| QA-3 | PG 실패 | hold 해제·`CREATED` | |

---

## 4. GO / NO-GO (planner 요약)

**종합 (2026-05-19 12:02 KST)**: Maven Shop **11클래스 65건 BUILD SUCCESS**(checkout mapping·CONSULTATION 매핑 링크 포함), Expo clientShop Jest **3 suite 19건 PASS**로 자동화 게이트는 **GO**이다. Flyway **V20260519_001 충돌은 007 재번호로 해소**되었으나 **002~007(6종) DB 적용·스모크 미완**, Admin·Client **수동 QA §3 미완**, Playwright catalog→cart **미실행**(API·시드 전제)이 남아 **운영 GO는 불가** — migrate 적용 후 §3·§6 수동 스모크 완료 시 GO 전환을 권고한다.

| 게이트 | 판정 |
|--------|------|
| Maven Shop 65건 (11클래스) | **GO** |
| Expo clientShop Jest 19건 | **GO** |
| Flyway 002~007 적용·스모크 | **NO-GO** (미적용 시) |
| Admin·Client 수동 스모크 §3 | **NO-GO** (미완 시) |
| Playwright catalog→cart | **조건부** (API·Flyway·SKU 시드 후 재실행) |

---

*작성: core-tester · 문서만 · 커밋 없음*
