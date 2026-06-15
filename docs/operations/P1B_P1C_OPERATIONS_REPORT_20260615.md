# P1-B / P1-C 운영 분석 보고서 (2026-06-15)

> 작성: 2026-06-15 KST · `core-debugger` (분석·SQL 초안 전용)
> 분류: 운영 데이터 보정 분석 — **코드 수정 없음 / SELECT 외 SQL 실행 없음**
> 갱신: **2026-06-15 13:40 KST · 사용자 결정 `auto_select` — P1-B/P1-C 권장 옵션 자동 채택 → §3 인계 절차·체크리스트 추가**
> 운영 DB 접근: 본 분석 환경에서 prod SSH (`mindgarden-prod`) / `/etc/mindgarden/` **미설정 → 직접 조회 불가**. 본 보고서는 저장소 코드·Flyway 스키마·이전 인계 문서를 근거로 한 가설·SQL 초안·결정 항목 정리에 한정한다.
> 참조: `docs/운영반영/POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md` §2.1 / §2.2, `docs/운영반영/HANDOFF_20260614_CRON_SQL_4DAY_GAP.md`, `src/main/java/com/coresolution/consultation/service/impl/FinancialPeriodServiceImpl.java`, `src/main/java/com/coresolution/consultation/scheduler/SessionDeductionRecoveryBatch.java`, `src/main/resources/db/migration/V20260606_011__create_financial_period.sql`, `src/main/resources/db/migration/V20260609_001__create_session_recovery_alerts.sql`.

---

## 사용자 액션 요약 (TL;DR)

| 항목 | 핵심 트레이스 | 채택 옵션 (✅) | 잔여 결정 |
|---|---|---|---|
| **P1-B** 부가세 1,409원 차이 (`tenant-incheon-counseling-001`) | `Q8` 부가세 가드 산식 `expected = (income − refund) × 0.10` 가정 시 **약 14,090원 base 의 INCOME 거래에서 `tax_amount` 누락** 1~2건이 가장 유력. 이전 가이드 §2.1.2 의 컬럼명(`total_revenue`/`expected_tax`/`tax_diff_amount`/`period_year`)은 **실제 스키마와 불일치** — 본 보고서 §1.2 의 SQL 로 교체 필요. | ✅ **§1.2 + §1.4 — ERP 화면 수동 보정** (사용자 `auto_select` 13:40 KST). DBA `mindgarden_readonly` SELECT → ERP 화면 보정 → 마감 재시도. 실행 절차·검증 SQL 은 **§3.1**. | dry-run 환경변수 확인 / 실행 일정 |
| **P1-C** `session_recovery_alerts` 2건 미해결 (8일째) | reason 컬럼은 `reason` 단일 (코드 보면 사용자 쿼리의 `alert_type`/`recovery_notes` 는 **컬럼 부재**). 후보 schedule_id (78/108/111/115/122/127) 중 미해결 2건의 **원인 (reason) 4종 분류 후** 매핑 수동 복구 또는 `resolved_at` 만 설정. | ✅ **§2.4 옵션 (a) — 매핑 수동 복구** (사용자 `auto_select` 13:40 KST). 어드민 매핑 복구 → 30분 사이클 자동 차감 → alert 종결. 실행 절차·검증 SQL 은 **§3.2**. | `UNEXPECTED_ERROR` reason 발생 시 core-debugger 추가 위임 여부 |

> **메인 트랙 비충돌**: ops-portal Phase 2~6 · Dependabot · 디자인 v2 영역 침범 없음. 본 보고서는 `docs/operations/` 신규 1건만 추가.

---

## 0. 본 분석의 환경 제약 (필독)

| 항목 | 상태 | 영향 |
|---|---|---|
| `~/.ssh/config` 의 `mindgarden-prod` Host | **미정의** (`ssh: Could not resolve hostname mindgarden-prod`) | prod SSH 직접 접근 불가 → 실데이터 검증은 사용자/DBA 가 §1.2 · §2.2 SQL 을 실행해야 한다. |
| `/etc/mindgarden/` (prod.env SSOT 경로) | **부재** (분석 환경에 마운트 없음) | DB 자격증명·readonly 계정 식별 불가. SSH 접근 가능 호스트에서 동일 SQL 을 실행해야 한다. |
| 운영 DB readonly endpoint | 본 환경에서 미식별 | `mindgarden_readonly` 계정 또는 prod 슬롯 호스트 접속은 사용자가 직접 수행. |

따라서 본 보고서는 **저장소 SSOT (코드·Flyway·인계 문서) 기반 가설·SQL 초안·결정 항목** 만 제공하며, 실제 1,409원 차이의 거래 ID·schedule_id 2건 식별은 **사용자/DBA 가 §1.2 · §2.2 SQL 을 운영 readonly 에서 실행한 결과로 확정**한다.

---

## §1. P1-B — 세액 1,409원 차이 보정 거래 파악

### 1.1 차이 발생 메커니즘 (코드 기반)

`FinancialPeriodServiceImpl#validateTaxIntegrity` (`src/main/java/com/coresolution/consultation/service/impl/FinancialPeriodServiceImpl.java` L286–306) 가 마감(`closePeriod`) 진입 시 다음 산식으로 가드한다.

```
expected_tax = (Σ INCOME amount − Σ REFUND amount) × 0.10
actual_tax   = Σ INCOME tax_amount
diff         = |expected_tax − actual_tax|
if (diff > 1원) → TaxIntegrityException → 422 + 마감 차단
```

- `VAT_RATE = 0.10` (한국 부가가치세 기본율)
- `TAX_TOLERANCE = 1원` (단순 반올림 차이만 통과)
- `REFUND_SUBCATEGORIES = ("CONSULTATION_REFUND", "CONSULTATION_PARTIAL_REFUND")` (`AdminServiceImpl` L129)
- `incomeSum`/`refundSum`/`taxSum` 모두 **soft delete 만 제외**, status 무관 합산 (`FinancialPeriodServiceImpl` L98–109)

#### 사용자가 보고한 수치 역산

| 항목 | 보고값 | 검산 |
|---|---|---|
| `total_income` (Σ INCOME amount) | **155,000원** (refund=0 가정 시) | — |
| `total_refund` | 0 가정 | — |
| `expected_tax` | **15,500원** (= 155,000 × 0.10) | 일치 |
| `actual_tax` (Σ tax_amount) | **14,091원** | 보고값 |
| `diff` | **1,409원** | 보고값 |
| diff ÷ 0.10 | **14,090원** | → 부가세 미계상된 income amount **합계 ≈ 14,090원** |

