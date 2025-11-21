# CoreSolution IA 구조도

**작성일**: 2025-11-21  
**버전**: 1.1.0  
**상태**: 업데이트 완료

---

## 📋 개요

CoreSolution 플랫폼의 정보 구조(Information Architecture)를 시각화한 문서입니다. 시스템의 전체 구조, 모듈 관계, 데이터 흐름을 파악할 수 있습니다.

---

## 🏗️ 시스템 전체 구조

### 패키지 구조

```
com.coresolution/
├── core/                    # 코어 패키지 (공통 기능)
│   ├── domain/             # 도메인 엔티티 (38개)
│   │   ├── Tenant          # 테넌트
│   │   ├── TenantRole      # 테넌트 역할
│   │   ├── UserRoleAssignment  # 사용자 역할 할당
│   │   ├── RoleTemplate    # 역할 템플릿
│   │   ├── TenantDashboard # 테넌트 대시보드
│   │   └── ...
│   ├── service/            # 서비스 (77개)
│   ├── controller/         # 컨트롤러 (33개)
│   ├── repository/         # 리포지토리 (23개)
│   └── config/             # 설정
│
├── consultation/           # 상담소 모델 (MindGarden)
│   ├── entity/             # 엔티티 (69개)
│   │   ├── User            # 사용자
│   │   ├── Branch          # 지점
│   │   ├── Schedule        # 일정
│   │   ├── Consultation    # 상담
│   │   └── ...
│   ├── service/            # 서비스 (204개)
│   ├── controller/         # 컨트롤러 (77개)
│   ├── repository/         # 리포지토리 (61개)
│   └── dto/                # DTO (88개)
│
├── erp/                    # ERP 모듈 (재무/회계)
│   ├── entity/             # ERP 엔티티
│   │   ├── Item            # 아이템 (비품/재고)
│   │   ├── PurchaseRequest # 구매 요청
│   │   ├── PurchaseOrder   # 구매 주문
│   │   ├── Budget          # 예산
│   │   ├── FinancialTransaction # 재무 거래
│   │   └── ...
│   ├── service/            # ERP 서비스
│   │   ├── ErpService     # ERP 서비스
│   │   ├── FinancialTransactionService # 재무 거래 서비스
│   │   └── ...
│   ├── controller/         # ERP 컨트롤러
│   │   ├── ErpController  # ERP 컨트롤러
│   │   ├── HQErpController # 본사 ERP 컨트롤러
│   │   └── ...
│   └── repository/         # ERP 리포지토리
│
└── user/                   # 사용자 모듈
    ├── controller/         # 컨트롤러 (1개)
    ├── service/            # 서비스 (1개)
    └── dto/                # DTO (2개)
```

---

## 📊 레이어 구조

### 공통 레이어 (Common Layer)

```
┌─────────────────────────────────────────────────────────────┐
│              공통 코어 레이어 (Common Core)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  인증/인가 (Authentication/Authorization)              │  │
│  │  - AuthController                                     │  │
│  │  - OAuth2Controller                                   │  │
│  │  - SecurityConfig                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  테넌트 관리 (Tenant Management)                      │  │
│  │  - Tenant                                             │  │
│  │  - OnboardingController                              │  │
│  │  - TenantRoleController                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  역할 관리 (Role Management)                          │  │
│  │  - RoleTemplate                                       │  │
│  │  - TenantRole                                         │  │
│  │  - UserRoleAssignment                                │  │
│  │  - RolePermission                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  대시보드 관리 (Dashboard Management)                 │  │
│  │  - TenantDashboard                                    │  │
│  │  - TenantDashboardController                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  공통 코드 관리 (Common Code)                         │  │
│  │  - CommonCode                                         │  │
│  │    ├─ CoreSolution 공통 코드 (tenant_id = NULL)      │  │
│  │    └─ 입점사 공통 코드 (tenant_id = UUID)            │  │
│  │  - CodeGroupMetadata                                 │  │
│  │    ├─ code_type: CORE (CoreSolution 코드)            │  │
│  │    └─ code_type: TENANT (입점사 코드)                │  │
│  │  - CommonCodeService                                 │  │
│  │  - CommonCodeController                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ERP 레이어 (ERP Layer)                               │  │
│  │  - ErpService                                         │  │
│  │  - ErpController                                      │  │
│  │  - Item (비품/재고)                                   │  │
│  │  - PurchaseRequest (구매 요청)                        │  │
│  │  - PurchaseOrder (구매 주문)                          │  │
│  │  - Budget (예산)                                      │  │
│  │  - FinancialTransaction (재무 거래)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  멀티테넌시 (Multi-Tenancy)                           │  │
│  │  - TenantContext                                      │  │
│  │  - TenantContextHolder                               │  │
│  │  - TenantIdentifierResolver                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  상담소 모델    │  │  학원 모델      │  │  기타 업종      │
│  (Consultation)│  │  (Academy)     │  │  (Future)      │
│                │  │                │  │                │
│  - 상담 예약   │  │  - 강좌 관리    │  │  - 업종별 기능  │
│  - 세션 관리   │  │  - 반 관리      │  │                │
│  - 상담 기록   │  │  - 출석 관리    │  │                │
│  - 결제 관리   │  │  - 성적 관리    │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## 🔄 데이터 흐름

### 사용자 인증 흐름

```
사용자
  ↓
