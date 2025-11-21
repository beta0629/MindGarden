# ERP 고도화 계획

## 1. 개요

Core Solution 플랫폼의 ERP 시스템을 고도화하여 재무, 회계, 인사, 정산 기능을 강화하고, 업종별 레이어와의 연동을 개선합니다.

## 2. 현재 ERP 상태 분석

### 2.1 현재 구현된 기능

**재무 관리 (Financial Management)**
- ✅ 기본 거래 기록 (수입/지출)
- ✅ 거래 목록 조회
- ✅ 거래 상세 정보
- ✅ 거래 필터링 (날짜, 카테고리, 거래 유형)
- ✅ 대시보드 통계 (수입/지출 합계)

**구매 관리 (Purchase Management)**
- ✅ 구매 요청 생성
- ✅ 구매 주문 관리
- ✅ 승인 프로세스

**예산 관리 (Budget Management)**
- ✅ 예산 계획 설정
- ✅ 예산 현황 조회

**재고 관리 (Inventory Management)**
- ✅ 재고 현황 조회
- ✅ 재고 입출고 관리

### 2.2 부족한 기능 (고도화 필요)

**회계 관리 (Accounting)**
- ❌ 분개 (Journal Entry) 관리
- ❌ 원장 (Ledger) 관리
- ❌ 재무제표 생성 (손익계산서, 재무상태표)
- ❌ 계정과목 관리
- ❌ 결산 처리

**세무 관리 (Tax Management)**
- ❌ 부가세 계산 및 신고
- ❌ 전자세금계산서 발행
- ❌ 원천징수 관리
- ❌ 연말정산 처리

**인사 관리 (HR Management)**
- ❌ 직원 정보 관리
- ❌ 급여 계산 및 지급
- ❌ 근태 관리
- ❌ 휴가 관리
- ❌ 평가 관리

**정산 관리 (Settlement Management)**
- ❌ 업종별 정산 자동화
- ❌ 수수료 계산
- ❌ 정산 리포트 생성
- ❌ 정산 승인 프로세스

**리포트 및 분석**
- ❌ 재무 리포트 생성
- ❌ 예산 대비 실적 분석
- ❌ 현금흐름 분석
- ❌ 손익 분석

**외부 시스템 연동**
- ❌ 회계 시스템 연동 (더존, 영림원 등)
- ❌ 세무 시스템 연동 (홈택스 등)
- ❌ 은행 연동 (계좌 조회, 이체)

## 3. ERP 고도화 로드맵

### Phase 1: 회계 관리 고도화 (4주)

#### Week 1-2: 계정과목 및 분개 시스템
- [ ] 계정과목 마스터 관리
  - 계정과목 코드 체계 설계
  - 계정과목 CRUD API
  - 계정과목 계층 구조 관리
- [ ] 분개 (Journal Entry) 시스템
  - 분개 생성/수정/삭제
  - 차변/대변 자동 검증
  - 분개 승인 프로세스
  - 분개 이력 관리

#### Week 3-4: 원장 및 재무제표
- [ ] 원장 (Ledger) 시스템
  - 계정별 원장 조회
  - 기간별 원장 조회
  - 잔액 계산
- [ ] 재무제표 생성
  - 손익계산서 (Income Statement)
  - 재무상태표 (Balance Sheet)
  - 현금흐름표 (Cash Flow Statement)
- [ ] 결산 처리
  - 월별 결산
  - 연도별 결산
  - 이월 처리

### Phase 2: 세무 관리 시스템 (3주)

#### Week 1: 부가세 관리
- [ ] 부가세 계산 로직
  - 공급가액/부가세 자동 계산
  - 세율 관리 (10%, 0% 등)
- [ ] 부가세 신고서 생성
  - 매출세액 계산서
  - 매입세액 계산서
  - 부가세 신고서 양식 생성

#### Week 2: 전자세금계산서
- [ ] 전자세금계산서 발행
  - 국세청 전자세금계산서 연동
  - 세금계산서 발행/수정/취소
- [ ] 전자세금계산서 수신
  - 매입 세금계산서 수신
  - 세금계산서 검증

#### Week 3: 원천징수 및 연말정산
- [ ] 원천징수 관리
  - 원천징수 계산
  - 원천징수 영수증 발급
- [ ] 연말정산 처리
  - 소득공제 계산
  - 연말정산 신고서 생성

### Phase 3: 인사 관리 시스템 (4주)

#### Week 1-2: 직원 관리
- [ ] 직원 정보 관리
  - 직원 등록/수정/삭제
  - 직원 프로필 관리
  - 조직도 관리
