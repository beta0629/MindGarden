# 새벽 스케줄러 E3 — 통합 재무 프로시저 멀티테넌트 격리 정공법 마이그레이션 합의서

**버전**: 1.0.0  
**작성일**: 2026-05-26  
**작성자**: core-planner (기획 전용 오케스트레이터)  
**상태**: 사용자 컴펜 대기 (Q1–Q3 응답 후 Phase 1 착수)  
**옵션 채택**: A-3 정공법 (스키마 확장 + 프로시저 재작성 + Java 정합 + E2E)  
**전제 게이트**: 본 합의서는 **읽기 전용 설계** — 코드 / Flyway / DB 변경 0건. 사용자 Q1–Q3 컴펜 받은 뒤 Phase 1 부터 core-coder / core-tester 분배실행 개시.

---

## 0. 합의서 사용법

- 본 문서는 **core-planner 산출물**이며, Phase별 **분배실행 표** (§4) 에 따라 부모 에이전트가 core-coder / core-tester 를 호출한다.
- 상세 SQL 본문 · Java 시그니처 · 인덱스 정의 등 **구현 디테일은 본 문서에 적지 않는다** — 그것은 core-coder / core-debugger 의 산출이다. 본 문서는 "무엇을, 왜, 어떤 순서로, 누가" 만 정의한다.
- 각 Phase 가 운영에 반영된 뒤 다음 Phase 를 착수한다 (Phase 간 게이트, §5 참조).

---

## 1. 배경 · 현재 상태

### 1.1 직전 진단 인용

- **Agent `61f90fde`** — 새벽 스케줄러 4종 ERROR 패턴 (E1 / E2 / E3 / E4) 광역 분류. E3 는 매일 04:00 KST 통합 재무 프로시저 호출 실패로 식별.
- **Agent `2819307d`** (core-coder 진단) — E3 의 **결정적 root cause** 확인:
  - DB 정본은 `mind_garden` 스키마의 5개 PL/SQL 프로시저.
  - `financial_transactions` (25 컬럼) + `branches` (29 컬럼) **양쪽 모두 `tenant_id` 컬럼 부재**.
  - 5개 프로시저 본문 어디에도 `tenant_id` WHERE 절 없음.
  - 5개 프로시저 RESULT SET 어디에도 tenant 식별 컬럼 없음.
  - Java 호출 측 (`PlSqlFinancialServiceImpl`) 은 `runPerTenant` 로 tenant 별 6-인자 (3 IN + 3 OUT) 패턴 사용 중 → **DB 정본과 완전 드리프트**.

### 1.2 영향 대상 — 5개 프로시저

| # | 프로시저명 | Java 호출 메서드 | 현재 시그니처 (Java 기대) |
|---|---|---|---|
| 1 | `GetBranchFinancialBreakdown` | `getBranchFinancialBreakdown` | `(tenant_id, start_date, end_date, OUT success, OUT message, OUT JSON)` |
| 2 | `GetMonthlyFinancialTrend` | `getMonthlyFinancialTrend` | `(tenant_id, start_date, end_date, OUT success, OUT message, OUT JSON)` |
| 3 | `GetCategoryFinancialBreakdown` | `getCategoryFinancialBreakdown` | `(tenant_id, start_date, end_date, OUT success, OUT message, OUT JSON)` |
| 4 | `GenerateQuarterlyFinancialReport` | `generateQuarterlyFinancialReport` | `(year, quarter, tenant_id, OUT success, OUT message, OUT JSON)` |
| 5 | `CalculateFinancialKPIs` | `calculateFinancialKPIs` | `(tenant_id, start_date, end_date, OUT success, OUT message, OUT 6 KPI fields)` |

### 1.3 영향 대상 — 2개 테이블

- **`financial_transactions`** (25 컬럼) — 현재 `branch_code` 만 보유, `tenant_id` 부재. 운영 데이터 다수 보유.
- **`branches`** (29 컬럼) — 현재 `branch_code` PK 기준, `tenant_id` 부재.

### 1.4 영향 · 빈도

