# 온보딩·ERP 시딩 에러·리스크 분석

**목적**: 온보딩 4단계 ERP 계정 매핑(`ensureErpAccountMappingForTenant`) 실패 영향, 트랜잭션 시나리오, init-tenant-erp 없이 온보딩만 완료 시 ERP 사용 가능 여부를 분석하고 수정 제안·체크리스트를 산출한다.  
**코드 수정 없음** — 분석·수정 제안만 수행 (실제 수정은 core-coder 위임).

---

## 1. 온보딩 관련 에러·예외 패턴

### 1.1 로그 키워드·스택 트레이스 패턴

| 구분 | 로그 키워드/메시지 | 로그 레벨 | 발생 위치 |
|------|-------------------|----------|----------|
| ERP 계정 매핑 시딩 실패 | `테넌트 ERP 계정 매핑 시딩 실패: tenantId=..., error=` | ERROR | AccountingServiceImpl:443 |
| 공통코드 삽입 실패 | `공통코드 삽입 실패 (계속 진행): tenantId=`, `공통코드 삽입 실패 (트랜잭션은 커밋)` | ERROR | OnboardingServiceImpl:1398, 1471 |
| 역할 코드 생성 실패 | `역할 코드 생성 실패 (계속 진행)`, `역할 코드 생성 실패 (트랜잭션은 커밋)` | ERROR | OnboardingServiceImpl:1409, 1484 |
| 권한 그룹 할당 실패 | `권한 그룹 할당 실패 (계속 진행)`, `권한 그룹 할당 실패 (트랜잭션은 커밋)` | ERROR | OnboardingServiceImpl:1419, 1502 |
| ERP 시딩 성공 | `✅ ERP 계정 매핑 시딩 성공: tenantId=` | INFO | OnboardingServiceImpl:1429 |
| 초기화 작업 상태 저장 실패 | `초기화 작업 상태 저장 실패: requestId=` | ERROR | OnboardingServiceImpl:2389, 2267 |
| 온보딩 후 테넌트 초기화 실패 | `온보딩 후 테넌트 초기화 실패 (온보딩 프로세스는 계속 진행)` | ERROR | OnboardingServiceImpl:782 |

### 1.2 관련 예외 타입·발생 조건

- **AccountingServiceImpl.ensureErpAccountMappingForTenant**
  - **예외**: `doEnsureErpAccountMappingForTenant()` 내부에서 발생 가능 — DB 제약(unique, FK), `accountRepository.save()` / `commonCodeRepository.save()` 예외, 트랜잭션 타임아웃 등.
  - **중요**: 예외 발생 시 내부에서 `catch` 후 `rollback` + `log.error`만 수행하고 **재throw 하지 않음** (443줄). 따라서 호출자(OnboardingServiceImpl)는 예외를 받지 못함.

- **OnboardingServiceImpl.initializeTenantAfterOnboardingInNewTransaction**
  - 4단계에서 `accountingService.ensureErpAccountMappingForTenant(tenantId)` 호출.
  - `ensureErpAccountMappingForTenant`가 실패해도 **예외가 전파되지 않으므로** `catch (Exception e)` 블록에 진입하지 않음.
  - 결과: **실제로 시딩이 실패해도 `statusMap.put("erpAccounts", createInitializationStatus("SUCCESS", null))`가 실행되어, 초기화 상태가 잘못 SUCCESS로 기록됨.**

- **기타 초기화 단계**
  - 1~3단계(공통코드, 역할코드, 권한그룹)는 각각 `self.xxxInNewTransaction()` 호출. 이 메서드들은 내부에서 예외를 catch 후 로그만 남기고 **재throw 하지 않음** (1471, 1484, 1502줄 주석). 따라서 실패 시에도 호출자 try 블록은 정상 완료되고, statusMap에는 **FAILED가 아닌 SUCCESS가 들어갈 수 있음** — 1~3단계는 catch 블록에서 `statusMap.put(..., FAILED)`를 하므로, **예외가 재throw되는 경우에만** FAILED 기록. 현재 1~3단계 메서드는 예외를 삼키므로 호출자에는 예외가 전파되지 않아, 1~3단계도 **실패해도 SUCCESS로 기록되는 구조일 수 있음**.  
  - 4단계(ERP)만 보면: `ensureErpAccountMappingForTenant`가 예외를 삼키므로 **무조건 SUCCESS로 기록**되는 것이 확실함.

