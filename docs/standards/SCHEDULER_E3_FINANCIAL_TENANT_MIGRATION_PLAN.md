# 새벽 스케줄러 E3 — 통합 재무 프로시저 멀티테넌트 격리 정공법 마이그레이션 합의서

**버전**: 2.0.0 (축소 보정판 — Phase 1-3 기 완료 반영 + 시나리오 C 채택 확정 + 사용자 컴펜 Q1-Q3 실측 반영)
**작성일**: 2026-05-26 (초판 v1.0.0) / 2026-05-26 갱신 (v2.0.0)
**작성자**: core-planner (기획 전용 오케스트레이터)
**상태**: Phase 1-3 ✅ 완료 (운영 정착) · Phase 4 🔄 진행 중 (core-coder `ce63df4b`, 표준화 본 5종 Flyway deploy `V20260531_004`) · Phase 5 무변경 (Q3=A `q3-A-keep-out-params` 결정) · Phase 6 대기
**채택 시나리오**: **C — 정공법 (스키마 확장 + 프로시저 재작성)**. 시나리오 A / B 폐기 (§0.2 참조).
**전제 게이트 (v2.0)**: 본 합의서 갱신은 **읽기 전용** — 코드 / Flyway / DB 변경 0건. Phase 4 실제 deploy 는 core-coder `ce63df4b` 가 별도 진행 중 (브랜치 `hotfix/scheduler-error-e3-procedures-redeploy`, 마이그레이션 `V20260531_004__rewrite_financial_procedures_with_tenant.sql`).

---

## 0. 합의서 사용법 + 현재 상태 요약

### 0.1 본 문서 사용법

- 본 문서는 **core-planner 산출물**이며, Phase별 **분배실행 표** (§4) 에 따라 부모 에이전트가 core-coder / core-tester 를 호출한다.
- 상세 SQL 본문 · Java 시그니처 · 인덱스 정의 등 **구현 디테일은 본 문서에 적지 않는다** — 그것은 core-coder / core-debugger 의 산출이다. 본 문서는 "무엇을, 왜, 어떤 순서로, 누가" 만 정의한다.
- 각 Phase 가 운영에 반영된 뒤 다음 Phase 를 착수한다 (Phase 간 게이트, §5 참조).

### 0.2 이전 시나리오 폐기 표기 — 시나리오 C 채택 확정

| 시나리오 | 요지 | 상태 | 사유 |
|---|---|---|---|
| **A — Java 를 DB 에 맞춤** | Java 측 6-인자 호출을 DB 정본(2 IN + RESULT SET, tenant_id 미사용) 에 맞게 다운그레이드 | **폐기** | (1) RESULT SET 에 tenant 식별 컬럼 부재 → 멀티테넌트 격리 위반. (2) Java 호출이 이미 `runPerTenant` 로 tenant_id 를 전달 중인데 DB 가 이를 받지 않으면 격리 검증 불가. (3) 사용자 컴펜 Q2 (`mind_garden` deprecated) 와 정합 안 됨. |
| **B — Java + 프로시저 양쪽 일부 수정** | 절충안 (RESULT SET 유지 + tenant_id 만 IN 추가) | **보류 (시나리오 C 로 흡수)** | 격리 보증을 위한 WHERE 절 격리는 결국 DB 측 작업이며, 절충안은 부분 작업 누적으로 회귀 위험 증가. |
| **C — 정공법** (tenant_id 컬럼 신설 + backfill + 프로시저 재작성 + Java 정합) | **채택 — 진행 중 (축소 범위)** | ✅ | 사용자 컴펜 Q1–Q3 + core-debugger `c836b864` 재조사 결과 채택 확정. **단 Phase 1-3 (스키마 확장 + backfill + NOT NULL) 은 이미 운영 반영 완료 상태** 이며, 본 핫픽스의 실제 작업 범위는 **Phase 4 (프로시저 재작성 deploy) 부터** 진행 (Java 정합 = Phase 5 는 Q3=A 결정으로 무변경). |

### 0.3 현재 상태 요약 (v2.0 갱신, 2026-05-26)

- **운영 스키마 단일화**: 사용자 컴펜 Q2 결과 + core-debugger `c836b864` 재조사 결과 — `mind_garden` 스키마는 **deprecated 확정**, 운영은 **`core_solution` 단독** 정착.
- **테이블 상태**: `core_solution.financial_transactions` + `core_solution.branches` — **`tenant_id` 컬럼 신설 + backfill 100% 완료 + NOT NULL 제약 정착** (Phase 1-3 모두 완료, core-debugger `c836b864` 검증).
- **프로시저 상태**: `core_solution.*` 5종 financial 프로시저는 **여전히 레거시 시그니처** (2 IN, RESULT SET, tenant_id 미사용) — Java 6-인자 호출 (3 IN + 3 OUT) 과 불일치하여 매일 04:00 KST `SQLException: Parameter index of 4 is out of range (1, 2)` 발생 중.
- **표준화 본 (SSOT)**: `database/schema/procedures_standardized/*_standardized.sql` 5종은 **이미 정공법 본** (tenant_id WHERE 격리 + Java 시그니처 정합) — deploy 만 미완. **§4 표준화 본 5종 + 정정 사항은 §1.2 표** 참조.
- **Phase 4 진행 중**: core-coder `ce63df4b` 가 `hotfix/scheduler-error-e3-procedures-redeploy` 브랜치에서 `V20260531_004__rewrite_financial_procedures_with_tenant.sql` 신설 — 표준화 본 5종을 `core_solution` 단독에 일괄 DROP/CREATE.
- **Java 무변경 확정**: 사용자 컴펜 Q3 = **A (`q3-A-keep-out-params`)** — 프로시저 측이 Java 시그니처 (3 IN + 3 OUT) 에 맞춰 표준화되므로 **Phase 5 는 Java 변경 0건**.
- **mind_garden DROP 후속**: 본 핫픽스 운영 반영 + 24h 모니터링 후 별도 PR 로 진행 (§1.6 참조).

