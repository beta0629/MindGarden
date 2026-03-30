# 프로시저 기반 ERP 고도화 계획

## 1. 현재 ERP 시스템 구조

### 1.1 프로시저 기반 아키텍처

현재 마인드가든 ERP 시스템은 **PL/SQL 프로시저 기반**으로 구현되어 있습니다.

**장점:**
- ✅ 복잡한 비즈니스 로직을 데이터베이스 레벨에서 처리
- ✅ 트랜잭션 일관성 보장
- ✅ 성능 최적화 (네트워크 왕복 최소화)
- ✅ 데이터 무결성 보장

**구조:**
```
Java Service Layer
    ↓ (프로시저 호출)
PL/SQL Stored Procedures
    ↓ (데이터 처리)
Database Tables
```

### 1.2 현재 구현된 프로시저

#### 급여 관리
- ✅ `ProcessIntegratedSalaryCalculation` - 급여 계산 및 ERP 동기화
- ✅ `ApproveSalaryWithErpSync` - 급여 승인 및 ERP 동기화
- ✅ `ProcessSalaryPaymentWithErpSync` - 급여 지급 및 ERP 동기화
- ✅ `GetIntegratedSalaryStatistics` - 급여 통계 조회

#### 회계 관리
- ✅ `ValidateIntegratedAmount` - 금액 검증 및 일관성 검사
- ✅ `GetConsolidatedFinancialData` - 통합 재무 데이터 조회
- ✅ `ProcessDiscountAccounting` - 할인 회계 처리
- ✅ `GenerateFinancialReport` - 재무 리포트 생성

#### 구매 관리
- ✅ `CreateItem` - 비품 생성
- ✅ `UpdateItemStock` - 재고 업데이트
- ✅ `CreatePurchaseRequest` - 구매 요청 생성
- ✅ `ApprovePurchaseRequest` - 구매 요청 승인
- ✅ `CheckLowStock` - 재고 부족 확인

#### 예산 관리
- ✅ `CreateBudget` - 예산 생성
- ✅ `TrackBudgetUsage` - 예산 사용 추적
- ✅ `CheckBudgetOverrun` - 예산 초과 확인
- ✅ `GetBudgetStatistics` - 예산 통계 조회

#### 환불 관리
- ✅ `ProcessRefundWithSessionAdjustment` - 환불 처리 및 세션 조정
- ✅ `ProcessPartialRefund` - 부분 환불 처리
- ✅ `GetRefundableSessions` - 환불 가능 세션 조회

### 1.3 Java 서비스 레이어

**프로시저 호출 패턴:**
```java
@Service
public class PlSqlAccountingServiceImpl {
    private final JdbcTemplate jdbcTemplate;
    
    public Map<String, Object> validateAmount(Long mappingId, BigDecimal amount) {
        SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
            .withProcedureName("ValidateIntegratedAmount")
            .declareParameters(
                new SqlParameter("p_mapping_id", Types.BIGINT),
                new SqlParameter("p_input_amount", Types.DECIMAL),
                new SqlOutParameter("p_is_valid", Types.BOOLEAN),
                // ... 기타 파라미터
            );
        
        Map<String, Object> params = new HashMap<>();
        params.put("p_mapping_id", mappingId);
        params.put("p_input_amount", amount);
        
        return jdbcCall.execute(params);
    }
}
```

## 2. 고도화 전략

### 2.1 하이브리드 접근 방식

**원칙:**
- ✅ **프로시저 유지**: 복잡한 비즈니스 로직, 대량 데이터 처리, 트랜잭션 일관성이 중요한 부분
- ✅ **Java 서비스 추가**: 단순 CRUD, 외부 API 연동, 유연성이 필요한 부분
- ✅ **프로시저 + Java 조합**: 프로시저로 데이터 처리, Java로 비즈니스 로직 확장

### 2.2 레이어 구조

```
┌─────────────────────────────────────────┐
│   Java Service Layer (비즈니스 로직)      │
│   - 단순 CRUD                            │
│   - 외부 API 연동                        │
│   - 유효성 검증                          │
└─────────────────────────────────────────┘
              ↓ 호출
┌─────────────────────────────────────────┐
│   PL/SQL Stored Procedures (핵심 로직)   │
│   - 복잡한 계산                          │
│   - 대량 데이터 처리                     │
│   - 트랜잭션 일관성                      │
│   - 데이터 무결성                        │
└─────────────────────────────────────────┘
              ↓ 처리
┌─────────────────────────────────────────┐
│   Database Tables                       │
└─────────────────────────────────────────┘
```