- **매일 04:00 KST** ERROR 발생 (스케줄러 통합 재무 새벽 집계).
- **데이터 손실 0건** — 캐시 stale 만 발생. 어드민 대시보드는 직전 값 표시.
- 사용자/관리자 가시 영향: 04:00 ~ 다음 정상 갱신까지 통합 재무 위젯 stale.
- 보안/격리 측면: **단일 tenant 운영이면 즉시 위험은 낮음, 다중 tenant 운영이면 잠재적 데이터 크로스-tenant 누출 위험** (Q1 컴펜 후 결정).

### 1.5 인접 이슈와의 관계

- **E1** (양 스키마 시그니처 충돌, 직전 hotfix `1ac3d8fc0` 에서 `withSchemaName("mind_garden")` 명시로 해소) — `mind_garden` 단독 정착 vs `core_solution` 동기화 여부가 Q2 와 연계.
- **E2** (`@Modifying` long → int, 직전 hotfix `6fe8c6668` 해소) — 본 E3 와 독립.
- **`V20260528_003__update_alimtalk_biz_template_code_solapi_ids.sql`** 운영 미적용 보존 — Phase 4 Flyway 번호 충돌 방지 필요 (별도 슬롯 배정).

---

## 2. 멀티테넌트 격리 정공법 목표

### 2.1 스키마 목표

- `financial_transactions.tenant_id` 컬럼 신설 (VARCHAR(255), 최종 NOT NULL, FK 후보 — `tenants` 테이블 존재 시).
- `branches.tenant_id` 컬럼 신설 (동일 규격).
- 인덱스 신설:
  - `idx_financial_transactions_tenant_id` (단독)
  - `idx_financial_transactions_tenant_date` (조합: `tenant_id`, `transaction_date`)
  - `idx_branches_tenant_id` (단독)
- 컬럼 표준: `docs/standards/TENANT_ID_GENERATION_STANDARD.md` 의 VARCHAR(255) 규격 준수.

### 2.2 프로시저 목표

- 5개 프로시저 모두 **첫 IN 파라미터로 `p_tenant_id VARCHAR(255)` 추가** (이미 Java 측 시그니처와 일치하는 형태).
- WHERE 절에 `tenant_id = p_tenant_id` (또는 `ft.tenant_id = p_tenant_id`) 일관 적용.
- 입력값 검증 절에 `IF p_tenant_id IS NULL OR p_tenant_id = '' THEN ... LEAVE;` 정착 (`database/schema/procedures_standardized/` 기존 표준화 본 참고).
- RESULT SET / OUT JSON 에 `tenant_id` echo 컬럼 추가 (검증/감사용).
- 배포 스키마: **Q2 컴펜 결과에 따라 `mind_garden` 단독 OR 양 스키마 동시 배포** 결정.

### 2.3 Java 정합 목표

- `PlSqlFinancialServiceImpl` 5개 메서드 시그니처 유지 (이미 tenant_id 를 전달 중).
- `prepareCall` SQL 의 `?` 수 · OUT 파라미터 등록 인덱스 점검 (DB 정본과 일치).
- **방식 결정 Q3** — 현행 3 OUT 파라미터 (`p_success`, `p_message`, `p_xxx_data`) 유지 vs 단순 RESULT SET 으로 단순화.

### 2.4 격리 보증 목표

- 새벽 04:00 KST 스케줄러 트리거 시 tenant 별 독립 실행 (`runPerTenant`) → 각 tenant 데이터만 집계.
- 다중 tenant DEV 환경에서 SELECT 격리 검증 (가짜 tenant 추가 → 다른 tenant 데이터 0건 노출 확인).

---

## 3. 단계별 마이그레이션 설계 (Flyway 다단계, backward-compatible)

> **원칙**: 각 Phase 는 직전 운영 상태에서 즉시 롤백 가능해야 한다. Phase 1 ~ 3 은 Java / 프로시저 무영향이므로 단독으로 운영에 반영 가능. Phase 4 부터 동기 변경 필요.