---

## 1. 배경 · 현재 상태

### 1.1 직전 진단 인용 (시계열)

- **Agent `61f90fde`** — 새벽 스케줄러 4종 ERROR 패턴 (E1 / E2 / E3 / E4) 광역 분류. E3 는 매일 04:00 KST 통합 재무 프로시저 호출 실패로 식별.
- **Agent `2819307d`** (core-coder 1차 진단, 2026-05-26 오전) — E3 root cause 1차 확인 (당시 DB 정본을 `mind_garden` 으로 가정 — 이후 Q2 결과로 정정됨).
- **Agent `c836b864`** (core-debugger 재조사, 2026-05-26 오후) — **v2.0 갱신의 결정적 근거**. 사용자 컴펜 응답 (Q1=브랜치≡테넌트 동의어, Q2=`mind_garden` deprecated, Q3=A `q3-A-keep-out-params`) 을 받은 직후 운영 정본을 재확정:
  - 운영 DB 정본 = **`core_solution` 단독** (`mind_garden` deprecated 확정 — Q2 반영).
  - `core_solution.financial_transactions` + `core_solution.branches` 양쪽에 **`tenant_id` 컬럼 이미 존재 + backfill 100% 완료 + NOT NULL 제약 정착** → **Phase 1-3 이미 완료** 상태로 확인 (운영 반영 시점 미상, 본 합의서 외 작업에서 정착됨).
  - 5종 financial 프로시저는 여전히 레거시 시그니처 (2 IN, RESULT SET, tenant_id 미사용) — Java 호출 (`PlSqlFinancialServiceImpl`, 3 IN + 3 OUT) 과 불일치하여 매일 04:00 KST `SQLException: Parameter index of 4 is out of range (1, 2)` 재현.
  - SSOT (`database/schema/procedures_standardized/*_standardized.sql`) 5종은 이미 정공법 본 (tenant_id WHERE + Java 시그니처 정합) — deploy 만 미완.
- **Agent `ce63df4b`** (core-coder, **현재 병렬 진행 중**) — `hotfix/scheduler-error-e3-procedures-redeploy` 브랜치에서 `V20260531_004__rewrite_financial_procedures_with_tenant.sql` 신설 + 표준화 본 5종 deploy 작업. Phase 4 실제 실행 담당.

### 1.2 영향 대상 — 5개 프로시저 + 용어 정리 (Q1 반영)

**용어 정리 (사용자 컴펜 Q1 반영)** — 본 합의서에서 "**브랜치** (`branch_code` / `branches`) = **테넌트** (`tenant_id` / `tenants`)" 는 운영상 **동의어**. backfill 매핑은 자명한 1:1 — Phase 2 매핑 규칙 논의 종료 (§5.1 Q1 참조).

| # | 프로시저명 | Java 호출 메서드 | 정합 후 시그니처 (Java 측과 동일) | 표준화 본 정정 사항 |
|---|---|---|---|---|
| 1 | `GetBranchFinancialBreakdown` | `getBranchFinancialBreakdown` | `(IN tenant_id, IN start_date, IN end_date, OUT success, OUT message, OUT JSON)` | — |
| 2 | `GetMonthlyFinancialTrend` | `getMonthlyFinancialTrend` | `(IN tenant_id, IN start_date, IN end_date, OUT success, OUT message, OUT JSON)` | — |
| 3 | `GetCategoryFinancialBreakdown` | `getCategoryFinancialBreakdown` | `(IN tenant_id, IN start_date, IN end_date, OUT success, OUT message, OUT JSON)` | — |
| 4 | `GenerateQuarterlyFinancialReport` | `generateQuarterlyFinancialReport` | `(IN year, IN quarter, IN tenant_id, OUT success, OUT message, OUT JSON)` | — |
| 5 | `CalculateFinancialKPIs` | `calculateFinancialKPIs` | `(IN tenant_id, IN start_date, IN end_date, OUT success, OUT message, OUT 6 KPI fields)` | **`'REVENUE'` → `'INCOME'` 거래 타입 오타 교정** 포함 (운영 데이터 정합) |

### 1.3 영향 대상 — 2개 테이블 (Phase 1-3 완료 반영, Q2 반영)

| 테이블 | tenant_id 컬럼 | backfill | NOT NULL | 비고 |
|---|---|---|---|---|
| **`core_solution.financial_transactions`** | ✅ 신설 완료 | ✅ 100% 완료 | ✅ 정착 | core-debugger `c836b864` 검증 |
| **`core_solution.branches`** | ✅ 신설 완료 | ✅ 100% 완료 | ✅ 정착 | core-debugger `c836b864` 검증 |