- [ ] 근태 관리
  - 출퇴근 기록
  - 근무 시간 계산
  - 초과근무 관리
- [ ] 휴가 관리
  - 휴가 신청/승인
  - 휴가 잔여일수 관리
  - 휴가 이력 관리

#### Week 3-4: 급여 관리
- [ ] 급여 계산
  - 기본급 계산
  - 수당 계산 (야근수당, 주말수당 등)
  - 공제 계산 (4대보험, 소득세 등)
  - 실지급액 계산
- [ ] 급여 지급
  - 급여 명세서 생성
  - 급여 지급 이력
  - 급여 조회 권한 관리
- [ ] 평가 관리
  - 평가 항목 설정
  - 평가 실시
  - 평가 결과 관리

### Phase 4: 정산 관리 고도화 (3주)

#### Week 1: 업종별 정산 자동화
- [ ] 학원 정산
  - 수강료 정산
  - 강사 정산
  - 본사 로열티 정산
- [ ] 상담소 정산
  - 상담료 정산
  - 상담사 정산
- [ ] 카페/요식업 정산
  - 매출 정산
  - 수수료 정산

#### Week 2: 정산 계산 엔진
- [ ] 정산 규칙 엔진
  - 정산 비율 설정
  - 정산 주기 설정
  - 정산 조건 설정
- [ ] 정산 자동 계산
  - 배치 작업으로 정산 계산
  - 정산 결과 검증

#### Week 3: 정산 리포트 및 승인
- [ ] 정산 리포트 생성
  - 정산 내역 리포트
  - 정산 요약 리포트
- [ ] 정산 승인 프로세스
  - 정산 승인 워크플로우
  - 정산 승인 이력

### Phase 5: 리포트 및 분석 (2주)

#### Week 1: 재무 리포트
- [ ] 재무 리포트 생성
  - 월별 재무 리포트
  - 연도별 재무 리포트
  - 비교 분석 리포트
- [ ] 예산 대비 실적 분석
  - 예산 대비 실적 차이 분석
  - 예산 달성률 계산

#### Week 2: 분석 대시보드
- [ ] 현금흐름 분석
  - 현금흐름표 생성
  - 현금흐름 트렌드 분석
- [ ] 손익 분석
  - 손익 구조 분석
  - 손익 트렌드 분석
  - 손익 예측

### Phase 6: 외부 시스템 연동 (3주)

#### Week 1: 회계 시스템 연동
- [ ] 더존 연동
  - 더존 API 연동
  - 데이터 동기화
- [ ] 영림원 연동
  - 영림원 API 연동
  - 데이터 동기화

#### Week 2: 세무 시스템 연동
- [ ] 홈택스 연동
  - 홈택스 API 연동
  - 세무 신고 자동화
- [ ] 전자세금계산서 연동
  - 국세청 전자세금계산서 API

#### Week 3: 은행 연동
- [ ] 계좌 조회
  - 은행 API 연동
  - 계좌 잔액 조회
  - 거래 내역 조회
- [ ] 자동 이체
  - 급여 자동 이체
  - 정산 자동 이체

## 4. ERP 데이터베이스 스키마 설계

### 4.1 회계 관리 테이블

```sql
-- 계정과목 마스터
CREATE TABLE erp_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    parent_account_id BIGINT,
    level INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 분개
CREATE TABLE erp_journal_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    total_debit DECIMAL(15, 2) NOT NULL,
    total_credit DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, APPROVED, POSTED
    approved_by BIGINT,
    approved_at TIMESTAMP,
    posted_at TIMESTAMP,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 분개 상세
CREATE TABLE erp_journal_entry_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    description TEXT,
    line_number INT NOT NULL,
    FOREIGN KEY (journal_entry_id) REFERENCES erp_journal_entries(id),
    FOREIGN KEY (account_id) REFERENCES erp_accounts(id)
);

-- 원장
CREATE TABLE erp_ledgers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    total_debit DECIMAL(15, 2) DEFAULT 0,
    total_credit DECIMAL(15, 2) DEFAULT 0,
    closing_balance DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES erp_accounts(id)
);
```

### 4.2 세무 관리 테이블

