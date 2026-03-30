# ERP 현재 상태 분석 및 고도화 계획

## 1. 현재 ERP 시스템 상태

### 1.1 구현된 기능 ✅

#### 재무 관리 (Financial Management)
- ✅ **FinancialTransaction** 엔티티
  - 수입/지출 거래 기록
  - 거래 유형 (INCOME, EXPENSE, RECEIVABLES)
  - 거래 상태 (PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED)
  - 세금 포함/제외 금액 관리
  - 승인 프로세스
  - 관련 엔티티 연결 (급여, 구매, 결제 등)
- ✅ 재무 거래 CRUD API
- ✅ 재무 통계 및 리포트
- ✅ 지점별 재무 대시보드

#### 구매 관리 (Purchase Management)
- ✅ **Item** 엔티티 (비품/재고 관리)
- ✅ **PurchaseRequest** 엔티티 (구매 요청)
- ✅ **PurchaseOrder** 엔티티 (구매 주문)
- ✅ 구매 요청 승인 프로세스 (관리자/수퍼 관리자)
- ✅ 구매 주문 상태 관리

#### 예산 관리 (Budget Management)
- ✅ **Budget** 엔티티
- ✅ 예산 생성/수정/삭제
- ✅ 예산 사용/환불 처리
- ✅ 예산 통계

#### 급여 관리 (Payroll Management)
- ✅ **SalaryCalculation** 엔티티 (급여 계산)
- ✅ **SalaryProfile** 엔티티 (급여 프로필)
- ✅ **ConsultantSalaryProfile** 엔티티 (상담사 급여 프로필)
- ✅ **SalaryTaxCalculation** 엔티티 (세금 계산)
- ✅ PL/SQL 기반 급여 계산 프로시저
- ✅ ERP 동기화 로그 (ErpSyncLog)

#### 회계 관리 (Accounting)
- ✅ **AccountingEntry** 엔티티 (회계 엔트리)
- ✅ **Account** 엔티티 (계정)
- ⚠️ 기본적인 회계 엔트리만 존재 (완전한 분개 시스템 아님)

### 1.2 부족한 기능 ❌

#### 회계 관리 고도화
- ❌ 완전한 분개 (Journal Entry) 시스템
  - 차변/대변 자동 검증
  - 분개 승인 프로세스
  - 분개 전기 (Posting)
- ❌ 원장 (Ledger) 시스템
  - 계정별 원장 조회
  - 기간별 원장 조회
  - 잔액 계산
- ❌ 재무제표 생성
  - 손익계산서 (Income Statement)
  - 재무상태표 (Balance Sheet)
  - 현금흐름표 (Cash Flow Statement)
- ❌ 결산 처리
  - 월별 결산
  - 연도별 결산
  - 이월 처리

#### 세무 관리
- ❌ 부가세 계산 및 신고
  - 부가세 자동 계산
  - 부가세 신고서 생성
- ❌ 전자세금계산서
  - 전자세금계산서 발행
  - 국세청 연동
- ❌ 원천징수 관리
- ❌ 연말정산 처리

#### 인사 관리
- ❌ 직원 정보 관리 (ERP 전용)
  - 현재는 User 엔티티 사용 (인증/권한 중심)
  - ERP 전용 직원 정보 필요
- ❌ 근태 관리
  - 출퇴근 기록
  - 근무 시간 계산
  - 초과근무 관리
- ❌ 휴가 관리
  - 휴가 신청/승인
  - 휴가 잔여일수 관리

#### 정산 관리 고도화
- ❌ 업종별 정산 자동화
  - 학원 정산 (수강료, 강사, 본사)
  - 상담소 정산 (상담료, 상담사)
  - 카페/요식업 정산 (매출, 수수료)
- ❌ 정산 규칙 엔진
  - 정산 비율 설정
  - 정산 주기 설정
- ❌ 정산 리포트 생성

#### 외부 시스템 연동
- ❌ 회계 시스템 연동 (더존, 영림원)
- ❌ 세무 시스템 연동 (홈택스)
- ❌ 은행 연동 (계좌 조회, 자동 이체)

## 2. 고도화 우선순위

### P0 (필수 - 즉시 구현)
1. **분개 시스템 완성**
   - AccountingEntry를 완전한 분개 시스템으로 확장
   - 차변/대변 검증 로직
   - 분개 승인 프로세스
2. **원장 시스템**
   - 계정별 원장 조회
   - 기간별 잔액 계산
3. **재무제표 생성**
   - 손익계산서
   - 재무상태표
4. **정산 자동화**
   - 업종별 정산 규칙 설정
   - 정산 자동 계산 배치