## 3. 고도화 계획

### Phase 1: 회계 관리 고도화 (프로시저 확장)

#### 3.1 분개 시스템 프로시저

**기존:** `AccountingEntry` 엔티티만 존재 (단일 분개)
**추가:** 완전한 분개 시스템 (차변/대변 검증, 분개 상세)

```sql
-- 분개 생성 프로시저
CREATE PROCEDURE CreateJournalEntry(
    IN p_entry_number VARCHAR(50),
    IN p_entry_date DATE,
    IN p_description TEXT,
    IN p_created_by BIGINT,
    OUT p_entry_id BIGINT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)

-- 분개 상세 추가 프로시저
CREATE PROCEDURE AddJournalEntryLine(
    IN p_entry_id BIGINT,
    IN p_account_id BIGINT,
    IN p_debit_amount DECIMAL(15,2),
    IN p_credit_amount DECIMAL(15,2),
    IN p_description TEXT,
    IN p_line_number INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)

-- 분개 차변/대변 검증 프로시저
CREATE PROCEDURE ValidateJournalEntry(
    IN p_entry_id BIGINT,
    OUT p_is_valid BOOLEAN,
    OUT p_debit_total DECIMAL(15,2),
    OUT p_credit_total DECIMAL(15,2),
    OUT p_difference DECIMAL(15,2),
    OUT p_message TEXT
)

-- 분개 승인 및 전기 프로시저
CREATE PROCEDURE ApproveAndPostJournalEntry(
    IN p_entry_id BIGINT,
    IN p_approved_by BIGINT,
    IN p_approval_comment TEXT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
```

#### 3.2 원장 생성 프로시저

```sql
-- 원장 자동 생성 프로시저 (분개 전기 시)
CREATE PROCEDURE GenerateLedgerFromJournalEntry(
    IN p_entry_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)

-- 계정별 원장 조회 프로시저
CREATE PROCEDURE GetAccountLedger(
    IN p_account_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    OUT p_opening_balance DECIMAL(15,2),
    OUT p_total_debit DECIMAL(15,2),
    OUT p_total_credit DECIMAL(15,2),
    OUT p_closing_balance DECIMAL(15,2),
    OUT p_ledger_entries JSON
)
```

#### 3.3 재무제표 생성 프로시저

```sql
-- 손익계산서 생성 프로시저
CREATE PROCEDURE GenerateIncomeStatement(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_code VARCHAR(20),
    OUT p_total_revenue DECIMAL(15,2),
    OUT p_total_expenses DECIMAL(15,2),
    OUT p_net_income DECIMAL(15,2),
    OUT p_statement_data JSON
)

-- 재무상태표 생성 프로시저
CREATE PROCEDURE GenerateBalanceSheet(
    IN p_report_date DATE,
    IN p_branch_code VARCHAR(20),
    OUT p_total_assets DECIMAL(15,2),
    OUT p_total_liabilities DECIMAL(15,2),
    OUT p_total_equity DECIMAL(15,2),
    OUT p_sheet_data JSON
)

-- 현금흐름표 생성 프로시저
CREATE PROCEDURE GenerateCashFlowStatement(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_code VARCHAR(20),
    OUT p_operating_cash_flow DECIMAL(15,2),
    OUT p_investing_cash_flow DECIMAL(15,2),
    OUT p_financing_cash_flow DECIMAL(15,2),
    OUT p_net_cash_flow DECIMAL(15,2),
    OUT p_statement_data JSON
)
```

### Phase 2: 정산 관리 고도화 (프로시저 확장)

#### 3.4 정산 자동 계산 프로시저

