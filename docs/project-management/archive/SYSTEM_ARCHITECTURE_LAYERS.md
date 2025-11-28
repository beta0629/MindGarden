# 시스템 아키텍처 레이어 구조

## 1. 개요

Core Solution 플랫폼은 다음과 같이 레이어별로 구분하여 관리합니다:
- **공통 레이어**: 모든 업종에서 공통으로 사용하는 기능
- **업종별 레이어**: 각 업종(학원, 상담소, 카페, 요식업)의 특화 기능
- **ERP 레이어**: 재무/회계/인사 등 별도 관리가 필요한 기능

## 2. 레이어 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    공통 레이어 (Common Layer)                 │
│  - 인증/인가 (Authentication/Authorization)                   │
│  - 회원가입/로그인 (User Registration/Login)                 │
│  - 기본 사용자 정보 관리 (Basic User Profile)                 │
│  - 테넌트 관리 (Tenant Management)                           │
│  - 지점 관리 (Branch Management)                             │
│  - 공통 코드 관리 (Common Code)                              │
│  - 알림 시스템 (Notification System)                         │
│  - 파일 관리 (File Management)                               │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  업종별 레이어   │  │  업종별 레이어   │  │  업종별 레이어   │
│  (Domain Layer) │  │  (Domain Layer) │  │  (Domain Layer) │
│                │  │                │  │                │
│  학원 (Academy)│  │  상담소 (Consult)│  │  카페 (Cafe)   │
│  - 강좌 관리    │  │  - 상담 예약     │  │  - 메뉴 관리    │
│  - 반 관리      │  │  - 세션 관리     │  │  - 주문 처리     │
│  - 수강 등록    │  │  - 결제 연동     │  │  - 포인트 적립   │
│  - 출결 관리    │  │  - 리포트 생성   │  │  - 재고 관리     │
└────────────────┘  └────────────────┘  └────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
┌───────────────────────────▼───────────────────────────┐
│              ERP 레이어 (ERP Layer)                    │
│  - 재무 관리 (Financial Management)                    │
│  - 회계 관리 (Accounting Management)                   │
│  - 인사 관리 (HR Management)                           │
│  - 급여 관리 (Payroll Management)                      │
│  - 정산 관리 (Settlement Management)                    │
│  - 세무 관리 (Tax Management)                          │
│  - 리포트/대시보드 (Reports/Dashboard)                  │
└───────────────────────────────────────────────────────┘
```

## 3. 공통 레이어 (Common Layer)

### 3.1 인증/인가 (Authentication/Authorization) ✅ **완전 공통화**

**이유:**
- 모든 업종에서 동일한 인증 방식 사용 (OAuth2, Passkey 등)
- 보안 정책은 플랫폼 전체에 일관되게 적용되어야 함
- 세션 관리, 토큰 관리도 공통

**포함 기능:**
- 로그인/로그아웃
- OAuth2 (Kakao, Naver, Google, Apple)
- Passkey (WebAuthn)
- JWT 토큰 관리
- 세션 관리
- 권한 관리 (Role-Based Access Control)
- 비밀번호 재설정
- 이메일 인증

**구현 위치:**
```
src/main/java/com/coresolution/core/
├── security/
│   ├── AuthenticationService
│   ├── AuthorizationService
│   └── TokenService
├── auth/
│   ├── LoginController
│   ├── RegisterController
│   └── OAuth2Controller
└── domain/
    └── AuthUser (공통 사용자 엔티티)
```

### 3.2 회원가입/기본 사용자 정보 ✅ **부분 공통화**

**공통 부분:**
- 기본 사용자 정보 (이름, 이메일, 전화번호, 생년월일)
- 계정 생성/수정/삭제
- 프로필 이미지 관리
- 알림 설정

**업종별 확장:**
- 학원: 학부모 정보, 학생 정보
- 상담소: 상담 이력, 선호 상담사
- 카페: 포인트 적립 내역, 선호 메뉴
- 요식업: 배달 주소, 선호 메뉴

**구현 방식:**
```java
// 공통 사용자 엔티티
@Entity
public class AuthUser extends BaseEntity {
    // 공통 필드
    private String email;
    private String name;
    private String phone;
    
    // 업종별 확장 (JSON 또는 별도 테이블)
    @Column(name = "profile_extension_json", columnDefinition = "JSON")
    private String profileExtensionJson;
}

