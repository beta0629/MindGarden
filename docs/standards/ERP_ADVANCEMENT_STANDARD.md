# ERP 고도화 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📋 개요

CoreSolution 플랫폼의 ERP(Enterprise Resource Planning) 시스템 고도화 표준입니다. 현재 기본 재무/구매/예산 관리 기능을 완전한 회계/세무/인사 시스템으로 확장합니다.

### ⭐ 핵심 원칙: 테넌트별 ERP 완전 독립

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  모든 ERP 데이터는 테넌트별로 완전히 독립적으로 관리됩니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**테넌트별 독립 관리**:
- ✅ 각 테넌트는 독립적인 ERP 시스템을 가짐
- ✅ 회계 계정 체계 (Chart of Accounts) 테넌트별 독립
- ✅ 분개 번호 체계 테넌트별 독립 (예: JE-{tenantId}-2025-0001)
- ✅ 정산 규칙 테넌트별 독립 설정
- ✅ 세무 신고 테넌트별 독립 처리
- ✅ 직원 정보 테넌트별 독립 관리
- ✅ 재무제표 테넌트별 독립 생성

**데이터 격리**:
```
테넌트 A의 ERP 데이터 ≠ 테넌트 B의 ERP 데이터
- 테넌트 A는 테넌트 B의 ERP 데이터를 절대 조회/수정 불가
- 모든 ERP 테이블에 tenant_id 필수
- 모든 ERP 쿼리에 tenant_id 필터 필수
```

---

## 🎯 고도화 목표

### 현재 상태 (As-Is)
- ✅ 기본 재무 거래 관리 (FinancialTransaction)
- ✅ 구매 요청/주문 관리 (PurchaseRequest, PurchaseOrder)
- ✅ 예산 관리 (Budget)
- ✅ 급여 계산 (PL/SQL 프로시저 기반)
- ⚠️ 기본적인 회계 엔트리만 존재 (완전한 분개 시스템 아님)

### 목표 상태 (To-Be)
- ✅ 완전한 분개 시스템 (차변/대변 검증)
- ✅ 원장 시스템 (계정별 원장 조회)
- ✅ 재무제표 자동 생성 (손익계산서, 재무상태표, 현금흐름표)
- ✅ 정산 자동화 (업종별 정산 규칙 엔진)
- ✅ 부가세 관리 (자동 계산 및 신고서 생성)
- ✅ 인사 관리 (직원 정보, 근태, 휴가)
- ✅ 외부 시스템 연동 (더존, 영림원, 홈택스)

---

## 🏗️ ERP 시스템 아키텍처

### 테넌트별 ERP 독립성 보장

```
┌─────────────────────────────────────────────────────────────┐
│                    CoreSolution Platform                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  테넌트 A       │  │  테넌트 B       │  │  테넌트 C       │
│  ERP 시스템     │  │  ERP 시스템     │  │  ERP 시스템     │
├────────────────┤  ├────────────────┤  ├────────────────┤
│ - 독립 회계     │  │ - 독립 회계     │  │ - 독립 회계     │
│ - 독립 분개     │  │ - 독립 분개     │  │ - 독립 분개     │
│ - 독립 원장     │  │ - 독립 원장     │  │ - 독립 원장     │
│ - 독립 정산     │  │ - 독립 정산     │  │ - 독립 정산     │
│ - 독립 세무     │  │ - 독립 세무     │  │ - 독립 세무     │
│ - 독립 인사     │  │ - 독립 인사     │  │ - 독립 인사     │
└────────────────┘  └────────────────┘  └────────────────┘
```

**테넌트별 독립 보장 메커니즘**:

1. **데이터베이스 레벨**:
   - 모든 ERP 테이블에 `tenant_id` 컬럼 필수
   - 복합 유니크 키에 `tenant_id` 포함
   - 인덱스에 `tenant_id` 우선 포함

2. **애플리케이션 레벨**:
   - `TenantContext` 필터 자동 적용
   - Repository 쿼리에 `tenant_id` 자동 추가
   - Service 레이어에서 테넌트 검증

3. **API 레벨**:
   - `X-Tenant-ID` 헤더 필수
   - 요청 테넌트와 데이터 테넌트 일치 검증
   - 크로스 테넌트 접근 차단

### 패키지 구조