> **유력 가설**: INCOME 거래 중 `amount` 합계 약 **14,090원** 분량 (1~2건)에서 **`tax_amount = 0` (또는 NULL)** 로 적재되어 누적 부가세가 1,409원 부족하다.
> - 가장 가능성 높은 형태: **단일 거래 amount=14,090원, tax_amount=0**
> - 차순위: amount=15,499원 거래 1건이 `taxIncluded=true` 임에도 `tax_amount` 미계산 — `TaxCalculationUtil.calculateTaxFromPayment` 로 다시 분리하면 amount_excluding_tax=12,818, vat=1,281, **외부 입력 거래에서 부가세 분리 누락** 시 자주 발생.
> - 또 다른 가설: 환불 거래가 `subcategory ∈ {CONSULTATION_REFUND, CONSULTATION_PARTIAL_REFUND}` 외 값(예: `CONSULTATION_PARTIAL`, 오타) 으로 적재되어 `refundSum` 에서 누락 → `expected_tax` 가 본래보다 14,090×0.1=1,409원 과대 산정. 이 경우 INCOME 측이 아니라 **EXPENSE/REFUND subcategory 컬럼 누락/오타**가 원인.

### 1.2 ⚠️ 컬럼명 정정 — 운영 가이드 §2.1.2 SQL 은 실제 스키마 불일치

`docs/운영반영/POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md` §2.1.2 가 사용하는 컬럼은 **실제 Flyway 스키마와 불일치**한다. 그대로 실행하면 `Unknown column` 오류로 모두 실패한다.

| 가이드 §2.1.2 (잘못) | 실제 `financial_period` 컬럼 (V20260606_011) |
|---|---|
| `total_revenue` | `total_income` |
| `total_tax` | `total_tax_amount` |
| `expected_tax` | **컬럼 부재** (`(total_income − total_refund) × 0.10` 으로 계산) |
| `tax_diff_amount` | **컬럼 부재** (`(total_income − total_refund) × 0.10 − total_tax_amount` 로 계산) |
| `period_year` / `period_month` / `period_day` | **컬럼 부재** (`period_start` DATE 로 통합) |

본 보고서가 제시하는 **정정 SQL** (`mindgarden_readonly` 계정·SELECT only):

```sql
USE core_solution;

-- (A) 인천 테넌트의 financial_period 행 중 부가세 차이가 있는 기간 식별
--     expected = (total_income − total_refund) × 0.10
--     diff     = expected − total_tax_amount  (음수 = 부가세 과대계상, 양수 = 누락)
SELECT
  fp.id,
  fp.tenant_id,
  fp.period_type,
  fp.period_start,
  fp.period_end,
  fp.status,
  fp.total_income,
  fp.total_refund,
  fp.total_expense,
  fp.total_tax_amount,
  ROUND((fp.total_income - fp.total_refund) * 0.10, 2)                       AS expected_tax,
  ROUND((fp.total_income - fp.total_refund) * 0.10 - fp.total_tax_amount, 2) AS tax_diff
FROM financial_period fp
WHERE fp.tenant_id = 'tenant-incheon-counseling-001'
  AND ABS(ROUND((fp.total_income - fp.total_refund) * 0.10 - fp.total_tax_amount, 2)) > 1
ORDER BY fp.period_start DESC
LIMIT 20;
```

→ `tax_diff = +1,409.00` 인 기간 행이 1,409원 차이의 **누적 윈도** 다. `period_type` (DAY/WEEK/MONTH) 과 `period_start ~ period_end` 로 보정 대상 기간을 확정한다.

```sql
-- (B) 위에서 식별된 기간 [PERIOD_START ~ PERIOD_END] 내 INCOME 거래 중
--     부가세 누락 또는 비율 불일치 거래 nominate (DBA 검토 대상)
SET @period_start = '<period_start>';
SET @period_end   = '<period_end>';

SELECT
  ft.id,
  ft.transaction_date,
  ft.transaction_type,
  ft.category,
  ft.subcategory,
  ft.amount,
  ft.tax_amount,
  ft.tax_included,
  ft.amount_before_tax,
  ROUND(ft.amount / 1.1, 2)             AS implied_base_if_included,
  ROUND(ft.amount * 0.10, 2)            AS implied_tax_if_excluded,
  ft.status,
  ft.related_entity_type,
  ft.related_entity_id,
  ft.is_deleted
FROM financial_transactions ft
WHERE ft.tenant_id = 'tenant-incheon-counseling-001'
  AND ft.is_deleted = 0
  AND ft.transaction_type = 'INCOME'
  AND ft.transaction_date BETWEEN @period_start AND @period_end
  AND (
        ft.tax_amount IS NULL
     OR ft.tax_amount = 0
     OR ABS(ft.tax_amount - ROUND(ft.amount * 0.10 / 1.1, 2)) > 1   -- taxIncluded=true 산식
     OR ABS(ft.tax_amount - ROUND(ft.amount * 0.10, 2))       > 1   -- taxIncluded=false 산식
  )
ORDER BY ft.transaction_date ASC, ft.id ASC;
```

```sql
-- (C) 환불 subcategory 오타 의심 — REFUND_SUBCATEGORIES 외 값으로 적재된 환불성 거래 확인
SELECT
  ft.id,
  ft.transaction_date,
  ft.transaction_type,
  ft.category,
  ft.subcategory,
  ft.amount,
  ft.tax_amount,
  ft.description
FROM financial_transactions ft
WHERE ft.tenant_id = 'tenant-incheon-counseling-001'
  AND ft.is_deleted = 0
  AND ft.transaction_type = 'EXPENSE'
  AND ft.transaction_date BETWEEN @period_start AND @period_end
  AND (ft.description LIKE '%환불%' OR ft.category = 'CONSULTATION_FEE')
  AND ft.subcategory NOT IN ('CONSULTATION_REFUND', 'CONSULTATION_PARTIAL_REFUND')
ORDER BY ft.transaction_date ASC, ft.id ASC;
```

```sql
-- (D) 누적 합 cross-check (period 행과 거래 합산 정합성 검증)
SELECT
  SUM(CASE WHEN ft.transaction_type='INCOME' THEN ft.amount ELSE 0 END)                                       AS income_sum,
  SUM(CASE WHEN ft.transaction_type='INCOME' THEN COALESCE(ft.tax_amount,0) ELSE 0 END)                       AS tax_sum,
  SUM(CASE WHEN ft.transaction_type='EXPENSE' AND ft.subcategory IN ('CONSULTATION_REFUND','CONSULTATION_PARTIAL_REFUND') THEN ft.amount ELSE 0 END) AS refund_sum
FROM financial_transactions ft
WHERE ft.tenant_id = 'tenant-incheon-counseling-001'
  AND ft.is_deleted = 0
  AND ft.transaction_date BETWEEN @period_start AND @period_end;
```

