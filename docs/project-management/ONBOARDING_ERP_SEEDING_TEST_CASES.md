# 온보딩·ERP 시딩 테스트 케이스 제안

**작성일**: 2026-03-15  
**목적**: 온보딩 → ERP 시딩 → 상담료 입금 → 분개 생성 전체 E2E 검증 및 `ensureErpAccountMappingForTenant` 실패·재시도 시나리오 테스트 케이스 제안  
**산출**: 시나리오 목록 + 우선순위 + 보완 포인트 (테스트 코드 미구현)

---

## 1. 흐름 요약

```
온보딩 승인
  → OnboardingApprovalServiceImpl.processOnboardingApproval
    → Step 1: 테넌트 생성/활성화
    → Step 2~3: 역할·권한
    → OnboardingServiceImpl.initializeTenantAfterOnboardingInNewTransaction
      → 1단계: 공통코드
      → 2단계: 역할 코드
      → 3단계: 권한 그룹
      → 4단계: ensureErpAccountMappingForTenant (ERP 계정 매핑 시딩)

상담료 입금 확인 (confirm-deposit)
  → AdminServiceImpl.confirmDeposit
    → createConsultationIncomeTransactionAsync
      → FinancialTransactionService.createTransaction (INCOME)
        → AccountingServiceImpl.createJournalEntryFromTransaction
          → getDefaultAccountId(null) 시 ensureErpAccountMappingForTenant 재호출
          → 분개 생성 → 승인 → 전기
```

---

## 2. E2E 검증 케이스

### 2.1 정상 경로 (P0)

| ID | 시나리오 | Given | When | Then | 계층 |
|----|----------|-------|------|------|------|
| E2E-P0-1 | 온보딩 승인 후 ERP 시딩 성공 | PENDING 온보딩, 관리자 토큰 | 온보딩 승인 API 호출 | statusMap.erpAccounts=SUCCESS, accounts 테이블에 ERP-REVENUE/EXPENSE/CASH 3개, common_codes에 ERP_ACCOUNT_TYPE 존재 | 통합 |
| E2E-P0-2 | 상담료 입금 후 분개 자동 생성 | 신규 테넌트, ERP 시딩 완료, 매칭 존재 | confirm-deposit API 호출 | financial_transactions 1건, accounting_entries 1건, entry_lines 2건(차변/대변), 원장 반영 | 통합 |
| E2E-P0-3 | 전체 플로우: 온보딩→테넌트→시딩→매칭→입금→분개 | 없음 | 온보딩 신청→승인→매칭 생성→입금확인 | 테넌트·계정·매칭·거래·분개·재무제표까지 일관된 데이터 | E2E |

### 2.2 엣지 케이스 (P1)

| ID | 시나리오 | Given | When | Then | 계층 |
|----|----------|-------|------|------|------|
| E2E-P1-1 | 이미 ERP 시딩된 테넌트에 재시딩 | REVENUE/EXPENSE/CASH 계정 존재 | ensureErpAccountMappingForTenant 재호출 | idempotent: 계정·공통코드 중복 생성 없음 | 단위/통합 |
| E2E-P1-2 | ERP 시딩 실패 후 상담료 입금 | 온보딩 완료, erpAccounts=FAILED | confirm-deposit 호출 | createJournalEntryFromTransaction 내부에서 ensureErpAccountMappingForTenant 재호출 시도; 성공 시 분개 생성, 실패 시 분개 미생성(null) | 통합 |
| E2E-P1-3 | 1·2·3단계 성공, 4단계(erpAccounts)만 실패 | Mock로 ensureErpAccountMappingForTenant 예외 | initializeTenantAfterOnboardingInNewTransaction | statusMap.erpAccounts=FAILED, 테넌트·역할·권한은 정상 생성, 온보딩 롤백 안 됨 | 통합 |
| E2E-P1-4 | tenantId null/빈값 | tenantId=null 또는 "" | ensureErpAccountMappingForTenant | 조기 반환, 예외 미발생 | 단위 |
| E2E-P1-5 | 매핑 금액 0 또는 null | accurateAmount=0 또는 null | createConsultationIncomeTransaction | 거래 생성 안 함, 분개 미생성 | 단위 |
| E2E-P1-6 | 중복 입금 확인 | 동일 매핑에 대해 이미 INCOME 거래 존재 | confirm-deposit 재호출 | 중복 거래 생성 안 됨(amountManagementService.isDuplicateTransaction) | 단위/통합 |
| E2E-P1-7 | 테넌트 격리 | 테넌트 A, B 각각 생성 | 테넌트 A 입금 → 분개 | 테넌트 B의 accounting_entries에 A 분개 없음 | 통합 |