```
com.coresolution.erp/
├── financial/                    # 재무 관리
│   ├── FinancialTransaction      # 재무 거래
│   ├── FinancialTransactionService
│   └── FinancialTransactionController
├── accounting/                   # 회계 관리 ⭐ 고도화
│   ├── AccountingEntry           # 분개 (확장 필요)
│   ├── JournalEntryLine          # 분개 상세 (신규)
│   ├── Ledger                    # 원장 (신규)
│   ├── FinancialStatement        # 재무제표 (신규)
│   ├── AccountingService
│   └── AccountingController
├── purchase/                     # 구매 관리
│   ├── Item                      # 아이템/재고
│   ├── PurchaseRequest           # 구매 요청
│   ├── PurchaseOrder             # 구매 주문
│   ├── PurchaseService
│   └── PurchaseController
├── budget/                       # 예산 관리
│   ├── Budget                    # 예산
│   ├── BudgetService
│   └── BudgetController
├── payroll/                      # 급여 관리
│   ├── SalaryCalculation         # 급여 계산
│   ├── SalaryProfile             # 급여 프로필
│   ├── SalaryTaxCalculation      # 세금 계산
│   ├── PayrollService
│   └── PayrollController
├── settlement/                   # 정산 관리 ⭐ 고도화
│   ├── SettlementRule            # 정산 규칙 (신규)
│   ├── Settlement                # 정산 결과 (신규)
│   ├── SettlementService
│   └── SettlementController
├── tax/                          # 세무 관리 ⭐ 신규
│   ├── VatReturn                 # 부가세 신고 (신규)
│   ├── TaxCalculation            # 세금 계산 (신규)
│   ├── TaxService
│   └── TaxController
├── hr/                           # 인사 관리 ⭐ 신규
│   ├── Employee                  # 직원 정보 (신규)
│   ├── AttendanceRecord          # 근태 기록 (신규)
│   ├── LeaveRequest              # 휴가 신청 (신규)
│   ├── HrService
│   └── HrController
└── integration/                  # 외부 시스템 연동 ⭐ 신규
    ├── ExternalErpAdapter        # 외부 ERP 어댑터
    ├── TaxSystemAdapter          # 세무 시스템 어댑터
    └── BankAdapter               # 은행 연동 어댑터
```

---

## 📊 고도화 우선순위

### P0 (필수 - 즉시 구현) ⭐⭐⭐⭐⭐

#### 1. 분개 시스템 완성
**목표**: AccountingEntry를 완전한 분개 시스템으로 확장

**구현 항목**:
- ✅ 분개 번호 (Entry Number) 자동 생성
- ✅ 분개 날짜 (Entry Date)
- ✅ 차변/대변 합계 검증 (차변 = 대변)
- ✅ 분개 상태 (DRAFT, APPROVED, POSTED)
- ✅ 분개 상세 (Journal Entry Lines) 테이블
- ✅ 분개 승인 프로세스
- ✅ 분개 전기 (Posting) 기능

**API 엔드포인트**:
```
POST   /api/v1/erp/accounting/entries           # 분개 생성
GET    /api/v1/erp/accounting/entries           # 분개 목록
GET    /api/v1/erp/accounting/entries/{id}      # 분개 상세
PUT    /api/v1/erp/accounting/entries/{id}      # 분개 수정
POST   /api/v1/erp/accounting/entries/{id}/approve  # 분개 승인
POST   /api/v1/erp/accounting/entries/{id}/post     # 분개 전기
```

#### 2. 원장 시스템
**목표**: 계정별 원장 자동 생성 및 조회

**구현 항목**:
- ✅ 원장 (Ledger) 테이블
- ✅ 원장 자동 생성 로직 (분개 전기 시)
- ✅ 계정별 원장 조회
- ✅ 기간별 원장 조회
- ✅ 잔액 계산 (기초 잔액 + 차변 - 대변 = 기말 잔액)

**API 엔드포인트**:
```
GET    /api/v1/erp/accounting/ledgers/account/{accountId}  # 계정별 원장
GET    /api/v1/erp/accounting/ledgers/period              # 기간별 원장
GET    /api/v1/erp/accounting/ledgers/balance/{accountId} # 계정 잔액
```

#### 3. 재무제표 생성
**목표**: 손익계산서, 재무상태표 자동 생성

**구현 항목**:
- ✅ 손익계산서 (Income Statement)
  - 수익 계정 합계
  - 비용 계정 합계
  - 순이익 계산