```sql
-- 업종별 정산 계산 프로시저
CREATE PROCEDURE CalculateSettlement(
    IN p_tenant_id VARCHAR(36),
    IN p_branch_id BIGINT,
    IN p_settlement_period VARCHAR(10), -- YYYYMM
    IN p_business_type VARCHAR(20), -- ACADEMY, CONSULTATION, etc.
    OUT p_settlement_id BIGINT,
    OUT p_total_revenue DECIMAL(15,2),
    OUT p_commission_amount DECIMAL(15,2),
    OUT p_royalty_amount DECIMAL(15,2),
    OUT p_net_settlement DECIMAL(15,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)

-- 학원 정산 계산 프로시저
CREATE PROCEDURE CalculateAcademySettlement(
    IN p_tenant_id VARCHAR(36),
    IN p_branch_id BIGINT,
    IN p_settlement_period VARCHAR(10),
    OUT p_settlement_id BIGINT,
    OUT p_tuition_revenue DECIMAL(15,2),
    OUT p_teacher_settlement DECIMAL(15,2),
    OUT p_hq_royalty DECIMAL(15,2),
    OUT p_net_settlement DECIMAL(15,2),
    OUT p_success BOOLEAN
)

-- 상담소 정산 계산 프로시저
CREATE PROCEDURE CalculateConsultationSettlement(
    IN p_tenant_id VARCHAR(36),
    IN p_branch_id BIGINT,
    IN p_settlement_period VARCHAR(10),
    OUT p_settlement_id BIGINT,
    OUT p_consultation_revenue DECIMAL(15,2),
    OUT p_consultant_settlement DECIMAL(15,2),
    OUT p_hq_royalty DECIMAL(15,2),
    OUT p_net_settlement DECIMAL(15,2),
    OUT p_success BOOLEAN
)
```

### Phase 3: 세무 관리 (프로시저 + Java)

#### 3.5 부가세 계산 프로시저

```sql
-- 부가세 자동 계산 프로시저
CREATE PROCEDURE CalculateVatForPeriod(
    IN p_period VARCHAR(10), -- YYYYMM
    IN p_branch_code VARCHAR(20),
    OUT p_supply_amount DECIMAL(15,2),
    OUT p_vat_amount DECIMAL(15,2),
    OUT p_purchase_amount DECIMAL(15,2),
    OUT p_input_vat_amount DECIMAL(15,2),
    OUT p_payable_vat_amount DECIMAL(15,2),
    OUT p_success BOOLEAN
)

-- 부가세 신고서 생성 프로시저
CREATE PROCEDURE GenerateVatReturn(
    IN p_period VARCHAR(10),
    IN p_branch_code VARCHAR(20),
    OUT p_return_id BIGINT,
    OUT p_return_data JSON,
    OUT p_success BOOLEAN
)
```

**Java 서비스:** 전자세금계산서 발행 (외부 API 연동)

### Phase 4: 인사 관리 (프로시저 + Java)

#### 3.6 근태 관리 프로시저

```sql
-- 근태 기록 생성 프로시저
CREATE PROCEDURE RecordAttendance(
    IN p_employee_id BIGINT,
    IN p_attendance_date DATE,
    IN p_check_in_time TIME,
    IN p_check_out_time TIME,
    OUT p_work_hours DECIMAL(5,2),
    OUT p_overtime_hours DECIMAL(5,2),
    OUT p_success BOOLEAN
)

-- 근태 통계 조회 프로시저
CREATE PROCEDURE GetAttendanceStatistics(
    IN p_employee_id BIGINT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_work_hours DECIMAL(8,2),
    OUT p_total_overtime_hours DECIMAL(8,2),
    OUT p_attendance_rate DECIMAL(5,2),
    OUT p_statistics_data JSON
)
```

**Java 서비스:** 직원 정보 관리, 휴가 관리 (단순 CRUD)

#### 3.7 급여 계산 프로시저 (기존 확장)

**기존:** `ProcessIntegratedSalaryCalculation` 존재
**확장:** 
- 인사 정보 연동
- 근태 정보 반영
- 휴가 차감 로직 추가

## 4. Java 서비스 레이어 개선

### 4.1 프로시저 호출 표준화

**BaseProcedureService 생성:**

```java
@Service
@RequiredArgsConstructor
public abstract class BaseProcedureService {
    
    protected final JdbcTemplate jdbcTemplate;
    protected final DataSource dataSource;
    
    /**
     * 프로시저 호출 공통 메서드
     */
    protected Map<String, Object> executeProcedure(
            String procedureName,
            Map<String, Object> inputParams,
            List<SqlParameter> outputParams) {
        
        SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
            .withProcedureName(procedureName);
        
        if (outputParams != null && !outputParams.isEmpty()) {
            jdbcCall.declareParameters(outputParams.toArray(new SqlParameter[0]));
        }
        
        return jdbcCall.execute(inputParams);
    }
}
```

