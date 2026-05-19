# Shop·Reward OPS 활성화 런북

| 항목 | 내용 |
|------|------|
| 일자 | 2026-05-20 (§4.1 배포 직후 10분 SSOT) |
| 범위 | Flyway P2 마이그레이션·테넌트 컴포넌트 OPS 활성화·dev/staging 기동·수동 QA·E2E 전제 |
| SSOT | [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §7, [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md), [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md), [SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md](./SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md) |
| 코드 변경 | 없음 (OPS·DB·배포 절차만) |

---

## 한 줄 결론

Shop·Reward P2 반영은 **백엔드 배포(Flyway 002~007 자동 적용, 001은 salary 별도) → OPS에서 대표 tenant 컴포넌트 3종 수동 활성화 → §5·§6·P1 QA 수동 스모크 → Playwright 전제 충족 후 E2E** 순서다. 운영 GO는 [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)와 교차 확인한다.

---

## 1. Flyway 적용 순서 (V20260519_001, 002~005, 007)

### 1.1 적용 방식

| 환경 | 적용 경로 | 비고 |
|------|-----------|------|
| **개발** | `develop` 푸시 → `deploy-backend-dev.yml` → JAR 기동 시 Flyway | `paths`에 `src/main/resources/db/migration/**` 포함 |
| **운영** | `main` 반영 → `deploy-production.yml` (push 또는 `workflow_dispatch`) → 블루그린 슬롯 기동 시 Flyway | [deployment/README-BLUEGREEN.md](../../deployment/README-BLUEGREEN.md) |
| **로컬** | Spring Boot `dev` 프로파일 기동 시 Flyway 자동 | DB URL은 `.env` / `application-dev.yml` |

마이그레이션 파일은 **버전 번호 순**으로 적용된다. Shop·Reward P2 세트:

| 순서 | 버전 | 파일 | 내용 |
|------|------|------|------|
| — | `V20260519_001` | `V20260519_001__salary_calculations_audit_columns_out_of_order.sql` | `salary_calculations` audit 컬럼 (Shop P2와 무관, 버전만 공유) |
| 1 | `V20260519_002` | `V20260519_002__point_tenant_policies.sql` | `point_tenant_policies` 테이블 |
| 2 | `V20260519_003` | `V20260519_003__shop_reward_component_catalog_seed.sql` | `component_catalog` 시드 3종 (`INSERT IGNORE`) |
| 3 | `V20260519_004` | `V20260519_004__shop_order_refunded_status.sql` | `shop_client_orders.status` COMMENT — `REFUNDED` 값 문서화 (VARCHAR 확장, DDL enum 변경 없음) |
| 4 | `V20260519_005` | `V20260519_005__shop_order_fulfillment_events.sql` | `shop_order_fulfillment_events` 테이블 (PAID 후 이행 이벤트, append-only) |
| 5 | `V20260519_006` | `V20260519_006__shop_order_line_mapping_link.sql` | `shop_client_order_lines.consultant_client_mapping_id` (CONSULTATION ERP 훅) |
| 6 | `V20260519_007` | `V20260519_007__shop_catalog_category_column.sql` | `shop_catalog_skus.catalog_category` (`CONSULTATION` \| `ASSESSMENT`) |
| 7 | `V20260520_001` | `V20260520_001__shop_catalog_sku_price_history.sql` | `shop_catalog_sku_price_history` (R3 단가 이력) |
| 8 | `V20260521_001` | `V20260521_001__lnb_admin_shop_reward_menus.sql` | LNB 「쇼핑·리워드」 메뉴 4건 — 적용 후 어드민 새로고침 |

> **수동 확인**: `flyway_schema_history`에 **구버전** `V20260519_001__shop_catalog_category_column.sql`(또는 `20260519.001` + shop catalog description)이 이미 SUCCESS인 DB는 rename 후 007 재적용을 막기 위해 §1.2 (B)로 `catalog_category` 컬럼 존재를 확인하고, 필요 시 [FLYWAY_REPAIR_AFTER_FAILED_MIGRATION.md](../deployment/FLYWAY_REPAIR_AFTER_FAILED_MIGRATION.md)로 이력·checksum을 정리한다.

> Shop P2c는 **004=REFUNDED**, **005=fulfillment events**, **006=mapping link**, **007=catalog_category** 로 분리되어 있다(과거 `V20260519_004__shop_order_fulfillment_events`·`001` shop 중복 해소). 배포 전 `flyway_schema_history`에서 `20260519` 항목·CI 빌드 로그를 확인한다.

### 1.2 적용 후 검증 SQL

아래는 **대상 DB에 접속한 뒤** 실행한다. `tenant_id`·`subdomain` 등은 환경 변수·조회 결과로 치환한다 (저장소·Flyway에 tenant 하드코딩 금지).

```sql
-- (A) Flyway 이력 — Shop P2: 002~007 SUCCESS (001은 salary 별도)
SELECT installed_rank, version, description, success, installed_on
FROM flyway_schema_history
WHERE version IN ('20260519.002', '20260519.003', '20260519.004', '20260519.005', '20260519.006', '20260519.007')
   OR script LIKE '%20260519_002__point_tenant%'
   OR script LIKE '%20260519_003__shop_reward%'
   OR script LIKE '%20260519_004__shop_order_refunded%'
   OR script LIKE '%20260519_005__shop_order_fulfillment%'
   OR script LIKE '%20260519_006__shop_order_line_mapping%'
   OR script LIKE '%20260519_007__shop_catalog_category%'
ORDER BY installed_rank;

-- (B) V007 — catalog_category 컬럼 (구 001 shop 적용 DB는 컬럼만 확인)
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'shop_catalog_skus'
  AND COLUMN_NAME = 'catalog_category';

-- 샘플 데이터 (테넌트·SKU는 조회 결과로 치환)
-- SELECT id, tenant_id, sku_code, catalog_category, catalog_visible, active
-- FROM shop_catalog_skus
-- WHERE tenant_id = :tenant_id AND is_deleted = 0
-- LIMIT 5;

-- (C) V002 — point_tenant_policies 테이블
SHOW TABLES LIKE 'point_tenant_policies';

SELECT COUNT(*) AS policy_row_count
FROM point_tenant_policies
WHERE tenant_id = :tenant_id AND is_deleted = 0;
-- MVP 키 6종은 어드민 GET 또는 PATCH 후 확인 (earn_rate, earn_cap_per_order, min_order_for_redeem, max_redeem_per_order, allow_pg_mix, allow_points_only)

-- (D) V003 — component_catalog 시드
SELECT component_code, component_id, is_active, is_deleted
FROM component_catalog
WHERE component_code IN ('CLIENT_SHOP', 'CLIENT_REWARD', 'ADMIN_SHOP_CATALOG')
  AND is_deleted = FALSE;
-- 기대: 3행, is_active = 1

-- (E) V004 — shop_client_orders.status REFUNDED (COMMENT만 갱신)
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'shop_client_orders'
  AND COLUMN_NAME = 'status';
-- 기대: COLUMN_COMMENT 에 REFUNDED 포함

-- (F) V005 — shop_order_fulfillment_events 테이블
SHOW TABLES LIKE 'shop_order_fulfillment_events';

-- (G) V006 — consultant_client_mapping_id (ERP fulfillment)
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'shop_client_order_lines'
  AND COLUMN_NAME = 'consultant_client_mapping_id';
```

**실패 시**: 애플리케이션 로그에서 Flyway 오류 확인 → 개발 `journalctl -u mindgarden-dev.service`, 운영 `mindgarden-core-blue` / `mindgarden-core-green` ([§3](#3-devstaging-기동-deployment-기준)).

---

## 2. V003 OPS 수동 활성화 — TenantComponent

Flyway `V20260519_003`은 **`component_catalog` 시드만** 수행한다. **테넌트별 on/off는 Flyway 밖 OPS SQL**이다 ([SHOP_REWARD §7](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md)). LNB 「쇼핑·리워드」 메뉴는 Flyway `V20260521_001` 적용·어드민 새로고침으로 노출된다(컴포넌트 off여도 LNB 표시, 페이지/API 403은 별도).

### 2.1 원칙

- **`tenant_id` 하드코딩 금지** — Flyway·저장소·Java/JS 상수에 MindGarden UUID를 박지 않는다.
- **`:tenant_id`**, **`:subdomain`** 은 운영 DB 조회 또는 온보딩 기록·Secret·런타임 env로 치환한다.
- MindGarden **대표 tenant**에 MVP 3종을 켠다: `CLIENT_SHOP`, `CLIENT_REWARD`, `ADMIN_SHOP_CATALOG`.

**저장소 스크립트**: `scripts/ops/activate-shop-reward-tenant-components.sql` (`:tenant_id` 플레이스홀더·멱등 `NOT EXISTS`).

```bash
# §2.2로 tenant_id 조회 후 mysql에서 실행 (예시)
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SET @tenant_id='YOUR-TENANT-UUID'; SOURCE scripts/ops/activate-shop-reward-tenant-components.sql;"
# 또는 클라이언트에서 :tenant_id 를 조회 UUID로 치환해 파일 내용만 붙여넣기
```

### 2.2 tenant_id 조회 (치환용)

```sql
-- subdomain은 환경별 MindGarden 테넌트 호스트 접두로 치환 (예: dev FQDN의 서브도메인 라벨)
SELECT tenant_id, subdomain, tenant_name, status
FROM tenants
WHERE subdomain = :subdomain
  AND is_deleted = FALSE;
```

### 2.3 활성화 SQL (V003 파일 주석 SSOT)

**파일**: `scripts/ops/activate-shop-reward-tenant-components.sql` (§2.1). Flyway 마이그레이션 `V20260519_003__shop_reward_component_catalog_seed.sql` 하단 주석과 동일 본문. **1회·멱등** (`NOT EXISTS`).

```sql
-- :tenant_id ← §2.2 조회 결과
INSERT INTO tenant_components (
    tenant_component_id, tenant_id, component_id, status,
    activated_at, activated_by, is_deleted, created_by, updated_by
)
SELECT UUID(), :tenant_id, cc.component_id, 'ACTIVE',
       CURRENT_TIMESTAMP, 'ops-manual', FALSE, 'ops-manual', 'ops-manual'
FROM component_catalog cc
WHERE cc.component_code IN ('CLIENT_SHOP', 'CLIENT_REWARD', 'ADMIN_SHOP_CATALOG')
  AND cc.is_deleted = FALSE
  AND NOT EXISTS (
      SELECT 1 FROM tenant_components tc
      WHERE tc.tenant_id = :tenant_id
        AND tc.component_id = cc.component_id
        AND tc.is_deleted = FALSE
  );
```

### 2.4 활성화 검증

```sql
SELECT tc.tenant_id, cc.component_code, tc.status, tc.activated_at
FROM tenant_components tc
JOIN component_catalog cc ON cc.component_id = tc.component_id
WHERE tc.tenant_id = :tenant_id
  AND cc.component_code IN ('CLIENT_SHOP', 'CLIENT_REWARD', 'ADMIN_SHOP_CATALOG')
  AND tc.is_deleted = FALSE;
-- 기대: 3행, status = ACTIVE
```

**API 스모크** (배포·JWT·`X-Tenant-ID` 전제):

```http
GET /api/v1/tenant/components/active-codes
```

응답 `activeComponentCodes`에 위 3 code 포함 여부 확인. 비활성 tenant는 LNB·PLP 숨김 또는 API 403 ([MULTI_TENANT §S-A4](./MULTI_TENANT_SHOP_MARKETPLACE_SPEC.md)).

### 2.5 SKU·포인트 시드 (OPS, Flyway 외)

Playwright·Client web §6 전제:

- 어드민 또는 API로 **`catalogVisible=true`**, **`active=true`** SKU ≥ 1 ([SHOP_P2 §5.1 A2·A6](./SHOP_P2_INTEGRATION_TEST_REPORT.md)).
- dev QA 일괄 시드는 [§3.5](#35-dev-qa용-sku-시드-제안) 제안 스크립트 참고.
- 포인트 전액 QA(C6·QA-2) 시 **가용 잔액** 시드.

---

## 3. dev/staging 기동 (`deployment/` 기준)

### 3.1 자동 배포 (권장)

| 대상 | 워크플로 | 트리거 |
|------|----------|--------|
| 백엔드·Flyway | `deploy-backend-dev.yml` | `develop` push + Java/`db/migration`/`pom.xml` paths |
| 프론트 (Shop UI) | `deploy-frontend-dev.yml` | `develop` push + `frontend/**` |
| 운영 백엔드 | `deploy-production.yml` | `main` push (paths) 또는 **Actions → Run workflow** |
| 운영 프론트만 | `deploy-frontend-prod.yml` | `main` push + `frontend/**` |

Shop P2는 **백엔드+프론트+DB** 모두 해당 → 개발은 develop 푸시 시 위 두 워크플로, 운영은 코어 배포 + 필요 시 프론트 워크플로.

### 3.2 systemd · 로그 (개발)

| 항목 | 저장소 기준 |
|------|-------------|
| 서비스 유닛 | `deploy-backend-dev.yml` → **`mindgarden-dev.service`** |
| 재시작 | `sudo systemctl restart mindgarden-dev.service` |
| 상태 | `sudo systemctl status mindgarden-dev.service` |
| 로그 | `sudo journalctl -u mindgarden-dev.service --no-pager -n 400` |
| 앱 로그 | `/var/www/mindgarden-dev/logs/error.log` ([DEV_DEPLOYMENT_STABILITY_CHECKLIST.md](../troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md) §3) |

### 3.3 systemd · 로그 (운영)

| 항목 | 저장소 기준 |
|------|-------------|
| 블루그린 예시 | [deployment/systemd/mindgarden-core-blue.service.example](../../deployment/systemd/mindgarden-core-blue.service.example), [mindgarden-core-green.service.example](../../deployment/systemd/mindgarden-core-green.service.example) |
| env 예시 | [deployment/mindgarden.prod-env.example](../../deployment/mindgarden.prod-env.example) → 호스트 `/etc/mindgarden/prod.env` |
| 절차 SSOT | [deployment/README-BLUEGREEN.md](../../deployment/README-BLUEGREEN.md), [PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](../deployment/PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md) |
| 레거시 수동 참고 | [deployment/manual-deploy.sh](../../deployment/manual-deploy.sh), [deployment/pre-deployment-checklist.md](../../deployment/pre-deployment-checklist.md) |

운영에서 **`mindgarden.service`와 블루그린 유닛 병행 금지** ([README-BLUEGREEN §기존 mindgarden.service](../../deployment/README-BLUEGREEN.md)).

### 3.4 기동 후 헬스

- 개발·운영: `/api/actuator/health` → `UP`
- Flyway 실패 시: 워크플로 로그의 Flyway 메시지 → [FLYWAY_REPAIR_AFTER_FAILED_MIGRATION.md](../deployment/FLYWAY_REPAIR_AFTER_FAILED_MIGRATION.md)
- **dev 일괄 검증 헬퍼**(read-only): `TENANT_ID=<uuid> bash scripts/ops/verify-shop-reward-dev.sh` — actuator health(선택)·Flyway 체크리스트·OPS SQL 실행 순서 출력 (기본 exit 0, `VERIFY_STRICT=1` 시 health 실패만 exit 1)

### 3.5 dev QA용 SKU 시드

**목적**: dev/staging에서 PLP·Playwright·런북 §4 Client 스모크 전제(`catalogVisible=true` SKU ≥ 1)를 API 없이 빠르게 맞춘다.

**파일**: `scripts/ops/seed-shop-demo-catalog.sql` (`:tenant_id` 플레이스홀더·CONSULTATION 1건·멱등 `NOT EXISTS`)

| 항목 | 내용 |
|------|------|
| `tenant_id` | **`:tenant_id` 플레이스홀더** — §2.2 `tenants` 조회 UUID로 치환 (저장소·Flyway 하드코딩 금지) |
| SKU | **CONSULTATION 1건** — `sku_code='DEV-CONSULT-DEMO-01'`, `catalog_category='CONSULTATION'`, `catalog_visible=1`, `active=1`, `is_deleted=0` |
| 멱등 | 동일 `tenant_id` + `sku_code` 존재 시 `INSERT` 스킵 (`NOT EXISTS`, `uk_shop_sku_tenant_code` 정합) |
| 가격 | dev QA 더미 `unit_price_minor=50000`, `currency='KRW'` — **운영 DB·덤프 이식 금지**(스크립트 주석 SSOT) |

**실행 예시** (3줄):

```bash
# §2.2로 tenant_id 조회 후
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SET @tenant_id='YOUR-TENANT-UUID'; SOURCE scripts/ops/seed-shop-demo-catalog.sql;"
```

**검증**:

```sql
SELECT sku_code, catalog_category, catalog_visible, active, unit_price_minor
FROM shop_catalog_skus
WHERE tenant_id = :tenant_id AND is_deleted = 0 AND catalog_visible = 1
LIMIT 5;
```

**선행**: Flyway P2 `002`~`007` 및 `V20260520_001` 적용, §2 TenantComponent 활성화. **후속**: §4 Client C1~C2, §5 Playwright.

---

## 4. P2 수동 QA (교차 참조)

**SSOT**: [SHOP_P2_INTEGRATION_TEST_REPORT.md](./SHOP_P2_INTEGRATION_TEST_REPORT.md)

### 4.1 배포 직후 10분 체크리스트

**대상**: dev — `develop` push·백엔드 배포(Flyway 자동) 직후 ~10분. **판정 SSOT**: [IMPLEMENTATION_STATUS §5.2](./SHOP_REWARD_IMPLEMENTATION_STATUS.md#52-운영-반영--배포opsqa-게이트-2026-05-20), [INTEGRATION_COMMIT_CHECKLIST §6 (3)~(5)](./SHOP_REWARD_INTEGRATION_COMMIT_CHECKLIST.md#6-다음-사용자-액션-2026-05-20).

| 순서 | 작업 | 완료 |
|------|------|:----:|
| 0 | **frontend dev** 배포 완료 확인 (`deploy-frontend-dev.yml`); Flyway `V20260521_001` 후 어드민 **강력 새로고침** | ☐ |
| 1 | **Flyway 3줄** — 대상 DB에서 `20260520.001`·`20260521.001` SUCCESS (Shop P2는 §1.2 전체 SQL로 002~007 병행 확인) | ☐ |
| 2 | **OPS activate** — `scripts/ops/activate-shop-reward-tenant-components.sql` (`:tenant_id` = §2.2 조회 UUID) | ☐ |
| 3 | **(선택) seed** — `scripts/ops/seed-shop-demo-catalog.sql` — PLP·Playwright 전제 SKU | ☐ |
| 4 | **verify 헬퍼** — `TENANT_ID=<uuid> bash scripts/ops/verify-shop-reward-dev.sh` (read-only; `VERIFY_STRICT=1` 선택) | ☐ |
| 5 | **어드민 LNB** — 로그인 후 LNB 「쇼핑·리워드」 4메뉴 노출 **스크린샷 1장** (첨부는 티켓·채널; 본 문서에는 경로·캡션만 기록) | ☐ |

**1) Flyway 검증 SQL (3줄)**

```sql
SELECT version, description, success FROM flyway_schema_history
WHERE version IN ('20260520.001', '20260521.001') AND success = 1
ORDER BY installed_rank;
```

**2) OPS activate** — §2.1·§2.3; `tenant_id` 저장소 하드코딩 금지.

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SET @tenant_id='YOUR-TENANT-UUID'; SOURCE scripts/ops/activate-shop-reward-tenant-components.sql;"
```

**3) (선택) seed** — §3.5.

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  -e "SET @tenant_id='YOUR-TENANT-UUID'; SOURCE scripts/ops/seed-shop-demo-catalog.sql;"
```

**4) verify-shop-reward-dev.sh**

```bash
TENANT_ID=<uuid> bash scripts/ops/verify-shop-reward-dev.sh
# 엄격 health: TENANT_ID=<uuid> VERIFY_STRICT=1 bash scripts/ops/verify-shop-reward-dev.sh
```

**5) 어드민 LNB (텍스트 기록만)**

- **캡션 예**: `dev 어드민 LNB — 쇼핑·리워드 (catalog-skus, point-policies, orders, …) post V20260521_001`
- **기대**: 카탈로그 SKU·포인트 정책·주문·(리워드) 메뉴 4건 표시; 컴포넌트 off 시 페이지 403은 §2·API와 별도 확인.

10분 내 위 표 전항 ☐ → [CHECKLIST §6 (4)](./SHOP_REWARD_INTEGRATION_COMMIT_CHECKLIST.md#6-다음-사용자-액션-2026-05-20) **OPS GO** 후 §4.2·§5 수동 QA·Playwright 진행.

---

### 4.2 P2 수동 QA 교차 참조

| 구분 | 문서 위치 | 내용 |
|------|-----------|------|
| Admin API 스모크 | **§5** (§5.1 카탈로그 A1~A8, §5.2 포인트 정책 B1~B4) | Flyway·JWT·`X-Tenant-ID` 전제 |
| Client web 플로우 | **§6** (C1~C8) | PLP→cart→checkout→points, `catalogVisible` SKU |
| P1 결제 게이트 | **§8** → [SHOP_P1 §3](./SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md) | **QA-1** 카드 전액, **QA-2** 포인트 전액, **QA-3** PG 실패 hold 해제 |

**P2 조건부 GO** ([SHOP_P2 §1](./SHOP_P2_INTEGRATION_TEST_REPORT.md)): Flyway 적용 + §5·§6 수동 스모크 + P1 QA-1~3 재확인.

---

## 5. Playwright E2E 재실행 전제

**Spec**: `tests/e2e/tests/client/client-shop-catalog-to-cart.spec.ts`  
**SSOT**: [SHOP_P2 §6.1](./SHOP_P2_INTEGRATION_TEST_REPORT.md)

### 5.1 전제 조건 (미충족 시 `loginClientWeb` 타임아웃·PLP SKU 없음 FAIL)

| # | 전제 |
|---|------|
| 1 | **Spring API 기동** — dev/staging 백엔드·프록시(Nginx) 정상 |
| 2 | **Flyway P2** — §1 `002`~`007` + `V20260520_001` 적용·검증 SQL 통과 |
| 3 | **TenantComponent** — §2 OPS 활성화 (`CLIENT_SHOP` 등) |
| 4 | **노출 SKU** — §3.5 시드 또는 어드민으로 `catalogVisible=true` SKU ≥ 1 |
| 5 | **내담자 자격** — `tests/e2e/helpers/erpAuth.ts` `loginClientWeb()` 계정 |

### 5.2 실행 명령

```bash
cd tests/e2e && npx playwright test client-shop-catalog-to-cart --project=chromium
```

**범위**: PLP → 첫 SKU 담기 → `/client/shop/cart` 소계 assert. **PG·checkout 결제는 범위 외** (P3).

**testid**: `client-shop-catalog-page`, `shop-sku-add-first`, `client-shop-cart-page`, `client-shop-cart-subtotal`

---

## 6. Go-Live 교차 참조

운영 반영 전 [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 전항목 + Shop P2 아래 매핑:

| Go-Live 절 | Shop·Reward 관련 점검 |
|------------|----------------------|
| **§4.5** 결제(PG)·웹훅 URL | Shop checkout·PortOne 웹훅 운영 도메인 ([P1 QA-1·QA-3](./SHOP_P1_PG_POINT_COMMIT_TEST_REPORT.md)) |
| **§5.1~5.2** DB 백업·Flyway | §1 마이그레이션 스테이징 선적용·`flyway_schema_history` |
| **§5.6** 데이터 선별 | 운영 tenant Mind Garden **온보딩으로만** 생성; dev tenant 덤프·SKU 하드코딩 금지 |
| **§7** 배포 파이프라인 | `deploy-production.yml` 수동 게이트·롤백 JAR 경로 |
| **§9 S4** 핵심 플로 1개 | §4 C4~C6 또는 P1 QA-1~2 중 조직 정의 1건 |

하드코딩·Secret 정책: [DEPLOYMENT_STANDARD.md](../standards/DEPLOYMENT_STANDARD.md), [PRE_PRODUCTION §4.2](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md).

---

## 7. 배포 종류 요약

| 변경 | 배포 |
|------|------|
| Java·Flyway·Shop API | **코어솔루션 배포** (`deploy-backend-dev` / `deploy-production`) |
| `frontend/**` Shop UI | **프론트 배포** (`deploy-frontend-dev` / `deploy-frontend-prod`) |
| §2 OPS SQL만 | DB 수동 (배포 불필요, API는 기존 JAR) |

---

## 8. 관련 문서

- [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §7 컴포넌트 플래그
- [SHOP_REWARD_IMPLEMENTATION_STATUS.md](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) — **구현 현황판**(Maven 60건·Flyway·R1/R2·GO/NO-GO)
- [EXPO_SHOP_REWARD_IMPLEMENTATION_STRATEGY.md](./EXPO_SHOP_REWARD_IMPLEMENTATION_STRATEGY.md)
- [POINT_REWARD_EARN_AND_REDEEM_SPEC.md](./POINT_REWARD_EARN_AND_REDEEM_SPEC.md)
- [DEV_DEPLOYMENT_STABILITY_CHECKLIST.md](../troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md)
- [FLYWAY_CORE_VS_OPS_TRACKS.md](../deployment/FLYWAY_CORE_VS_OPS_TRACKS.md)

---

*작성: core-deployer · 문서만 · 커밋 없음*