- ✅ 재무상태표 (Balance Sheet)
  - 자산 계정 합계
  - 부채 계정 합계
  - 자본 계정 합계
- ✅ 현금흐름표 (Cash Flow Statement)
  - 영업 활동 현금흐름
  - 투자 활동 현금흐름
  - 재무 활동 현금흐름

**API 엔드포인트**:
```
GET    /api/v1/erp/accounting/statements/income        # 손익계산서
GET    /api/v1/erp/accounting/statements/balance       # 재무상태표
GET    /api/v1/erp/accounting/statements/cash-flow     # 현금흐름표
```

#### 4. 정산 자동화
**목표**: 업종별 정산 규칙 설정 및 자동 계산

**구현 항목**:
- ✅ 정산 규칙 (SettlementRule) 테이블
- ✅ 정산 결과 (Settlement) 테이블
- ✅ 정산 규칙 엔진
  - 비율 계산 (PERCENTAGE)
  - 고정 금액 (FIXED)
  - 단계별 계산 (TIERED)
- ✅ 정산 자동 계산 배치 작업
- ✅ 정산 승인 프로세스
- ✅ 정산 리포트 생성

**업종별 정산 규칙**:
```
학원 (ACADEMY):
- 수강료 정산 (학생 → 학원)
- 강사 정산 (학원 → 강사)
- 본사 로열티 (학원 → 본사)

상담소 (CONSULTATION):
- 상담료 정산 (내담자 → 상담소)
- 상담사 정산 (상담소 → 상담사)

카페/요식업 (CAFE/FOOD_SERVICE):
- 매출 정산 (고객 → 매장)
- 수수료 정산 (매장 → 본사)
```

**API 엔드포인트**:
```
POST   /api/v1/erp/settlement/rules                # 정산 규칙 생성
GET    /api/v1/erp/settlement/rules                # 정산 규칙 목록
POST   /api/v1/erp/settlement/calculate            # 정산 계산 실행
GET    /api/v1/erp/settlement/results              # 정산 결과 목록
POST   /api/v1/erp/settlement/results/{id}/approve # 정산 승인
```

---

### P1 (중요 - 빠른 확장) ⭐⭐⭐⭐

#### 5. 부가세 관리
**목표**: 부가세 자동 계산 및 신고서 생성

**구현 항목**:
- ✅ 부가세 신고 (VatReturn) 테이블
- ✅ 부가세 자동 계산 로직
  - 공급가액 (Supply Amount)
  - 부가세액 (VAT Amount)
  - 매입가액 (Purchase Amount)
  - 매입세액 (Input VAT Amount)
  - 납부세액 (Payable VAT Amount)
- ✅ 부가세 신고서 생성
- ✅ 부가세 신고서 조회

**API 엔드포인트**:
```
POST   /api/v1/erp/tax/vat/calculate              # 부가세 계산
POST   /api/v1/erp/tax/vat/returns                # 부가세 신고서 생성
GET    /api/v1/erp/tax/vat/returns                # 부가세 신고서 목록
GET    /api/v1/erp/tax/vat/returns/{id}           # 부가세 신고서 상세
POST   /api/v1/erp/tax/vat/returns/{id}/submit    # 부가세 신고서 제출
```

#### 6. 인사 관리 기본
**목표**: 직원 정보 및 근태 관리

**구현 항목**:
- ✅ 직원 정보 (Employee) 테이블
  - 직원 번호 (Employee Number)
  - 사용자 ID (User ID)
  - 부서 ID (Department ID)
  - 직책 (Position)
  - 입사일 (Hire Date)
  - 고용 형태 (Employment Type)
  - 기본급 (Base Salary)
- ✅ 근태 기록 (AttendanceRecord) 테이블
  - 출근 시간 (Check In Time)
  - 퇴근 시간 (Check Out Time)
  - 근무 시간 (Work Hours)
  - 초과근무 시간 (Overtime Hours)
  - 상태 (Status: PRESENT, ABSENT, LATE, EARLY_LEAVE, VACATION)
- ✅ 휴가 신청 (LeaveRequest) 테이블
- ✅ 직원 CRUD API
- ✅ 근태 기록 API
- ✅ 근태 통계 API