### P1 (중요 - 빠른 확장)
1. **부가세 관리**
   - 부가세 자동 계산
   - 부가세 신고서 생성
2. **인사 관리 기본**
   - 직원 정보 관리
   - 근태 관리
3. **정산 리포트**
   - 정산 내역 리포트
   - 정산 요약 리포트

### P2 (선택 - 장기)
1. **전자세금계산서**
2. **원천징수 및 연말정산**
3. **외부 시스템 연동**

## 3. 구현 계획

### Phase 1: 회계 관리 고도화 (2주)

#### Week 1: 분개 시스템 완성
- [ ] AccountingEntry 엔티티 확장
  - 분개 번호 (Entry Number)
  - 분개 날짜 (Entry Date)
  - 차변/대변 합계 검증
  - 분개 상태 (DRAFT, APPROVED, POSTED)
- [ ] 분개 상세 (Journal Entry Lines) 테이블 생성
- [ ] 분개 CRUD API
- [ ] 분개 승인 프로세스
- [ ] 분개 전기 (Posting) 기능

#### Week 2: 원장 및 재무제표
- [ ] 원장 (Ledger) 테이블 생성
- [ ] 원장 자동 생성 로직 (분개 전기 시)
- [ ] 계정별 원장 조회 API
- [ ] 재무제표 생성 로직
  - 손익계산서
  - 재무상태표
- [ ] 재무제표 조회 API

### Phase 2: 정산 관리 고도화 (1주)

#### Week 1: 정산 자동화
- [ ] 정산 규칙 (SettlementRule) 테이블 생성
- [ ] 정산 결과 (Settlement) 테이블 생성
- [ ] 정산 규칙 엔진 구현
- [ ] 정산 자동 계산 배치 작업
- [ ] 정산 승인 프로세스
- [ ] 정산 리포트 생성

### Phase 3: 세무 관리 기본 (1주)

#### Week 1: 부가세 관리
- [ ] 부가세 신고 (VatReturn) 테이블 생성
- [ ] 부가세 자동 계산 로직
- [ ] 부가세 신고서 생성
- [ ] 부가세 신고서 조회 API

### Phase 4: 인사 관리 기본 (1주)

#### Week 1: 직원 및 근태 관리
- [ ] 직원 정보 (Employee) 테이블 생성
- [ ] 근태 기록 (AttendanceRecord) 테이블 생성
- [ ] 직원 CRUD API
- [ ] 근태 기록 API
- [ ] 근태 통계 API

## 4. 데이터베이스 스키마 설계

### 4.1 분개 시스템 테이블

```sql
-- 분개 상세 (Journal Entry Lines)
CREATE TABLE IF NOT EXISTS erp_journal_entry_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id BIGINT NOT NULL COMMENT '분개 ID (AccountingEntry.id)',
    account_id BIGINT NOT NULL COMMENT '계정 ID (Account.id)',
    debit_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '차변 금액',
    credit_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '대변 금액',
    description TEXT COMMENT '설명',
    line_number INT NOT NULL COMMENT '라인 번호',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (journal_entry_id) REFERENCES accounting_entries(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    
    INDEX idx_journal_entry_id (journal_entry_id),
    INDEX idx_account_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='분개 상세 테이블';

-- 원장 (Ledger)
CREATE TABLE IF NOT EXISTS erp_ledgers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL COMMENT '계정 ID',
    period_start DATE NOT NULL COMMENT '기간 시작일',
    period_end DATE NOT NULL COMMENT '기간 종료일',
    opening_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '기초 잔액',
    total_debit DECIMAL(15, 2) DEFAULT 0 COMMENT '총 차변',
    total_credit DECIMAL(15, 2) DEFAULT 0 COMMENT '총 대변',
    closing_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '기말 잔액',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    
    UNIQUE KEY uk_account_period (account_id, period_start, period_end),
    INDEX idx_account_id (account_id),
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='원장 테이블';
```

### 4.2 정산 관리 테이블