AuthController (/api/v1/auth/login)
  ↓
AuthService
  ↓
UserRepository (사용자 조회)
  ↓
UserRoleAssignmentRepository (역할 조회)
  ↓
TenantRoleRepository (역할 정보 조회)
  ↓
AuthResponse (역할 정보 포함)
  ↓
동적 대시보드 라우팅
```

### 테넌트 온보딩 흐름

```
온보딩 요청
  ↓
OnboardingController (/api/v1/onboarding/request)
  ↓
OnboardingService
  ↓
PL/SQL 프로시저 (ProcessOnboardingApproval)
  ├─ 테넌트 생성
  ├─ 기본 역할 템플릿 적용
  ├─ 기본 대시보드 생성
  ├─ 기본 컴포넌트 활성화
  └─ 기본 구독 생성
  ↓
온보딩 완료
```

### 역할 할당 흐름

```
사용자 역할 할당
  ↓
UserRoleAssignmentController (/api/v1/user-role-assignments)
  ↓
UserRoleAssignmentService
  ↓
UserRoleAssignmentRepository (할당 저장)
  ↓
RolePermissionRepository (권한 조회)
  ↓
권한 검증
```

---

## 📦 모듈별 구조

### Core 모듈

**도메인 엔티티:**
- `Tenant`: 테넌트 정보
- `TenantRole`: 테넌트 역할
- `UserRoleAssignment`: 사용자 역할 할당
- `RoleTemplate`: 역할 템플릿
- `TenantDashboard`: 테넌트 대시보드
- `PricingPlan`: 요금제
- `ComponentCatalog`: 컴포넌트 카탈로그

**주요 서비스:**
- `TenantRoleService`: 역할 관리
- `UserRoleAssignmentService`: 역할 할당
- `TenantDashboardService`: 대시보드 관리
- `OnboardingService`: 온보딩 관리

**주요 컨트롤러:**
- `TenantRoleController`: 역할 관리 API
- `UserRoleAssignmentController`: 역할 할당 API
- `TenantDashboardController`: 대시보드 관리 API
- `OnboardingController`: 온보딩 API

### Consultation 모듈

**도메인 엔티티:**
- `User`: 사용자 (상속: Consultant, Client)
- `Branch`: 지점
- `Schedule`: 일정
- `Consultation`: 상담
- `ConsultationMessage`: 상담 메시지
- `Payment`: 결제
- `Account`: 계좌

**주요 서비스:**
- `AuthService`: 인증
- `UserService`: 사용자 관리
- `ScheduleService`: 일정 관리
- `ConsultationService`: 상담 관리
- `PaymentService`: 결제 관리
- `CommonCodeService`: 공통 코드 관리
  - CoreSolution 공통 코드 관리
  - 입점사 공통 코드 관리
  - 코드 그룹 메타데이터 관리

**주요 컨트롤러:**
- `AuthController`: 인증 API
- `UserController`: 사용자 관리 API
- `ScheduleController`: 일정 관리 API
- `ConsultationController`: 상담 관리 API
- `PaymentController`: 결제 API
- `CommonCodeController`: 공통 코드 관리 API

---

## 🗄️ 데이터베이스 구조

### 핵심 테이블

```
Tenant (테넌트)
  ├─ Branch (지점)
  │   └─ User (사용자)
  │       └─ UserRoleAssignment (역할 할당)
  │
  ├─ TenantRole (테넌트 역할)
  │   └─ RolePermission (역할 권한)
  │
  ├─ TenantDashboard (대시보드)
  │
  └─ TenantSubscription (구독)
      └─ TenantComponent (컴포넌트)
```

### 역할 시스템 테이블

```
RoleTemplate (역할 템플릿)
  ├─ RoleTemplatePermission (템플릿 권한)
  └─ RoleTemplateMapping (템플릿 매핑)
      ↓