```sql
-- 부가세 신고
CREATE TABLE erp_vat_returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_period VARCHAR(10) NOT NULL, -- YYYYMM
    supply_amount DECIMAL(15, 2) NOT NULL,
    vat_amount DECIMAL(15, 2) NOT NULL,
    purchase_amount DECIMAL(15, 2) NOT NULL,
    input_vat_amount DECIMAL(15, 2) NOT NULL,
    payable_vat_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 전자세금계산서
CREATE TABLE erp_electronic_tax_invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    supplier_registration_number VARCHAR(20),
    buyer_name VARCHAR(100) NOT NULL,
    buyer_registration_number VARCHAR(20),
    supply_amount DECIMAL(15, 2) NOT NULL,
    vat_amount DECIMAL(15, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    invoice_type VARCHAR(20) NOT NULL, -- SUPPLY, PURCHASE
    status VARCHAR(20) DEFAULT 'DRAFT',
    nts_submission_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 인사 관리 테이블

```sql
-- 직원 정보
CREATE TABLE erp_employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL, -- auth_users.id 참조
    department_id BIGINT,
    position VARCHAR(50),
    hire_date DATE NOT NULL,
    employment_type VARCHAR(20), -- FULL_TIME, PART_TIME, CONTRACT
    base_salary DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 근태 기록
CREATE TABLE erp_attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    work_hours DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2),
    status VARCHAR(20), -- PRESENT, ABSENT, LATE, EARLY_LEAVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES erp_employees(id)
);

-- 급여
CREATE TABLE erp_payrolls (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    payroll_period VARCHAR(10) NOT NULL, -- YYYYMM
    base_salary DECIMAL(15, 2) NOT NULL,
    allowances DECIMAL(15, 2) DEFAULT 0,
    deductions DECIMAL(15, 2) DEFAULT 0,
    net_pay DECIMAL(15, 2) NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES erp_employees(id)
);
```

### 4.4 정산 관리 테이블

```sql
-- 정산 규칙
CREATE TABLE erp_settlement_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    business_type VARCHAR(20), -- ACADEMY, CONSULTATION, CAFE, FOOD_SERVICE
    settlement_type VARCHAR(20), -- REVENUE, COMMISSION, ROYALTY
    calculation_method VARCHAR(20), -- PERCENTAGE, FIXED, TIERED
    calculation_params JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 정산 결과
CREATE TABLE erp_settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    settlement_number VARCHAR(50) UNIQUE NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36),
    settlement_period VARCHAR(10) NOT NULL, -- YYYYMM
    total_revenue DECIMAL(15, 2) NOT NULL,
    commission_amount DECIMAL(15, 2) DEFAULT 0,
    royalty_amount DECIMAL(15, 2) DEFAULT 0,
    net_settlement_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by BIGINT,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. ERP API 설계

### 5.1 회계 관리 API

```
POST   /api/erp/accounts                    # 계정과목 생성
GET    /api/erp/accounts                    # 계정과목 목록 조회
GET    /api/erp/accounts/{id}               # 계정과목 상세 조회
PUT    /api/erp/accounts/{id}               # 계정과목 수정
DELETE /api/erp/accounts/{id}               # 계정과목 삭제

POST   /api/erp/journal-entries             # 분개 생성
GET    /api/erp/journal-entries             # 분개 목록 조회
GET    /api/erp/journal-entries/{id}        # 분개 상세 조회
PUT    /api/erp/journal-entries/{id}        # 분개 수정
POST   /api/erp/journal-entries/{id}/approve # 분개 승인
POST   /api/erp/journal-entries/{id}/post    # 분개 전기

GET    /api/erp/ledgers                      # 원장 조회
GET    /api/erp/ledgers/{accountId}         # 계정별 원장 조회

GET    /api/erp/financial-statements        # 재무제표 조회
POST   /api/erp/period-close                # 결산 처리
```

### 5.2 세무 관리 API

```
POST   /api/erp/vat-returns                 # 부가세 신고 생성
GET    /api/erp/vat-returns                 # 부가세 신고 목록
GET    /api/erp/vat-returns/{id}            # 부가세 신고 상세
POST   /api/erp/vat-returns/{id}/submit     # 부가세 신고 제출

POST   /api/erp/tax-invoices                # 전자세금계산서 발행
GET    /api/erp/tax-invoices                # 전자세금계산서 목록
GET    /api/erp/tax-invoices/{id}           # 전자세금계산서 상세
POST   /api/erp/tax-invoices/{id}/cancel    # 전자세금계산서 취소

GET    /api/erp/withholding-tax             # 원천징수 조회
POST   /api/erp/year-end-settlement         # 연말정산 처리
```

### 5.3 인사 관리 API