### Phase 1 — 스키마 확장 (NULL 허용)

- **Flyway 파일**: `V202606XX_001__add_tenant_id_to_financial_tables.sql` (실제 날짜는 core-coder 가 산정 시 결정)
- **변경 핵심**:
  - `ALTER TABLE financial_transactions ADD COLUMN tenant_id VARCHAR(255) NULL` (먼저 NULL 허용)
  - `ALTER TABLE branches ADD COLUMN tenant_id VARCHAR(255) NULL`
  - 단독 인덱스 + 조합 인덱스 추가 (운영 데이터 규모는 core-coder 가 사전 측정 후 인덱스 생성 전략 결정 — 대용량이면 `CREATE INDEX ... ALGORITHM=INPLACE LOCK=NONE`).
- **운영 영향**: NULL 허용이므로 기존 INSERT / SELECT 호환. Java · 프로시저 무영향.
- **검증**: `SHOW COLUMNS FROM financial_transactions` / `SHOW INDEX FROM ...` 으로 신규 컬럼 · 인덱스 존재 확인.

### Phase 2 — 데이터 backfill

- **Flyway 파일**: `V202606XX_002__backfill_tenant_id_financial_tables.sql`
- **변경 핵심**:
  - 운영이 **단일 tenant** (`tenant-incheon-counseling-001`) — 단순 `UPDATE financial_transactions SET tenant_id = 'tenant-incheon-counseling-001' WHERE tenant_id IS NULL` + `branches` 동일 처리.
  - 운영이 **다중 tenant** — `branches.branch_code` → `tenant_id` 매핑 테이블 (또는 매핑 규칙) 기반 일괄 UPDATE. **매핑 규칙은 Q1 컴펜 후 core-coder 가 별도 산출**.
  - 신규 INSERT 시점에 `tenant_id` 가 누락되지 않도록 **application 레벨 보장** (entity / repository) 또는 **DB 트리거** 중 선택 — core-coder 가 trade-off 보고 후 결정.
- **운영 영향**: DML 만 발생. Java · 프로시저 무영향.
- **검증**: `SELECT COUNT(*) FROM financial_transactions WHERE tenant_id IS NULL` = 0, `branches` 동일.

### Phase 3 — NOT NULL 제약 + FK (선택)

- **Flyway 파일**: `V202606XX_003__finalize_tenant_id_constraints.sql`
- **변경 핵심**:
  - `ALTER TABLE financial_transactions MODIFY COLUMN tenant_id VARCHAR(255) NOT NULL`
  - `ALTER TABLE branches MODIFY COLUMN tenant_id VARCHAR(255) NOT NULL`
  - `tenants` 테이블 존재 시 FK 추가 검토 (운영 데이터 정합성 사전 검증 필수).
- **운영 영향**: Phase 2 backfill 100% 완료 후에만 안전. Java · 프로시저 무영향 (NULL 검사가 강화될 뿐).
- **검증**: `ALTER` 성공 + 신규 INSERT 시 NULL 거부 동작 확인.

### Phase 4 — 프로시저 재작성

- **Flyway 파일**: `V202606XX_004__rewrite_financial_procedures_with_tenant.sql` (5개 프로시저 일괄 `DROP / CREATE`)
- **변경 핵심**:
  - 5개 프로시저 첫 IN 파라미터로 `p_tenant_id VARCHAR(255)` 추가.
  - WHERE 절 `tenant_id = p_tenant_id` 일관 적용.
  - RESULT / OUT JSON 에 `tenant_id` echo.
  - `mind_garden` 스키마 단독 배포 vs `core_solution` 동기화 — **Q2 컴펜 후 결정**.
  - 참고: `database/schema/procedures_standardized/` 의 기존 "표준화 본" 이 이미 정공법 형태 — Phase 4 는 표준화 본을 정본화 (deploy) 하는 작업.
- **운영 영향**: Java 호출 측이 이미 6-인자 패턴을 보내므로 시그니처는 즉시 정합. RESULT SET 의 echo 컬럼 추가는 Java 측 무시 가능.
- **검증**: `SHOW CREATE PROCEDURE ...` 로 신규 시그니처 확인 + DEV 에서 1 tenant 대상 호출 → JSON 응답 형식 점검.

