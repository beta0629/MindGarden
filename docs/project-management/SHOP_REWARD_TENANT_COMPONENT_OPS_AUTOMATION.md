# Shop·Reward TenantComponent 운영 자동화 (OPS Automation SSOT)

| 항목 | 내용 |
|------|------|
| 문서 제목 | TenantComponent 활성화 — **운영 수동 SQL 금지**·3트랙 자동화 |
| 상태 | **기획 확정** — P0/P1/P2 분배·병렬 위임 대기 |
| 작성일 | 2026-05-20 |
| 상위 SSOT | [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) §7, [SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) |
| 위임 규칙 | [CORE_PLANNER_DELEGATION_ORDER.md](./CORE_PLANNER_DELEGATION_ORDER.md) — 구현=`core-coder`, 검증=`core-tester` 게이트, 배포=`core-deployer` |

---

## 0. 전체 완결 오케스트레이션과의 관계

[Tier A 쇼핑·리워드 전체 완결 오케스트레이션](./SHOP_REWARD_FULL_COMPLETION_ORCHESTRATION.md)은 R11 알림·R10 Playwright·OPS-02(테넌트 컴포넌트)·수동 QA를 한 SSOT로 묶는다. 본 문서는 그중 **OPS-02「대표 tenant에 Shop 3종 수동 activate」**를 **운영 정책 위반(수동 SQL)**에서 벗겨 **Flyway backfill(P0)·온보딩 기본값(P1)·슈퍼어드민 UI(P2)**로 치환하는 실행 계획이다. Tier A **운영 GO** 판정은 FULL_COMPLETION §2의 OPS-02가 **본 문서 P0 dev 검증 완료**로 대체될 때만 [INTEGRATION_COMMIT_CHECKLIST](./SHOP_REWARD_INTEGRATION_COMMIT_CHECKLIST.md) §6·[IMPLEMENTATION_STATUS](./SHOP_REWARD_IMPLEMENTATION_STATUS.md) §5.2와 함께 갱신한다.

---

## 1. 문제 — per-tenant 수동 OPS vs 운영 요구

| 구분 | 현재 (갭) | 운영 요구 |
|------|-----------|-----------|
| **카탈로그 시드** | Flyway `V20260519_003` — `component_catalog` 3종 (`CLIENT_SHOP`, `CLIENT_REWARD`, `ADMIN_SHOP_CATALOG`) | 배포 시 **자동** (유지) |
| **테넌트 on/off** | [OPS 런북 §2](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) — `scripts/ops/activate-shop-reward-tenant-components.sql`를 **tenant마다** `SET @tenant_id` + `SOURCE` | **운영·스테이징·프로덕션에서 수동 SQL 금지** |
| **신규 테넌트** | `ProcessOnboardingApproval` → `ActivateDefaultComponents` — `business_category_items.default_components_json` 의존; Shop 3종 **미포함** | 상담 업종 **온보딩 승인 시** Shop 3종 자동 활성화 |
| **예외·재활성** | DB 직접 접속만 문서화 | 슈퍼어드민 **API/UI** (P2) |

**리스크**: 수동 OPS는 tenant UUID 누락·환경 혼동·감사 추적 부재·Go-Live 체크리스트 불일치. **SSOT SQL 본문**은 `activate-shop-reward-tenant-components.sql`에 두되, **프로덕션 실행 경로는 Flyway·애플리케이션만** 허용한다.

---

## 2. 3트랙 우선순위 (P0 / P1 / P2)

| 트랙 | 우선순위 | 목표 | 산출 | 운영 수동 SQL |
|------|:--------:|------|------|:-------------:|
| **P0** | **P0** | **기존** `tenants.status = ACTIVE` 이고 상담 계열 `business_type` 테넌트 전원에 Shop 3종 `tenant_components` **멱등 backfill** | 신규 Flyway 1건 + dev **1회** 배포·검증 | **금지** (backfill이 대체) |
| **P1** | **P1** | `business_category_items.default_components_json`에 Shop 3종 반영 → **신규 온보딩** 시 `ActivateDefaultComponents` 자동 | Flyway(데이터) 1건; 프로시저 계약 검증 | **금지** |
| **P2** | **P2** | 슈퍼어드민 **TenantComponent activate/deactivate** API + 어드민 UI | Controller·Service·AdminCommonLayout 화면 | **금지** (UI/API만) |