**API 엔드포인트**:
```
POST   /api/v1/erp/hr/employees                   # 직원 생성
GET    /api/v1/erp/hr/employees                   # 직원 목록
GET    /api/v1/erp/hr/employees/{id}              # 직원 상세
PUT    /api/v1/erp/hr/employees/{id}              # 직원 수정
POST   /api/v1/erp/hr/attendance/check-in         # 출근 기록
POST   /api/v1/erp/hr/attendance/check-out        # 퇴근 기록
GET    /api/v1/erp/hr/attendance/records          # 근태 기록 목록
GET    /api/v1/erp/hr/attendance/statistics       # 근태 통계
```

#### 7. 정산 리포트
**목표**: 정산 내역 및 요약 리포트 생성

**구현 항목**:
- ✅ 정산 내역 리포트 (상세)
- ✅ 정산 요약 리포트 (월별/분기별/연도별)
- ✅ 정산 비교 리포트 (기간별 비교)
- ✅ 정산 리포트 엑셀 다운로드

**API 엔드포인트**:
```
GET    /api/v1/erp/settlement/reports/detail      # 정산 내역 리포트
GET    /api/v1/erp/settlement/reports/summary     # 정산 요약 리포트
GET    /api/v1/erp/settlement/reports/comparison  # 정산 비교 리포트
GET    /api/v1/erp/settlement/reports/export      # 리포트 엑셀 다운로드
```

---

### P2 (선택 - 장기) ⭐⭐⭐

#### 8. 전자세금계산서
**목표**: 전자세금계산서 발행 및 국세청 연동

**구현 항목**:
- ✅ 전자세금계산서 발행
- ✅ 국세청 연동 (홈택스 API)
- ✅ 전자세금계산서 조회
- ✅ 전자세금계산서 취소

#### 9. 원천징수 및 연말정산
**목표**: 원천징수 관리 및 연말정산 처리

**구현 항목**:
- ✅ 원천징수 세액 계산
- ✅ 원천징수 신고서 생성
- ✅ 연말정산 처리
- ✅ 연말정산 신고서 생성

#### 10. 외부 시스템 연동
**목표**: 외부 회계/세무/은행 시스템 연동

**구현 항목**:
- ✅ 더존 회계 시스템 연동
- ✅ 영림원 회계 시스템 연동
- ✅ 홈택스 세무 시스템 연동
- ✅ 은행 계좌 조회 연동
- ✅ 은행 자동 이체 연동

---

## 🗄️ 데이터베이스 스키마

### 1. 분개 시스템 테이블

#### erp_journal_entry_lines (분개 상세)
```sql
CREATE TABLE IF NOT EXISTS erp_journal_entry_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    journal_entry_id BIGINT NOT NULL COMMENT '분개 ID (accounting_entries.id)',
    account_id BIGINT NOT NULL COMMENT '계정 ID (accounts.id)',
    debit_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '차변 금액',
    credit_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '대변 금액',
    description TEXT COMMENT '설명',
    line_number INT NOT NULL COMMENT '라인 번호',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    FOREIGN KEY (journal_entry_id) REFERENCES accounting_entries(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_journal_entry_id (journal_entry_id),
    INDEX idx_account_id (account_id),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='분개 상세 테이블';
```

#### erp_ledgers (원장)
```sql
CREATE TABLE IF NOT EXISTS erp_ledgers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    account_id BIGINT NOT NULL COMMENT '계정 ID',
    period_start DATE NOT NULL COMMENT '기간 시작일',
    period_end DATE NOT NULL COMMENT '기간 종료일',
    opening_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '기초 잔액',
    total_debit DECIMAL(15, 2) DEFAULT 0 COMMENT '총 차변',
    total_credit DECIMAL(15, 2) DEFAULT 0 COMMENT '총 대변',
    closing_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '기말 잔액',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    
    UNIQUE KEY uk_account_period (tenant_id, account_id, period_start, period_end),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_account_id (account_id),
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='원장 테이블';
```

### 2. 정산 관리 테이블

#### erp_settlement_rules (정산 규칙)
```sql
CREATE TABLE IF NOT EXISTS erp_settlement_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    rule_name VARCHAR(100) NOT NULL COMMENT '규칙명',
    business_type VARCHAR(20) COMMENT '업종: ACADEMY, CONSULTATION, CAFE, FOOD_SERVICE',
    settlement_type VARCHAR(20) NOT NULL COMMENT '정산 유형: REVENUE, COMMISSION, ROYALTY',
    calculation_method VARCHAR(20) NOT NULL COMMENT '계산 방법: PERCENTAGE, FIXED, TIERED',
    calculation_params JSON COMMENT '계산 파라미터 (JSON)',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_business_type (business_type),
    INDEX idx_settlement_type (settlement_type),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='정산 규칙 테이블';
```