### Phase 5 — Java 정합

- **변경 파일**: `src/main/java/com/coresolution/consultation/service/impl/PlSqlFinancialServiceImpl.java` (5개 메서드).
- **변경 핵심**:
  - `prepareCall` SQL 의 `?` 수가 DB 정본과 일치하는지 재확인 (현재도 동일하지만 회귀 가드 차원).
  - OUT 파라미터 방식 — **Q3 컴펜 결과** 에 따라 현행 유지 OR 단순 RESULT SET 으로 단순화.
  - 단위 테스트 — 5개 메서드 × {정상, tenant_id NULL, 기간 invalid} 시나리오.
- **운영 영향**: Spring Bean redeploy. 직전 Phase 4 가 운영 반영된 뒤에만 안전.
- **검증**: 단위 테스트 통과 + DEV 환경에서 04:00 KST 스케줄러 수동 트리거 → ERROR 0건.

### Phase 6 — E2E 테스트

- **변경 파일**: `src/test/java/.../FinancialSchedulerE2ETest.java` 신설 (core-tester 가 위치 결정).
- **변경 핵심**:
  - 단위 테스트 (Phase 5 에서 1차 작성, Phase 6 에서 통합).
  - 통합 테스트 (스케줄러 트리거 → 5개 프로시저 호출 → 결과 적재 검증).
  - 회귀 테스트 — 직전 4종 핫픽스 (E1 · E2 · i18n · 단회기 가드) 누적 영향 점검.
  - 다중 tenant 격리 회귀 (DEV 에서 가짜 tenant 추가 → SELECT 결과 격리 확인).

---

## 4. 분배실행 표 (Phase 별 위임)

> 사용자 컴펜 (Q1–Q3) 응답 받은 뒤, 부모 에이전트가 아래 표대로 서브에이전트를 호출. 의존성 없는 작업은 병렬 호출. **각 Phase 가 운영에 반영된 뒤 다음 Phase 시작 (단계별 게이트).**