**선행**: `V20260519_003` (component_catalog 시드) **SUCCESS** — 이미 Tier A 배포 전제.

**병렬 위임 (의존성 없음)**  
- **동시 가능**: P0 `core-coder` ‖ P1 `core-coder`(별도 Flyway 파일) ‖ P2 `core-designer`(와이어·정보 노출)  
- **순차 필수**: 각 코더 배치 직후 **core-tester**; P0 배포 후 **shell**(dev SSH·read-only 검증) **1회**

---

## 3. P0 — Flyway backfill (기존 ACTIVE 상담 테넌트)

### 3.1 대상·멱등

- **대상 테넌트**: `tenants` where `(is_deleted = 0 OR is_deleted IS NULL OR is_deleted = FALSE)` AND `status = 'ACTIVE'` AND `business_type` in 상담 계열 — 최소 `CONSULTATION`, `COUNSELING` (코더: dev DB `SELECT DISTINCT business_type`로 확정 후 마이그레이션 주석에 기록).
- **대상 컴포넌트**: `component_catalog.component_code IN ('CLIENT_SHOP','CLIENT_REWARD','ADMIN_SHOP_CATALOG')` AND `is_deleted = FALSE`.
- **멱등**: `NOT EXISTS` on `(tenant_id, component_id)` — [scripts/ops/activate-shop-reward-tenant-components.sql](../../scripts/ops/activate-shop-reward-tenant-components.sql)와 **동일 의미**; `activated_by` = `'flyway-backfill'` (또는 동일 상수 1곳).
- **tenant UUID 하드코딩 금지** — 전 테넌트 `INSERT … SELECT` only.

### 3.2 Flyway 파일명 (코더 SSOT)

| 항목 | 값 |
|------|-----|
| **권장 파일** | `src/main/resources/db/migration/V20260522_001__shop_reward_tenant_component_backfill_active_consultation.sql` |
| **버전** | `20260522.001` (당일 이미 사용 시 `V20260522_002__…`로 bump — [DATABASE_MIGRATION_STANDARD.md](../standards/DATABASE_MIGRATION_STANDARD.md)) |
| **선행 Flyway** | `V20260519_003` SUCCESS |

### 3.3 dev SSH 1회 검증 (수동 SQL 아님)

**목적**: develop 배포 후 backfill **결과 확인만** — 프로덕션·스테이징에 `SOURCE activate` **실행하지 않음**.

| 단계 | 담당 | 내용 |
|------|------|------|
| 1 | **core-deployer** / CI | `develop` push → `deploy-backend-dev.yml` → Flyway 자동 적용 |
| 2 | **shell** | dev 호스트 SSH — `journalctl -u mindgarden-dev.service` 에 `Flyway` / `V20260522_001` SUCCESS 확인 |
| 3 | **shell** | read-only: `flyway_schema_history` 에 `20260522.001` SUCCESS; 샘플 tenant 1건에 대해 `tenant_components` 3행 `ACTIVE` (런북 §2.4 SQL — **조회만**) |
| 4 | **shell** | `TENANT_ID=<uuid> bash scripts/ops/verify-shop-reward-dev.sh` ([verify-shop-reward-dev.sh](../../scripts/ops/verify-shop-reward-dev.sh)) |
| 5 | (선택) | 어드민 JWT로 `GET /api/v1/tenant/components/active-codes` — 3 code 포함 |

**금지**: SSH에서 `SOURCE scripts/ops/activate-shop-reward-tenant-components.sql` 로 **데이터 변경** (P0 backfill 이후 중복·감사 혼선).

---

## 4. P1 — `default_components_json` 온보딩 자동화

### 4.1 목표

- `business_category_items` 중 `business_type` ∈ 상담 계열( P0와 동일 집합)의 `default_components_json`에 Shop 3종 **추가**.
- `ProcessOnboardingApproval` → `ActivateDefaultComponents` 호출 시 **신규 tenant**에 Shop 컴포넌트 행 생성.

### 4.2 코더 확인 필수 (기획만)

