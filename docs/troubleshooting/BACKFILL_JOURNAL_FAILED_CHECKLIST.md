# Backfill 분개 실패 원인 파악용 체크리스트

**상황**: backfill 실행 시 `처리 0건, 스킵 0건, 실패 11건`  
**동작**: `createJournalEntryFromTransaction`이 `null` 반환 또는 예외 발생 시 `failedCount` 증가

---

## 1. 원인별 로그 확인 키워드

| # | 원인 | 로그 키워드/메시지 | 로그 레벨 | 발생 위치 |
|---|------|-------------------|----------|----------|
| 1 | tenantId null/빈값 | `FinancialTransaction에 tenantId가 없어 분개를 생성할 수 없습니다` | WARN | AccountingServiceImpl:190 |
| 2 | TenantIsolationValidator 불일치 | `테넌트 ID 불일치: 분개 생성 건너뜀` | WARN | AccountingServiceImpl:196 |
| 3 | 기본 계정 ID(REVENUE/EXPENSE/CASH) null | `기본 계정을 찾을 수 없어 분개를 생성할 수 없습니다` | WARN | AccountingServiceImpl:226-230 |
| 3-a | getDefaultAccountId 파싱/조회 실패 | `기본 계정을 찾을 수 없습니다`, `계정 ID 파싱 실패`, `기본 계정 ID 조회 실패` | WARN/ERROR | getDefaultAccountId 내부 |
| 3-b | ensureErpAccountMapping 시딩 실패 | `테넌트 ERP 계정 매핑 시딩 실패` | ERROR | ensureErpAccountMappingForTenant:376 |
| 4 | createJournalEntry 예외 | `FinancialTransaction에서 분개 생성 실패` | ERROR | AccountingServiceImpl:292-293 |
| 5 | approveJournalEntry 예외 | `분개 전기 실패: 원장 미반영` | ERROR | AccountingServiceImpl:275-282 |
| 6 | postJournalEntry 예외 | (5와 동일 - approve/post는 함께 try-catch됨) | ERROR | AccountingServiceImpl:275-282 |
| - | 백필 루프 예외 | `백필 분개 생성 실패` | WARN | AccountingServiceImpl:596 |

**중요 구분**  
- 5, 6번(approve/post 실패): **saved를 반환**하므로 `failedCount`는 증가하지 않음. 분개는 생성·저장되지만 원장 미반영.
- `failedCount`가 증가하는 경로: 1, 2, 3(3-a 포함), 4 + 백필 루프 예외.

---

## 2. 11건 전부 실패 시 유력 원인(시스템 이슈) 순위

| 순위 | 원인 | 설명 |
|-----|------|------|
| **1** | **기본 계정 매핑 부재(REVENUE/EXPENSE/CASH)** | `ERP_ACCOUNT_TYPE` 공통코드에 extraData/codeDescription에 계정 ID가 없거나 파싱 실패. init 실행 전이거나 init 실패 시 11건 전부 null 반환 가능성이 가장 높음. |
| **2** | **TenantContextHolder vs transaction.tenantId 불일치** | backfill은 `TenantContextHolder.getRequiredTenantId()`로 tenantId를 받고, FinancialTransaction의 tenantId와 비교. 스케줄러/비동기/세션 경로에서 컨텍스트 tenantId가 달라지면 11건 모두 실패. |
| **3** | **init 미실행** | `init-tenant-erp`를 먼저 실행하지 않아 계정·공통코드가 생성되지 않음. |
| **4** | **createJournalEntry 예외** | 차변/대변 불균형, FK/제약, Repository 저장 예외 등. 11건이 동일 데이터 패턴이면 동일 예외로 전부 실패 가능. |
| **5** | **FinancialTransaction.tenantId 일괄 null** | DB에서 tenant_id가 null인 거래가 11건 있는 경우(데이터 품질 이슈). |

---

## 3. 로그 스니펫이 있을 때 확인 포인트

로그 스니펫을 받았을 때 아래 패턴으로 원인 후보를 좁힐 수 있음.