| Phase | 담당 서브에이전트 | 의존성 | 위임 프롬프트 요약 | 적용 스킬 |
|---|---|---|---|---|
| **Phase 1** | `core-coder` | 사용자 Q1–Q3 컴펜 완료 | "본 합의서 §3 Phase 1 에 따라 `V202606XX_001__add_tenant_id_to_financial_tables.sql` Flyway 마이그레이션 신설. `financial_transactions` + `branches` 양쪽에 `tenant_id VARCHAR(255) NULL` + 단독/조합 인덱스 추가. 운영 데이터 규모 사전 측정 후 인덱스 생성 전략 (INPLACE / LOCK=NONE) 명시. 본문 SQL 작성 + 로컬 DEV 검증 + Flyway 적용 시 lock 점유 시간 측정." | `/core-solution-database-first`, `DATABASE_MIGRATION_STANDARD.md` |
| **Phase 2** | `core-coder` | Phase 1 운영 반영 + Q1 응답 | "본 합의서 §3 Phase 2 에 따라 `V202606XX_002__backfill_tenant_id_financial_tables.sql` 신설. Q1 응답이 **단일 tenant** 면 단순 UPDATE, **다중 tenant** 면 branches.branch_code → tenant_id 매핑 규칙 기반 UPDATE. 신규 INSERT 시점 NULL 방지를 위한 application 레벨 보장 (Entity 기본값 또는 Repository 가드) 추가. backfill 결과 검증 쿼리 (`COUNT(*) WHERE tenant_id IS NULL = 0`) 포함." | `/core-solution-database-first` |
| **Phase 3** | `core-coder` | Phase 2 운영 반영 + Phase 2 검증 100% | "본 합의서 §3 Phase 3 에 따라 `V202606XX_003__finalize_tenant_id_constraints.sql` 신설. 양 테이블 `tenant_id` NOT NULL 전환 + `tenants` 테이블 존재 시 FK 추가 검토. Phase 2 검증 데이터 (NULL = 0) 사전 첨부 필수." | `/core-solution-database-first`, `DATABASE_SCHEMA_STANDARD.md` |
| **Phase 4** | `core-coder` | Phase 3 운영 반영 + Q2 응답 | "본 합의서 §3 Phase 4 + §2.2 에 따라 `V202606XX_004__rewrite_financial_procedures_with_tenant.sql` 신설. 5개 프로시저 모두 첫 IN `p_tenant_id VARCHAR(255)` + WHERE 격리 + RESULT echo. `database/schema/procedures_standardized/` 표준화 본을 정본화. Q2 응답에 따라 `mind_garden` 단독 OR `core_solution` 동기화. DROP/CREATE 절차에 이전 버전 백업 (`SHOW CREATE PROCEDURE`) 포함." | `/core-solution-database-first`, `BATCH_SCHEDULER_STANDARD.md` |
| **Phase 5** | `core-coder` | Phase 4 운영 반영 + Q3 응답 | "본 합의서 §3 Phase 5 + §2.3 에 따라 `PlSqlFinancialServiceImpl` 5개 메서드 정합. Q3 응답에 따라 현행 3 OUT 유지 OR RESULT SET 단순화. 단위 테스트 5개 메서드 × {정상, tenant NULL, invalid 기간} 작성. 직전 진단 (Agent `2819307d`) 의 6-인자 패턴 회귀 점검." | `BACKEND_CODING_STANDARD.md`, `/core-solution-encapsulation-modularization` |
| **Phase 6** | `core-tester` | Phase 5 단위 테스트 통과 | "본 합의서 §3 Phase 6 + §6 에 따라 E2E 테스트 신설. (1) 스케줄러 04:00 KST 수동 트리거 → ERROR 0건 검증, (2) DEV 다중 tenant 격리 회귀 (가짜 tenant 추가 → 크로스 격리 확인), (3) 직전 4종 핫픽스 (E1·E2·i18n·단회기) 누적 영향 회귀, (4) KPI sample SELECT 로 backfill 결과 데이터 검증." | `/core-solution-business-flow` |

**병렬 가능성**: Phase 1 ~ 6 은 순차 (각 Phase 가 직전 Phase 의 운영 반영을 요구) — **병렬 불가**. 단, Phase 5 의 단위 테스트는 Phase 5 코드와 함께 core-coder 가 동시 작성 가능.

---

## 5. 게이트 + 사용자 컴펜

### 5.1 Phase 1 시작 전 사용자 컴펜 필수

#### Q1. 운영 tenant 구조 — backfill 규칙 결정

- **A. 단일 tenant** — 현재 운영이 `tenant-incheon-counseling-001` 단독. backfill 은 단순 UPDATE 1줄.
- **B. 다중 tenant 운영 중** — backfill 매핑 규칙 필요. `branches.branch_code` → `tenant_id` 매핑 표 제공 또는 매핑 규칙 (e.g., 도메인 prefix) 합의.
- **C. 단일이지만 향후 다중 전환 예정** — 현재는 A 처리, but Phase 2 의 application 레벨 INSERT 가드는 미리 다중 대응 설계.

> **planner 의견**: B 이거나 C 일 가능성이 높음 — `tenants` 테이블 / `branches` 와의 매핑이 운영 어딘가에 있을 것 (e.g., `BrandingController`, `TenantContextHolder`). core-debugger 사전 분석 위임 옵션 있음 (Phase 1 직전).

#### Q2. 프로시저 배포 스키마 — `mind_garden` 단독 vs `core_solution` 동기화

- **A. `mind_garden` 단독** — 직전 E1 핫픽스 (`1ac3d8fc0`) 의 `withSchemaName("mind_garden")` 명시 방향과 일치. 가장 단순.
- **B. 양 스키마 동기 배포** — Phase 4 Flyway 가 `mind_garden` + `core_solution` 양쪽 모두에 DROP/CREATE. E1 의 양 스키마 시그니처 충돌 회귀 위험 (Java 호출이 명시 스키마 사용 중이라 안전하지만 검증 필요).
- **C. `core_solution` 단독 + Java 측 스키마 명시 제거** — 더 큰 리팩토링. 본 마이그레이션 범위 밖.