**`mind_garden.*` 스키마 (deprecated, Q2 반영, §1.6 참조)**: 본 핫픽스 범위에서 **조회/변경 없음**. 운영 정착 + 24h 안정화 검증 후 별도 PR 로 financial 프로시저 5종 DROP 마이그레이션 진행. 운영 검증 완료까지 동결 유지 (롤백 안전망).

### 1.4 영향 · 빈도

- **매일 04:00 KST** ERROR 발생 (스케줄러 통합 재무 새벽 집계).
- **데이터 손실 0건** — 캐시 stale 만 발생. 어드민 대시보드는 직전 값 표시.
- 사용자/관리자 가시 영향: 04:00 ~ 다음 정상 갱신까지 통합 재무 위젯 stale.
- 보안/격리 측면: Phase 1-3 운영 반영으로 **테이블 레벨 격리 이미 확보**. 프로시저 레벨 격리는 Phase 4 deploy 로 완성.

### 1.5 인접 이슈와의 관계

- **E1** (양 스키마 시그니처 충돌, 직전 hotfix `1ac3d8fc0` 에서 `withSchemaName("mind_garden")` 명시로 해소) — 사용자 Q2 결과 `core_solution` 단독 정착으로 확정되어, **E1 의 스키마 명시 결정 자체가 재검토 대상**. core-coder `ce63df4b` 의 Phase 4 deploy 가 `core_solution` 단독에 정착되면, **`withSchemaName("mind_garden")` 제거 또는 `core_solution` 명시로 정합하는 별도 PR 권고** (본 합의서 §10 후속 작업 참조).
- **E2** (`@Modifying` long → int, 직전 hotfix `6fe8c6668` 해소) — 본 E3 와 독립.
- **`V20260528_003__update_alimtalk_biz_template_code_solapi_ids.sql`** 운영 미적용 보존 — Phase 4 Flyway 번호가 `V20260531_004` (충분히 큰 슬롯) 로 배정되어 충돌 없음. **deployer 운영 반영 시 `V20260528_003` 보존 확인 필수** (§6.3 참조).

### 1.6 mind_garden 스키마 deprecated — DROP 후속 PR 권고 (Q2 반영)

- **현 상태**: `mind_garden.financial_transactions` / `mind_garden.branches` / `mind_garden.*` financial 프로시저 5종 — **운영 트래픽 0건** (사용자 컴펜 Q2 확정). 단, 본 핫픽스 진행 중에는 **롤백 안전망** 으로 동결 유지.
- **DROP 후속 PR 조건** (별도 핫픽스로 분리):
  1. 본 핫픽스 (Phase 4) 운영 반영 완료.
  2. 운영 04:00 KST 사이클 **24h 모니터링** — ERROR 0건 확인.
  3. 직전 4종 핫픽스 (E1·E2·i18n·단회기) 누적 회귀 없음.
- **DROP 대상 (financial 프로시저 5종)**:
  - `DROP PROCEDURE mind_garden.GetBranchFinancialBreakdown`
  - `DROP PROCEDURE mind_garden.GetMonthlyFinancialTrend`
  - `DROP PROCEDURE mind_garden.GetCategoryFinancialBreakdown`
  - `DROP PROCEDURE mind_garden.GenerateQuarterlyFinancialReport`
  - `DROP PROCEDURE mind_garden.CalculateFinancialKPIs`
- **DROP 범위 밖 (별도 합의서 권고)**: `mind_garden.financial_transactions` / `mind_garden.branches` 테이블 자체의 DROP 은 본 합의서 범위 밖 — **별도 스키마 정리 합의서** 로 분리 (다른 모듈이 mind_garden 테이블을 참조하는지 사전 스캔 필요).
- **별도 PR 가칭**: `hotfix/mind-garden-financial-procedures-drop` (planner 후속 위임 시점에 확정).

---

## 2. 멀티테넌트 격리 정공법 목표 (v2.0 — 일부 이미 달성)

### 2.1 스키마 목표 ✅ 달성 완료

- ✅ `core_solution.financial_transactions.tenant_id` 컬럼 신설 + NOT NULL 정착 (core-debugger `c836b864` 검증).
- ✅ `core_solution.branches.tenant_id` 컬럼 신설 + NOT NULL 정착 (core-debugger `c836b864` 검증).
- 인덱스 (단독 / 조합) — 운영 정착 여부 별도 확인 (core-debugger 후속 점검 필요 — 본 합의서 범위 밖).
- 컬럼 표준: `docs/standards/TENANT_ID_GENERATION_STANDARD.md` 의 VARCHAR 규격 준수 (실제 운영 길이는 100, core-coder `ce63df4b` 표준화 본과 일치).

### 2.2 프로시저 목표 🔄 진행 중 (core-coder `ce63df4b`)

- 5개 프로시저 모두 **첫 IN 파라미터로 `p_tenant_id VARCHAR(100)` 추가** — 표준화 본 정합.
- WHERE 절에 `tenant_id = p_tenant_id` 일관 적용.
- 입력값 검증 절에 `IF p_tenant_id IS NULL OR p_tenant_id = '' THEN ... LEAVE fin_proc;` 정착 (MySQL 8.0 호환 라벨).
- 배포 스키마: **`core_solution` 단독** (Q2 deprecated 결과로 확정).
- `'REVENUE'` → `'INCOME'` 거래 타입 오타 교정 (`CalculateFinancialKPIs`).