#### erp_settlements (정산 결과)
```sql
CREATE TABLE IF NOT EXISTS erp_settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    settlement_number VARCHAR(50) UNIQUE NOT NULL COMMENT '정산 번호',
    settlement_period VARCHAR(10) NOT NULL COMMENT '정산 기간 (YYYYMM)',
    total_revenue DECIMAL(15, 2) NOT NULL COMMENT '총 매출',
    commission_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '수수료',
    royalty_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '로열티',
    net_settlement_amount DECIMAL(15, 2) NOT NULL COMMENT '순 정산 금액',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '상태: PENDING, APPROVED, PAID',
    approved_by BIGINT COMMENT '승인자',
    approved_at TIMESTAMP COMMENT '승인 시간',
    paid_at TIMESTAMP COMMENT '지급 시간',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_settlement_number (settlement_number),
    INDEX idx_settlement_period (settlement_period),
    INDEX idx_status (status),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='정산 결과 테이블';
```

### 3. 세무 관리 테이블

#### erp_vat_returns (부가세 신고)
```sql
CREATE TABLE IF NOT EXISTS erp_vat_returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    return_period VARCHAR(10) NOT NULL COMMENT '신고 기간 (YYYYMM)',
    supply_amount DECIMAL(15, 2) NOT NULL COMMENT '공급가액',
    vat_amount DECIMAL(15, 2) NOT NULL COMMENT '부가세액',
    purchase_amount DECIMAL(15, 2) NOT NULL COMMENT '매입가액',
    input_vat_amount DECIMAL(15, 2) NOT NULL COMMENT '매입세액',
    payable_vat_amount DECIMAL(15, 2) NOT NULL COMMENT '납부세액',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '상태: DRAFT, SUBMITTED',
    submitted_at TIMESTAMP COMMENT '제출 시간',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    UNIQUE KEY uk_return_period (tenant_id, return_period),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='부가세 신고 테이블';
```

### 4. 인사 관리 테이블

#### erp_employees (직원 정보)
```sql
CREATE TABLE IF NOT EXISTS erp_employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    employee_number VARCHAR(20) UNIQUE NOT NULL COMMENT '직원 번호',
    user_id BIGINT NOT NULL COMMENT '사용자 ID (users.id)',
    department_id BIGINT COMMENT '부서 ID',
    position VARCHAR(50) COMMENT '직책',
    hire_date DATE NOT NULL COMMENT '입사일',
    employment_type VARCHAR(20) COMMENT '고용 형태: FULL_TIME, PART_TIME, CONTRACT',
    base_salary DECIMAL(15, 2) COMMENT '기본급',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_employee_number (employee_number),
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='직원 정보 테이블 (ERP)';
```

#### erp_attendance_records (근태 기록)
```sql
CREATE TABLE IF NOT EXISTS erp_attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    employee_id BIGINT NOT NULL COMMENT '직원 ID',
    attendance_date DATE NOT NULL COMMENT '근무일',
    check_in_time TIME COMMENT '출근 시간',
    check_out_time TIME COMMENT '퇴근 시간',
    work_hours DECIMAL(5, 2) COMMENT '근무 시간',
    overtime_hours DECIMAL(5, 2) DEFAULT 0 COMMENT '초과근무 시간',
    status VARCHAR(20) COMMENT '상태: PRESENT, ABSENT, LATE, EARLY_LEAVE, VACATION',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    FOREIGN KEY (employee_id) REFERENCES erp_employees(id),
    UNIQUE KEY uk_employee_date (tenant_id, employee_id, attendance_date),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_status (status),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='근태 기록 테이블';
```

---

## 🔄 기존 시스템과의 통합

### 1. AccountingEntry 확장

현재 `AccountingEntry` 엔티티를 확장하여 완전한 분개 시스템으로 발전:

```java
@Entity
@Table(name = "accounting_entries",
    indexes = {
        @Index(name = "idx_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_entry_number", columnList = "entry_number"),
        @Index(name = "idx_tenant_entry_date", columnList = "tenant_id, entry_date")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_entry_number", 
            columnNames = {"tenant_id", "entry_number"})
    }
)
public class AccountingEntry {
    // 기존 필드
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ⭐ 테넌트 ID 필수 (ERP 독립성 보장)
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    
    // 추가 필드 ⭐
    // 분개 번호: 테넌트별 독립 채번 (예: JE-tenant-seoul-consultation-001-2025-0001)
    @Column(name = "entry_number", nullable = false, length = 100)
    private String entryNumber;
    
    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate; // 분개 날짜
    
    @Column(name = "total_debit", precision = 15, scale = 2)
    private BigDecimal totalDebit; // 차변 합계
    
    @Column(name = "total_credit", precision = 15, scale = 2)
    private BigDecimal totalCredit; // 대변 합계
    
    @Enumerated(EnumType.STRING)
    @Column(name = "entry_status", length = 20)
    private EntryStatus entryStatus; // DRAFT, APPROVED, POSTED
    
    @Column(name = "approved_by")
    private Long approvedBy; // 승인자 ID
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt; // 승인 시간
    
    @Column(name = "posted_at")
    private LocalDateTime postedAt; // 전기 시간
    
    // 분개 상세 (One-to-Many)
    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JournalEntryLine> lines = new ArrayList<>();
    
    // 차변/대변 검증 메서드
    public boolean isBalanced() {
        return totalDebit != null && totalCredit != null 
            && totalDebit.compareTo(totalCredit) == 0;
    }
}

public enum EntryStatus {
    DRAFT,      // 초안
    APPROVED,   // 승인됨
    POSTED      // 전기됨
}
```

### 2. FinancialTransaction과의 연동

```java
@Service
public class FinancialTransactionService {
    
    @Autowired
    private AccountingService accountingService;
    
    @Autowired
    private TenantContextHolder tenantContextHolder;
    
    @Transactional
    public FinancialTransaction createTransaction(FinancialTransactionRequest request) {
        // 0. 테넌트 컨텍스트 검증 ⭐ (ERP 독립성 보장)
        String currentTenantId = tenantContextHolder.getCurrentTenantId();
        if (!currentTenantId.equals(request.getTenantId())) {
            throw new UnauthorizedAccessException(
                "테넌트 ID 불일치: 다른 테넌트의 ERP 데이터에 접근할 수 없습니다."
            );
        }
        
        // 1. 재무 거래 생성 (테넌트 ID 포함)
        FinancialTransaction transaction = financialTransactionRepository.save(
            FinancialTransaction.builder()
                .tenantId(currentTenantId) // ⭐ 테넌트 ID 필수
                .transactionType(request.getTransactionType())
                .amount(request.getAmount())
                .build()
        );
        
        // 2. 자동으로 분개 생성 (같은 테넌트 ID로)
        accountingService.createJournalEntryFromTransaction(transaction);
        
        return transaction;
    }
}
```

### 3. 급여 시스템과의 연동

```java
@Service
public class PayrollService {
    
    @Autowired
    private AccountingService accountingService;
    
    @Autowired
    private TenantContextHolder tenantContextHolder;
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Transactional
    public SalaryCalculation processSalary(Long employeeId) {
        // 0. 테넌트 컨텍스트 검증 ⭐ (ERP 독립성 보장)
        String currentTenantId = tenantContextHolder.getCurrentTenantId();
        
        // 1. 직원 정보 조회 (테넌트 ID 검증)
        Employee employee = employeeRepository.findByIdAndTenantId(employeeId, currentTenantId)
            .orElseThrow(() -> new EntityNotFoundException(
                "해당 테넌트에 직원이 존재하지 않습니다: " + employeeId
            ));
        
        // 2. 급여 계산 (PL/SQL 프로시저 호출, 테넌트 ID 전달)
        SalaryCalculation salary = calculateSalary(employee, currentTenantId);
        
        // 3. 자동으로 분개 생성 (같은 테넌트 ID로)
        accountingService.createJournalEntryFromSalary(salary);
        
        return salary;
    }
}
```

### 4. 테넌트별 분개 번호 생성 전략