---

## 2. ensureErpAccountMappingForTenant 실패 시 영향

### 2.1 상담료 입금 시 분개 생성 실패 가능 여부

- **가능함.**
- 흐름: 입금 확인 → `FinancialTransactionServiceImpl.createTransaction()` → `createJournalEntryFromTransaction(transaction)` (148줄).
- `createJournalEntryFromTransaction()` (AccountingServiceImpl 187~347줄):
  1. `getDefaultAccountId(tenantId, "REVENUE"|"EXPENSE"|"CASH")` 조회.
  2. 하나라도 null이면 `ensureErpAccountMappingForTenant(tenantId)` 호출 후 재조회.
  3. **재조회 후에도 하나라도 null이면 분개 생성하지 않고 null 반환** (226~232줄).
- 따라서 **온보딩 4단계에서 ensureErpAccountMappingForTenant가 실패한 테넌트**는 계정·공통코드가 없으므로, 입금 시 `getDefaultAccountId`가 null → (한 번 더 ensure 호출) → 여전히 null → **분개 미생성(null 반환)**.
- `ensureErpAccountMappingForTenant`가 실패하는 **근본 원인**(DB 오류, 제약 위반 등)이 해결되지 않으면, 이후 입금에서도 **매번 분개 생성 실패**가 반복됨.

### 2.2 실패 시 사용자/시스템 관점 영향

| 관점 | 영향 |
|------|------|
| **사용자** | 상담료 입금 후 재무제표·원장에 반영되지 않음. ERP 대시에서 해당 입금에 대한 분개/수익이 보이지 않음. |
| **시스템** | `financial_transactions`에는 거래만 있고, `accounting_entries`/`erp_ledgers`에는 데이터 없음. backfill 시에도 계정 매핑이 없으면 동일하게 실패(0건 처리, 실패 건수만 증가). |
| **운영** | 초기화 상태 JSON에서 `erpAccounts`가 SUCCESS로 잘못 기록되어, 실제로는 ERP가 준비되지 않았는데 “성공”으로 보일 수 있음. |

---

## 3. 트랜잭션 시나리오

### 3.1 REQUIRES_NEW / noRollbackFor 사용 위치

| 위치 | 전파/옵션 | 동작 요약 |
|------|-----------|-----------|
| OnboardingServiceImpl.initializeTenantAfterOnboardingInNewTransaction | REQUIRES_NEW, noRollbackFor = Exception.class | 전체 초기화가 하나의 새 트랜잭션. 예외가 나도 롤백하지 않고 커밋하려 함(예외를 throw하면 rollback-only 될 수 있음). |
| OnboardingServiceImpl 1~3단계 래퍼 | REQUIRES_NEW, noRollbackFor = Exception.class | 각 단계가 별도 새 트랜잭션. 내부에서 예외 catch 후 재throw 안 함 → 부모에는 예외 전파 안 됨. |
| AccountingServiceImpl.ensureErpAccountMappingForTenant | 프로그램 방식 REQUIRES_NEW (TransactionTemplate) | 새 트랜잭션 시작 → doEnsure → 성공 시 commit, 실패 시 rollback 후 **예외 삼킴**. |

### 3.2 부분 성공/부분 실패 시 동작

- **4단계(ERP) 실패 시**
  - `ensureErpAccountMappingForTenant` 내부에서 새 트랜잭션 rollback → DB에는 계정/공통코드 미생성.
  - 예외가 호출자로 전파되지 않으므로, `initializeTenantAfterOnboardingInNewTransaction`은 4단계를 “성공”으로 간주하고 statusMap에 `erpAccounts: SUCCESS` 기록.
  - 이후 “초기화 작업 상태 저장” 시 이 잘못된 JSON이 저장됨 → **데이터 불일치(상태는 성공, 실제는 미준비)**.

- **1~3단계 실패 시**
  - 각 래퍼 메서드가 예외를 catch하고 재throw 하지 않으면, 호출자 try-catch에서 예외를 받지 못해 해당 단계도 SUCCESS로 기록될 수 있음. (1~3단계는 catch에서 FAILED를 넣으려면 “예외가 전파되어야” 함.)

