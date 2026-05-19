# Shop Catalog UX MVP+ — B-3 테스트 계획

| 항목 | 내용 |
|------|------|
| 문서 제목 | Shop Catalog UX MVP+ — 검증 게이트 (B-3) |
| 상태 | **계획 확정** — 코드·스펙·E2E 구현 **금지** (본 문서만) |
| 작성일 | 2026-05-19 |
| 담당 | core-tester (B-3) |
| 입력 SSOT | [SHOP_CATALOG_UX_MVP_PLUS_ORCHESTRATION.md](./SHOP_CATALOG_UX_MVP_PLUS_ORCHESTRATION.md) §4 B-3 · [SHOP_CATALOG_UX_MVP_PLUS_DESIGN_HANDOFF.md](./SHOP_CATALOG_UX_MVP_PLUS_DESIGN_HANDOFF.md) testid · 기존 Playwright 2종 |
| 테스트 표준 | [docs/standards/TESTING_STANDARD.md](../standards/TESTING_STANDARD.md) · `/core-solution-testing` |

---

## 1. 범위·목표

| 구분 | 내용 |
|------|------|
| **목표** | MVP+ (SKU 자동·전용 어드민 폼·hero image 필수·내담자 PLP/PDP 썸네일) 구현 **후** B-3 게이트 통과 여부 판정 |
| **자동** | Maven Shop 회귀 · Playwright 2 spec 갱신·실행 · (선택) `frontend` Jest `clientShopService` |
| **수동** | 런시트 A2·C1·C2 + **이미지** 5줄 (§6) |
| **제외** | PG/checkout 결제 · Expo Maestro(별도 B-2) · 프로덕션 DB |

**B-3 완료 판정 (오케스트레이션 §4 B-3)**

- [ ] core-tester 보고: passed / failed / skipped · exit code
- [ ] 실패 시 core-debugger → core-coder 루프 1회
- [ ] [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) §3 갱신 항목 목록 제출

---

## 2. Maven — 클래스 목록

### 2.1 Tier A REG-01 (Shop 전체 회귀, 14클래스)

B-3 **필수** 전체 회귀. SSOT: [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md) · [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) §1.0.

| # | 클래스 (`-Dtest=` 짧은 이름) | 유형 | MVP+ 관련도 |
|---|------------------------------|------|-------------|
| 1 | `AdminShopCatalogSkuServiceImplTest` | 단위 | **핵심** — upsert·가격이력·(구현 후) hero 필수·skuCode 자동 |
| 2 | `AdminShopCatalogSkuControllerMvcTest` | MockMvc | **핵심** — 목록·multipart·403·catalog-visible |
| 3 | `ClientShopControllerMvcTest` | MockMvc | **핵심** — catalog 응답 `heroImageUrl` |
| 4 | `ClientShopCheckoutServiceImplTest` | 단위 | 회귀 — 주문·포인트·알림 |
| 5 | `ClientPointWalletServiceImplTest` | 단위 | 회귀 |
| 6 | `PointTenantPolicyServiceImplTest` | 단위 | 회귀 |
| 7 | `TenantComponentActivationServiceImplTest` | 단위 | 회귀 — `ADMIN_SHOP_CATALOG` / `CLIENT_SHOP` |
| 8 | `AdminPointTenantPolicyControllerMvcTest` | MockMvc | 회귀 |
| 9 | `AdminShopOrderControllerMvcTest` | MockMvc | 회귀 |
| 10 | `AdminShopOrderRefundServiceImplTest` | 단위 | 회귀 |
| 11 | `ShopOrderFulfillmentServiceImplTest` | 단위 | 회귀 |
| 12 | `ShopOrderHoldExpiryServiceImplTest` | 단위 | 회귀 |
| 13 | `ClientShopConsultantMappingServiceImplTest` | 단위 | 회귀 |
| 14 | `ShopNotificationHelperImplTest` | 단위 | 회귀 (R11) |

**부트스트랩 (실행 대상 아님, slice 전제)**

- `src/test/java/com/coresolution/integrationtest/shop/AdminShopCatalogSkuControllerMvcTestApplication.java`
- `src/test/java/com/coresolution/integrationtest/shop/ClientShopControllerMvcTestApplication.java`

### 2.2 MVP+ 집중 slice (코더·테스터 빠른 게이트)

구현 PR 검증 시 **우선** 실행:

```bash
mvn -Dtest=AdminShopCatalogSkuServiceImplTest,AdminShopCatalogSkuControllerMvcTest,ClientShopControllerMvcTest test -DforkCount=0
```

| 클래스 | B-1 완료 기준 연계 시나리오 (계획·코더가 테스트 추가) |
|--------|------------------------------------------------------|
| `AdminShopCatalogSkuServiceImplTest` | 신규 POST `skuCode` 생략 → 201 + 서버 코드; hero 없음 → 실패 |
| `AdminShopCatalogSkuControllerMvcTest` | multipart POST/PUT; `ADMIN_SHOP_CATALOG` 비활성 403 유지 |
| `ClientShopControllerMvcTest` | `GET` catalog 항목에 `heroImageUrl` (또는 동등 필드) |