```
POST   /api/erp/employees                   # 직원 등록
GET    /api/erp/employees                   # 직원 목록 조회
GET    /api/erp/employees/{id}              # 직원 상세 조회
PUT    /api/erp/employees/{id}              # 직원 정보 수정

POST   /api/erp/attendance                  # 근태 기록
GET    /api/erp/attendance                  # 근태 목록 조회
GET    /api/erp/attendance/{employeeId}     # 직원별 근태 조회

POST   /api/erp/payrolls                   # 급여 계산
GET    /api/erp/payrolls                   # 급여 목록 조회
GET    /api/erp/payrolls/{id}              # 급여 상세 조회
POST   /api/erp/payrolls/{id}/pay          # 급여 지급
```

### 5.4 정산 관리 API

```
POST   /api/erp/settlement-rules            # 정산 규칙 생성
GET    /api/erp/settlement-rules            # 정산 규칙 목록
PUT    /api/erp/settlement-rules/{id}       # 정산 규칙 수정

POST   /api/erp/settlements/calculate       # 정산 계산
GET    /api/erp/settlements                 # 정산 목록 조회
GET    /api/erp/settlements/{id}            # 정산 상세 조회
POST   /api/erp/settlements/{id}/approve    # 정산 승인
POST   /api/erp/settlements/{id}/pay        # 정산 지급

GET    /api/erp/settlements/reports         # 정산 리포트 조회
```

## 6. ERP와 업종별 레이어 연동

### 6.1 이벤트 기반 연동 (권장)

```java
// 학원 수강료 결제 이벤트
@EventListener
public void onAcademyTuitionPaid(AcademyTuitionPaidEvent event) {
    // ERP에 매출 기록
    erpFinancialService.recordRevenue(
        event.getTenantId(),
        event.getBranchId(),
        event.getAmount(),
        "ACADEMY_TUITION",
        event.getPaymentId()
    );
    
    // 분개 자동 생성
    erpAccountingService.createJournalEntry(
        event.getTenantId(),
        "ACADEMY_TUITION_REVENUE",
        event.getAmount()
    );
}

// 상담소 상담료 결제 이벤트
@EventListener
public void onConsultationFeePaid(ConsultationFeePaidEvent event) {
    erpFinancialService.recordRevenue(
        event.getTenantId(),
        event.getBranchId(),
        event.getAmount(),
        "CONSULTATION_FEE",
        event.getPaymentId()
    );
}
```

### 6.2 배치 작업

```java
// 매일 자정 정산 계산 배치
@Scheduled(cron = "0 0 0 * * ?")
public void calculateDailySettlements() {
    // 전날 매출 기준으로 정산 계산
    erpSettlementService.calculateDailySettlements();
}

// 매월 1일 급여 계산 배치
@Scheduled(cron = "0 0 0 1 * ?")
public void calculateMonthlyPayrolls() {
    erpPayrollService.calculateMonthlyPayrolls();
}

// 매월 말일 결산 배치
@Scheduled(cron = "0 0 0 L * ?")
public void closeMonthlyPeriod() {
    erpAccountingService.closeMonthlyPeriod();
}
```

## 7. 구현 우선순위

### P0 (필수 - MVP)
1. 계정과목 관리
2. 분개 시스템
3. 원장 조회
4. 기본 재무제표 (손익계산서, 재무상태표)
5. 부가세 계산 및 신고
6. 급여 계산 및 지급
7. 정산 자동 계산

### P1 (중요 - 빠른 확장)
1. 전자세금계산서 발행
2. 원천징수 관리
3. 근태 관리
4. 정산 리포트
5. 예산 대비 실적 분석

### P2 (선택 - 장기)
1. 연말정산
2. 외부 회계 시스템 연동
3. 은행 연동
4. 고급 분석 대시보드

## 8. 기술 스택

- **Backend**: Spring Boot, JPA/Hibernate
- **Database**: MySQL (회계 데이터는 별도 스키마 권장)
- **외부 API**: 
  - 국세청 전자세금계산서 API
  - 더존/영림원 API
  - 은행 API (오픈뱅킹)
- **배치 처리**: Spring Batch
- **이벤트 처리**: Spring Events

## 9. 보안 및 규정 준수

- **데이터 암호화**: 회계 데이터는 AES-256 암호화
- **접근 제어**: ERP 전용 권한 시스템
- **감사 로그**: 모든 회계 거래 기록
- **백업**: 일일 자동 백업
- **규정 준수**: 
  - 전자세금계산서법 준수
  - 개인정보보호법 준수
  - 회계 기준 준수