TenantRole (테넌트 역할)
  ├─ RolePermission (역할 권한)
  └─ UserRoleAssignment (사용자 할당)
```

### 상담소 모델 테이블

```
User (사용자)
  ├─ Consultant (상담사)
  └─ Client (내담자)
      │
      └─ Schedule (일정)
          └─ Consultation (상담)
              └─ ConsultationMessage (상담 메시지)
```

### 공통 코드 테이블

```
CommonCode (공통 코드)
  ├─ tenant_id: NULL (CoreSolution 코드)
  ├─ tenant_id: UUID (입점사 코드)
  ├─ code_group: 코드 그룹
  ├─ code_value: 코드 값
  ├─ code_label: 코드 라벨
  ├─ korean_name: 한글명 (필수)
  └─ code_description: 설명

CodeGroupMetadata (코드 그룹 메타데이터)
  ├─ code_group: 코드 그룹
  ├─ code_type: CORE 또는 TENANT
  └─ description: 설명
```

---

## 🔌 API 구조

### API 경로 구조

```
/api/v1/
├── auth/                    # 인증
│   ├── login
│   ├── logout
│   └── refresh
│
├── tenants/                 # 테넌트 관리
│   ├── {tenantId}/roles     # 역할 관리
│   └── {tenantId}/dashboards # 대시보드 관리
│
├── users/                   # 사용자 관리
│   ├── {userId}/roles       # 역할 할당
│   └── {userId}/profile     # 프로필
│
├── tenants/                 # 테넌트 관리
│   ├── {tenantId}/profile   # 테넌트 프로필 (상태, 구독, 결제 수단)
│   ├── {tenantId}/subscriptions # 구독 관리
│   └── {tenantId}/payment-methods # 결제 수단 관리
│
├── schedules/               # 일정 관리
├── consultations/           # 상담 관리
├── payments/                # 결제 관리
└── admin/                   # 관리자 기능
```

---

## 🔄 시스템 프로세스

### 1. 사용자 로그인 프로세스

```
1. 사용자 로그인 요청
   ↓
2. 인증 처리 (AuthService)
   ↓
3. 사용자 조회 (UserRepository)
   ↓
4. 역할 조회 (UserRoleAssignmentRepository)
   ↓
5. 권한 조회 (RolePermissionRepository)
   ↓
6. 동적 대시보드 경로 결정
   ↓
7. AuthResponse 반환
```

### 2. 테넌트 온보딩 프로세스

```
1. 온보딩 요청 생성
   ↓
2. HQ 승인 대기
   ↓
3. 승인 처리 (PL/SQL 프로시저)
   ├─ 테넌트 생성
   ├─ 기본 역할 템플릿 적용
   ├─ 기본 대시보드 생성
   ├─ 기본 컴포넌트 활성화
   └─ 기본 구독 생성
   ↓
4. 온보딩 완료
```

### 3. 역할 관리 프로세스

```
1. 역할 템플릿 조회
   ↓
2. 템플릿 기반 역할 생성
   ├─ TenantRole 생성
   └─ RolePermission 복제
   ↓
3. 역할 커스터마이징
   ├─ 역할명 수정
   └─ 권한 추가/수정
   ↓
4. 사용자 역할 할당
   └─ UserRoleAssignment 생성
```

---

## 📊 정보 계층 구조

### 레벨 1: 플랫폼 레벨

- 테넌트 관리
- 역할 템플릿 관리
- 컴포넌트 카탈로그
- 요금제 관리

### 레벨 2: 테넌트 레벨

- 테넌트 역할 관리
- 테넌트 대시보드 관리
- 테넌트 구독 관리
- 테넌트 컴포넌트 활성화

### 레벨 3: 사용자 레벨

- 사용자 역할 할당
- 사용자 프로필 관리
- 사용자 권한 관리

### 레벨 4: 업종별 기능 레벨

- 상담소: 상담, 일정, 결제
- 학원: 강좌, 출석, 성적
- 기타: 업종별 기능

---

## 🔗 관련 문서

- [데이터 흐름도](./DATA_FLOW_DIAGRAM.md)
- [동적 역할 시스템](./DYNAMIC_ROLE_SYSTEM.md)
- [테넌트 대시보드 관리 시스템](../TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md)

---

**마지막 업데이트**: 2025-11-21

## 📝 변경 이력

### v1.1.0 (2025-11-21)
- 테넌트 프로필 페이지 추가 (`/tenant/profile`)
- 테넌트 구독 관리 API 추가
- 테넌트 결제 수단 관리 API 추가
- 온보딩 완료 후 로그인 시 테넌트 프로필 페이지로 리다이렉트 기능 추가