### 2.3 Java 정합 목표 ⚪ 무변경 (Q3=A)

- `PlSqlFinancialServiceImpl` 5개 메서드 시그니처 **현행 유지** (이미 3 IN + 3 OUT 패턴으로 안정).
- 프로시저 측이 Java 시그니처에 맞춰 표준화되므로 Java 코드 변경 0건.
- 회귀 가드는 core-coder `ce63df4b` 가 `PlSqlFinancialServiceImplCallableTest.java` 단위 테스트로 신설.

### 2.4 격리 보증 목표 ⏳ Phase 6 검증

- 새벽 04:00 KST 스케줄러 트리거 시 tenant 별 독립 실행 (`runPerTenant`) → 각 tenant 데이터만 집계.
- DEV 환경 가짜 tenant 추가 → SELECT 결과 0건 누출 확인 (Phase 6 회귀 테스트).

---

## 3. 단계별 마이그레이션 설계 (Flyway 다단계, backward-compatible)

> **원칙**: 각 Phase 는 직전 운영 상태에서 즉시 롤백 가능해야 한다. Phase 1 ~ 3 은 Java / 프로시저 무영향이므로 단독으로 운영에 반영 가능. Phase 4 부터 동기 변경 필요.
>
> **v2.0 진행 상태 요약**:
>
> | Phase | 작업 | 상태 | 담당 / 검증 |
> |---|---|---|---|
> | **Phase 1** | `financial_transactions` / `branches` 에 `tenant_id` 컬럼 신설 (NULL 허용) | ✅ **이미 완료** | core-debugger `c836b864` 검증 |
> | **Phase 2** | tenant_id 데이터 backfill (브랜치≡테넌트 동의어 매핑) | ✅ **이미 완료** | core-debugger `c836b864` 검증 |
> | **Phase 3** | tenant_id NOT NULL 제약 | ✅ **이미 완료** | core-debugger `c836b864` 검증 |
> | **Phase 4** | 5종 프로시저 표준화 본 Flyway deploy (`V20260531_004`) | 🔄 **진행 중** | core-coder `ce63df4b` (`hotfix/scheduler-error-e3-procedures-redeploy`) |
> | **Phase 5** | Java 정합 | ⚪ **무변경 확정** (Q3=A) | — (작업 0건) |
> | **Phase 6** | E2E 테스트 + 회귀 검증 | ⏳ **대기** | Phase 4 완료 후 core-tester 위임 |

### Phase 1 — 스키마 확장 (NULL 허용) ✅ 이미 완료

- **상태**: ✅ 운영 반영 완료 (core-debugger `c836b864` 검증).
- **결과**:
  - `core_solution.financial_transactions.tenant_id` 컬럼 존재 확인.
  - `core_solution.branches.tenant_id` 컬럼 존재 확인.
- **본 합의서 v2.0 기준 작업 0건** — 별도 핫픽스 / 사전 작업에서 이미 정착됨 (반영 시점은 본 합의서 외 작업 이력).

### Phase 2 — 데이터 backfill ✅ 이미 완료

- **상태**: ✅ 운영 반영 완료 (core-debugger `c836b864` 검증).
- **결과**: `SELECT COUNT(*) FROM core_solution.financial_transactions WHERE tenant_id IS NULL = 0`, `core_solution.branches` 동일.
- **매핑 규칙**: 사용자 컴펜 Q1 결과 **브랜치 ≡ 테넌트 동의어** → `branch_code` → `tenant_id` 자명한 1:1 매핑으로 backfill 완료.
- **본 합의서 v2.0 기준 작업 0건**.

### Phase 3 — NOT NULL 제약 ✅ 이미 완료

- **상태**: ✅ 운영 반영 완료 (core-debugger `c836b864` 검증).
- **결과**: 양 테이블 `tenant_id NOT NULL` 제약 정착 + 신규 INSERT 시 NULL 거부 동작 확인.
- **FK 추가**: 본 합의서 v2.0 범위 밖 (선택 사항, 운영 정착 후 별도 검토).
- **본 합의서 v2.0 기준 작업 0건**.

### Phase 4 — 프로시저 재작성 🔄 진행 중 (core-coder `ce63df4b`)

- **Flyway 파일**: `V20260531_004__rewrite_financial_procedures_with_tenant.sql` (core-coder `ce63df4b` 가 신설 중).
- **담당 브랜치**: `hotfix/scheduler-error-e3-procedures-redeploy`.
- **변경 핵심** (Q2=`core_solution` 단독 정착으로 확정):
  - 5개 프로시저 모두 `core_solution` 스키마에 **DROP IF EXISTS + CREATE PROCEDURE** 일괄 처리.
  - 첫 IN 파라미터 `p_tenant_id VARCHAR(100)` (TENANT_ID_GENERATION_STANDARD 와 일관, 기존 운영 길이 100 유지).
  - WHERE 절 `tenant_id = p_tenant_id` 일관 적용.
  - OUT 3개 (`p_success BOOLEAN`, `p_message TEXT`, `p_xxx_data JSON` — KPI 는 6개 OUT KPI 필드) — **Q3=A 결정으로 Java 시그니처와 1:1 정합**.
  - SSOT (`database/schema/procedures_standardized/*_standardized.sql`) 5종 본문을 정본화 — 본 합의서 §4 정정 사항 (`'REVENUE'` → `'INCOME'` 거래 타입 오타) 포함.
  - `mind_garden` 동기화 **없음** (Q2 결과 deprecated 확정 → §1.6 후속 DROP 별도 PR).
  - MySQL 8.0 호환: `fin_proc` BEGIN 라벨 + `LEAVE fin_proc` 명시.