> **planner 의견**: A 권장 (가장 안전 + 직전 E1 핫픽스 방향 정합). B 는 E1 회귀 위험 사전 검증 필요.

#### Q3. 프로시저 결과 반환 방식 — OUT 파라미터 vs RESULT SET

- **A. 현행 3 OUT 유지** (`p_success`, `p_message`, `p_xxx_data` JSON) — Java 변경 최소. 단위 테스트 회귀 위험 낮음.
- **B. 단순 RESULT SET 으로 전환** — Java 측에서 `JdbcTemplate.queryForList` 사용 가능, 코드 단순화. 하지만 5개 메서드 모두 리팩토링 필요 + 회귀 위험.
- **C. KPI 만 다중 OUT 유지, 나머지 4 는 RESULT SET** — 절충안.

> **planner 의견**: A 권장 (변경 최소 + 직전 진단의 시그니처가 이미 안정). B/C 는 본 마이그레이션 이후 별도 PR.

### 5.2 Phase 간 게이트

- 각 Phase 운영 반영 → KPI (§6) 측정 → 다음 Phase 시작.
- 단계 게이트 위반 시 본 합의서로 회귀.

### 5.3 Flyway 번호 충돌 회피

- 운영 미적용 보존 중인 `V20260528_003__update_alimtalk_biz_template_code_solapi_ids.sql` 와 Phase 1 ~ 4 의 신규 마이그레이션 번호가 충돌하지 않도록 **별도 슬롯** 배정. core-coder 가 Phase 1 신설 시 현재 `src/main/resources/db/migration/` 최신 번호 점검 후 충분히 큰 날짜 (e.g., `V202606XX_*`) 사용.

---

## 6. KPI · 검증

| 영역 | KPI | 측정 시점 |
|---|---|---|
| **E3 해소** | 매일 04:00 KST 스케줄러 ERROR 0건 (7일 연속) | Phase 5 운영 반영 후 D+7 |
| **데이터 정합** | `SELECT COUNT(*) FROM financial_transactions WHERE tenant_id IS NULL` = 0 | Phase 2 운영 반영 후 즉시 |
| **단일 tenant 검증** | 운영 backfill 결과 sample 100 rows `tenant_id` 일치 | Phase 2 운영 반영 후 |
| **다중 tenant 격리 (DEV)** | 가짜 tenant 추가 후 SELECT 결과 0건 누출 | Phase 4 DEV 검증 |
| **회귀 — 직전 핫픽스** | E1 (`1ac3d8fc0`), E2 (`6fe8c6668`), i18n, 단회기 누적 회귀 검수 통과 | Phase 6 |
| **회귀 — 새벽 4종 스케줄러** | 00:01 / 00:03 / 00:05 / 03:00 / 04:00 KST 모두 ERROR 0건 | Phase 6 D+7 |

---

## 7. 리스크 · 롤백 전략

| Phase | 리스크 | 롤백 전략 |
|---|---|---|
| **Phase 1** | 대용량 테이블 ALTER lock 점유 (운영 트래픽 영향) | Pre-check 로 row count + INPLACE/LOCK=NONE 사용 가능 여부 확인. 즉시 롤백 가능 (`ALTER TABLE ... DROP COLUMN tenant_id`). |
| **Phase 2** | backfill 매핑 오류 (다중 tenant 시) | UPDATE 트랜잭션 + 사전 dry-run COUNT 비교. 오류 시 `UPDATE ... SET tenant_id = NULL` 로 원복 가능 (Phase 3 미진행 상태이므로 안전). |
| **Phase 3** | NOT NULL 전환 중 INSERT 실패 | Phase 2 backfill 100% 검증 후에만 진행. 롤백 시 `MODIFY ... NULL` 로 즉시 회귀. |
| **Phase 4** | 프로시저 재작성 후 ERROR 패턴 변경 | DROP 전 `SHOW CREATE PROCEDURE` 로 이전 버전 백업 보존 (별도 SQL 파일). 롤백 시 백업본 CREATE 재실행. **백업 파일 위치는 core-coder 가 Phase 4 산출 시 명시**. |
| **Phase 5** | Java 시그니처 불일치 회귀 | Git revert. 직전 4종 핫픽스 hash 기록 후 진행. |
| **Phase 6** | E2E 실패 → 운영 반영 전 차단 | core-tester 가 실패 case 보고 → core-debugger 분석 위임 → core-coder fix → 재테스트 루프. |