→ `(income_sum − refund_sum) × 0.10 − tax_sum` 이 1,409 와 일치하면 `tax_amount` 누락 가설 확정. 일치하지 않으면 `subcategory` 오타·`is_deleted` 토글·`status` 영향을 추가 확인.

### 1.3 보정 SQL **초안** (DBA 검토 전용, 실행 X)

운영 DB 직접 UPDATE 는 **권장하지 않는다** — 감사 흔적·역분개·트랜잭션 정합성 보존을 위해 **ERP 화면 보정**이 우선. 부득이한 케이스(ERP 화면 미지원) 에만 DBA 가 별도 백업 후 검토하도록 초안만 제시한다.

```sql
-- ⚠️ 실행 금지 (DBA 검토 초안)
-- (1) tax_amount 누락 단일 거래 보정 (가설 a — amount=14,090, tax_amount=0)
-- 사전: §1.2 (B) 로 대상 거래 ID 확정 + mysqldump 백업 + AuditLog 별도 기재
UPDATE financial_transactions
SET tax_amount        = ROUND(amount * 0.10, 2),
    amount_before_tax = ROUND(amount, 2),
    tax_included      = 0,
    updated_at        = NOW()
WHERE id = <확정된_거래_ID>
  AND tenant_id = 'tenant-incheon-counseling-001'
  AND is_deleted = 0;

-- (2) tax_included=true 인데 tax_amount=0 인 케이스 (가설 b — 합포함 단가 분리 누락)
UPDATE financial_transactions
SET amount_before_tax = ROUND(amount / 1.1, 2),
    tax_amount        = ROUND(amount - amount / 1.1, 2),
    updated_at        = NOW()
WHERE id = <확정된_거래_ID>
  AND tenant_id = 'tenant-incheon-counseling-001'
  AND tax_included = 1
  AND tax_amount = 0
  AND is_deleted = 0;
```

> **권장**: 위 SQL 대신 어드민 ERP 화면(거래 상세 → 부가세 수동 보정) 사용. 감사 로그가 자동 적재된다.

### 1.4 ERP 일 마감 차단 해제 절차

`TaxIntegrityException` 은 `@ExceptionHandler` (`GlobalExceptionHandler` L471) 에서 **422 + `notify=true`** 로 응답하며, retry 제외(`@Retryable(exclude = { TaxIntegrityException.class })`) 이므로 **다음 자동 마감 시도에서도 동일 차단**된다. 해제 절차:

1. **§1.2 (A) (B) (C) (D) SELECT 로 원인 trace 확정** (사용자/DBA).
2. **보정**: ERP 화면 수동 보정 (권장) 또는 §1.3 SQL (DBA 백업 후, 비상시).
3. **재가드 검증**: §1.2 (A) 를 재실행 → `ABS(tax_diff) ≤ 1` 확인.
4. **마감 재시도**:
   - 자동 마감: 다음 `ErpAutomationScheduler` 사이클 대기 (자정 또는 02:00 KST cron).
   - 수동 마감: `dryRun=true` (default) 상태에서는 row 미삽입이므로 운영 활성화 시점은 `MINDGARDEN_SCHEDULER_FINANCIAL_CLOSE_DRY_RUN=false` 사전 합의 필요.
5. **마감 성공 시** `financial_period.status = 'CLOSED'` + `closed_at` 채워짐 → 일 마감 차단 해제 완료.

> **dry-run 기본값**: `application.yml` `mindgarden.scheduler.financial-close.dry-run: true` — 운영에서 활성화 전까지는 자동 close 자체가 수행되지 않으므로 일 마감 차단이라기보다 **부가세 가드 위반 로그·알림이 누적**되는 형태일 수 있다. 운영 BE 의 실제 `dry-run` 환경변수 (`MINDGARDEN_SCHEDULER_FINANCIAL_CLOSE_DRY_RUN`) 값을 사용자가 확인해야 정확한 영향 규명 가능.

---

## §2. P1-C — `session_recovery_alerts` 2건 미해결

### 2.1 ⚠️ 컬럼명 정정 — 사용자 쿼리의 `alert_type`/`recovery_notes` 는 컬럼 부재

Flyway `V20260609_001__create_session_recovery_alerts.sql` 기준 실제 컬럼은 다음과 같으며, **`alert_type`·`recovery_notes` 컬럼은 존재하지 않는다**.

| 실제 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | BIGINT PK | — |
| `tenant_id` | VARCHAR(36) | 멀티테넌트 격리 |
| `schedule_id` | BIGINT NOT NULL | 보정 대상 일정 |
| `mapping_id` | BIGINT NULL | 매핑 없음(`ACTIVE_MAPPING_NOT_FOUND`) 케이스에는 NULL |
| **`reason`** | VARCHAR(64) NOT NULL | 4종 enum-like (아래) — 사용자의 `alert_type` 에 해당 |
| `resolved_at` | DATETIME(6) NULL | NULL 이면 미해결 |
| `created_at` / `updated_at` / `deleted_at` / `is_deleted` / `version` | — | BaseEntity 표준 |

reason 4종 (`SessionRecoveryAlert.java` L43–49 · 적재 분기: `SessionDeductionRecoveryBatch.java` L145–174):

| reason | 의미 | 멱등성 |
|---|---|---|
| `ACTIVE_MAPPING_NOT_FOUND` | 결제 승인된 활성/입금대기 매핑이 없음 (`findActiveByConsultantAndClient` 결과 없음). `mapping_id` 는 NULL. | — |
| `REMAINING_SESSIONS_ZERO` | 매핑은 있지만 `remaining_sessions ≤ 0` (또는 NULL) → 차감 불가, 추가 회기 필요 | — |
| `MAPPING_STATUS_INVALID` | `useSessionForSpecificMapping` 호출 중 `IllegalStateException` (TERMINATED 등 보정 허용 외 상태) | — |
| `UNEXPECTED_ERROR` | 차감 시도 중 알 수 없는 RuntimeException | — |

배치는 동일 (`tenant_id`, `schedule_id`) 의 **unresolved 알람이 있으면 중복 적재하지 않는다** (`saveAlertIfAbsent` L181–192). 8일째 미해결로 남아있다는 것은 같은 schedule_id 에 대한 30분 주기 보정이 **연속 8일 (≈384 사이클) 실패**했다는 의미이며, 매 사이클마다 동일 schedule_id 가 `findRecoveryCandidates(session_sequence IS NULL + RECOVERY_STATUSES)` 후보로 재진입 중일 가능성이 높다.

