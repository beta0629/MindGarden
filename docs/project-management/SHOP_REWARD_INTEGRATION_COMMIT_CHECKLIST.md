# Shop·Reward 통합 커밋 체크리스트

| 항목 | 내용 |
|------|------|
| 일자 | 2026-05-19 (SSOT 동기화 — R11 알림·푸시 P0 미커밋) |
| 범위 | 로컬 미커밋 R3/R4/R8/R9 + **R11** (`ShopNotificationHelper`, push·인앱, Expo `pushScenarios`), Flyway·어드민·Client·OPS·문서 |
| SSOT | [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md), [SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md), [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md) |
| 코드 변경 | **없음** (본 문서는 커밋·배포 절차만) |

---

## 1. 커밋 제외 (필수)

| 패턴 | 사유 |
|------|------|
| `api-*.json` (예: `api-0000000000000000000-111111-aaaaaabbbbbb.json`) | **credentials·서비스 계정 키** — 저장소·커밋 금지. 필요 시 로컬·시크릿 매니저만 보관 |
| `tests/e2e/test-results/**` | Playwright 산출물·재현 아티팩트 |
| `.env` / `*.pem` / `credentials*.json` | [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) Secret 정책 |

**권장**: 루트 `.gitignore`에 `api-*.json` 유지·추가 확인 후 `git status`에서 untracked credentials가 없는지 재확인.

---

## 2. 권장 커밋 분리 (2~3개)

의존성: **(A) → dev 배포·Flyway → OPS → (B)**. 문서·스크립트는 (A) 직후 또는 (B)와 병렬 가능.

| 커밋 | 제목 예시 | 포함 요약 |
|------|-----------|-----------|
| **(A) backend + Flyway** | `feat(shop): R11 notifications, R3/R4/R8/R9, Flyway P2c` | `ShopNotificationHelper`·`ShopNotificationCopy`·`MobilePush*` shop dispatch·hold/refund/checkout 훅, Flyway, Shop Maven **15클래스·103건** |
| **(B) frontend web** | `feat(shop): admin catalog·policies, client checkout, LNB menus` | `frontend/` Shop·LNB·상수·서비스·CSS |
| **(C) docs + scripts + expo + e2e** | `docs(shop): R11 full completion; expo push scenarios; e2e` | `docs/project-management/SHOP_*.md`, OPS SQL, `expo-app/**` push·notification (§3 glob), `tests/e2e/**` |