| 로그에 보이는 메시지 | 추정 원인 |
|---------------------|----------|
| `기본 계정을 찾을 수 없어` + `revenue=null, expense=null, cash=null` | 3번: ERP_ACCOUNT_TYPE 계정 매핑 부재 |
| `테넌트 ID 불일치: 분개 생성 건너뜀` | 2번: TenantContextHolder 불일치 |
| `FinancialTransaction에 tenantId가 없어` | 1번 또는 5번: transaction.tenantId null |
| `FinancialTransaction에서 분개 생성 실패` + 스택 | 4번: createJournalEntry 예외(차변대변, FK 등) |
| `분개 전기 실패: 원장 미반영` | 5/6번 (failedCount 증가는 아님. 원장만 미반영) |
| `백필 분개 생성 실패` + `transactionId=` | 위 중 하나가 루프 밖으로 전파된 경우 |
| `IllegalArgumentException` + `차변/대변 불균형` | 4번: createJournalEntry 내부 검증 실패 |
| `IllegalStateException` + `테넌트 ID 불일치` | LedgerService.updateLedgerFromJournalEntry: 계정 테넌트 불일치 (approve/post 구간) |

---

## 4. 추가 확인 권장 DB/설정 항목

### 4.1 공통코드 (common_codes)

```sql
SELECT tenant_id, code_group, code_value, extra_data, code_description, is_active
FROM common_codes
WHERE tenant_id = '<tenantId>' AND code_group = 'ERP_ACCOUNT_TYPE'
ORDER BY code_value;
```

- `REVENUE`, `EXPENSE`, `CASH` 3개 행 존재 여부
- `extra_data` 형식: `{"accountId": 123}` 또는 `code_description`에 `accountId:123` 형식
- `is_active = true` 여부

### 4.2 계정 (accounts)

```sql
SELECT id, tenant_id, account_number, description, is_deleted
FROM accounts
WHERE tenant_id = '<tenantId>'
  AND account_number IN ('ERP-REVENUE', 'ERP-EXPENSE', 'ERP-CASH')
  AND is_deleted = false;
```

- ERP 가상 계정 3개 존재 여부
- `common_codes.extra_data`의 accountId와 일치 여부

### 4.3 financial_transactions (백필 대상)

```sql
SELECT id, tenant_id, transaction_type, amount, transaction_date
FROM financial_transactions
WHERE tenant_id = '<tenantId>'
  AND transaction_type = 'INCOME'
  AND is_deleted = false
ORDER BY id;
```

- `tenant_id` null 여부
- 백필 대상 건수와 failedCount(11) 비교

### 4.4 erp_ledgers

```sql
SELECT tenant_id, account_id, period_start, period_end, total_debit, total_credit
FROM erp_ledgers
WHERE tenant_id = '<tenantId>'
ORDER BY period_start DESC
LIMIT 20;
```

- 원장 데이터 존재 여부(전기 성공 여부 간접 확인)
- 5/6번 실패 시에는 분개는 생성되지만 원장에 반영되지 않음

### 4.5 accounting_entries (기존 분개)

```sql
SELECT id, tenant_id, financial_transaction_id, entry_status, entry_number
FROM accounting_entries
WHERE tenant_id = '<tenantId>'
ORDER BY id DESC
LIMIT 20;
```

- failedCount 증가 원인이 approve/post(5,6)가 아닌 create 단계인지 확인

---

## 5. shell로 실행 권장 명령

**목적**: 로그 확인

```bash
# 최근 backfill 관련 로그 (tail 라인 수는 환경에 맞게 조정)
tail -n 500 build/logs/application.log | grep -E "백필|backfill|기본 계정|tenantId|분개 생성|분개 전기|ERP_ACCOUNT_TYPE"
```

**목적**: 실패 transactionId 목록·원인 패턴 확인

```bash
grep -E "FinancialTransaction에서 분개 생성 실패|기본 계정을 찾을 수 없어|테넌트 ID 불일치" build/logs/application.log | tail -n 50
```

---

## 6. 수정 후 검증 체크리스트

- [ ] 해당 tenantId로 `init-tenant-erp` 실행 후 `common_codes`, `accounts` 확인
- [ ] backfill 재실행 후 processed/failed/skipped 수 확인
- [ ] 실패 시 위 1번 로그 키워드로 원인 식별
- [ ] `accounting_entries`에 해당 financial_transaction_id로 분개 생성 여부 확인
- [ ] `erp_ledgers`에 해당 기간·계정 데이터 반영 여부 확인