### 2.2 정정 SELECT SQL (운영 readonly, 조회만)

```sql
USE core_solution;

-- (A) 미해결 알람 2건 식별
SELECT
  sra.id,
  sra.tenant_id,
  sra.schedule_id,
  sra.mapping_id,
  sra.reason,
  sra.created_at,
  sra.updated_at,
  TIMESTAMPDIFF(DAY, sra.created_at, NOW()) AS days_open
FROM session_recovery_alerts sra
WHERE sra.resolved_at IS NULL
  AND sra.is_deleted = 0
ORDER BY sra.created_at ASC;
```

→ 결과의 `schedule_id` 2건이 핵심 대상. 다음 (B)~(D) 의 `IN (...)` 부분에 그대로 대입.

```sql
-- (B) 후보 schedule 의 현재 상태 (사용자 제공 6건 78/108/111/115/122/127 + 알람에서 식별된 2건)
SELECT
  s.id              AS schedule_id,
  s.tenant_id,
  s.status,
  s.session_sequence,
  s.consultant_id,
  s.client_id,
  s.mapping_id,
  s.date            AS schedule_date,
  s.is_deleted
FROM schedules s
WHERE s.id IN (78, 108, 111, 115, 122, 127);
```

```sql
-- (C) 각 schedule 의 매핑 상태 — 회기 잔량 / status / tenant 격리 확인
SELECT
  m.id                  AS mapping_id,
  m.tenant_id,
  m.status,
  m.used_sessions,
  m.remaining_sessions,
  m.total_sessions,
  m.consultant_id,
  m.client_id,
  m.payment_status
FROM consultant_client_mappings m
WHERE m.id IN (
  SELECT DISTINCT mapping_id FROM session_recovery_alerts WHERE resolved_at IS NULL AND mapping_id IS NOT NULL
)
   OR (m.consultant_id, m.client_id, m.tenant_id) IN (
        SELECT s.consultant_id, s.client_id, s.tenant_id
        FROM schedules s
        WHERE s.id IN (78, 108, 111, 115, 122, 127)
      );
```

```sql
-- (D) 매핑 이력 (회기 변경 추적) — 운영 가이드의 mapping_history 명칭 확인 필요
SELECT
  h.mapping_id,
  h.session_change,
  h.change_reason,
  h.created_at
FROM consultant_client_mapping_history h
WHERE h.mapping_id IN (<위 (C)의 mapping_id 목록>)
ORDER BY h.mapping_id, h.created_at ASC;
```

> **테이블/컬럼명 주의**: `consultant_client_mapping_history` · `session_change` · `change_reason` 컬럼은 본 저장소에서 즉시 검증되지 않았다. DBA 가 실제 SHOW COLUMNS 로 확인 후 컬럼명을 정정해 실행한다.

### 2.3 원인 분류 매트릭스 (reason 4종)

각 미해결 알람 1건의 `reason` 값에 따라 다음 처리를 매핑한다.

| reason | 근본 원인 | 권장 복구 (옵션 a) | 단순 해소 (옵션 b — 위험) |
|---|---|---|---|
| `ACTIVE_MAPPING_NOT_FOUND` | 결제·매핑이 schedule 보다 늦게/누락 생성. 또는 매핑이 `TERMINATED`/`REFUNDED` | ① 정상 매핑 생성 (어드민 → 매핑 관리) + ② 회기 차감 재시도. `mapping_id` 가 NULL 이므로 schedule_id 만으로 추적. | `resolved_at = NOW()` — 단, 회기 누락이 그대로 남음. **추천 X** |
| `REMAINING_SESSIONS_ZERO` | 매핑은 있으나 잔여 0. 추가 회기 결제 미완료 또는 `used_sessions = total_sessions` 도달 | ① 추가 회기 결제 등록 → ② `remaining_sessions` 증가 → ③ 배치가 자동 재처리 | `resolved_at = NOW()` — 회기 음수 발생 위험. **추천 X** |
| `MAPPING_STATUS_INVALID` | 매핑이 `TERMINATED`/`REFUNDED` 등 보정 허용 외 상태. 또는 `ScheduleService.useSessionForSpecificMapping` 의 가드 위반 | ① 매핑 status 정정 (운영 점검 후 `ACTIVE` 복원) + ② 재시도. 또는 매핑 신규 생성. | `resolved_at = NOW()` — 데이터 정합성 위배 가능성 있음 |
| `UNEXPECTED_ERROR` | 예상 외 예외 (DB lock, NPE 등). 로그 확인 필수 | ① BE 로그에서 stacktrace 확인 → ② core-debugger 위임으로 원인 분류 → ③ 코드 패치 or 데이터 보정 | `resolved_at = NOW()` — 원인 미해결 상태로 누적될 위험. **추천 X** |

### 2.4 복구 SQL **초안** (DBA 검토 전용, 실행 X)

#### 옵션 (a) 매핑 수동 복구 + 회기 재차감 (권장 — 이전 #93/#107 패턴)

매핑 신규 생성·status 복원은 ERP 어드민 화면 또는 별도 운영 절차로 수행하고, 그 결과 매핑이 정상화되면 다음 사이클(30분 주기)에서 배치가 자동으로 차감 시도 → 성공 시 `alertRepository.existsUnresolvedByTenantIdAndScheduleId` 가 새 알람을 막고, `session_sequence` 가 채워진다. 단, **기존 미해결 알람의 `resolved_at`** 은 별도로 다음 SQL 로 종결한다.

```sql
-- ⚠️ 실행 금지 (DBA 검토 초안)
-- 매핑이 정상화되어 다음 사이클에서 schedule.session_sequence 가 채워진 것을 확인한 뒤,
-- 해당 schedule_id 의 미해결 알람만 종결 (resolved_at)
UPDATE session_recovery_alerts
SET resolved_at = NOW(),
    updated_at  = NOW()
WHERE id IN (<§2.2 (A) 결과의 id 2건>)
  AND resolved_at IS NULL;

-- 검증
SELECT id, schedule_id, reason, resolved_at
FROM session_recovery_alerts
WHERE id IN (<위 id 2건>);
```

#### 옵션 (b) `resolved_at` 만 설정 — 회피, 추천 X

근본 원인 (매핑 결손/잔여 0/status invalid) 을 해결하지 않은 채 알람만 종결한다. **회기 차감 누락은 그대로** 남으므로 **세션 사용량·정산·KPI 가 영구히 불일치** 한다. 비상 모니터링 신호 차단 목적 외에는 사용 금지.

