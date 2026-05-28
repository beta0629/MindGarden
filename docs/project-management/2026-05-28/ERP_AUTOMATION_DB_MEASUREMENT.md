# ERP 자동화 운영 DB 실측 진단 보고서

- **작성 일자**: 2026-05-28
- **작성 주체**: core-debugger 서브에이전트 (READ-ONLY 운영 측정)
- **운영 환경**: `beta74.cafe24.com` / MySQL 8.0.43 / 스키마 `core_solution`
- **운영 main 기준**: `c759f97a8` (develop HEAD `4dee473b8`)
- **측정 범위**: M1~M10 (자동 분개 일관성·중복·환불·tenant·LazyInit·스케줄러·응답·결산)
- **데이터 모집단**: 매칭 90건 (ACTIVE 10 / TERMINATED 70 / SESSIONS_EXHAUSTED 10) · 거래 104건 · 분개 105건
- **격리 워크트리**: `/Users/mind/mindgarden-erp-debug` (브랜치 `docs/erp-automation-db-measurement`)

---

## 결론부 — 즉시 조치 권고

| 트랙 | 케이스 수 | 비고 |
|------|----------|------|
| **HIGH (P0)** | 2 | M3 데이터 불일치 1건, M8 PL/SQL 시그니처 매일 ERROR |
| **MEDIUM (P1)** | 3 | M3 일관성 위반 8건, M8 PL/SQL ArrayIndex, M10 결산/마감/부가세 자동화 부재 |
| **LOW (P2~P3)** | 4 | M6 branch_code 전건 NULL, M7 LazyInit 누적 추적, M9 응답시간 측정 인프라 부재, M9 더블 호출 패턴 |

**즉시 조치 필요 5건 (코더/플래너 위임)**

1. `[P0]` **soft-delete 부정합**: `financial_transactions.id=30` (매칭 9·INCOME 80만원) `is_deleted=1` 이지만 `accounting_entries.id=30` (POSTED+APPROVED, 80만원) 살아있음 → ERP 분개·원장 무결성 깨짐. **즉시 분개 동반 soft-delete 또는 데이터 보정 필요**
2. `[P0]` **PL/SQL 프로시저 시그니처 충돌**: `UpdateAllConsultantPerformance` 가 `core_solution.null.*` + `mind_garden.null.*` 양쪽에 존재 → 매일 0:00·4:00·14:00 등 8회 스케줄러 ERROR. 이전 E1/E3 에서 발견된 동일 이슈가 운영 main `c759f97a8` 에 여전히 잔존. **`mind_garden` 스키마 잔존 PL/SQL 정리 필요 (`hotfix/deprecate-session-plsql-procedures` 워크트리 협업)**
3. `[P1]` **AmountInfo `accurateAmount` 로직 결함**: `packagePrice` 우선이지만 `packagePrice=0` & `payment_amount>0` 인 매칭 8건이 `accurateAmount=0` 으로 잘못 보고됨. `AmountManagementServiceImpl.getIntegratedAmountInfo()` 의 fallback 우선순위 재정렬 필요 (`payment_amount > 0` 이면 우선)
4. `[P1]` **결산/마감/부가세 자동화 미구현**: `closing_*`, `period_close_*`, `vat_*` 테이블 0건. 분개 균형은 맞지만 (debit=credit=13,147,680원) 월/분기/연 결산 자동화 부재. **부가세 분리는 description 텍스트에만 기록**, 실 `tax_amount` 컬럼은 38%가 0/NULL
5. `[P1]` **`PlSqlFinancialServiceImpl` 지점별 재무 PL/SQL ArrayIndexOutOfBoundsException** 매일 04:00 발생 ("Index 3 out of bounds for length 3" + 5-25 까지는 "Parameter index of 4 is out of range") → 코드/스키마 불일치

**explore 광역 인벤토리와 교차검증할 5건**