- **운영 영향**: Java 호출 측이 이미 6-인자 패턴을 보내므로 시그니처 즉시 정합 — 다음 04:00 KST 사이클에서 ERROR 해소 기대.
- **검증** (core-coder `ce63df4b` 산출 게이트):
  - `flyway info` → `V20260531_004 SUCCESS`.
  - `information_schema.parameters` 쿼리로 5종 시그니처 (`IN p_tenant_id ... OUT p_success ... OUT p_message ...`) 확인.
  - 다음 04:00 KST 사이클 ERROR 미재현 확인 (§6 KPI 참조).

### Phase 5 — Java 정합 ⚪ 무변경 확정 (Q3=A `q3-A-keep-out-params`)

- **상태**: ⚪ **변경 0건** — 본 합의서 v2.0 범위 밖.
- **사유** (사용자 컴펜 Q3 = A `q3-A-keep-out-params`):
  - Java 측 `PlSqlFinancialServiceImpl` 의 5개 메서드는 **이미 6-인자 (3 IN + 3 OUT) 패턴으로 안정** — Phase 4 의 프로시저 재작성이 Java 시그니처에 맞춰 표준화되므로 Java 측 무변경.
  - `prepareCall` SQL 의 `?` 수 · OUT 파라미터 등록 인덱스 모두 Phase 4 deploy 후 DB 정본과 1:1 정합.
- **단위 테스트 (참고)**: core-coder `ce63df4b` 가 `PlSqlFinancialServiceImplCallableTest.java` 를 별도로 신설 중 — Java 무변경이지만 회귀 가드 단위 테스트로 활용 (Phase 6 통합 회귀와 합산).

### Phase 6 — E2E 테스트 ⏳ 대기 (Phase 4 완료 후)

- **담당**: core-tester (Phase 4 운영 반영 후 분배실행 표 §4 위임).
- **변경 핵심**:
  - 단위 테스트 (Phase 5 의 `PlSqlFinancialServiceImplCallableTest.java` 와 통합).
  - 통합 테스트 (스케줄러 04:00 KST 트리거 → 5개 프로시저 호출 → 결과 적재 검증).
  - 회귀 테스트 — 직전 4종 핫픽스 (E1 · E2 · i18n · 단회기 가드) 누적 영향 점검.
  - 격리 회귀 (DEV 가짜 tenant 추가 → SELECT 결과 격리 확인 — 테이블 격리는 이미 Phase 1-3 로 확보되어 있으므로 프로시저 격리 검증이 핵심).

---

## 4. 분배실행 표 (Phase 별 위임) — v2.0 갱신

> v2.0 기준: Phase 1-3 이미 완료, Phase 4 진행 중 (core-coder `ce63df4b`), Phase 5 무변경 (Q3=A), Phase 6 대기. **본 합의서 v2.0 후속 호출은 Phase 6 만** (Phase 4 deploy 완료 후 core-tester 위임).

| Phase | 담당 서브에이전트 | 상태 | 의존성 | 위임 프롬프트 요약 | 적용 스킬 |
|---|---|---|---|---|---|
| **Phase 1** | `core-coder` | ✅ **완료** | — | (이미 완료, 본 합의서 외 작업에서 정착, core-debugger `c836b864` 검증) | — |
| **Phase 2** | `core-coder` | ✅ **완료** | — | (이미 완료, brand≡tenant 자명 1:1 매핑, core-debugger `c836b864` 검증) | — |
| **Phase 3** | `core-coder` | ✅ **완료** | — | (이미 완료, NOT NULL 정착, core-debugger `c836b864` 검증) | — |
| **Phase 4** | `core-coder` `ce63df4b` | 🔄 **진행 중** | 사용자 Q1–Q3 컴펜 완료 | "본 합의서 v2.0 §3 Phase 4 에 따라 `V20260531_004__rewrite_financial_procedures_with_tenant.sql` 신설. 5종 프로시저 (`GetBranchFinancialBreakdown`, `GetMonthlyFinancialTrend`, `GetCategoryFinancialBreakdown`, `GenerateQuarterlyFinancialReport`, `CalculateFinancialKPIs`) 를 `core_solution` 단독 DROP/CREATE. SSOT (`database/schema/procedures_standardized/*_standardized.sql`) 본문 + Java 시그니처 (3 IN + 3 OUT) 정합. `CalculateFinancialKPIs` 의 `'REVENUE'` → `'INCOME'` 거래 타입 오타 교정 포함. `mind_garden` 동기화 없음 (Q2 deprecated)." | `/core-solution-database-first`, `BATCH_SCHEDULER_STANDARD.md` |
| **Phase 5** | — | ⚪ **무변경** | Q3=A 결정 | **변경 0건** — Java 측 `PlSqlFinancialServiceImpl` 의 6-인자 호출 패턴은 이미 표준화 본 시그니처와 1:1 정합. 별도 위임 없음. | — |
| **Phase 6** | `core-tester` | ⏳ **대기** | Phase 4 운영 반영 완료 | "본 합의서 v2.0 §3 Phase 6 + §6 에 따라 E2E + 회귀 테스트 신설. (1) 스케줄러 04:00 KST 수동 트리거 → ERROR 0건 검증, (2) 5종 프로시저 단위 단위 테스트 (`PlSqlFinancialServiceImplCallableTest.java` 연계), (3) 직전 4종 핫픽스 (E1·E2·i18n·단회기) 누적 영향 회귀, (4) tenant 격리 회귀 (DEV 환경 가짜 tenant 추가 → 크로스 격리 확인), (5) `CalculateFinancialKPIs` 의 `'INCOME'` 교정 결과 KPI 값 정합 검증." | `/core-solution-business-flow` |