```sql
-- ⚠️ 비상시에만 (운영팀 합의 필수)
UPDATE session_recovery_alerts
SET resolved_at = NOW(),
    updated_at  = NOW()
WHERE id IN (<§2.2 (A) 결과의 id 2건>)
  AND resolved_at IS NULL;
```

### 2.5 멱등성 / 재발 가드

- 동일 (`tenant_id`, `schedule_id`) 의 unresolved 알람은 1건만 적재 (`existsUnresolvedByTenantIdAndScheduleId`).
- `resolved_at` 종결 후, **schedule 의 `session_sequence` 가 여전히 NULL** 이고 RECOVERY_STATUSES (BOOKED/CONFIRMED/IN_PROGRESS/COMPLETED) 중 하나라면 다음 30분 사이클에서 **새 알람이 다시 적재** 된다. 따라서 옵션 (b) 단순 해소는 30분 후 재출현할 수 있으며, 옵션 (a) 매핑 복구 후 차감 성공이 확인되어야 영구 종결.
- 또는 schedule 자체가 무효이면 (`is_deleted = 1` 또는 status 변경) 후보 셋에서 제외되어 더 이상 알람이 적재되지 않는다.

---

## §3. 권장 옵션 자동 채택 (2026-06-15 13:40 KST · 사용자 결정)

> **결정**: 사용자가 `auto_select` 로 P1-B/P1-C 각각의 **권장 옵션 (§1.2 + §1.4 / §2.4 옵션 a)** 자동 채택을 지시. 보고서 §1·§2 에서 권장하던 옵션을 그대로 본 §3 의 실행 절차로 확정한다.

### 3.0 채택 결과 요약

| 항목 | 채택 옵션 | 채택 사유 | 실행 권한자 | 실행 시점 |
|---|---|---|---|---|
| **P1-B** | ✅ **§1.2 + §1.4 — ERP 화면 수동 보정** (DBA 의 `mindgarden_readonly` SELECT trace → 어드민 ERP 화면 부가세 수동 보정 → 마감 재시도) | 감사 로그 자동 적재 / 역분개·트랜잭션 정합성 보존 / 직접 UPDATE 회피 | **운영팀 리드 + DBA (조회) + HQ_MASTER (보정 화면 권한)** | 운영 BE 에서 `MINDGARDEN_SCHEDULER_FINANCIAL_CLOSE_DRY_RUN` 값 확인 직후, 다음 자동 마감 사이클 전 |
| **P1-C** | ✅ **§2.4 옵션 (a) — 매핑 수동 복구 + `resolved_at` 종결** (어드민 매핑 화면에서 매핑 복원 → 30분 사이클 자동 재차감 확인 후 미해결 알람 종결) | 회기 누락 근본 해결 / `resolved_at` 단순 종결 (옵션 b) 의 회기 음수·정산 KPI 불일치 위험 차단 | **운영팀 리드 + DBA (alert 종결 UPDATE write 권한)** | §2.2 (A) SELECT 로 미해결 알람 2건 id·schedule_id 확정 직후, 매핑 복구 → 1 사이클 (30분) 후 검증 |

> 옵션 (b) (`resolved_at` 단순 설정) 및 옵션 (c) (보류) 는 본 채택에서 **명시적으로 제외**. 향후 운영팀이 비상시 옵션 (b) 로 전환할 경우 별도 결정·기록이 필요.

---

### 3.1 P1-B 실행 절차 (ERP 화면 수동 보정, 단계별)

> **전제**: 운영 SSH (`mindgarden-prod`) + `mindgarden_readonly` 계정으로 운영 DB 조회 가능, ERP 어드민 화면(거래 상세 → 부가세 수동 보정) 사용 가능, HQ_MASTER 권한 보유.

#### 단계 1. 운영 BE dry-run 상태 확인 (영향 범위 사전 확정)

운영 BE 호스트(`beta74.cafe24.com`) 에서 환경변수 확인. 본 단계는 readonly·조회 한정:

```bash
# 운영 SSH (shell 서브에이전트 위임 권장)
ssh mindgarden-prod 'sudo systemctl show mindgarden-core-blue.service --property=Environment 2>/dev/null | tr " " "\n" | grep -i FINANCIAL_CLOSE_DRY_RUN'
ssh mindgarden-prod 'sudo systemctl show mindgarden-core-green.service --property=Environment 2>/dev/null | tr " " "\n" | grep -i FINANCIAL_CLOSE_DRY_RUN'

# 또는 /etc/mindgarden/ env 파일 직접 조회 (계정 권한 보유 시)
ssh mindgarden-prod 'sudo grep -E "^MINDGARDEN_SCHEDULER_FINANCIAL_CLOSE_DRY_RUN" /etc/mindgarden/*.env 2>/dev/null'
```

| 결과 | 의미 | 후속 |
|---|---|---|
| `true` 또는 키 미설정 | dry-run = ON. 자동 마감 미수행 → 422 로그만 누적, 즉시 차단 영향 없음 | 단계 2~5 정상 진행 (마감 재시도는 dry-run 해제 합의 후) |
| `false` | dry-run = OFF. 자동 마감 시도 중 → 422 차단 발생 중 | 단계 2~5 우선 진행, 마감 차단 해제 긴급 |

#### 단계 2. DBA 백업 (mysqldump, 보정 대상 테이블 한정)

DBA 가 보정 직전 백업을 생성한다. 운영 DB 서버에서 직접 수행 (readonly 가 아닌 backup 권한 계정 사용).

```bash
# 보정 대상 테이블 2종만 백업 (시간·용량 최소화)
TS=$(date +%Y%m%d_%H%M%S)
ssh mindgarden-prod-db "mysqldump --single-transaction --skip-lock-tables \
  -u <BACKUP_USER> -p '$DB_PASSWORD' \
  core_solution financial_transactions financial_period \
  > /var/backup/p1b_pre_correction_${TS}.sql"

# 또는 인천 테넌트 데이터만 (where 조건 백업 — 시간 절약)
ssh mindgarden-prod-db "mysqldump --single-transaction --skip-lock-tables \
  --where=\"tenant_id='tenant-incheon-counseling-001'\" \
  -u <BACKUP_USER> -p '$DB_PASSWORD' \
  core_solution financial_transactions financial_period \
  > /var/backup/p1b_pre_correction_incheon_${TS}.sql"
```

#### 단계 3. SELECT trace 실행 (§1.2 SQL 4건, readonly)

`mindgarden_readonly` 계정으로 다음 SELECT 를 순서대로 실행하여 보정 대상 1~2건 거래 ID 와 보정 산식 (가설 a vs b) 을 확정한다.