1. `AccountingEntry.lines` (OneToMany LAZY) 사용 지점 — 트랜잭션 외 호출 시 LazyInit 위험 (`AccountingEntryRepository`, `JournalEntryLineRepository`, DTO 프로젝션 적용 여부)
2. `consultant_client_mappings.status` enum 에 `COMPLETED` 부재 (`ACTIVE`/`TERMINATED`/`SESSIONS_EXHAUSTED` 만 사용) — 명세·문서 vs 실제 enum 격차
3. `financial_transactions.transaction_type` enum 이 `INCOME`/`EXPENSE` 만 — `REFUND`/`RECEIVABLES` 는 별도 type 이 아니라 `EXPENSE` + `subcategory='CONSULTATION_REFUND'` 로 표현. ERP 스킬 문서와 실제 데이터 모델 차이
4. `branch_code` 가 `financial_transactions` 전건 NULL — 멀티지점 통계 분기 불가. `c759f97a8` 코드에서 `branchCode` set 누락 여부
5. `refund_requests` 테이블 0건 사용 — 실제 환불은 `financial_transactions` EXPENSE 직접 생성으로 처리됨. 명세상 채널과 실제 운영 격차

---

## M1. 자동 분개 일관성 — INCOME 거래 누락

```sql
SELECT m.id, m.tenant_id, m.consultant_id, m.client_id, m.status, m.payment_status,
       m.package_price, m.payment_amount,
       (SELECT COUNT(*) FROM financial_transactions ft
         WHERE ft.related_entity_type='CONSULTANT_CLIENT_MAPPING'
           AND ft.related_entity_id = m.id
           AND ft.transaction_type='INCOME'
           AND ft.is_deleted = 0) AS income_cnt
FROM consultant_client_mappings m
WHERE m.status IN ('ACTIVE','TERMINATED','SESSIONS_EXHAUSTED')
  AND m.is_deleted = 0
HAVING income_cnt = 0 LIMIT 30;
```

> **주의**: 명세상 `mappings.status IN ('ACTIVE','COMPLETED')` 였지만 실제 enum 에 `COMPLETED` 없음 → `ACTIVE`/`TERMINATED`/`SESSIONS_EXHAUSTED` 로 보정. 또한 `financial_transactions.mapping_id` 컬럼 없음 → `related_entity_type='CONSULTANT_CLIENT_MAPPING'` + `related_entity_id` 로 조인.

**결과 (5건)**

| mapping_id | status | payment_status | package | payment | method | 진단 |
|---|---|---|---|---|---|---|
| 1 | TERMINATED | APPROVED | 0 | 0 | BANK_TRANSFER | **정상** (금액 0 → 거래 스킵, ERP 스킬 § 1) |
| 9 | TERMINATED | CONFIRMED | 0 | 800,000 | BANK_TRANSFER | **🚨 P0 무결성** — FT id=30 존재하지만 `is_deleted=1`. 분개(AE id=30, POSTED) 는 살아있음 |
| 10 | TERMINATED | REJECTED | 800,000 | 800,000 | CASH | **정상** (결제 REJECTED → 거래 미생성) |
| 30 | TERMINATED | PENDING | 0 | NULL | NULL | **정상** (결제 PENDING) |
| 66 | TERMINATED | PENDING | 0 | NULL | NULL | **정상** (결제 PENDING) |

**자동 분개 커버리지 (status × INCOME FT 보유율)**

| status | 매칭 수 | INCOME 보유 | 커버리지 |
|---|---|---|---|
| ACTIVE | 10 | 10 | 100% |
| SESSIONS_EXHAUSTED | 10 | 10 | 100% |
| TERMINATED | 70 | 65 | 92.9% |
| **합계** | **90** | **85** | **94.4%** |

→ **해석**: 자동 분개 자체는 정상 작동 (CONFIRMED + 금액 양수 매칭 100% 커버). 진짜 결함은 ID 9 단 1건 (soft-delete 부정합).

- **분류**: HIGH (P0) — 매칭 9 단 1건
- **후속 위임**: core-coder → `FinancialTransactionService` soft-delete 시 종속 `AccountingEntry` 동반 처리 + 데이터 보정 마이그레이션

---

## M2. 중복 INCOME 거래 (동일 mappingId 2건+)

```sql
SELECT ft.related_entity_id AS mapping_id, COUNT(*) AS income_cnt
FROM financial_transactions ft
WHERE ft.related_entity_type='CONSULTANT_CLIENT_MAPPING'
  AND ft.transaction_type='INCOME' AND ft.is_deleted = 0
GROUP BY ft.related_entity_id HAVING income_cnt > 1 LIMIT 30;
```