- 라이브 DB·마이그레이션의 `ActivateDefaultComponents`가 JSON 원소를 **component_id(UUID)** 로 쓰는지 **component_code** 로 resolve 하는지 **코더가 소스·DB로 확인** 후 P1 Flyway 작성.
- V9 시드는 `["CONSULTATION", …]` 형태(레거시 코드 문자열) — Shop 추가 시 **기존 항목 유지 + JSON_ARRAY_APPEND/merge** 멱등.

### 4.3 Flyway 파일명 (초안)

| 항목 | 값 |
|------|-----|
| **권장 파일** | `V20260522_002__shop_reward_default_components_json_consultation.sql` (P0과 **별도 파일**·병렬 PR 가능) |

---

## 5. P2 — Super-admin API/UI

### 5.1 범위

| 포함 | 제외 |
|------|------|
| 슈퍼어드민(플랫폼) 역할만 `POST/PATCH` tenant별 component activate·deactivate | 테넌트 어드민 self-service |
| `tenant_id`·`component_code` 입력·목록·상태 | Flyway 대체 (P0/P1 유지) |
| **AdminCommonLayout** children 본문 | 커스텀 모달 래퍼 |

### 5.2 설계·구현 위임

- **core-designer** (`model: gemini-3.1-pro`): 테넌트 검색·3종 일괄 토글·감사(activated_by) 표시 — 사용성·역할별 정보 노출.
- **core-coder**: `TenantComponentActivationService` 확장·슈퍼어드민 Controller·권한 `@PreAuthorize`·StandardizedApi 프론트.

---

## 6. 분배실행 표 (병렬)

| Phase | subagent | 병렬 | 전달 요약 |
|:-----:|----------|:----:|-----------|
| **A** | **core-coder** | ↔ B, ↔ D | §7 P0 Flyway backfill |
| **B** | **core-coder** | ↔ A, ↔ D | §8 P1 `default_components_json` Flyway |
| **C** | **core-tester** | A 완료 후 | P0 Maven·Flyway 통합·backfill 멱등·`active-codes` 스모크 |
| **D** | **core-designer** | ↔ A, ↔ B | P2 슈퍼어드민 TenantComponent 화면설계 |
| **E** | **core-coder** | D 산출 후 | P2 API/UI 구현 |
| **F** | **core-tester** | E 완료 후 | P2 권한·교차 tenant·회귀 |
| **G** | **shell** | C PASS 후 | dev SSH read-only §3.3 |
| **H** | **core-deployer** | A merge 후 | develop 배포·Flyway 로그 |
| **I** | **core-tester** | B 완료 후 | P1 온보딩/프로시저 스모크(가능 시) |

**게이트**: [CORE_PLANNER_DELEGATION_ORDER.md](./CORE_PLANNER_DELEGATION_ORDER.md) — 코드 변경 배치는 **core-tester 통과 전 완료 보고 금지**.

---

## 7. core-coder 배치 프롬프트 — P0 (Flyway backfill)

아래 블록을 Task **`core-coder`** 에 전달한다.

```
역할: core-coder — Shop·Reward P0 TenantComponent Flyway backfill

목표:
- 운영 수동 SQL(activate-shop-reward-tenant-components.sql SOURCE)을 대체하는
  전-ACTIVE-상담-테넌트 멱등 backfill 마이그레이션 1건 추가.

파일:
- src/main/resources/db/migration/V20260522_001__shop_reward_tenant_component_backfill_active_consultation.sql
  (당일 충돌 시 002로 bump, DATABASE_MIGRATION_STANDARD.md 준수)

선행:
- V20260519_003 SUCCESS (component_catalog 3종 존재)

로직 SSOT (의미 동일, tenant UUID 하드코딩 금지):
- scripts/ops/activate-shop-reward-tenant-components.sql
- INSERT tenant_components … SELECT … FROM tenants t CROSS JOIN component_catalog cc
  WHERE t.status='ACTIVE' AND t.business_type IN (…상담 계열…)
  AND cc.component_code IN ('CLIENT_SHOP','CLIENT_REWARD','ADMIN_SHOP_CATALOG')
  AND NOT EXISTS (…)

완료 조건:
- [ ] 로컬/CI Flyway clean migrate 또는 기존 DB에 1회 적용 시 중복 행 0·재실행 no-op
- [ ] activated_by = 'flyway-backfill' (또는 프로젝트 상수 1곳)
- [ ] tenant_id·subdomain 저장소·Java/TS 하드코딩 0건
- [ ] SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md §2에 「프로덕션: P0 Flyway만」1문단 cross-link (문서만, SQL 실행 절차는 deprecated 표기)
- [ ] Maven testCompile; 관련 통합 테스트 깨지지 않음

참조:
- docs/project-management/SHOP_REWARD_TENANT_COMPONENT_OPS_AUTOMATION.md (본 문서)
- docs/standards/DATABASE_MIGRATION_STANDARD.md
- docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md (하드코딩·tenant)
```