---

## 3. ensureErpAccountMappingForTenant 실패·재시도 시나리오

### 3.1 실패 시 온보딩 롤백 여부

| ID | 시나리오 | 예상 동작 | 검증 포인트 |
|----|----------|-----------|-------------|
| RT-1 | 온보딩 4단계(erpAccounts) 실패 | **온보딩 롤백 안 됨** | `initializeTenantAfterOnboardingInNewTransaction`은 `noRollbackFor = Exception.class`, try-catch로 statusMap.erpAccounts=FAILED 저장 후 계속 진행 |
| RT-2 | 1·2·3단계 실패 | 각 단계 try-catch로 처리, 다음 단계 시도 | statusMap에 해당 단계 FAILED, 나머지 PENDING 또는 SUCCESS |
| RT-3 | ensureErpAccountMappingForTenant 내부 트랜잭션 | REQUIRES_NEW로 별도 트랜잭션, 실패 시 rollback 호출 | AccountingServiceImplTest.ensureErpAccountMappingForTenant_rollbackOnSeedingFailure 검증 완료 |

**정리**:  
- 온보딩 자체는 롤백되지 않음.  
- ERP 시딩만 실패 시 `statusMap.erpAccounts.status = "FAILED"`, `errorMessage` 저장.  
- 테넌트·역할·권한은 이미 커밋된 상태.

### 3.2 재시도 시 성공 시나리오

| ID | 시나리오 | 트리거 | When | Then | 계층 |
|----|----------|--------|------|------|------|
| RT-4 | init-tenant-erp API 수동 재시도 | 관리자 | POST /api/v1/erp/accounting/init-tenant-erp (X-Tenant-ID 헤더) | 200, success=true, ensureErpAccountMappingForTenant 성공, 계정·공통코드 생성 | 통합 |
| RT-5 | 스케줄러 자동 재시도 | ErpAutomationScheduler (00:08) | scheduleErpInitAndBackfill | 모든 활성 테넌트에 대해 ensureErpAccountMappingForTenant + backfillJournalEntriesFromIncomeTransactions | 통합 |
| RT-6 | 상담료 입금 시 자동 재시도 | confirm-deposit | getDefaultAccountId null → ensureErpAccountMappingForTenant 호출 → 재조회 | 시딩 성공 시 분개 생성, 재무제표 반영 | 통합 |
| RT-7 | 백필로 분개 보완 | ERP 시딩 후 입금된 INCOME 거래 | backfillJournalEntriesFromIncomeTransactions | 분개 미존재 INCOME 거래에 대해 분개 생성·전기 | 통합 |

---

## 4. 기존 테스트 커버리지 및 보완 포인트

### 4.1 기존 테스트

| 대상 | 파일 | 커버 범위 |
|------|------|-----------|
| ensureErpAccountMappingForTenant | AccountingServiceImplTest | isPrimary=false 저장, 실패 시 rollback |
| 온보딩 승인 | OnboardingApprovalServiceIntegrationTest | processOnboardingApproval 전체 흐름 |
| 온보딩 플로우 | MvpOnboardingFlowIntegrationTest, OnboardingOpsIntegrationTest | create→decide(APPROVED) |
| OnboardingService | OnboardingServiceTest | Mock 기반 decide, findPending 등 |
| 시스템 통합 | FullSystemIntegrationTest | Onboarding→Erd→PgConfig→Payment (ERP 시딩/분개 상세 검증 없음) |
| E2E | erp-menu-and-list.spec.ts | ERP 메뉴·목록 화면만 |
| 테넌트 생성 | TENANT_CREATION_TEST_PLAN.md | 대시보드·역할·위젯 위주, ERP 시딩 미포함 |

### 4.2 보완 필요 포인트