### 2.3 실행 명령·주의

```bash
# Tier A 전체 (권장)
mvn test -Dtest=AdminShopCatalogSkuServiceImplTest,AdminShopCatalogSkuControllerMvcTest,AdminPointTenantPolicyControllerMvcTest,AdminShopOrderControllerMvcTest,ClientShopControllerMvcTest,ClientShopCheckoutServiceImplTest,ClientPointWalletServiceImplTest,PointTenantPolicyServiceImplTest,TenantComponentActivationServiceImplTest,ShopOrderFulfillmentServiceImplTest,AdminShopOrderRefundServiceImplTest,ShopOrderHoldExpiryServiceImplTest,ClientShopConsultantMappingServiceImplTest,ShopNotificationHelperImplTest -DforkCount=0
```

- `-DforkCount=0` 또는 `mvn clean test … -DforkCount=1` — 병렬 fork 시 `ClassNotFoundException` 회피 ([SHOP_P2 §2](./SHOP_P2_INTEGRATION_TEST_REPORT.md)).
- **판정**: failed=0, exit=0 → REG-01 **GO**.

### 2.4 프론트 단위 (선택·경량)

| 대상 | 경로 | 비고 |
|------|------|------|
| `clientShopService` | `frontend/src/services/__tests__/clientShopService.test.js` | catalog DTO·`heroImageUrl` 매핑 시 갱신 |

---

## 3. E2E (Playwright) — 시나리오

**SSOT 스펙**

| spec | 경로 | 현재(스모크) | MVP+ 목표 |
|------|------|--------------|-----------|
| Admin | `tests/e2e/tests/admin/admin-shop-catalog-skus-smoke.spec.ts` | 목록 셸·등록 버튼·시드/빈 상태 | **목록 → 전용 등록 → 이미지 → 저장** |
| Client | `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts` | PLP 첫 SKU 담기 → cart 소계 | **PLP 썸네일/placeholder → PDP → 담기** |

**공통 전제** ([tests/e2e/README.md](../../tests/e2e/README.md) §내담자 쇼핑)

- 백엔드 **8080** · 프론트 **3000** · `E2E_*` 자격
- Flyway MVP+ 적용 · `scripts/ops/activate-shop-reward-tenant-components.sql` · `seed-shop-demo-catalog.sql` (`catalog_visible=1`, hero URL 또는 placeholder)
- `skipWhenLocalBackend8080Down` / `skipWhenCiMissingE2eCredentials` — skip 시 exit 0, **Tier A R10은 2 passed가 아님**

**실행 (chromium만 Tier A R10)**

```bash
cd tests/e2e && npx playwright test admin-shop-catalog-skus-smoke client-shop-catalog-to-cart --project=chromium
```

### 3.1 어드민 — 목록 → 등록 → 이미지 → 저장

| 단계 | 동작 | 검증 (testid·셀렉터) |
|:----:|------|----------------------|
| 0 | `loginErpUser` | ERP 어드민 세션 |
| 1 | `GET` `/admin/shop/catalog-skus` | `admin-shop-catalog-page` visible; 게이트 `admin-tenant-component-gate--ADMIN_SHOP_CATALOG` 없음 |
| 2 | 「상품 등록」 클릭 | URL `/admin/shop/catalog-skus/new` (또는 A-2 확정 라우트); `admin-shop-sku-form-page` |
| 3 | 필수 필드 | `admin-sku-title-input`; SKU 코드 **read-only** (입력 불가 또는 서버 발급 표시) |
| 4 | 대표 이미지 | `admin-sku-image-upload` — 파일 선택·미리보기; **저장 전** hero 없으면 클라이언트 400 또는 UI validation |
| 5 | 저장 | `admin-sku-save-button` → 목록 복귀 또는 토스트 성공; 목록에 신규 행·`hero` 반영 |
| 6 | (선택) 수정 | 시드 `DEV-CONSULT-DEMO-01` → `.../edit` · 이미지 교체 PUT |

**기존 스모크 유지**: `admin-shop-catalog-page`, `#admin-shop-catalog-skus-title`, `SEED_SKU_CODE` poll — **깨지지 않도록** 확장만.

**로딩**: `admin-sku-form-loading` detached 후 interact.

### 3.2 내담자 — PLP 썸네일 → PDP → 담기

| 단계 | 동작 | 검증 |
|:----:|------|------|
| 0 | `loginClientWeb` · `E2E_TENANT_ID` | `client-shop-session-loading` detached |
| 1 | `/client/shop` | `client-shop-catalog-page`; `client-shop-catalog-loading` hidden |
| 2 | PLP 카드 | 첫 노출 SKU 카드 내 `figure.client-shop__sku-image-wrapper` — **`img[src]`** 또는 placeholder DOM (network idle 의존 금지, [ORCHESTRATION §8](./SHOP_CATALOG_UX_MVP_PLUS_ORCHESTRATION.md)) |
| 3 | PDP 진입 | 카드 링크/타이틀 클릭 → `client-shop-pdp`; `client-shop__pdp-image` visible |
| 4 | 담기 | `pdp-add-to-cart-button` → `/client/shop/cart` |
| 5 | 장바구니 | `client-shop-cart-page` · `client-shop-cart-subtotal` 「합계」 |
| 6 | 회귀 가드 | `react130ConsoleGate` — React #130·severe console 0건 |