**결과: 0건** — confirm-payment + confirm-deposit 더블 호출(M9 참조)에도 코드의 중복 방지 가드(ERP 스킬 § "중복 거래 방지")가 정상 작동.

- **분류**: 정상 (정상이면서도 "왜 0건 인지" 검증된 사례)

---

## M3. relatedTransactions 합계 vs accurateAmount 차이 (1원 이상)

```sql
SELECT m.id, m.status, m.package_price, m.payment_amount,
       COALESCE(m.package_price, m.payment_amount, 0) AS accurate_amount,
       (SELECT COALESCE(SUM(ft.amount),0) FROM financial_transactions ft
         WHERE ft.related_entity_type='CONSULTANT_CLIENT_MAPPING'
           AND ft.related_entity_id = m.id
           AND ft.transaction_type='INCOME' AND ft.is_deleted=0) AS erp_income_sum
FROM consultant_client_mappings m
WHERE m.is_deleted = 0 AND m.status IN ('ACTIVE','TERMINATED','SESSIONS_EXHAUSTED','PAYMENT_CONFIRMED','DEPOSIT_CONFIRMED')
HAVING ABS(accurate_amount - erp_income_sum) > 1 LIMIT 30;
```

**결과 (8건)**

| mapping_id | package | payment | accurate (코드 산식) | ERP INCOME 합계 | diff |
|---|---|---|---|---|---|
| 10 | 800,000 | 800,000 | 800,000 | 0 | **800,000** |
| 2 | 0 | 80,000 | 0 | 80,000 | 80,000 |
| 4 | 0 | 80,000 | 0 | 80,000 | 80,000 |
| 7 | 0 | 80,000 | 0 | 80,000 | 80,000 |
| 8 | 0 | 80,000 | 0 | 80,000 | 80,000 |
| 3 | 0 | 75,000 | 0 | 75,000 | 75,000 |
| 5 | 0 | 75,000 | 0 | 75,000 | 75,000 |
| 6 | 0 | 30,000 | 0 | 30,000 | 30,000 |

**해석**:
- **7건 (ID 2~8)**: `package_price=0` & `payment_amount>0` 패턴 → AmountInfo 의 `accurateAmount = COALESCE(package, payment)` 산식이 0 을 반환. **ERP 거래는 `payment_amount` 기반으로 정상 생성**되었으나 amount-info API 가 일관성 경고를 잘못 띄울 수 있음. 매칭별 amount 출처 분포: `only_payment=8`, `both_set=79`, `both_mismatch=1`, `neither=3`, `only_package=0`
- **1건 (ID 10)**: REJECTED → 거래 미생성 정상 (M1 참조). diff 계산에는 잡혀도 실 결함 아님.

- **분류**: MEDIUM (P1) — 8건 모두 사용자에게 보이는 일관성 경고로 노출 가능
- **후속 위임**: core-coder → `AmountManagementServiceImpl.getIntegratedAmountInfo()` `accurateAmount` 산식 정정 (`package_price` 가 0이면 `payment_amount` 우선)

---

## M4. 환불 ↔ 역분개 누락

> **명세 보정**: `consultant_client_mapping_refund` 테이블 부재. 실제 환불 테이블은 `refund_requests` (mapping_id FK 포함). 또한 `transaction_type` enum 에 `REFUND` 부재 → 환불 분개는 `transaction_type='EXPENSE'` + `subcategory IN ('CONSULTATION_REFUND','CONSULTATION_PARTIAL_REFUND')` + `related_entity_type LIKE '%REFUND%'` 로 표현.

```sql
SELECT status, erp_status, COUNT(*) FROM refund_requests GROUP BY status, erp_status;
```

**결과**: `refund_requests` 행 **0건**. 별도 EXPENSE 환불 거래 4건은 직접 생성됨:

| ft_id | subcategory | amount | status | mapping_id | 부가세 분리 |
|---|---|---|---|---|---|
| 79 | CONSULTATION_REFUND | 100,000 | PENDING | 67 | 공급 90,909 + VAT 9,091 |
| 80 | CONSULTATION_PARTIAL_REFUND | 100,000 | COMPLETED | 67 | 공급 90,909 + VAT 9,091 |
| 87 | CONSULTATION_REFUND | 80,000 | PENDING | 72 | 공급 72,727 + VAT 7,273 |
| 88 | CONSULTATION_PARTIAL_REFUND | 80,000 | COMPLETED | 72 | 공급 72,727 + VAT 7,273 |