| 우선순위 | 보완 항목 | 계층 | 상세 |
|----------|-----------|------|------|
| P0 | 온보딩 승인 후 erpAccounts 상태·accounts 조회 | 통합 | OnboardingApprovalServiceIntegrationTest 또는 새 통합 테스트에 4단계 검증 추가 |
| P0 | confirm-deposit → financial_transaction + accounting_entry 생성 | 통합 | AdminService/AccountingService 통합 테스트 |
| P0 | ensureErpAccountMappingForTenant idempotent | 단위 | 이미 계정 있을 때 스킵 검증 |
| P1 | tenantId null/빈값 조기 반환 | 단위 | AccountingServiceImplTest |
| P1 | init-tenant-erp API | 통합 | AccountingBackfillController 통합 테스트 |
| P1 | createJournalEntryFromTransaction 내부 재시도(ensureErp) | 통합 | 계정 없음 → ensure → 재조회 → 분개 생성 시나리오 |
| P2 | scheduleErpInitAndBackfill 스케줄러 | 통합 | 스케줄러 Mock 또는 @Scheduled 비활성화 후 직접 호출 |
| P2 | 온보딩→매칭→입금→분개 E2E | E2E | tests/e2e/tests/admin 또는 erp 하위 새 spec |
| P2 | 테넌트 격리 (ERP) | 통합 | 두 테넌트 분개 데이터 격리 검증 |

---

## 5. 테스트 시나리오 우선순위 매트릭스

| 우선순위 | 시나리오 ID | 계층 | 예상 공수 |
|----------|-------------|------|-----------|
| **P0** | E2E-P0-1, E2E-P0-2, E2E-P0-3 | 통합 2 + E2E 1 | M |
| **P0** | RT-4 (init-tenant-erp) | 통합 | S |
| **P1** | E2E-P1-1, E2E-P1-2, E2E-P1-3, RT-6 | 단위 1 + 통합 3 | M |
| **P1** | E2E-P1-4, E2E-P1-5, E2E-P1-6, E2E-P1-7 | 단위 3 + 통합 1 | M |
| **P2** | RT-5, RT-7, E2E-P0-3 상세 | 통합 2 + E2E | L |
| **P2** | ensureErpAccountMapping idempotent | 단위 | S |

---

## 6. 검증용 데이터·API 참조

### 6.1 관련 엔드포인트

| 메서드 | 경로 | 용도 |
|--------|------|------|
| POST | /api/v1/onboarding/request | 온보딩 신청 |
| POST | /api/v1/onboarding/approve/{requestId} | 온보딩 승인 |
| POST | /api/v1/admin/mappings/{mappingId}/confirm-deposit | 입금 확인 |
| POST | /api/v1/erp/accounting/init-tenant-erp | ERP 계정 매핑 수동 초기화(재시도) |

### 6.2 DB 검증 포인트

- `tenants`: tenant_id
- `accounts`: tenant_id, account_number IN ('ERP-REVENUE','ERP-EXPENSE','ERP-CASH'), is_deleted=false
- `common_codes`: tenant_id, code_group='ERP_ACCOUNT_TYPE', code_value IN ('REVENUE','EXPENSE','CASH')
- `financial_transactions`: tenant_id, transaction_type='INCOME', related_entity_type='CONSULTANT_CLIENT_MAPPING'
- `accounting_entries`: tenant_id, financial_transaction_id
- `journal_entry_lines`: account_id, debit_amount, credit_amount

### 6.3 초기화 상태 JSON (onboarding_requests)

```json
{
  "commonCodes": { "status": "SUCCESS", "updatedAt": "..." },
  "roleCodes": { "status": "SUCCESS", "updatedAt": "..." },
  "permissionGroups": { "status": "SUCCESS", "updatedAt": "..." },
  "erpAccounts": { "status": "SUCCESS"|"FAILED", "errorMessage": "..." }
}
```

---

## 7. 참고 문서

- `docs/project-management/ERP_TENANT_ISOLATION.md` — ERP 시딩 흐름
- `docs/project-management/ERP_RENEWAL_PLANNING.md` — 입금확인→분개 플로우
- `docs/troubleshooting/ERP_REVENUE_TO_STATEMENTS_ANALYSIS.md` — 분개 생성·계정 조회
- `docs/standards/TESTING_STANDARD.md` — 테스트 표준
- `docs/project-management/2025-12-03/TENANT_CREATION_TEST_PLAN.md` — 테넌트 생성 테스트 계획