1. **§1.2 (A)** — `financial_period` 에서 `tax_diff = +1,409.00` 인 행 식별 → `period_start`/`period_end` 확정.
2. **§1.2 (D)** — 같은 기간의 income·tax·refund 합계 cross-check (`(income_sum − refund_sum) × 0.10 − tax_sum ≈ 1409` 검증).
3. **§1.2 (B)** — 같은 기간 INCOME 거래 중 `tax_amount` 누락/불일치 후보 식별.
4. **§1.2 (C)** — 환불 subcategory 오타 (가설 c) 추가 확인 (위 (D) 결과로 income 측이 원인이라는 결론이 나오면 (C) 는 참고용).

#### 단계 4. ERP 화면 보정 (단일 또는 복수 거래)

식별된 거래 ID 1~2건을 ERP 어드민 화면에서 수동 보정한다. 두 가지 보정 모드 중 거래 데이터에 맞는 것을 선택:

| 가설 | 거래 상태 | ERP 화면 입력 |
|---|---|---|
| **(a) `tax_amount` 0/NULL 누락** (`amount` 만 적재) | `tax_included = false`, `amount_before_tax` 미설정 | 거래 상세 → "부가세 분리" 선택 → `tax_amount = amount × 0.10` 자동 계산 적용 → 저장 |
| **(b) 합포함 단가 분리 누락** | `tax_included = true`, `tax_amount = 0` | 거래 상세 → "부가세 재분리" → `amount_before_tax = amount / 1.1`, `tax_amount = amount − amount/1.1` 자동 적용 → 저장 |

> 화면 저장 시 ERP 가 `AuditLog` (감사 로그) 에 자동 적재한다. DB 직접 UPDATE 없음.

#### 단계 5. 검증

```sql
-- (검증 1) §1.2 (A) 재실행 — tax_diff 가 ABS(diff) ≤ 1 인지 확인
SELECT
  fp.id, fp.period_type, fp.period_start, fp.period_end,
  fp.total_income, fp.total_refund, fp.total_tax_amount,
  ROUND((fp.total_income - fp.total_refund) * 0.10 - fp.total_tax_amount, 2) AS tax_diff
FROM financial_period fp
WHERE fp.tenant_id = 'tenant-incheon-counseling-001'
  AND fp.period_start = '<단계 3 (A) 결과의 period_start>';
-- 기대: tax_diff ∈ [-1, +1]

-- (검증 2) 보정한 거래 1~2건의 현재 상태 재조회
SELECT
  ft.id, ft.transaction_date, ft.amount, ft.tax_amount, ft.amount_before_tax, ft.tax_included, ft.updated_at
FROM financial_transactions ft
WHERE ft.id IN (<단계 4 에서 보정한 거래 ID>);
-- 기대: tax_amount ≠ 0, amount_before_tax 채워짐, updated_at = NOW() 근접
```

#### 단계 6. 마감 재시도 (dry-run 상태에 따라 분기)

| dry-run 상태 | 절차 |
|---|---|
| **`true`** | 별도 수동 close 호출 없음. 운영팀이 별도 시점에 `MINDGARDEN_SCHEDULER_FINANCIAL_CLOSE_DRY_RUN=false` 로 전환 결정 시 다음 자동 cron (자정 or 02:00 KST) 에서 정상 마감 |
| **`false`** | 다음 `ErpAutomationScheduler` 사이클 (자정 or 02:00 KST) 까지 대기 → 자동 마감 → `financial_period.status = 'CLOSED'` + `closed_at` 채워짐. 422 알람 미발화 확인 |

#### 단계 7. 백업 SQL (rollback 용)

보정 결과가 비즈니스 검토에서 부정 판단 시 단계 2 의 mysqldump 로 복원:

```bash
# rollback (DBA 만, 운영팀 합의 후)
mysql -u <RESTORE_USER> -p core_solution < /var/backup/p1b_pre_correction_incheon_<TS>.sql
```

> 또는 ERP 화면 거래 상세 → "보정 이력" 에서 직전 상태로 되돌리기 (감사 로그 적재).

---

### 3.2 P1-C 실행 절차 (매핑 수동 복구 + 알람 종결, 단계별)

> **전제**: 운영 SSH + `mindgarden_readonly` 조회 가능, 어드민 매핑 관리 화면 사용 가능 (HQ_ADMIN 또는 HQ_MASTER 권한), DBA write 권한 (alert UPDATE 용).

#### 단계 1. 미해결 알람 2건 식별 (§2.2 SELECT 그대로)

```sql
-- (P1C-검증 1) §2.2 (A) — 미해결 알람 2건 id·schedule_id·reason 식별
SELECT
  sra.id,
  sra.tenant_id,
  sra.schedule_id,
  sra.mapping_id,
  sra.reason,
  sra.created_at,
  sra.updated_at,
  TIMESTAMPDIFF(DAY, sra.created_at, NOW()) AS days_open
FROM session_recovery_alerts sra
WHERE sra.resolved_at IS NULL
  AND sra.is_deleted = 0
ORDER BY sra.created_at ASC;
```

→ 결과의 `id` 2건 (`<ALERT_ID_1>`, `<ALERT_ID_2>`) 과 `schedule_id` 2건 (`<SCHEDULE_ID_1>`, `<SCHEDULE_ID_2>`) 을 단계 2~6 에 대입.

#### 단계 2. 후보 schedule/매핑 상태 확인 (§2.2 (B) (C))

```sql
-- (P1C-검증 2) schedule 상태 확인
SELECT s.id AS schedule_id, s.tenant_id, s.status, s.session_sequence, s.consultant_id, s.client_id, s.mapping_id, s.date, s.is_deleted
FROM schedules s
WHERE s.id IN (<SCHEDULE_ID_1>, <SCHEDULE_ID_2>);

-- (P1C-검증 3) 해당 consultant/client/tenant 의 매핑 상태
SELECT m.id AS mapping_id, m.tenant_id, m.status, m.used_sessions, m.remaining_sessions, m.total_sessions, m.consultant_id, m.client_id, m.payment_status
FROM consultant_client_mappings m
WHERE (m.consultant_id, m.client_id, m.tenant_id) IN (
  SELECT s.consultant_id, s.client_id, s.tenant_id FROM schedules s WHERE s.id IN (<SCHEDULE_ID_1>, <SCHEDULE_ID_2>)
);
```

→ 단계 1 의 reason 값 + 단계 2 의 매핑 상태로 §2.3 매트릭스 항목 (4종) 중 어느 케이스인지 분류.

#### 단계 3. reason 별 매핑 복구 (어드민 화면)