**해석**:
- `refund_requests` 워크플로우(REQUESTED→APPROVED→PROCESSING→COMPLETED)는 **실 사용 0건** — 명세상 정규 채널과 실제 운영의 채널 격차
- 매칭당 환불·부분환불 각 1건씩 쌍으로 생성됨 → 동일 mapping_id 에 환불 100,000 + 부분환불 100,000 = 200,000원 EXPENSE 합산되어 회계적으로 환불이 2배 잡힐 가능성. 매칭 67·72 단 2건이지만 패턴 자체가 의심
- 부가세 분리는 description 텍스트에만 기록, `tax_amount` 컬럼은 별도 검증 필요 (M10-2 참조)

- **분류**: MEDIUM (P1) — 데이터 4건 / 패턴 2건
- **후속 위임**: core-planner → `refund_requests` 채널 정식 도입 여부 판단, core-coder → 환불 + 부분환불 중복 가능성 가드

---

## M5. PENDING_PAYMENT + INCOME 거래 (있으면 비정상)

```sql
SELECT m.id, m.status, ft.id, ft.amount FROM consultant_client_mappings m
JOIN financial_transactions ft ON ft.related_entity_type='CONSULTANT_CLIENT_MAPPING'
  AND ft.related_entity_id=m.id AND ft.transaction_type='INCOME' AND ft.is_deleted=0
WHERE m.status='PENDING_PAYMENT' AND m.is_deleted=0;
```

**결과: 0건**.

- 그러나 모집단 자체에 `PENDING_PAYMENT` 매칭이 **0건** (현재 status 분포: ACTIVE 10 / TERMINATED 70 / SESSIONS_EXHAUSTED 10).
- → **테스트 모집단 부족**. PENDING_PAYMENT 가 실제 발생할 때 옵션 B 결제 보류 흐름이 ERP 거래를 만들지 않는지는 운영 데이터로 검증되지 않음.
- **분류**: 정상 + 검증 부족 (P2)
- **후속 위임**: core-tester → PENDING_PAYMENT 상태 매칭 생성 + ERP 거래 미생성 시나리오 회귀 테스트

---

## M6. financial_transactions tenant_id / branch_code 검증

```sql
SELECT (SELECT COUNT(*) FROM financial_transactions WHERE is_deleted=0) AS total,
       (SELECT COUNT(*) FROM financial_transactions WHERE is_deleted=0 AND tenant_id IS NULL) AS null_tenant_cnt,
       (SELECT COUNT(DISTINCT tenant_id) FROM financial_transactions WHERE is_deleted=0) AS distinct_tenants;
```

**결과**

| 측정 | 값 |
|---|---|
| total_active | 104 |
| null_tenant_cnt | **0** |
| empty_tenant_cnt | 0 |
| distinct_tenants | 1 (`tenant-incheon-counseling-001`) |
| ft_with_branch_code | **0** |
| ft_without_branch_code | **104 (100%)** |
| dangling_branch_cnt | 0 (NULL 이므로 dangling 없음) |

**해석**:
- 이전 E3 트랙에서 "`financial_transactions` 에 `tenant_id` 자체 없음" 으로 알려졌지만 **실제 스키마에는 존재** (`varchar(36)`) 하며 **100% 정상 입력**. 멀티테넌트 격리 OK.
- 그러나 `branch_code` 는 **전건 NULL** → 멀티지점 환경에서 거래의 지점 분기 불가. `consultant_client_mappings.branch_code` 는 존재할 수 있으므로 매칭→FT 전파 누락 가능성.

- **분류**: tenant_id MEDIUM-LOW (E3 결론 수정 필요) / branch_code MEDIUM (P1~P2)
- **후속 위임**: core-coder → `FinancialTransactionFactory` (또는 동등 위치) 에서 `mapping.branchCode` → `ft.branchCode` 전파 추가

---

## M7. AccountingEntry / JournalEntryLine LazyInit 누적 위험

> **명세 보정**: `journal_entries` 테이블 부재. 실제 child 는 `erp_journal_entry_lines` (FK `journal_entry_id` → `accounting_entries.id`). 엔티티는 `AccountingEntry.lines` `@OneToMany(fetch=LAZY)` `List<JournalEntryLine>`.