### 4.2 ERP 서비스 구조

```
com.coresolution.erp.service
├── BaseProcedureService (추상 클래스)
├── accounting/
│   ├── JournalEntryService (프로시저 호출)
│   ├── LedgerService (프로시저 호출)
│   └── FinancialStatementService (프로시저 호출)
├── settlement/
│   ├── SettlementService (프로시저 호출)
│   └── SettlementRuleService (Java CRUD)
├── tax/
│   ├── VatService (프로시저 호출)
│   └── TaxInvoiceService (Java + 외부 API)
└── hr/
    ├── AttendanceService (프로시저 호출)
    ├── EmployeeService (Java CRUD)
    └── PayrollService (프로시저 호출 - 기존 확장)
```

## 5. 구현 우선순위

### P0 (필수 - 즉시 구현)
1. **분개 시스템 프로시저**
   - `CreateJournalEntry`
   - `AddJournalEntryLine`
   - `ValidateJournalEntry`
   - `ApproveAndPostJournalEntry`
2. **원장 생성 프로시저**
   - `GenerateLedgerFromJournalEntry`
   - `GetAccountLedger`
3. **재무제표 생성 프로시저**
   - `GenerateIncomeStatement`
   - `GenerateBalanceSheet`
4. **정산 계산 프로시저**
   - `CalculateSettlement`
   - `CalculateAcademySettlement`
   - `CalculateConsultationSettlement`

### P1 (중요 - 빠른 확장)
1. **부가세 계산 프로시저**
   - `CalculateVatForPeriod`
   - `GenerateVatReturn`
2. **근태 관리 프로시저**
   - `RecordAttendance`
   - `GetAttendanceStatistics`
3. **Java 서비스 레이어**
   - `BaseProcedureService`
   - 각 도메인별 서비스 구현

### P2 (선택 - 장기)
1. 전자세금계산서 발행 (Java + 외부 API)
2. 원천징수 및 연말정산
3. 외부 시스템 연동

## 6. 프로시저 작성 가이드라인

### 6.1 프로시저 네이밍 규칙

- **생성/처리:** `Create*`, `Process*`, `Calculate*`
- **조회:** `Get*`, `Find*`
- **검증:** `Validate*`, `Check*`
- **승인/처리:** `Approve*`, `Post*`

### 6.2 프로시저 파라미터 규칙

- **입력 파라미터:** `p_*` (예: `p_tenant_id`, `p_amount`)
- **출력 파라미터:** `p_*` + OUT (예: `OUT p_success`, `OUT p_message`)
- **반환값:** 항상 `p_success`, `p_message` 포함

### 6.3 에러 처리

```sql
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    GET DIAGNOSTICS CONDITION 1
        p_message = MESSAGE_TEXT;
    SET p_success = FALSE;
    ROLLBACK;
END;
```

### 6.4 트랜잭션 관리

- 복잡한 프로시저는 `START TRANSACTION` / `COMMIT` / `ROLLBACK` 사용
- 단순 조회는 트랜잭션 불필요

## 7. 마이그레이션 전략

### Phase 1: 프로시저 확장 (1주)
1. 분개 시스템 프로시저 작성
2. 원장 생성 프로시저 작성
3. 재무제표 생성 프로시저 작성

### Phase 2: Java 서비스 구현 (1주)
1. `BaseProcedureService` 생성
2. 각 도메인별 서비스 구현
3. 프로시저 호출 래퍼 메서드 작성

### Phase 3: 정산 프로시저 확장 (1주)
1. 정산 계산 프로시저 작성
2. 업종별 정산 프로시저 작성
3. 정산 승인 프로시저 작성

### Phase 4: 통합 테스트 (1주)
1. 프로시저 단위 테스트
2. Java 서비스 통합 테스트
3. 전체 플로우 테스트

## 8. 장점

1. **성능**: 데이터베이스 레벨에서 처리하여 네트워크 왕복 최소화
2. **일관성**: 트랜잭션 일관성 보장
3. **보안**: 데이터베이스 레벨에서 접근 제어 가능
4. **유지보수**: 비즈니스 로직이 프로시저에 집중되어 관리 용이
5. **확장성**: Java 서비스 레이어에서 유연한 확장 가능