// 업종별 확장 엔티티 (필요시)
@Entity
public class AcademyUserExtension {
    @Id
    private Long userId;
    private String parentName;
    private String studentInfo;
}
```

### 3.3 테넌트/지점 관리 ✅ **완전 공통화**

**이유:**
- 멀티테넌트 구조의 핵심
- 모든 업종에서 동일한 구조 사용

## 4. 업종별 레이어 (Domain Layer)

### 4.1 학원 (Academy)
- 강좌 관리 (Course)
- 반 관리 (Class)
- 수강 등록 (Enrollment)
- 출결 관리 (Attendance)
- 수강료 관리 (Tuition)

### 4.2 상담소 (Consultation)
- 상담 예약 (Appointment)
- 세션 관리 (Session)
- 상담 이력 (History)
- 결제 연동 (Payment)

### 4.3 카페 (Cafe)
- 메뉴 관리 (Menu)
- 주문 처리 (Order)
- 재고 관리 (Inventory)
- 포인트 적립 (Points)

### 4.4 요식업 (Food Service)
- 메뉴 관리 (Menu)
- 주문 처리 (Order)
- 배달 관리 (Delivery)
- 재고 관리 (Inventory)

## 5. ERP 레이어 (ERP Layer) ✅ **완전 분리**

### 5.1 ERP를 별도로 분리해야 하는 이유

1. **독립적인 비즈니스 도메인**
   - 재무/회계는 업종과 무관한 공통 기능
   - 하지만 각 업종의 특수한 ERP 요구사항도 존재

2. **보안 및 규정 준수**
   - 회계 데이터는 높은 보안 수준 필요
   - 세무 규정 준수 (전자세금계산서, 부가세 신고 등)
   - 감사(Audit) 요구사항

3. **확장성**
   - ERP는 독립적으로 확장 가능해야 함
   - 외부 회계 시스템 연동 (예: 더존, 영림원 등)

4. **권한 분리**
   - 일반 사용자와 회계 담당자의 권한 분리
   - 재무 데이터 접근 제어

### 5.2 ERP 레이어 구조

```
src/main/java/com/coresolution/erp/
├── financial/
│   ├── AccountService (계정 관리)
│   ├── TransactionService (거래 관리)
│   └── BalanceService (잔액 관리)
├── accounting/
│   ├── JournalEntryService (분개 관리)
│   ├── LedgerService (원장 관리)
│   └── ReportService (회계 리포트)
├── hr/
│   ├── EmployeeService (직원 관리)
│   ├── PayrollService (급여 관리)
│   └── AttendanceService (근태 관리)
├── settlement/
│   ├── SettlementService (정산 관리)
│   └── CommissionService (수수료 관리)
└── tax/
    ├── TaxCalculationService (세금 계산)
    └── TaxReportService (세무 신고)
```

### 5.3 ERP와 업종 레이어의 연동

**연동 포인트:**
1. **주문/결제 → ERP**
   - 업종별 주문/결제 발생 시 ERP에 거래 기록
   - 예: 학원 수강료 결제 → ERP 매출 기록

2. **ERP → 업종 레이어**
   - 정산 정보를 업종별로 제공
   - 예: 월별 매출 리포트를 학원 대시보드에 표시

**구현 방식:**
```java
// 이벤트 기반 연동 (권장)
@Service
public class AcademyPaymentService {
    
    @EventListener
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        // ERP에 매출 기록
        erpFinancialService.recordRevenue(
            event.getTenantId(),
            event.getAmount(),
            "ACADEMY_TUITION",
            event.getPaymentId()
        );
    }
}
```

## 6. 레이어별 공통화 전략

### 6.1 공통 레이어
- ✅ **완전 공통화**: BaseService 사용
- 모든 업종에서 동일한 인터페이스 사용
- 변경 시 모든 업종에 일괄 적용

### 6.2 업종별 레이어
- ⚠️ **조건부 공통화**: BaseTenantService 사용
- 기본 CRUD는 공통화
- 비즈니스 로직은 업종별 구현

### 6.3 ERP 레이어
- ❌ **별도 관리**: BaseService 사용하되 독립 모듈
- ERP 전용 BaseService (BaseErpService)
- 업종 레이어와 이벤트 기반 연동

## 7. 데이터베이스 구조

### 7.1 공통 테이블
```
auth_users (공통 사용자)
tenants (테넌트)
branches (지점)
common_codes (공통 코드)
notifications (알림)
files (파일)
```

### 7.2 업종별 테이블
```
academy_courses (학원 강좌)
academy_classes (학원 반)
consultation_appointments (상담 예약)
cafe_menus (카페 메뉴)
foodservice_orders (요식업 주문)
```

### 7.3 ERP 테이블
```
erp_accounts (계정)
erp_transactions (거래)
erp_journal_entries (분개)
erp_ledgers (원장)
erp_settlements (정산)
erp_employees (직원)
erp_payrolls (급여)
```

## 8. API 구조

### 8.1 공통 API
```
/api/common/auth/* (인증/인가)
/api/common/users/* (사용자 관리)
/api/common/tenants/* (테넌트 관리)
/api/common/branches/* (지점 관리)
```

### 8.2 업종별 API
```
/api/academy/courses/* (학원 강좌)
/api/consultation/appointments/* (상담 예약)
/api/cafe/menus/* (카페 메뉴)
/api/foodservice/orders/* (요식업 주문)
```

### 8.3 ERP API
```
/api/erp/financial/* (재무)
/api/erp/accounting/* (회계)
/api/erp/hr/* (인사)
/api/erp/settlement/* (정산)
```

## 9. 권장 사항

### 9.1 인증/회원가입
- ✅ **완전 공통화**: 모든 업종에서 동일한 인증 시스템 사용
- 사용자 프로필은 기본 정보는 공통, 확장 정보는 업종별

### 9.2 ERP
- ✅ **완전 분리**: 독립 모듈로 관리
- 이벤트 기반으로 업종 레이어와 연동
- ERP 전용 권한 및 보안 정책 적용

### 9.3 업종별 기능
- ⚠️ **조건부 공통화**: BaseTenantService 활용
- 공통 CRUD는 공통화, 비즈니스 로직은 업종별

## 10. 마이그레이션 전략

### Phase 1: 공통 레이어 정리
1. 인증/인가 시스템 공통화
2. 사용자 관리 공통화
3. 테넌트/지점 관리 공통화

### Phase 2: ERP 레이어 분리
1. ERP 모듈 독립화
2. 이벤트 기반 연동 구현
3. ERP 전용 권한 시스템 구축

### Phase 3: 업종별 레이어 정리
1. BaseTenantService 적용
2. 업종별 비즈니스 로직 분리
3. 공통 CRUD 공통화