**병렬 가능성**: Phase 4 → Phase 6 은 순차 (Phase 4 운영 반영 필수). **Phase 5 작업 없음**.

---

## 5. 게이트 + 사용자 컴펜 (v2.0 — 실측 확정 반영)

### 5.1 사용자 컴펜 Q1–Q3 응답 결과 (v2.0 갱신)

> v1.0 의 Q1–Q3 는 **모두 사용자 컴펜 응답 완료** 상태. 본 절은 v2.0 갱신의 결정적 기반이 된 응답을 기록한다.

#### Q1. 운영 tenant 구조 — backfill 규칙 결정 → **응답: 브랜치 = 테넌트 동의어**

- **사용자 컴펜 응답**: 운영상 **브랜치 (`branch_code` / `branches`) ≡ 테넌트 (`tenant_id` / `tenants`) 동의어**. backfill 매핑은 자명한 1:1.
- **반영 위치**: §1.2 용어 정리 (본 합의서 표 상단 주석).
- **결과**: Phase 2 의 매핑 규칙 논의 종료 — 단순 `UPDATE ... SET tenant_id = branch_code` 동일 (또는 매핑 테이블 1:1) 으로 backfill 100% 완료 (core-debugger `c836b864` 검증).

#### Q2. 프로시저 배포 스키마 — `mind_garden` 단독 vs `core_solution` 동기화 → **응답: `mind_garden` deprecated**

- **사용자 컴펜 응답**: `mind_garden` 스키마는 **deprecated** — 운영은 **`core_solution` 단독**.
- **반영 위치**: §0.3 현재 상태 요약, §1.3 영향 대상 테이블, §1.6 mind_garden DROP 후속 PR 권고.
- **결과**: Phase 4 deploy 는 `core_solution` 단독 DROP/CREATE. `mind_garden` 동기화 없음. 본 핫픽스 운영 반영 + 24h 모니터링 후 별도 PR 로 `mind_garden.*` financial 프로시저 5종 DROP.

#### Q3. 프로시저 결과 반환 방식 — OUT 파라미터 vs RESULT SET → **응답: A `q3-A-keep-out-params`**

- **사용자 컴펜 응답**: **A — 현행 3 OUT 유지** (`p_success`, `p_message`, `p_xxx_data` JSON / KPI 는 6 OUT). Java 변경 최소.
- **반영 위치**: §3 Phase 5 (무변경 사유), §4 분배실행 표 Phase 5 행.
- **결과**: Phase 5 Java 정합 = **변경 0건**. 프로시저 측이 Java 시그니처에 맞춰 표준화됨 — 본 합의서 v2.0 의 작업 범위는 Phase 4 + Phase 6 로 축소.

### 5.2 Phase 간 게이트 (v2.0)

- **Phase 1-3 → Phase 4 게이트**: ✅ 이미 통과 (Phase 1-3 운영 반영 완료, core-debugger `c836b864` 검증).
- **Phase 4 → Phase 6 게이트**: 🔄 진행 중 — core-coder `ce63df4b` 의 `V20260531_004` deploy 완료 + 다음 04:00 KST 사이클 ERROR 0건 확인 후 Phase 6 위임 개시.
- **Phase 6 → mind_garden DROP 후속 게이트**: ⏳ Phase 6 통과 + 운영 24h 안정화 검증 후 별도 PR (§1.6).

### 5.3 Flyway 번호 충돌 회피 (v2.0)

- 운영 미적용 보존 중인 `V20260528_003__update_alimtalk_biz_template_code_solapi_ids.sql` 와 Phase 4 의 `V20260531_004__rewrite_financial_procedures_with_tenant.sql` 는 **충돌 없음** (충분히 큰 슬롯 배정).
- **deployer 운영 반영 시 `V20260528_003` 보존 확인 필수** (§6.3 참조).

---

## 6. KPI · 검증 + 게이트 (v2.0)

### 6.1 KPI 표