---

## 8. core-coder 배치 프롬프트 — P1 (요약)

```
역할: core-coder — P1 business_category_items.default_components_json Shop 3종

파일: V20260522_002__shop_reward_default_components_json_consultation.sql (병렬 PR)

완료 조건:
- [ ] ActivateDefaultComponents 실제 계약(component_id vs code) 확인 후 JSON 갱신
- [ ] 상담 business_type 행에 CLIENT_SHOP, CLIENT_REWARD, ADMIN_SHOP_CATALOG 반영(멱등)
- [ ] 신규 온보딩 승인 스모크 1건(테스트 DB)에서 tenant_components 3행 생성
```

---

## 9. core-tester·배포 게이트

### 9.1 core-tester (P0 완료 후)

| # | 검증 | 기준 |
|---|------|------|
| T1 | Flyway | `20260522.001` SUCCESS; 재기동 시 실패 없음 |
| T2 | Backfill 멱등 | 동일 마이그레이션 재적용 불가(Flyway) + 수동 COUNT: tenant×3 code 중복 0 |
| T3 | API | `TenantComponentActivationService` / `GET …/tenant/components/active-codes` — backfill tenant에서 3 code |
| T4 | 회귀 | Shop Maven 84건·관련 MVC mock (`AdminShopCatalogSku`, `ClientShop`) PASS |
| T5 | E2E 전제 | [admin-shop-catalog-skus-smoke.spec.ts](../../tests/e2e/tests/admin/admin-shop-catalog-skus-smoke.spec.ts) — **수동 activate 메시지 없이** 통과 가능 여부 기록 |

### 9.2 core-tester (P1·P2)

- P1: 온보딩 승인 경로·`default_components_json` null/legacy 회귀.
- P2: 슈퍼어드민만 200·테넌트 어드민 403·타 tenant 격리.

### 9.3 배포 게이트 (core-deployer)

| 환경 | 트리거 | Flyway | OPS SQL |
|------|--------|--------|---------|
| **dev** | `develop` push | P0(+P1) 자동 | **금지** |
| **staging/prod** | `main` / workflow_dispatch | P0(+P1) 자동 | **금지**; P2 UI로 예외 처리 |

**Go-Live**: [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) Shop·컴포넌트 항목 — 「수동 activate SQL」체크를 **「P0 Flyway backfill 적용 확인」**으로 교체 기록.

### 9.4 문서·런북 정리 (generalPurpose 또는 코더 동반)

- [SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md](./SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) §2·§4.1: 프로덕션 **SOURCE activate** → **deprecated**, P0 Flyway + dev read-only 검증으로 대체.
- [SHOP_REWARD_FULL_COMPLETION_ORCHESTRATION.md](./SHOP_REWARD_FULL_COMPLETION_ORCHESTRATION.md) OPS-02 완료 조건 갱신.
- `scripts/ops/activate-shop-reward-tenant-components.sql`: 파일 헤더에 「로컬 개발·비상만; 운영 금지」명시.

---

## 10. 완료 판정 (Tier A OPS-02 대체)

| 체크 | 담당 |
|------|------|
| P0 Flyway merged·dev 배포·§3.3 SSH read-only PASS | core-coder + shell + core-tester |
| P1 Flyway merged·온보딩 스모크 PASS | core-coder + core-tester |
| P2 (선택 Tier A / 권장 Tier B) 슈퍼어드민 UI | designer + coder + tester |
| 운영·스테이징 수동 `SOURCE activate` 미실행 증적 | QA·배포 체크리스트 |

---

**작성**: core-planner · 2026-05-20