```sql
SELECT (SELECT COUNT(*) FROM accounting_entries WHERE is_deleted=0) AS ae_total,
       (SELECT COUNT(*) FROM erp_journal_entry_lines WHERE is_deleted=0) AS jel_total,
       (SELECT MAX(c) FROM (SELECT COUNT(*) c FROM erp_journal_entry_lines WHERE is_deleted=0 GROUP BY journal_entry_id) s) AS max_lines,
       (SELECT AVG(c) FROM (SELECT COUNT(*) c FROM erp_journal_entry_lines WHERE is_deleted=0 GROUP BY journal_entry_id) s) AS avg_lines;
```

**결과**

| 측정 | 값 |
|---|---|
| `accounting_entries` (active) | 105 |
| `erp_journal_entry_lines` (active) | 334 |
| MAX lines per AE | **4** |
| AVG lines per AE | **3.18** |
| AE → FT orphan (`financial_transaction_id` IS NULL) | 0 |
| AE → FT dangling | 0 |
| entry_status × approval_status | `POSTED`/`APPROVED` 105건 (100%) |
| 분개 차변/대변 균형 (총계) | debit=credit=13,147,680원 (imbalance 0) |
| 차변/대변 불일치 행 | 0 |
| `erp_journal_entry_lines.tenant_id` NULL | 0 / 334 |
| 30일간 분개 ERROR 로그 | 0건 |
| INCOME FT → AE 매칭 | **86/85** (1건 초과 = soft-deleted FT) |

**해석**:
- LazyInit 시한폭탄은 **데이터 측면에선 아직 미발현**. 평균 3.18 lines/AE, 최대 4 lines/AE 로 매칭당 분개 규모가 작음.
- **Agent 796e3a07 DTO 프로젝션 핫픽스**가 운영 main 에 미반영 상태에서도 현재 트래픽으로는 안전. **단, 매칭이 1000+ 로 증가하거나 다건 일괄 조회 화면이 트랜잭션 밖에서 `getLines()` 호출하면 즉시 폭발.**
- **`income_ft_with_ae` 86 > `income_ft_total` 85** = AccountingEntry 가 soft-deleted FT 를 가리키는 사례 1건 (M1 ID 9 와 동일) — **분개 무결성 P0 재확인**.
- 분개 차변/대변 총액 균등 = 자동 분개 로직 자체는 정상.

- **분류**: 누적 위험 P2 / 무결성 P0 (M1 와 중복)
- **후속 위임**: core-coder → DTO 프로젝션 핫픽스 (Agent 796e3a07) 빠른 머지 / core-tester → 1000+ 매칭 부하 회귀

---

## M8. 스케줄러 ERROR 잔존

**측정**: `/var/www/mindgarden/releases/blue/logs/error.{date}.0.log` 최근 7일 (2026-05-21 ~ 2026-05-27)

**일별 ERROR 추이**

| 날짜 | error 로그 라인 | ERROR 카운트 |
|---|---|---|
| 2026-05-21 | 12,985 | 228 |
| 2026-05-22 | 14,230 | 239 |
| 2026-05-23 | 11,167 | 193 |
| 2026-05-24 | 13,122 | 223 |
| 2026-05-25 | 12,449 | 216 |
| **2026-05-26** | **448** | **7** (급감) |
| 2026-05-27 | 307 | 3 |

→ **5-25 → 5-26 에 무엇인가 운영 배포** 가 들어가서 ERROR 폭이 99% 감소. 운영 main `c759f97a8` 배포 시점으로 추정.

**키워드 매트릭스 (7일 누적)**

| 키워드 | 카운트 |
|---|---|
| `withSchemaName` | 0 |
| `@Modifying` | 0 |
| `procedure signature` (Unable to determine the correct call signature) | 매일 발생 |
| `LazyInitializationException` | 0 |
| `Could not initialize proxy` | 0 |
| `상담료 수입 거래 자동 생성 실패` | 0 |
| `유효한 거래 금액을 결정할 수 없습니다` | 0 |
| `중복 거래 방지` | 0 (INFO 로 logback 필터링 가능) |
| `TenantContextHolder` | 0 |
| `ConstraintViolation` | 12 (입력 검증 정상 범주) |
| `JDBCException` | 0 |