| 영역 | KPI | 상태 / 측정 시점 |
|---|---|---|
| **E3 해소** | 매일 04:00 KST 스케줄러 ERROR 0건 (7일 연속) | ⏳ Phase 4 운영 반영 후 D+7 |
| **데이터 정합** | `SELECT COUNT(*) FROM core_solution.financial_transactions WHERE tenant_id IS NULL` = 0 | ✅ Phase 2 완료 시점에 확인 (core-debugger `c836b864`) |
| **brand≡tenant 매핑 정합** | `SELECT branch_code, tenant_id FROM core_solution.branches` 1:1 동일 | ✅ Phase 2 완료 시점에 확인 |
| **프로시저 시그니처 정합** | `information_schema.parameters` 에 5종 모두 `IN p_tenant_id ...` + `OUT p_success/p_message/...` | ⏳ Phase 4 deploy 직후 |
| **`'REVENUE'` → `'INCOME'` 교정** | `CalculateFinancialKPIs` 의 KPI 값 (revenue / income) 운영 SELECT 결과 ≥ 0 (음수 / NULL 없음) | ⏳ Phase 6 |
| **회귀 — 직전 핫픽스** | E1 (`1ac3d8fc0`), E2 (`6fe8c6668`), i18n, 단회기 누적 회귀 검수 통과 | ⏳ Phase 6 |
| **회귀 — 새벽 4종 스케줄러** | 00:01 / 00:03 / 00:05 / 03:00 / 04:00 KST 모두 ERROR 0건 | ⏳ Phase 6 D+7 |

### 6.2 검증 게이트 (v2.0)

- **Phase 4 deploy 직후 단위 게이트** (core-coder `ce63df4b` 산출):
  1. `flyway info` → `V20260531_004 SUCCESS`.
  2. `information_schema.parameters` 쿼리로 5종 시그니처 확인.
  3. DEV 환경에서 1 tenant 대상 5종 프로시저 호출 → JSON 응답 형식 점검.
- **Phase 4 운영 반영 후 통합 게이트** (Phase 6 위임 직전):
  1. 다음 04:00 KST 사이클 ERROR 미재현 (1일).
  2. 어드민 통합 재무 위젯 정상 갱신 (UI 확인).
- **운영 24h 안정화 게이트** (mind_garden DROP 후속 PR 진입 직전, §1.6 참조):
  1. 04:00 KST 사이클 ERROR 0건 7일 연속 (KPI E3 해소).
  2. 직전 4종 핫픽스 회귀 0건.

### 6.3 deployer 운영 반영 시 주의 사항

- ⚠️ **`V20260528_003__update_alimtalk_biz_template_code_solapi_ids.sql` 보존 필수** — 운영 미적용 상태로 보존 중. Phase 4 의 `V20260531_004` deploy 가 이 파일을 건드리지 않도록 deployer 가 사전 확인.
- ⚠️ **`core_solution` 단독 정착 확정**: deployer 는 `mind_garden` 스키마를 본 핫픽스 deploy 범위에서 **건드리지 않음** — 동결 유지 (롤백 안전망).
- ⚠️ **익일 새벽 스케줄러 사이클 모니터링** 필수 — Phase 4 운영 반영 후 24h 동안 04:00 KST 사이클 로그 추적 (deployer 또는 운영 담당).

---

## 7. 리스크 · 롤백 전략 (v2.0)

| Phase | 리스크 | 롤백 전략 | 상태 |
|---|---|---|---|
| **Phase 1** | (대용량 테이블 ALTER lock 점유) | (실현되지 않음 — 이미 정착) | ✅ 완료 |
| **Phase 2** | (backfill 매핑 오류) | (실현되지 않음 — brand≡tenant 자명 1:1 매핑) | ✅ 완료 |
| **Phase 3** | (NOT NULL 전환 중 INSERT 실패) | (실현되지 않음 — Phase 2 검증 후 정착) | ✅ 완료 |
| **Phase 4** | 프로시저 재작성 후 ERROR 패턴 변경 | DROP 전 `SHOW CREATE PROCEDURE` 로 이전 버전 백업 보존 (core-coder `ce63df4b` 책임). 롤백 시 백업본 CREATE 재실행. **추가 안전망**: `mind_garden.*` financial 프로시저 5종이 동결 상태로 보존되어 있어, Java 측 `withSchemaName("mind_garden")` 임시 복귀로 즉시 회피 가능 (단 격리는 깨짐). | 🔄 진행 중 |
| **Phase 5** | (Java 시그니처 불일치 회귀) | (변경 0건이므로 회귀 불가 — Q3=A 결정) | ⚪ 무변경 |
| **Phase 6** | E2E 실패 → 운영 반영 전 차단 | core-tester 가 실패 case 보고 → core-debugger 분석 위임 → core-coder fix → 재테스트 루프. | ⏳ 대기 |

---

## 8. 일정 추정 (v2.0 갱신)

| Phase | 추정 | 상태 |
|---|---|---|
| **사용자 Q1–Q3 컴펜** | 완료 | ✅ |
| **Phase 1-3** | 완료 | ✅ (본 합의서 외 작업에서 정착, core-debugger `c836b864` 검증) |
| **Phase 4** | 0.5 ~ 1 영업일 | 🔄 core-coder `ce63df4b` 진행 중 (표준화 본 5종 deploy) |
| **Phase 5** | 0 영업일 | ⚪ 변경 0건 (Q3=A) |
| **Phase 6** | 1 영업일 | ⏳ Phase 4 완료 후 |
| **운영 24h 모니터링 + mind_garden DROP 후속 PR** | 1 ~ 2 영업일 | ⏳ Phase 6 완료 후 별도 PR |
| **본 핫픽스 잔여 추정** | **2 ~ 3 영업일** | (v1.0 추정 5~6 영업일 → v2.0 축소) |

---

## 9. 다음 단계 (v2.0)