```sql
-- 정산 규칙
CREATE TABLE IF NOT EXISTS erp_settlement_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL COMMENT '규칙명',
    business_type VARCHAR(20) COMMENT '업종: ACADEMY, CONSULTATION, CAFE, FOOD_SERVICE',
    settlement_type VARCHAR(20) NOT NULL COMMENT '정산 유형: REVENUE, COMMISSION, ROYALTY',
    calculation_method VARCHAR(20) NOT NULL COMMENT '계산 방법: PERCENTAGE, FIXED, TIERED',
    calculation_params JSON COMMENT '계산 파라미터 (JSON)',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_business_type (business_type),
    INDEX idx_settlement_type (settlement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='정산 규칙 테이블';

-- 정산 결과
CREATE TABLE IF NOT EXISTS erp_settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    settlement_number VARCHAR(50) UNIQUE NOT NULL COMMENT '정산 번호',
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    branch_id BIGINT COMMENT '지점 ID',
    settlement_period VARCHAR(10) NOT NULL COMMENT '정산 기간 (YYYYMM)',
    total_revenue DECIMAL(15, 2) NOT NULL COMMENT '총 매출',
    commission_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '수수료',
    royalty_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '로열티',
    net_settlement_amount DECIMAL(15, 2) NOT NULL COMMENT '순 정산 금액',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '상태: PENDING, APPROVED, PAID',
    approved_by BIGINT COMMENT '승인자',
    approved_at TIMESTAMP COMMENT '승인 시간',
    paid_at TIMESTAMP COMMENT '지급 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_settlement_number (settlement_number),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_settlement_period (settlement_period),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='정산 결과 테이블';
```

### 4.3 세무 관리 테이블

```sql
-- 부가세 신고
CREATE TABLE IF NOT EXISTS erp_vat_returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_period VARCHAR(10) NOT NULL COMMENT '신고 기간 (YYYYMM)',
    supply_amount DECIMAL(15, 2) NOT NULL COMMENT '공급가액',
    vat_amount DECIMAL(15, 2) NOT NULL COMMENT '부가세액',
    purchase_amount DECIMAL(15, 2) NOT NULL COMMENT '매입가액',
    input_vat_amount DECIMAL(15, 2) NOT NULL COMMENT '매입세액',
    payable_vat_amount DECIMAL(15, 2) NOT NULL COMMENT '납부세액',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '상태: DRAFT, SUBMITTED',
    submitted_at TIMESTAMP COMMENT '제출 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_return_period (return_period),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='부가세 신고 테이블';
```

### 4.4 인사 관리 테이블

```sql
-- 직원 정보 (ERP 전용)
CREATE TABLE IF NOT EXISTS erp_employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(20) UNIQUE NOT NULL COMMENT '직원 번호',
    user_id BIGINT NOT NULL COMMENT '사용자 ID (users.id)',
    department_id BIGINT COMMENT '부서 ID',
    position VARCHAR(50) COMMENT '직책',
    hire_date DATE NOT NULL COMMENT '입사일',
    employment_type VARCHAR(20) COMMENT '고용 형태: FULL_TIME, PART_TIME, CONTRACT',
    base_salary DECIMAL(15, 2) COMMENT '기본급',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_employee_number (employee_number),
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='직원 정보 테이블 (ERP)';

-- 근태 기록
CREATE TABLE IF NOT EXISTS erp_attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL COMMENT '직원 ID',
    attendance_date DATE NOT NULL COMMENT '근무일',
    check_in_time TIME COMMENT '출근 시간',
    check_out_time TIME COMMENT '퇴근 시간',
    work_hours DECIMAL(5, 2) COMMENT '근무 시간',
    overtime_hours DECIMAL(5, 2) DEFAULT 0 COMMENT '초과근무 시간',
    status VARCHAR(20) COMMENT '상태: PRESENT, ABSENT, LATE, EARLY_LEAVE, VACATION',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES erp_employees(id),
    UNIQUE KEY uk_employee_date (employee_id, attendance_date),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='근태 기록 테이블';
```

## 5. 기존 시스템과의 통합

### 5.1 AccountingEntry 확장

현재 `AccountingEntry` 엔티티를 확장하여 완전한 분개 시스템으로 발전:

```java
// 기존 AccountingEntry에 추가할 필드
@Column(name = "entry_number", unique = true, length = 50)
private String entryNumber; // 분개 번호

@Column(name = "entry_date", nullable = false)
private LocalDate entryDate; // 분개 날짜

@Column(name = "total_debit", precision = 15, scale = 2)
private BigDecimal totalDebit; // 차변 합계

@Column(name = "total_credit", precision = 15, scale = 2)
private BigDecimal totalCredit; // 대변 합계

@Enumerated(EnumType.STRING)
@Column(name = "entry_status", length = 20)
private EntryStatus entryStatus; // DRAFT, APPROVED, POSTED
```

### 5.2 FinancialTransaction과의 연동

- FinancialTransaction 생성 시 자동으로 분개 생성
- 분개 전기 시 원장 자동 업데이트

### 5.3 급여 시스템과의 연동

- 기존 SalaryCalculation과 연동
- 급여 지급 시 자동으로 분개 생성

## 6. 구현 시작

다음 단계로 진행:
1. 분개 시스템 완성 (AccountingEntry 확장 + JournalEntryLines)
2. 원장 시스템 구현
3. 재무제표 생성
4. 정산 자동화