> **현재 워크스페이스 (2026-05-19)**: **R11 P0 미커밋** — (A)~(C) **재커밋 필요** ([§6](#6-다음-사용자-액션-2026-05-20)). 커밋 전 `npx jest --testPathPattern='clientShop|pushScenarios'` → **32 passed** ([§5.4](#54-선택-expo--e2e)).

---

## 3. 파일 그룹 (glob)

스테이징 시 `git add` 경로 참고. `git add -p`로 Shop 외 동시 수정이 섞이면 분리.

### (A) backend + Flyway

```
src/main/java/com/coresolution/consultation/**/shop/**
src/main/java/com/coresolution/consultation/**/*Shop*
src/main/java/com/coresolution/consultation/constant/PointTenantPolicyKeys.java
src/main/java/com/coresolution/consultation/constant/ShopCheckoutConstants.java
src/main/java/com/coresolution/consultation/constant/ShopNotificationCopy.java
src/main/java/com/coresolution/consultation/constant/MobilePushCanonicalTypes.java
src/main/java/com/coresolution/consultation/constant/MobilePushNotificationCategory.java
src/main/java/com/coresolution/consultation/service/ShopNotificationHelper.java
src/main/java/com/coresolution/consultation/service/impl/ShopNotificationHelperImpl.java
src/main/java/com/coresolution/consultation/service/MobilePushDispatchService.java
src/main/java/com/coresolution/consultation/service/impl/MobilePushDispatchServiceImpl.java
src/main/java/com/coresolution/consultation/service/impl/PaymentServiceImpl.java
src/main/java/com/coresolution/consultation/util/MobilePushMessageFormatter.java
src/main/resources/db/migration/V20260519_002__*.sql
src/main/resources/db/migration/V20260519_003__*.sql
src/main/resources/db/migration/V20260519_004__*.sql
src/main/resources/db/migration/V20260519_005__*.sql
src/main/resources/db/migration/V20260519_006__*.sql
src/main/resources/db/migration/V20260519_007__*.sql
src/main/resources/db/migration/V20260520_001__*.sql
src/main/resources/db/migration/V20260521_001__*.sql
src/main/resources/application.yml
src/test/java/com/coresolution/consultation/**/*Shop*
src/test/java/com/coresolution/consultation/**/*PointTenant*
src/test/java/com/coresolution/integrationtest/shop/**
```

### (B) frontend web

```
frontend/src/components/admin/AdminShop*
frontend/src/pages/client/shop/**
frontend/src/constants/adminShop*
frontend/src/constants/clientShop*
frontend/src/constants/clientShopNotificationCopy.js
frontend/src/services/adminShop*
frontend/src/services/clientShop*
frontend/src/styles/shop/**
frontend/src/components/dashboard-v2/constants/menuItems.js
frontend/src/components/dashboard-v2/constants/lnbIconMap.js
frontend/src/utils/lnbMenuUtils.js
frontend/src/constants/icons.js
```

### (C) docs + scripts + expo + e2e

```
docs/project-management/SHOP_*.md
scripts/ops/activate-shop-reward-tenant-components.sql
scripts/ops/seed-shop-demo-catalog.sql
tests/e2e/tests/client/client-shop-*.spec.ts
tests/e2e/README.md
expo-app/app/(client)/(shop)/**
expo-app/src/api/hooks/useClientShop*
expo-app/src/api/endpoints.ts
expo-app/src/constants/clientShop*
expo-app/src/constants/pushScenarios.ts
expo-app/src/constants/shopNotificationCopy.ts
expo-app/src/services/NotificationService.ts
expo-app/src/utils/clientShop*
expo-app/src/utils/__tests__/clientShop*
expo-app/src/utils/__tests__/pushScenarios.test.ts
```

**Expo Jest (커밋 전)**: `cd expo-app && npx jest --testPathPattern='clientShop|pushScenarios'` — **32 passed** (5 suite).

---

## 4. 배포 순서 (dev 기준)

SSOT: [SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) §1~§2.

| 순서 | 작업 | 비고 |
|------|------|------|
| 1 | **backend dev** 배포 | `develop` → `deploy-backend-dev.yml`; JAR 기동 시 Flyway 자동 |
| 2 | **Flyway** | `V20260519_002` ~ `007` → `V20260520_001` (R3 price history) → `V20260521_001` (LNB 쇼핑·리워드 메뉴). `V20260519_001`은 salary 별도 — Shop P2와 무관 |
| 3 | **OPS activate** | `scripts/ops/activate-shop-reward-tenant-components.sql` — `CLIENT_SHOP`, `CLIENT_REWARD`, `ADMIN_SHOP_CATALOG` (tenant_id **하드코딩 금지**, 런북 §2) |
| 4 | **frontend dev** 배포 | LNB·어드민·Client Shop UI; Flyway `20260521_001` 후 어드민 **새로고침** |
| 5 | (선택) dev QA SKU 시드 | 런북 §3.5 — `catalogVisible=true` SKU ≥1 |
| 6 | (선택) Playwright | API 8080·OPS·시드 후 `client-shop-catalog-to-cart.spec.ts` |

---

## 5. 커밋 전·후 검증

### 5.1 Maven — Shop 13클래스 (84건)

저장소 루트에서 (`-DforkCount=1` **권장** — 병렬 fork 시 `ClassNotFoundException` 회피):

```bash
mvn clean test -Dtest=AdminShopCatalogSkuServiceImplTest,AdminShopCatalogSkuControllerMvcTest,AdminPointTenantPolicyControllerMvcTest,AdminShopOrderControllerMvcTest,ClientShopControllerMvcTest,ClientShopCheckoutServiceImplTest,ClientPointWalletServiceImplTest,PointTenantPolicyServiceImplTest,TenantComponentActivationServiceImplTest,ShopOrderFulfillmentServiceImplTest,AdminShopOrderRefundServiceImplTest,ShopOrderHoldExpiryServiceImplTest,ClientShopConsultantMappingServiceImplTest,ShopNotificationHelperImplTest,MobilePushDispatchServiceImplTest -DforkCount=1 test
```

**통과 기준**: `BUILD SUCCESS`, **15클래스·103 tests** 0 failures ([SHOP_P2 §2](./SHOP_P2_INTEGRATION_TEST_REPORT.md), [IMPLEMENTATION_STATUS §1.1](./SHOP_REWARD_IMPLEMENTATION_STATUS.md)).  
**포함**: `ShopNotificationHelperImplTest` (R11, 7건)·`MobilePushDispatchServiceImplTest` (shop dispatch, 12건). 최종 게이트 2026-05-19: **PASS**.

### 5.2 Frontend CI 빌드

```bash
cd frontend && npm run build:ci
```

**통과 기준**: `craco build` exit 0 (`CI=false`, source map off).

### 5.3 수동 QA (§4 요약 3줄)

배포·OPS·`catalogVisible` SKU 전제 후 [IMPLEMENTATION_STATUS §4](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) / [런북 §4](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md):

1. **Admin** — `GET/POST/PATCH` catalog-skus, point-policies, orders·refund (A1~A10); UI `/admin/shop/*`.
2. **Client web** — PLP→cart→checkout(C5 카드·C6 포인트 전액), points·주문 상세 (C1~C9).
3. **P1 회귀** — QA-1 카드+PG `PAID`, QA-2 포인트 전액, QA-3 PG 실패 hold 해제 ([SHOP_P1 §3](./SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md)).

운영 GO: 위 3줄 + Flyway 검증 SQL(런북 §1.2) 미완 시 **NO-GO**.

### 5.4 (선택) Expo · E2E

| 항목 | 명령 |
|------|------|
| Expo Jest | `cd expo-app && npx jest --testPathPattern='clientShop|pushScenarios'` — **32 passed** (5 suite) |
| Playwright | `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts` (dev API·OPS·시드 후) |

---

## 6. 다음 사용자 액션 (2026-05-20)

| # | 액션 | 상태 |
|---|------|------|
| **(1)** | **커밋 (A)/(B)/(C)** — §2·§3 glob; `api-*.json`·credentials 제외 ([§1](#1-커밋-제외-필수)) | **R11 재커밋 필요** (P0 알림·푸시 미반영분) |
| **(2)** | **`develop` push** — 원격 반영·CI·배포 워크플로 트리거 | **R11 재커밋 필요** (1 완료 후) |
| **(3)** | **dev 배포** — backend → Flyway(`002`~`007`, `V20260520_001`, `V20260521_001`) → frontend ([§4](#4-배포-순서-dev-기준)) | **현재 단계** |
| **(4)** | **OPS activate + seed** — `activate-shop-reward-tenant-components.sql` + (선택) `seed-shop-demo-catalog.sql`; 배포 직후 10분은 [런북 §4.1](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md#41-배포-직후-10분-체크리스트) | **현재 단계** |
| **(5)** | **수동 QA·GO 판정** — [IMPLEMENTATION_STATUS §4](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) Admin·Client·P1 회귀; (선택) Playwright R10; §5.2 OPS·QA 게이트 갱신 | **현재 단계** |

> **SSOT**: 배포·OPS·QA 판정은 [IMPLEMENTATION_STATUS §5.2](./SHOP_REWARD_IMPLEMENTATION_STATUS.md#52-운영-반영--배포opsqa-게이트-2026-05-20)와 [런북 §4.1](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md#41-배포-직후-10분-체크리스트)를 함께 본다.

---

## 7. 커밋 직전 체크리스트

- [ ] `api-*.json` 및 `test-results` 미스테이징
- [ ] (A) Flyway 파일명·버전 순서 확인 (`007` shop catalog, `020` price history, `021` LNB)
- [ ] (A) Maven **15클래스·103건** PASS (`-DforkCount=1` 권장)
- [ ] (B) `npm run build:ci` PASS
- [ ] (C) SHOP_* 문서·OPS SQL·expo-app Shop·pushScenarios — credentials 없음; Expo Jest **32** PASS
- [ ] 푸시 후 dev: backend → Flyway → OPS → frontend 순 배포
- [ ] §4 수동 QA 3줄(Admin / Client / P1) 스테이징·dev에서 스모크

---

## 8. 관련 문서

| 문서 | 용도 |
|------|------|
| [SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) | Flyway·OPS·Playwright 상세 |
| [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) | R3/R4/R8/R9·GO/NO-GO |
| [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md) | Maven·E2E SSOT |
| [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) | 운영 반영 게이트 |