**기존 플로우 호환**: `shop-sku-add-first` 직접 담기 경로는 **유지**하거나, MVP+ 후 **PDP 경유 시나리오를 추가 describe**로 분리 (한 spec 파일 내 2 tests 권장).

**스킵 조건 (문서화만)**

| 조건 | testid / 메시지 |
|------|-----------------|
| `CLIENT_SHOP` 비활성 | `client-tenant-component-gate--CLIENT_SHOP` |
| PLP SKU 없음 | `client-shop-catalog-empty` |

### 3.3 Design Handoff testid 체크리스트 (E2E·수동 공용)

| 영역 | data-testid |
|------|-------------|
| 어드민 폼 페이지 | `admin-shop-sku-form-page` |
| 어드민 로딩 | `admin-sku-form-loading` |
| 어드민 제목·이미지·저장 | `admin-sku-title-input`, `admin-sku-image-upload`, `admin-sku-save-button` |
| 어드민 목록 (기존) | `admin-shop-catalog-page` |
| 클라 PDP | `client-shop-pdp`, `pdp-add-to-cart-button` |
| 클라 PLP·장바구니 (기존) | `client-shop-catalog-page`, `shop-sku-add-first`, `client-shop-cart-page`, `client-shop-cart-subtotal` |

---

## 4. Tier A 회귀

| ID | 게이트 | 명령·대상 | MVP+ B-3 목표 |
|----|--------|-----------|---------------|
| **REG-01** | Maven 14클래스 | §2.3 | **91+ tests PASS**, exit 0 |
| **REG-01** | `frontend` `npm run build:ci` | 프로젝트 표준 | PASS (eslint 경고만 허용) |
| **REG-01** | Expo Jest `pushScenarios\|clientShop` | B-2 병행 시 | 32 passed (B-2 범위) |
| **R10** | Playwright 2 spec · chromium | §3 | **2 passed**, 0 failed (OPS·8080·시드·`CLIENT_SHOP` 전제) |

**종합 (Tier A Shop GO, MVP+ 배치)**

- REG-01 **GO** + R10 **2 passed** → [SHOP_REWARD_FULL_COMPLETION_ORCHESTRATION.md](./SHOP_REWARD_FULL_COMPLETION_ORCHESTRATION.md) R10·OPS 잔여 해소에 기여
- R10 **1 passed / 1 skipped** → **BLOCKED** (현재 dev 이력과 동일; activate·tenant 매칭 후 재실행)

**Go-Live (참조만, B-3 틱)**

- [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) — multipart 크기·MIME·tenant·하드코딩
- `check-hardcode` Shop/catalog 경로 신규 위반 0

---

## 5. B-3 실행 순서 (core-tester)

1. Flyway·OPS 전제 확인 (runbook·tenant activate·시드 hero)
2. Maven §2.3 → REG-01
3. (구현 PR 포함 시) Maven §2.2 slice
4. `npm run build:ci` (frontend)
5. Playwright §3 · chromium
6. 수동 §6
7. 보고서: [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md) §1.0 형식으로 R10·MVP+ 행 추가 · STATUS §3 목록

---

## 6. 수동 QA (5줄)

[SHOP_REWARD_MANUAL_QA_RUN_SHEET.md](./SHOP_REWARD_MANUAL_QA_RUN_SHEET.md) A2·C1·C2에 **이미지** 열을 추가해 실행한다.

1. **A2+** 어드민 `/admin/shop/catalog-skus/new`에서 대표 이미지 없이 저장 시 **400 또는 UI 차단**, 이미지 포함 저장 시 **201**·목록에 썸네일 URL 노출.
2. **A2** 동일 tenant API `GET /api/v1/admin/shop/catalog-skus` — 신규 SKU `heroImageUrl`(또는 스펙 필드명) 비어 있지 않음.
3. **C1** `/client/shop` PLP — 노출 SKU 카드에 **1:1 썸네일** 또는 **placeholder** (깨진 이미지 아이콘 없음).
4. **C1+** PDP — 히어로 이미지·카테고리 뱃지·가격·「장바구니 담기」하단 고정 버튼 정상.
5. **C2** PDP 또는 PLP에서 담기 후 `/client/shop/cart` **소계·수량** 일치; 어드민·내담자 **동일 hero URL**.

---

## 7. 구현 후 문서 갱신 (코드 없음)

| 문서 | 갱신 내용 |
|------|-----------|
| `SHOP_P2_INTEGRATION_TEST_REPORT.md` | Maven 건수·MVP+ 시나리오·R10 2 passed/skipped |
| `SHOP_REWARD_IMPLEMENTATION_STATUS.md` | §3 B-3·G3·G5 |
| `SHOP_REWARD_MANUAL_QA_RUN_SHEET.md` | A2·C1·C2 이미지 열 (§6 반영) |

---

*작성: core-tester · B-3 테스트 계획만 · 코드·스펙·Playwright diff 없음*
