# ERP 개발 서버 테스트 데이터 준비 가이드

**작성일**: 2025-03-04  
**목적**: 개발 서버에서 ERP 시스템 테스트(재무제표 API, 스케줄러, ERP 화면)를 위한 최소 테스트 데이터 준비 방법 정리.  
**참조**: `docs/planning/ERP_TEST_SCENARIOS.md`, `docs/standards/TESTING_STANDARD.md`

---

## 1. 필수 데이터 요약

| 구분 | 필수 여부 | 설명 |
|------|-----------|------|
| **테넌트** | 필수 | 모든 ERP API/화면은 `tenantId`(세션 또는 X-Tenant-ID) 필요 |
| **사용자** | 필수 | ERP 접근 권한(관리자 또는 ERP_ACCESS 동적 권한) 있는 계정으로 로그인 |
| **회계 계정(accounts)** | 재무제표용 | 재무제표 API는 원장(Ledger) 기반. 원장은 `accounts` + `erp_ledgers` 사용. 데이터 없으면 0으로 응답 |
| **예산/거래/아이템** | 목록 조회용 | 대시보드·구매·예산·재무 목록 조회 시 빈 목록 또는 샘플 표시용 |

---

## 2. 기존 SQL 스크립트 참고

프로젝트 내 ERP 테스트 데이터 스크립트:

| 파일 | 비고 |
|------|------|
| `src/main/resources/sql/erp_test_data.sql` | 구매요청·주문·예산·재무거래·아이템. **tenant_id 없음** (레거시 구조). 개발 DB 스키마와 맞는지 확인 후 사용 |
| `src/main/resources/sql/erp_test_data_corrected.sql` | 테이블명·컬럼 맞춤. **tenant_id 없음** |
| `src/main/resources/sql/erp_test_data_2025.sql` | 2025년 재무 거래 샘플. **tenant_id 없음**, `financial_transactions` 컬럼 세트 확인 필요 |

**주의**: 현재 ERP 회계 도메인(분개·원장·재무제표)은 **멀티테넌트**입니다.

- `accounting_entries`, `erp_journal_entry_lines`, `erp_ledgers` → `tenant_id` 필수
- `accounts` → `tenant_id` 있음(선택)
- 기존 `erp_test_data*.sql`은 대부분 **tenant_id를 넣지 않음**. 개발 서버 DB에 그대로 넣으면 테넌트 격리 테스트에 부적합할 수 있음.

---

## 3. 최소 데이터 준비 절차 (권장)

### 3.1 테넌트·사용자

- **이미 있는 개발 계정 사용**: 관리자(superadmin) 또는 ERP_ACCESS 권한이 부여된 사용자로 로그인하면 `tenantId`는 세션/헤더로 전달됨.
- **신규 테넌트가 필요할 때**:  
  - 테넌트 생성 API 또는 관리 화면에서 테넌트 생성 후, 해당 테넌트에 ERP 권한이 있는 사용자로 로그인.

### 3.2 재무제표 API용 데이터 (선택)

재무제표 API(`/api/v1/erp/accounting/statements/balance`, `statements/income`)는 **원장(Ledger)** 데이터를 사용합니다.

- **원장 데이터가 없으면**: 응답은 `success: true`이며, `assets/liabilities/equity` 또는 `revenue/expenses`는 0/빈 배열로 반환됩니다. (에러 아님)
- **0이 아닌 값을 보고 싶다면**:
  1. 해당 테넌트에 대해 `accounts` 테이블에 계정 등록(description에 "자산", "수익", "비용" 등 키워드 포함 시 `FinancialStatementServiceImpl` 분류에 사용됨).
  2. **테넌트별 공통코드 `ERP_ACCOUNT_TYPE` 설정**: 결제/입금 연동 시 자동 분개 생성·전기를 위해 **REVENUE**(수익), **EXPENSE**(비용), **CASH**(현금) 계정 ID가 공통코드(`extraData` 또는 `codeDescription`에 계정 ID)로 설정되어 있어야 함. 없으면 분개가 생성되지 않아 원장·재무제표에 반영되지 않음.
  3. 분개(AccountingEntry + JournalEntryLine) 생성 후 **전기(post)** 하면 원장(`erp_ledgers`)이 생성/갱신됨. (결제 완료/입금 확인 시에는 자동 생성 분개가 승인·전기되어 원장에 반영됨.)
  4. 그 다음 재무제표 API 호출 시 0이 아닌 값이 나올 수 있음.

기존 `erp_test_data*.sql`에는 **분개/원장/accounts** 삽입이 없을 수 있으므로, 개발 서버에서 수동으로 분개 생성·전기하거나, 테넌트별 원장/계정 시딩 스크립트를 별도로 준비하는 것을 권장합니다.

### 3.3 실행 가능 스크립트 제안

- **로컬/개발 DB**에서 기존 스크립트를 쓸 경우:
  1. 스키마 호환 여부 확인(테이블명·컬럼명이 현재 엔티티와 일치하는지).
  2. 필요 시 `tenant_id` 컬럼에 개발용 테넌트 ID를 넣는 구문을 추가한 버전을 만들어 실행.

예시 (개념):

```sql
-- 예: 테넌트가 이미 있다고 가정
SET @dev_tenant_id = 'your-dev-tenant-id';

-- 예산 테이블에 tenant_id가 있다면
INSERT INTO budgets (..., tenant_id, ...) VALUES (..., @dev_tenant_id, ...);
```

- **통합 테스트**에서는 `@SpringBootTest` + `TestDataBuilder` 등으로 테넌트·사용자·계정·분개를 동적 생성하는 방식을 권장(`docs/standards/TESTING_STANDARD.md`).

---

## 4. 검증 체크리스트

- [ ] 개발 서버에 로그인 가능한 계정이 있고, 해당 계정에 ERP 메뉴 접근 권한이 있는가?
- [ ] 로그인 후 세션에 `tenantId`(또는 테넌트 정보)가 설정되는가?
- [ ] 재무제표 API만 검증할 경우: 원장 없이 호출 시 200 + `success: true` + 0/빈 항목으로 응답하는지 확인.
- [ ] (선택) 0이 아닌 재무제표를 보려면 해당 테넌트에 계정·분개·전기 데이터를 준비했는가?

---

## 5. 참조

- `docs/planning/ERP_TEST_SCENARIOS.md` — API-1~API-11, E2E-1~E2E-9 시나리오
- `docs/project-management/ERP_AUTOMATION_GAP_AND_PLAN.md` — 스케줄러·재무제표 자동화
- `docs/standards/TESTING_STANDARD.md` — 테스트 데이터 동적 생성, 하드코딩 ID 금지