| reason | 복구 절차 (어드민 매핑 관리 화면) |
|---|---|
| `ACTIVE_MAPPING_NOT_FOUND` | 어드민 → 매핑 관리 → 해당 consultant/client 매핑 생성 (`status=ACTIVE`, `remaining_sessions` 적절한 값) → 결제 정보 연결 |
| `REMAINING_SESSIONS_ZERO` | 어드민 → 추가 회기 결제 등록 (예: 5회 패키지) → 매핑 `remaining_sessions += N`, `total_sessions += N` 자동 갱신 |
| `MAPPING_STATUS_INVALID` | 어드민 → 매핑 status 정정 (TERMINATED → ACTIVE) 또는 신규 매핑 생성. 운영 점검 후 수행 |
| `UNEXPECTED_ERROR` | **단계 중단** → core-debugger 추가 위임 (BE 로그 stacktrace 분석 필요). 본 §3 채택 범위 외, 사용자 별도 결정 항목 |

> 위 1~3번 reason 은 본 §3 자동 채택 범위 (매핑 수동 복구). UNEXPECTED_ERROR 만 별도 결정 필요.

#### 단계 4. DBA 백업 (alert 종결 UPDATE 전)

```bash
# session_recovery_alerts 만 백업 (2건 row, 용량 미미)
TS=$(date +%Y%m%d_%H%M%S)
ssh mindgarden-prod-db "mysqldump --single-transaction --skip-lock-tables \
  --where=\"id IN (<ALERT_ID_1>, <ALERT_ID_2>)\" \
  -u <BACKUP_USER> -p '$DB_PASSWORD' \
  core_solution session_recovery_alerts \
  > /var/backup/p1c_pre_resolve_${TS}.sql"
```

#### 단계 5. 30분 사이클 대기 + schedule 자동 재차감 확인

매핑 복구 후 다음 `SessionDeductionRecoveryBatch` 30분 사이클까지 대기 (최대 30분). 사이클 후 schedule 의 `session_sequence` 가 채워졌는지 확인:

```sql
-- (P1C-검증 4) 매핑 복구 후 session_sequence 채워졌는지 확인
SELECT s.id, s.status, s.session_sequence, s.updated_at
FROM schedules s
WHERE s.id IN (<SCHEDULE_ID_1>, <SCHEDULE_ID_2>);
-- 기대: session_sequence 가 NULL → 양의 정수로 채워짐
```

> `session_sequence` 가 여전히 NULL 이면 매핑 복구가 미완료 또는 다른 reason 으로 재실패. 단계 2 의 진단 재수행.

#### 단계 6. 미해결 알람 종결 (DBA write 권한, §2.4 옵션 (a) SQL)

`session_sequence` 가 정상 채워진 것을 확인한 뒤, **그때만** 다음 UPDATE 를 1회 실행한다.

```sql
-- (P1C-실행) 매핑 정상화 확인 후 미해결 알람 종결
START TRANSACTION;

UPDATE session_recovery_alerts
SET resolved_at = NOW(),
    updated_at  = NOW()
WHERE id IN (<ALERT_ID_1>, <ALERT_ID_2>)
  AND resolved_at IS NULL
  AND is_deleted = 0;

-- 영향 row 수 검증 (정확히 2건 expected)
SELECT ROW_COUNT();

-- 정상이면 COMMIT, 아니면 ROLLBACK
COMMIT;
-- ROLLBACK;
```

#### 단계 7. 최종 검증

```sql
-- (P1C-검증 5) 종결 결과 확인
SELECT id, schedule_id, reason, resolved_at, updated_at
FROM session_recovery_alerts
WHERE id IN (<ALERT_ID_1>, <ALERT_ID_2>);
-- 기대: 2건 모두 resolved_at = 현재 시각, updated_at = 동일

-- (P1C-검증 6) 미해결 알람 카운트 0 확인 (전체 테넌트)
SELECT COUNT(*) AS unresolved_count
FROM session_recovery_alerts
WHERE resolved_at IS NULL AND is_deleted = 0;
-- 기대: 0 (새 알람이 적재되지 않은 상태)

-- (P1C-검증 7) 30분 후 재확인 — 매핑 복구가 정상이면 새 알람 미적재
-- (30분 사이클 1회 더 대기 후 검증 6 재실행)
```

#### 단계 8. 백업 SQL (rollback 용)

```bash
# 단계 6 결과가 운영 검토에서 부정 시 (예: 매핑 복구가 실제로는 미완료였음)
mysql -u <RESTORE_USER> -p core_solution < /var/backup/p1c_pre_resolve_<TS>.sql
```

> 또는 알람 row 의 `resolved_at` 만 NULL 로 되돌리는 UPDATE 1건 실행 (DBA 영역).

---

### 3.3 인계 체크리스트 (운영팀 리드 / DBA)

#### P1-B

- [ ] 단계 1: 운영 BE `MINDGARDEN_SCHEDULER_FINANCIAL_CLOSE_DRY_RUN` 값 확인 결과 기록
- [ ] 단계 2: mysqldump 백업 파일 경로·timestamp 기록 (`/var/backup/p1b_pre_correction_*.sql`)
- [ ] 단계 3: §1.2 (A) 결과의 `period_start`/`period_end`/`tax_diff` 기록
- [ ] 단계 3: §1.2 (B) 결과의 보정 대상 거래 ID 1~2건 + `amount`/`tax_amount`/`tax_included` 기록
- [ ] 단계 4: ERP 화면 보정 후 거래 상세 화면 캡처 + `AuditLog` 적재 확인
- [ ] 단계 5: 검증 1~2 결과 (`tax_diff ≤ 1`, 보정 거래 `tax_amount > 0`) 기록
- [ ] 단계 6: 다음 마감 사이클 결과 (`status = CLOSED`, 422 알람 없음) 기록

#### P1-C

- [ ] 단계 1: §2.2 (A) 결과의 `<ALERT_ID_1>`, `<ALERT_ID_2>`, `<SCHEDULE_ID_1>`, `<SCHEDULE_ID_2>`, `reason` 기록
- [ ] 단계 2: schedule·매핑 현재 상태 기록 → §2.3 매트릭스 case 분류
- [ ] 단계 2-1: reason 이 `UNEXPECTED_ERROR` 인 경우 → **단계 중단** + core-debugger 추가 위임 (별도 결정)
- [ ] 단계 3: 어드민 매핑 복구 화면 작업 결과 (신규 매핑 ID 또는 status 변경) 기록
- [ ] 단계 4: mysqldump 백업 파일 경로·timestamp 기록 (`/var/backup/p1c_pre_resolve_*.sql`)
- [ ] 단계 5: 30분 사이클 후 `schedules.session_sequence` 채워짐 확인
- [ ] 단계 6: alert UPDATE 영향 row = 2건 정확 + COMMIT 완료
- [ ] 단계 7: 검증 5·6 결과 (resolved_at 채워짐, 미해결 카운트 0) 기록
- [ ] 단계 7-1: 30분 사이클 후 검증 6 재확인 (새 알람 0건)