```java
@Service
public class JournalEntryNumberGenerator {
    
    @Autowired
    private AccountingEntryRepository accountingEntryRepository;
    
    /**
     * 테넌트별 독립적인 분개 번호 생성
     * 형식: JE-{tenantId}-{YYYY}-{sequence}
     * 예시: JE-tenant-seoul-consultation-001-2025-0001
     */
    public String generateEntryNumber(String tenantId) {
        // 1. 현재 연도
        int currentYear = LocalDate.now().getYear();
        
        // 2. 해당 테넌트의 현재 연도 최대 시퀀스 조회
        Integer maxSequence = accountingEntryRepository
            .findMaxSequenceByTenantIdAndYear(tenantId, currentYear);
        
        int nextSequence = (maxSequence == null) ? 1 : maxSequence + 1;
        
        // 3. 분개 번호 생성 (테넌트별 독립)
        return String.format("JE-%s-%d-%04d", 
            tenantId, 
            currentYear, 
            nextSequence
        );
    }
}
```

### 5. 테넌트별 회계 계정 체계 독립

```java
@Service
public class AccountService {
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private TenantContextHolder tenantContextHolder;
    
    /**
     * 테넌트 생성 시 기본 회계 계정 체계 자동 생성
     */
    @Transactional
    public void createDefaultAccountsForTenant(String tenantId, String businessType) {
        String currentTenantId = tenantContextHolder.getCurrentTenantId();
        
        // 테넌트 ID 검증
        if (!currentTenantId.equals(tenantId)) {
            throw new UnauthorizedAccessException("다른 테넌트의 계정을 생성할 수 없습니다.");
        }
        
        // 업종별 기본 계정 체계 생성
        List<Account> defaultAccounts = getDefaultAccountsByBusinessType(businessType);
        
        for (Account template : defaultAccounts) {
            Account account = Account.builder()
                .tenantId(tenantId) // ⭐ 테넌트별 독립
                .accountCode(template.getAccountCode())
                .accountName(template.getAccountName())
                .accountType(template.getAccountType())
                .isActive(true)
                .build();
            
            accountRepository.save(account);
        }
    }
    
    /**
     * 업종별 기본 계정 체계
     */
    private List<Account> getDefaultAccountsByBusinessType(String businessType) {
        // 업종별 차이가 있는 계정 체계 반환
        switch (businessType) {
            case "ACADEMY":
                return getAcademyDefaultAccounts();
            case "CONSULTATION":
                return getConsultationDefaultAccounts();
            case "CAFE":
            case "FOOD_SERVICE":
                return getFoodServiceDefaultAccounts();
            default:
                return getCommonDefaultAccounts();
        }
    }
}
```

---

## 📅 구현 일정

### Phase 1: 회계 관리 고도화 (2주)

#### Week 1: 분개 시스템 완성
- [ ] AccountingEntry 엔티티 확장
- [ ] JournalEntryLine 엔티티 생성
- [ ] 분개 CRUD API
- [ ] 분개 승인 프로세스
- [ ] 분개 전기 기능
- [ ] 차변/대변 검증 로직

#### Week 2: 원장 및 재무제표
- [ ] Ledger 엔티티 생성
- [ ] 원장 자동 생성 로직
- [ ] 계정별 원장 조회 API
- [ ] 재무제표 생성 로직 (손익계산서, 재무상태표)
- [ ] 재무제표 조회 API

### Phase 2: 정산 관리 고도화 (1주)

#### Week 1: 정산 자동화
- [ ] SettlementRule 엔티티 생성
- [ ] Settlement 엔티티 생성
- [ ] 정산 규칙 엔진 구현
- [ ] 정산 자동 계산 배치 작업
- [ ] 정산 승인 프로세스
- [ ] 정산 리포트 생성

### Phase 3: 세무 관리 기본 (1주)

#### Week 1: 부가세 관리
- [ ] VatReturn 엔티티 생성
- [ ] 부가세 자동 계산 로직
- [ ] 부가세 신고서 생성
- [ ] 부가세 신고서 조회 API

### Phase 4: 인사 관리 기본 (1주)

#### Week 1: 직원 및 근태 관리
- [ ] Employee 엔티티 생성
- [ ] AttendanceRecord 엔티티 생성
- [ ] 직원 CRUD API
- [ ] 근태 기록 API
- [ ] 근태 통계 API

---

## 🚫 금지 사항