1. **(현재) core-coder `ce63df4b` Phase 4 완료 대기** — `hotfix/scheduler-error-e3-procedures-redeploy` 브랜치의 `V20260531_004` deploy 완료 + 단위 테스트 통과.
2. **(Phase 4 완료 후) 부모 에이전트가 §4 분배실행 표 Phase 6 행에 따라 `core-tester` 호출** — 단위 + 통합 테스트 + 회귀 위임.
3. **(Phase 6 통과 후) deployer 운영 반영** — §6.3 주의 사항 준수 (V20260528_003 보존 + mind_garden 미접촉).
4. **(운영 반영 후 D+1) 익일 새벽 04:00 KST 스케줄러 사이클 모니터링** — ERROR 미재현 확인.
5. **(운영 24h 안정화 후) `hotfix/mind-garden-financial-procedures-drop` 별도 PR 위임** (§10 참조).
6. **(전 Phase + 후속 PR 종료 후) core-planner 가 본 합의서 §6 KPI 달성 여부 사용자에게 최종 보고**.

---

## 10. mind_garden DROP 후속 PR 권고 (별도 핫픽스)

> 본 핫픽스 (`hotfix/scheduler-error-e3-procedures-redeploy`) 와 **분리된 별도 PR** 로 진행. 운영 안정화 검증 후 위임.

### 10.1 진입 게이트

- ✅ 본 핫픽스 Phase 4 운영 반영 완료.
- ✅ Phase 6 E2E + 회귀 통과.
- ✅ 운영 04:00 KST 사이클 ERROR 0건 24h 연속.
- ✅ 직전 4종 핫픽스 (E1·E2·i18n·단회기) 누적 회귀 0건.

### 10.2 작업 범위

- **DROP 대상**: `mind_garden.*` financial 프로시저 5종 (§1.6 목록).
- **DROP 범위 밖** (별도 합의서로 분리):
  - `mind_garden.financial_transactions` / `mind_garden.branches` 테이블 자체.
  - `mind_garden` 스키마 자체.
- **사전 스캔 필수** (core-debugger 위임):
  - 코드베이스 전체에서 `mind_garden.financial_*` / `mind_garden.branches` / `mind_garden.GetBranch*` 등 참조 grep — 잔존 참조 0건 확인 후 진행.
  - Java 측 `withSchemaName("mind_garden")` 등 명시적 스키마 참조 정리 여부 검토.

### 10.3 부가 권고 — E1 핫픽스 정리

- 직전 E1 핫픽스 `1ac3d8fc0` 의 `withSchemaName("mind_garden")` 명시는 본 핫픽스 운영 반영 후 **재검토 대상**:
  - `core_solution` 단독 정착 시 `withSchemaName("mind_garden")` 은 잘못된 스키마를 가리킴.
  - **별도 후속 PR** (가칭 `hotfix/e1-withschemaname-cleanup`) 로 정리 권고.
  - 본 합의서 §1.5 참조.

---

## 참조 문서 · 스킬

- **직전 hotfix**:
  - `1ac3d8fc0` (E1 P2 `withSchemaName`, 본 합의서 §1.5 재검토 대상)
  - `6fe8c6668` (E2 P1 `@Modifying`)
- **직전 진단 에이전트 시계열**:
  - `61f90fde` (스케줄러 4종 ERROR 광역 분류)
  - `2819307d` (core-coder 1차 진단)
  - `c836b864` (core-debugger 재조사, v2.0 결정적 근거)
  - `ce63df4b` (core-coder, Phase 4 진행 중 — `hotfix/scheduler-error-e3-procedures-redeploy`)
- **표준 문서**:
  - `docs/standards/BATCH_SCHEDULER_STANDARD.md` (테넌트별 독립 실행 원칙)
  - `docs/standards/TENANT_ID_GENERATION_STANDARD.md` (VARCHAR 규격)
  - `docs/standards/TENANT_CONTEXT_USAGE.md` (TenantContextHolder 사용 패턴)
  - `docs/standards/DATABASE_MIGRATION_STANDARD.md` (Flyway 규약)
  - `docs/standards/DATABASE_SCHEMA_STANDARD.md` (스키마 표준)
  - `docs/standards/BACKEND_CODING_STANDARD.md` (Java 코딩 표준)
- **표준화 본 (Phase 4 정본화 대상, `'REVENUE'` → `'INCOME'` 교정 포함)**:
  - `database/schema/procedures_standardized/GetBranchFinancialBreakdown_standardized.sql`
  - `database/schema/procedures_standardized/GetMonthlyFinancialTrend_standardized.sql`
  - `database/schema/procedures_standardized/GetCategoryFinancialBreakdown_standardized.sql`
  - `database/schema/procedures_standardized/GenerateQuarterlyFinancialReport_standardized.sql`
  - `database/schema/procedures_standardized/CalculateFinancialKPIs_standardized.sql`
- **Phase 4 마이그레이션 (core-coder `ce63df4b` 진행 중)**:
  - `src/main/resources/db/migration/V20260531_004__rewrite_financial_procedures_with_tenant.sql`
- **적용 스킬**: `/core-solution-planning`, `/core-solution-database-first`, `/core-solution-business-flow`, `/core-solution-encapsulation-modularization`

---

**합의서 v2.0 종료** — Phase 4 core-coder `ce63df4b` 완료 후 Phase 6 (core-tester) → deployer 운영 반영 → mind_garden DROP 후속 PR 순서로 진행.