---

## 8. 일정 추정

| Phase | 추정 | 비고 |
|---|---|---|
| **사용자 Q1–Q3 컴펜** | 별도 | 본 합의서 합의 후 사용자 응답 대기 |
| **Phase 1** | 1 영업일 | 마이그레이션 작성 + DEV 검증 + 운영 반영 |
| **Phase 2** | 1 영업일 | backfill 규칙 + 검증 (Q1 응답 의존) |
| **Phase 3** | 0.5 영업일 | NOT NULL + FK |
| **Phase 4** | 1 ~ 2 영업일 | 프로시저 5종 재작성 + DB 동기화 (Q2 응답 의존) |
| **Phase 5** | 1 영업일 | Java 정합 + 단위 테스트 (Q3 응답 의존) |
| **Phase 6** | 1 영업일 | E2E + 회귀 |
| **총** | **5 ~ 6 영업일** | 사용자 컴펜 시간 별도 |

---

## 9. 다음 단계

1. **(즉시) 사용자 Q1–Q3 컴펜 수령** — §5.1 의 3개 질문에 대한 사용자 응답.
2. **(컴펜 후) 부모 에이전트가 §4 분배실행 표 Phase 1 행에 따라 `core-coder` 호출** — Flyway 마이그레이션 신설 위임.
3. **(Phase 1 운영 반영 후) Phase 2 위임 진행** — Phase 간 게이트 준수.
4. **(전 Phase 종료 후) core-planner 가 본 합의서 §6 KPI 달성 여부 사용자에게 최종 보고**.

---

## 참조 문서 · 스킬

- 직전 hotfix: `1ac3d8fc0` (E1 P2 `withSchemaName`), `6fe8c6668` (E2 P1 `@Modifying`)
- 직전 진단 에이전트: `61f90fde` (스케줄러 4종 ERROR 광역 분류), `2819307d` (E3 root cause 확정)
- 표준 문서:
  - `docs/standards/BATCH_SCHEDULER_STANDARD.md` (테넌트별 독립 실행 원칙)
  - `docs/standards/TENANT_ID_GENERATION_STANDARD.md` (VARCHAR(255) 규격)
  - `docs/standards/TENANT_CONTEXT_USAGE.md` (TenantContextHolder 사용 패턴)
  - `docs/standards/DATABASE_MIGRATION_STANDARD.md` (Flyway 규약)
  - `docs/standards/DATABASE_SCHEMA_STANDARD.md` (스키마 표준)
  - `docs/standards/BACKEND_CODING_STANDARD.md` (Java 코딩 표준)
- 표준화 본 참조 (정본화 후보):
  - `database/schema/procedures_standardized/GetBranchFinancialBreakdown_standardized.sql`
  - `database/schema/procedures_standardized/GetMonthlyFinancialTrend_standardized.sql`
  - `database/schema/procedures_standardized/GetCategoryFinancialBreakdown_standardized.sql`
  - `database/schema/procedures_standardized/GenerateQuarterlyFinancialReport_standardized.sql`
  - `database/schema/procedures_standardized/CalculateFinancialKPIs_standardized.sql`
- 적용 스킬: `/core-solution-planning`, `/core-solution-database-first`, `/core-solution-business-flow`, `/core-solution-encapsulation-modularization`

---

**합의서 종료** — 사용자 Q1–Q3 컴펜 대기 후 Phase 1 착수.