**잔존 ERROR 클래스 (5-26 이후 안정화 후)**

| 클래스 | 1일 평균 | 위험도 |
|---|---|---|
| `c.c.c.s.i.PlSqlStatisticsServiceImpl` | 1~2 | **P0** — 매일 정시 PL/SQL 시그니처 충돌 `UpdateAllConsultantPerformance` 가 `core_solution.null.*` + `mind_garden.null.*` 양쪽에 존재 |
| `c.c.c.s.i.PlSqlFinancialServiceImpl` | 1 | **P1** — 매일 04:00 `Index 3 out of bounds for length 3` (5-25 까지는 "Parameter index of 4 is out of range (1, 2)") → 코드/스키마 시그니처 불일치 |
| `c.c.core.filter.TenantContextFilter` | 0~2 | P2 — 산발적 |
| `c.c.c.s.PersonalDataDestructionService` | 1 | P2 — 개인정보 파기 스케줄러, dry-run 명시되어 있어 별도 트랙 |
| `c.c.c.service.impl.AuthServiceImpl` | 1 | 정상 — 사용자 비번 오타 |

**핵심 ERROR 샘플 (2026-05-27)**

```
00:03:00 ERROR PlSqlStatisticsServiceImpl - 모든 상담사 성과 PL/SQL 프로시저 실행 실패: performanceDate=2026-05-26,
  오류=Unable to determine the correct call signature - multiple signatures for 
  'UpdateAllConsultantPerformance': found [core_solution.null.UpdateAllConsultantPerformance, 
  mind_garden.null.UpdateAllConsultantPerformance] procedures
04:00:00 ERROR PlSqlFinancialServiceImpl - 지점별 재무 상세 조회 실패: Index 3 out of bounds for length 3
```

- **분류**: PL/SQL 시그니처 충돌 **HIGH (P0)** / PL/SQL 재무 ArrayIndex **MEDIUM (P1)**
- **후속 위임**:
  1. `hotfix/deprecate-session-plsql-procedures` 워크트리 (이미 존재) 와 협업하여 `mind_garden` 스키마의 잔존 PL/SQL 제거
  2. `PlSqlFinancialServiceImpl.getBranchFinancialDetail` 의 in/out 파라미터 시그니처와 실제 PL/SQL 시그니처 매칭 검증
  3. ERP 자동 분개 자체에 대한 ERROR 는 **0건** (안정 상태) 기록 → 자동 분개는 안정적

---

## M9. 자동 분개 endpoint 호출 빈도

> **응답시간 측정 불가**: nginx access log 에 `$request_time` 미설정 (`combined` 표준 포맷). 대체 측정으로 호출 빈도·응답 코드만 측정.

**최근 2일 (2026-05-27 ~ 2026-05-28)**

| endpoint | 호출 수 | 응답 |
|---|---|---|
| `POST /api/v1/admin/mappings/{id}/confirm-payment` | 4 | 200 only |
| `POST /api/v1/admin/mappings/{id}/confirm-deposit` | 4 | 200 only |
| `GET /api/v1/admin/refund-statistics?period=month` | 86 | 200 only |
| `GET /api/v1/admin/financial-transactions` | 1 | 200 |
| `/api/v1/admin/journal-entries` | 0 | — |
| `/api/v1/admin/accounting-entries` | 0 | — |
| `/api/v1/admin/amount-management/mappings/*/amount-info` | **0** | — |
| `/api/v1/admin/erp/*` | 0 | — |

**핵심 관찰**

1. **`confirm-payment` + `confirm-deposit` 더블 호출 패턴**: 매칭 87/88/89/90 각각 5초 간격으로 두 API 가 연속 호출됨 (예: `11:35:19 confirm-payment` + `11:35:23 confirm-deposit` 매칭 88). 프론트 로직이 두 호출을 직렬로 트리거. M2 중복 0건 = 코드 가드 정상이지만 **클라이언트 측 API 중복 호출**.
2. **`amount-info` 호출 0건**: AmountManagement API 가 운영에서 미사용. ERP 스킬 명세된 핵심 API 인데도 실 트래픽 0 → 프론트 라우팅/대시보드 통합 누락 가능성.
3. **`refund-statistics` 86건**: 대시보드 자동 로딩으로 추정 (period=month 고정), 모두 200.
4. **모든 ERP endpoint 응답 200 only** — 4xx/5xx 없음.