### 3.4 비고

- **운영 BE dry-run 값에 따라 P1-B 의 긴급도가 달라진다.** `true` 인 동안에는 422 로그만 누적되므로 본 §3 채택 절차는 운영팀 일정에 맞춰 진행 가능. `false` 면 즉시 진행 권장.
- **P1-C 의 30분 사이클 대기는 필수.** 매핑 복구 직후 알람만 종결하면 다음 사이클에서 동일 schedule_id 의 새 알람이 적재되어 회피 효과만 발생.
- **`UNEXPECTED_ERROR` reason** 은 본 §3 자동 채택 범위 밖. core-debugger 추가 위임으로 BE 로그 stacktrace 분석 → 케이스별 대응 결정 필요.
- **본 §3 채택 자체는 운영 DB 변경을 수반하지 않음.** 모든 write 작업 (ERP 화면 보정, alert UPDATE) 은 운영팀 리드/DBA 가 수행. 본 보고서·core-debugger 는 절차·SQL 초안·검증 쿼리 제공만 담당.

---

## §4. 사용자 / 운영팀 결정 (잔여 항목)

> 본 §3 채택으로 P1-B/P1-C 의 보정 방식·복구 옵션은 확정. 아래는 본 채택 후에도 사용자/운영팀이 추가로 결정해야 하는 항목.

| # | 항목 | 옵션 | 비고 |
|---|---|---|---|
| 1 | **P1-B dry-run 환경변수 현재값** | 운영 BE 의 `MINDGARDEN_SCHEDULER_FINANCIAL_CLOSE_DRY_RUN` 확인 (단계 1) | true 면 자동 마감 미수행, false 면 즉시 차단 영향 — 단계 6 분기 결정 |
| 2 | **P1-B/P1-C 실행 일정** | 즉시 / 다음 정기 점검 윈도 / 평일 새벽 (04:00~05:30 KST) | mysqldump 백업·검증 사이클 (P1-C 30분) 고려 |
| 3 | **P1-C `UNEXPECTED_ERROR` 케이스** | 단계 1 결과 reason 이 UNEXPECTED_ERROR 인 경우 → core-debugger 추가 위임 여부 | 본 §3 범위 외 |
| 4 | **P1-B 보정 후 BI/회계 보고** | 인천 테넌트의 1,409원 차이 보정 사실을 회계팀 별도 인계 여부 | 감사·부가세 신고 데이터 정합성 고려 |
| 5 | **운영 가이드 문서 정정 PR** | `POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md` §2.1.2 / §2.2.2 의 잘못된 컬럼명을 PR 로 정정할지 (부록 참조) | 본 보고서로 우회 가능하나, 향후 동일 trace 시 혼란 방지 |

---

## §5. 미해결 시 영향

| 항목 | 영향 | 누적성 |
|---|---|---|
| **P1-B 미해결** | `TaxIntegrityException` 으로 인천 테넌트의 **일/주/월 마감 자동화 차단**. dry-run=false 가 되는 시점부터 `financial_period` row INSERT 불가 → BI 대시보드 마감 KPI 누락. 부가세 신고 기준 데이터 누락. | 매 마감 사이클마다 422 로그 + 알림 트리거 누적 |
| **P1-C 미해결** | 세션 회복 모니터링 신호 노이즈 누적 (30분마다 동일 schedule_id 가 후보로 재진입). 어드민 알람 UI 의 미해결 카운트 ≥ 2 유지. 회기 차감 누락이 정산·매출 KPI 에 잠재 불일치. | 매 30분 사이클마다 후보 재진입, 멱등 가드로 추가 적재는 차단 |

---

## §6. 운영 DB 접근 가능 시 즉시 실행 권장 SELECT 묶음

운영팀이 prod readonly 에서 다음 6개 SELECT 를 순서대로 실행하면 본 보고서의 가설 1·2를 1차 확정·반증할 수 있다. 모두 변경 SQL 아님.

1. §1.2 (A) — `financial_period` 의 `tax_diff` 행 식별 (인천 테넌트)
2. §1.2 (D) — 같은 기간의 income·tax·refund 합계 cross-check
3. §1.2 (B) — `tax_amount` 누락 후보 거래 식별
4. §1.2 (C) — 환불 subcategory 오타 케이스 확인
5. §2.2 (A) — 미해결 알람 2건 식별 (id·schedule_id·reason)
6. §2.2 (B) (C) — 후보 schedule·mapping 상태 확인

결과를 본 디버거에게 전달하면 가설을 좁히고 §1.3 / §2.4 의 보정 SQL 초안을 **확정된 거래 ID / 알람 id** 로 채워 재발행할 수 있다.

---

## 절대 금지 (본 보고서 범위)

- 운영 DB 변경 SQL 실행 (모든 UPDATE/INSERT/DELETE 는 DBA 영역)
- 코드 수정 (본 보고서는 core-debugger 분석 산출물, 구현은 core-coder)
- 별도 PR 생성 (보고서 1건만 추가)
- 메인 트랙 (ops-portal Phase 2~6 · Dependabot · 디자인 v2) 영역 침범

---

## 부록 — 본 보고서가 정정한 운영 인계 문서 항목 (사용자 별도 결정)

| 위치 | 기존 (잘못) | 정정 (실제 스키마) |
|---|---|---|
| `POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md` §2.1.2 | `fp.total_revenue / fp.total_tax / fp.expected_tax / fp.tax_diff_amount / fp.period_year / fp.period_month / fp.period_day` | `fp.total_income / fp.total_tax_amount / (total_income − total_refund) × 0.10 / 위 산식 − total_tax_amount / fp.period_start / fp.period_end` |
| `POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md` §2.2.2 | `sra.alert_type` | `sra.reason` |
| 사용자 P1-C SQL | `erp_transactions.tax_amount / adjusted_amount / audited_at` | `financial_transactions.tax_amount / amount_before_tax / approved_at` (테이블·컬럼명 동시 정정) |

> 위 정정은 별도 PR 로 운영 가이드 문서를 수정할지 여부도 사용자 결정 항목이다 (옵션: 본 보고서로 우회 / 가이드 본문 정정 PR 생성).