### 3.3 롤백·커밋 순서로 인한 데이터 불일치 위험

- **위험 1**: 초기화 메인 트랜잭션(REQUIRES_NEW, noRollbackFor)이 “성공”으로 끝나면서 statusMap(erpAccounts=SUCCESS)을 반환하고, 이 값이 별도 트랜잭션에서 `OnboardingRequest.initializationStatusJson`으로 저장됨. 실제 4단계는 롤백되어 DB에는 아무것도 없음 → **상태 JSON과 실제 DB 상태 불일치**.
- **위험 2**: `init-tenant-erp` API는 `ensureErpAccountMappingForTenant` 호출 후 결과를 검사하지 않고 항상 `success: true`를 반환. 시딩이 실패(예외 삼킴)해도 클라이언트는 성공으로 인식.

---

## 4. init-tenant-erp 수동 호출 없이 온보딩만 완료 시

### 4.1 ensureErpAccountMappingForTenant 호출 위치

- **온보딩 4단계**: `OnboardingServiceImpl.initializeTenantAfterOnboardingInNewTransaction()` 1425~1433줄에서 `accountingService.ensureErpAccountMappingForTenant(tenantId)` 호출.
- **수동 API**: `POST /api/v1/erp/accounting/init-tenant-erp` → `AccountingBackfillController.initTenantErp()` → 동일하게 `ensureErpAccountMappingForTenant(tenantId)`.
- **스케줄러**: `ErpAutomationScheduler.scheduleErpInitAndBackfill()` 매일 00:08에 테넌트별로 `ensureErpAccountMappingForTenant` 후 backfill.

### 4.2 수동 호출 없이 온보딩만 완료 시 ERP 사용 가능 여부

- **설계상**: 온보딩 완료 시 4단계에서 이미 `ensureErpAccountMappingForTenant`가 **자동 호출**되므로, **정상 동작 시** init-tenant-erp를 따로 호출하지 않아도 ERP(계정 매핑, 분개 생성)는 사용 가능해야 함.
- **단, 다음 경우에는 ERP 사용 불가 또는 불완전**:
  1. **4단계 시딩이 실패한 경우** (예외는 삼키고 상태만 SUCCESS로 기록): 계정·공통코드 없음 → 입금 시 분개 미생성.
  2. **초기화 자체가 다른 이유로 4단계를 건너뛴 경우** (코드 상으로는 항상 호출됨).
- **검증 제안**: 온보딩 승인 직후 해당 테넌트의 `common_codes`(ERP_ACCOUNT_TYPE), `accounts`(ERP-REVENUE/EXPENSE/CASH) 존재 여부 확인. 없으면 4단계 실패 또는 예외 삼킴으로 인한 잘못된 SUCCESS 기록 가능성 있음.

### 4.3 결론

- **init-tenant-erp는 “수동 호출 없이도 된다”가 맞음** — 단, **4단계 시딩이 실제로 성공했을 때만**.
- 현재 구현은 **4단계 실패 시에도 상태를 SUCCESS로 기록**하므로, “온보딩만 완료했는데 ERP가 안 된다”는 현상이 발생할 수 있음. 이때 수동으로 init-tenant-erp를 호출하면, 동일한 `ensureErpAccountMappingForTenant`가 다시 실행되어 **같은 DB 오류가 있으면 역시 실패**하고, API는 여전히 200 + “초기화 완료”를 반환하는 문제가 있음.

---

## 5. 잠재적 문제점 목록 및 우선순위

| 우선순위 | 문제 | 설명 |
|----------|------|------|
| **심각** | 4단계 실패 시에도 erpAccounts가 SUCCESS로 기록됨 | `ensureErpAccountMappingForTenant`가 예외를 삼키므로 OnboardingServiceImpl이 실패를 인지하지 못함. |
| **심각** | 입금 시 분개 미생성 시 사용자 피드백 부족 | `createJournalEntryFromTransaction`이 null 반환해도 FinancialTransactionServiceImpl은 로그만 남기고 정상 응답. 사용자는 입금은 됐는데 재무제표에 안 나오는 상황만 보게 됨. |
| **중간** | init-tenant-erp API가 시딩 실패 시에도 200 + 성공 메시지 반환 | `ensureErpAccountMappingForTenant`가 실패해도 예외를 던지지 않아 컨트롤러는 항상 성공 응답. |
| **중간** | 1~3단계 래퍼가 예외를 삼키면 해당 단계도 실패인데 SUCCESS로 기록될 수 있음 | (현재 1~3단계는 내부 catch 후 재throw 여부 확인 필요. 재throw 안 하면 동일 패턴.) |
| **낮음** | 스케줄러 init+backfill 실패 시 로그만 WARN, 재시도/알림 없음 | ErpAutomationScheduler에서 예외 catch 후 log.warn만 수행. |