- **분류**: P1 (응답시간 인프라) + P2 (프론트 더블 호출)
- **후속 위임**:
  1. core-coder → nginx 로그 포맷에 `$request_time $upstream_response_time` 추가 (응답시간 SLO 측정 인프라 구축)
  2. core-coder → 프론트 confirm-payment/deposit 의 직렬 호출 단일화 또는 두 호출의 의도 명확화
  3. core-planner → AmountManagement API 의 실 사용 채널 점검 (API 가 실제로 호출되지 않으면 폐기 또는 노출 채널 강화)

---

## M10. 결산 / 마감 / 부가세 자동화 흔적

```sql
SHOW TABLES LIKE 'closing%'; -- 0
SHOW TABLES LIKE '%closing%'; -- 0
SHOW TABLES LIKE 'vat%'; -- 0
SHOW TABLES LIKE '%vat%'; -- 0
SHOW TABLES LIKE 'period_close%'; -- 0
SHOW TABLES LIKE '%tax%'; -- salary_tax_calculations 만 존재
```

**결과**: 결산·마감·부가세 자동화 테이블 **전무**.

**`financial_transactions` 세금 컬럼 통계**

| 측정 | 값 | 비율 |
|---|---|---|
| total active | 104 | 100% |
| `tax_amount IS NULL` | 0 | 0% |
| `tax_amount = 0` OR NULL | 40 | 38.5% |
| `tax_included = TRUE` | 77 | 74% |
| `tax_included = FALSE` | 27 | 26% |
| `withholding_tax_amount > 0` | 58 | 55.8% (대부분 인건비) |

**해석**:
- 부가세 분리는 **description 텍스트에만 기록** ("부가세 분리: 공급가 X원, 부가세 Y원") — 실 `tax_amount` 컬럼은 38% 비어있음.
- 결산·마감·부가세 자동 계산 **스케줄러·테이블 모두 미구현**.
- 자동 분개 차변/대변 균형은 맞음 (13,147,680원 일치, M7).

- **분류**: P1 (개선 필요)
- **후속 위임**: core-planner → 결산·마감·부가세 신고 자동화 로드맵 수립. 단순한 월/분기/연 마감 procedure + `tax_amount` 컬럼 정형화부터 시작

---

## 부록 — 측정 메타데이터

- **실행 위치**: `beta74.cafe24.com` (mindgarden-server 별칭)
- **DB 권한**: `mindgarden` 사용자, SELECT only 실행, DML/DDL 미실행
- **SQL 스크립트**: `/tmp/erp_measure.sql` + `/tmp/erp_measure2.sql` (운영 호스트)
- **세션 단위 결과 캐시**: `/tmp/erp_measure_result.txt`, `/tmp/erp_measure2_result.txt`
- **소요 시간**: 모든 쿼리 < 1.3 초 (운영 부하 무시 수준)
- **격리 워크트리**: `/Users/mind/mindgarden-erp-debug` (origin/develop 기준)
- **브랜치**: `docs/erp-automation-db-measurement`
- **스키마 보정 사항 (명세 vs 실제)**

| 명세 (사용자 매트릭스) | 실제 운영 스키마 |
|---|---|
| `financial_transactions.mapping_id` | `related_entity_id` + `related_entity_type` |
| `transaction_type IN ('REFUND')` | `EXPENSE` + `subcategory='CONSULTATION_REFUND'` |
| `journal_entries` 테이블 | `erp_journal_entry_lines` (FK `journal_entry_id` → `accounting_entries.id`) |
| `consultant_client_mapping_refund` | `refund_requests` (그러나 미사용, 0건) |
| `mappings.status IN ('ACTIVE','COMPLETED')` | enum 에 `COMPLETED` 없음 → `ACTIVE`/`TERMINATED`/`SESSIONS_EXHAUSTED` |
| `financial_transactions.branch_id` | `branch_code` varchar(20) (branches.branch_code UNIQUE 와 조인) |
| "financial_transactions / branches 에 tenant_id 자체 없음" (E3 결론) | **둘 다 존재** (`varchar(36)`, ft 100% non-NULL) — E3 결론 수정 필요 |