### 0. 크로스 테넌트 접근 절대 금지 ⭐⭐⭐
```java
// ❌ 절대 금지 - 다른 테넌트의 ERP 데이터 접근
accountingEntryRepository.findById(id); // tenant_id 필터 없음

// ❌ 절대 금지 - 테넌트 검증 없이 데이터 수정
accountingEntry.setAmount(newAmount);
accountingEntryRepository.save(accountingEntry);

// ✅ 필수 - 반드시 테넌트 ID 검증
String currentTenantId = tenantContextHolder.getCurrentTenantId();
AccountingEntry entry = accountingEntryRepository
    .findByIdAndTenantId(id, currentTenantId)
    .orElseThrow(() -> new EntityNotFoundException("해당 테넌트에 데이터가 없습니다."));

// ✅ 필수 - 테넌트 ID 일치 검증 후 수정
if (!entry.getTenantId().equals(currentTenantId)) {
    throw new UnauthorizedAccessException("다른 테넌트의 데이터를 수정할 수 없습니다.");
}
entry.setAmount(newAmount);
accountingEntryRepository.save(entry);
```

### 1. 브랜치 개념 사용 금지
```java
// ❌ 금지
@Column(name = "branch_id")
private Long branchId;

@Column(name = "branch_code")
private String branchCode;

// ✅ 필수
@Column(name = "tenant_id", nullable = false, length = 36)
private String tenantId;
```

### 2. 하드코딩 금지
```java
// ❌ 금지
if (businessType.equals("ACADEMY")) {
    commissionRate = 0.15;
}

// ✅ 필수 - 데이터베이스에서 조회
SettlementRule rule = settlementRuleRepository
    .findByBusinessTypeAndSettlementType(businessType, settlementType);
BigDecimal commissionRate = rule.getCalculationParams().get("rate");
```

### 3. 하드 삭제 금지
```java
// ❌ 금지
accountingEntryRepository.deleteById(id);

// ✅ 필수 - 소프트 삭제
AccountingEntry entry = accountingEntryRepository.findById(id);
entry.setIsDeleted(true);
entry.setDeletedAt(LocalDateTime.now());
entry.setDeletedBy(currentUserId);
accountingEntryRepository.save(entry);
```

---

## ✅ 개발 체크리스트

### 데이터베이스 (테넌트 독립성 보장)
- [ ] `tenant_id` 컬럼 추가 (NOT NULL, VARCHAR(36))
- [ ] 감사 필드 추가 (created_at, updated_at, created_by, updated_by)
- [ ] 소프트 삭제 필드 추가 (is_deleted, deleted_at, deleted_by)
- [ ] 브랜치 관련 컬럼 없음 확인 (branch_id, branch_code 금지)
- [ ] 테넌트 포함 유니크 키 생성 (예: uk_tenant_entry_number)
- [ ] 테넌트 포함 인덱스 생성 (예: idx_tenant_entry_date)
- [ ] ⭐ 모든 쿼리에 tenant_id 필터 필수 확인

### API
- [ ] `/api/v1/erp/` 접두사 사용
- [ ] 테넌트 ID 헤더 검증
- [ ] 표준 응답 구조 사용
- [ ] 에러 처리 구현
- [ ] 페이징 구현 (목록 API)
- [ ] API 문서화 (Swagger)

### 백엔드 (테넌트 독립성 보장)
- [ ] ⭐ TenantContextHolder 사용 (모든 Service에서)
- [ ] ⭐ Repository 메서드에 tenantId 파라미터 추가
- [ ] ⭐ 크로스 테넌트 접근 검증 로직 구현
- [ ] 브랜치 로직 제거
- [ ] 권한 체크 구현 (테넌트별 권한)
- [ ] 소프트 삭제 구현
- [ ] 단위 테스트 작성 (테넌트 격리 테스트 포함)
- [ ] 통합 테스트 작성 (멀티 테넌트 시나리오 포함)
- [ ] ⭐ 테넌트별 ERP 번호 채번 로직 구현
- [ ] ⭐ 테넌트별 회계 계정 체계 자동 생성 로직 구현

### 프론트엔드
- [ ] 테넌트 컨텍스트 사용
- [ ] 브랜치 UI 제거
- [ ] API 호출 시 헤더 포함
- [ ] 에러 처리 구현
- [ ] 로딩 상태 처리

---

## 📖 참고 문서

- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [Stored Procedure 표준](./STORED_PROCEDURE_STANDARD.md)
- [공통코드 시스템 표준](./COMMON_CODE_SYSTEM_STANDARD.md)

---

**최종 업데이트**: 2025-12-02