---

## 6. core-coder 전달용 수정 제안 체크리스트 (초안)

### 6.1 AccountingServiceImpl.ensureErpAccountMappingForTenant

- [ ] **옵션 A**: 시딩 실패 시 예외를 다시 throw하여 호출자가 실패를 인지할 수 있게 함.  
  - 주의: 스케줄러/init-tenant-erp 호출부에서 예외 처리 필요.
- [ ] **옵션 B**: 반환 타입을 `boolean`(또는 결과 DTO)으로 변경해 성공/실패를 반환하고, 호출자(OnboardingServiceImpl, AccountingBackfillController)에서 반환값에 따라 상태/응답 처리.
- [ ] 실패 시 로그는 유지: `테넌트 ERP 계정 매핑 시딩 실패: tenantId=..., error=...`.

### 6.2 OnboardingServiceImpl.initializeTenantAfterOnboardingInNewTransaction

- [ ] 4단계에서 `ensureErpAccountMappingForTenant` 호출 후 **실패 여부를 반환값 또는 예외로 확인**하고, 실패 시 `statusMap.put("erpAccounts", createInitializationStatus("FAILED", errorMsg))` 및 `log.error("ERP 계정 매핑 시딩 실패 (계속 진행): ...")` 수행.
- [ ] 1~3단계도 동일하게, 각 래퍼가 **실패 시 예외를 재throw하거나 boolean 반환**하도록 하여, 호출자에서 FAILED를 정확히 기록할지 검토.

### 6.3 AccountingBackfillController.initTenantErp

- [ ] `ensureErpAccountMappingForTenant` 결과(반환값 또는 예외)에 따라 성공/실패 응답 분기. 실패 시 4xx/5xx 및 메시지로 “ERP 계정 매핑 초기화 실패” 반환.

### 6.4 FinancialTransactionServiceImpl.createTransaction (선택)

- [ ] `createJournalEntryFromTransaction` 반환값이 null일 때 로그 레벨 상향(WARN) 또는 관리자 알림 등 사용자/운영 관점 피드백 강화 검토.

### 6.5 검증 체크리스트 (수정 후)

- [ ] 온보딩 승인 직후 해당 tenantId로 `common_codes`(ERP_ACCOUNT_TYPE), `accounts`(ERP-REVENUE/EXPENSE/CASH) 존재 여부 확인.
- [ ] 4단계 시딩을 의도적으로 실패시킨 뒤, `initializationStatusJson`에 `erpAccounts.status == "FAILED"` 가 들어가는지 확인.
- [ ] init-tenant-erp 호출 후 시딩 실패 시 HTTP 응답이 성공이 아닌지 확인.
- [ ] 해당 테넌트에서 상담료 입금 → 분개 생성 → 원장/재무제표 반영 end-to-end 확인.

---

## 7. 참조 문서·코드 위치

| 구분 | 파일·위치 |
|------|-----------|
| 온보딩 4단계 ERP 시딩 | OnboardingServiceImpl 1424~1433 |
| ensureErpAccountMappingForTenant | AccountingServiceImpl 425~444, doEnsure 453~534 |
| 분개 생성(입금 시) | AccountingServiceImpl createJournalEntryFromTransaction 187~347, getDefaultAccountId 366~424 |
| init-tenant-erp API | AccountingBackfillController 57~78 |
| 스케줄러 init+backfill | ErpAutomationScheduler 56~72 |
| Backfill/분개 실패 로그 패턴 | docs/troubleshooting/BACKFILL_JOURNAL_FAILED_CHECKLIST.md |
| 재무제표·원장 흐름 | docs/troubleshooting/ERP_REVENUE_TO_STATEMENTS_ANALYSIS.md |
