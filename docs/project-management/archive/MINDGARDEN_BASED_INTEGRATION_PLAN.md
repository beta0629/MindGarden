# 코어솔루션 기반 통합 및 고도화 계획

## 1. 개요

### 1.1 시스템 목적

**핵심 목적:**
- **소상공인이 필요한 시스템을 저비용으로 활용**할 수 있도록 제공
- 소상공인도 대기업 수준의 ERP 시스템을 저렴하게 사용 가능
- 복잡한 권한 관리 없이 간단하게 운영 가능
- 상품성 있는 솔루션으로 시장 경쟁력 확보

**최우선 원칙: 사용성 (Usability First)**
- ✅ **사용하기 편해야 함** - 어려우면 안 씀
- ✅ **입력은 회원가입 때만** - 그 외에는 자동화
- ✅ **복잡한 설정 없음** - 모든 것이 자동으로 동작
- ✅ **모바일 앱 지원** - 추후 앱 개발 필수

**특화 영역 (핵심 가치):**
1. **ERP 시스템 특화** - 소상공인 맞춤형 재무/회계/정산 시스템 (자동화)
2. **권한 확장 시스템 특화** - 업종별, 역할별 세밀한 권한 관리 (템플릿 기반 자동)
3. **통합 로그인 시스템** - SSO 기반 단일 로그인 경험 (모든 업종 통합)
4. **상품성** - 마케팅 가능한 완성도 높은 SaaS 솔루션 (추후 논의)
5. **사용성** - 최소한의 입력, 최대한의 자동화
6. **브랜딩** - 입점사 로고 및 상호 노출 (자신의 브랜드로 운영)

### 1.2 핵심 전략

**통합 전략:**
- 코어솔루션 상담소 시스템을 기반으로 모든 시스템 통합
- 코어솔루션을 테넌트 시스템으로 완전 통합
- BaseTenantService 패턴을 코어솔루션에 먼저 적용
- 코어솔루션 패턴을 학원 시스템에 적용
- **ERP는 핵심 특화 영역으로 고도화**
- **권한 확장 시스템은 핵심 특화 영역으로 고도화**
- **온보딩 시스템을 마인드가든과 통합**
- **내부 시스템(ops 포털)을 마인드가든과 통합**
- **통합 로그인 시스템 구축 (SSO 완성)**
- **입점사 브랜딩 시스템 (로고 및 상호 노출)**

## 2. 현재 상태 분석

### 2.1 코어솔루션 시스템 현황

**패키지 구조:**
```
com.mindgarden.consultation/
├── entity/          # 68개 엔티티
├── repository/       # 60개 Repository
├── service/          # 195개 Service
├── controller/       # 76개 Controller
└── dto/              # 67개 DTO
```

**테넌트 지원 상태:**
- ✅ `BaseEntity`에 `tenant_id` 필드 존재
- ✅ `Branch` 엔티티에 `tenant_id` 필드 존재
- ⚠️ 하지만 테넌트 컨텍스트 활용 미흡
- ⚠️ 서비스 레이어에서 테넌트 필터링 미적용
- ⚠️ BaseTenantService 패턴 미적용

**배치 시스템:**
- ✅ `@EnableScheduling` 활성화
- ✅ Spring `@Scheduled` 어노테이션 사용
- ✅ 여러 스케줄러 구현:
  - `SalaryBatchScheduler` (급여 배치)
  - `ConsultationRecordAlertScheduler` (상담 기록 알림)
  - `SessionCleanupScheduler` (세션 정리)
  - `WellnessNotificationScheduler` (웰니스 알림)
  - `ScheduleAutoCompleteService` (스케줄 자동 완료)
- ✅ 배치 시스템 공통 활용 가능

### 2.2 CoreSolution 시스템 현황

**패키지 구조:**
```
com.coresolution.core/
├── domain/
│   ├── Tenant, Branch (테넌트 시스템)
│   └── academy/ (학원 시스템 - 신규)
├── service/
│   ├── BaseTenantService (공통 서비스)
│   ├── academy/ (학원 서비스)
│   └── OnboardingApprovalService (온보딩 승인)
└── context/
    └── TenantContextHolder (테넌트 컨텍스트)
```

**온보딩 시스템:**
- ✅ `OnboardingApprovalService` 구현
- ✅ PL/SQL 프로시저 `ProcessOnboardingApproval` 존재
- ✅ ERD 자동 생성 프로시저 `GenerateErdOnOnboardingApproval` 존재
- ⚠️ 코어솔루션과 통합 필요

**내부 시스템 (Ops Portal):**
- ✅ `backend-ops` 패키지에 별도 구현
- ✅ `OnboardingService` (ops 포털용)
- ✅ `OnboardingController` (ops 포털용)
- ⚠️ 코어솔루션과 통합 필요

## 3. 통합 전략

### 3.1 단계별 통합 계획

```
Phase 1: 마인드가든 테넌트 시스템 통합 (2주)
    ↓
Phase 2: 마인드가든 BaseTenantService 패턴 적용 (2주)
    ↓
Phase 3: 온보딩 및 내부 시스템 통합 (2주)
    ↓
Phase 4: 학원 시스템을 마인드가든 패턴으로 고도화 (2주)
    ↓
Phase 5: ERP 공통 레이어 통합 (2주)
    ↓
Phase 6: 통합 검증 및 최적화 (1주)
```

### 3.2 통합 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│              공통 코어 레이어 (Common Core)                  │
│  - 테넌트/지점 관리 (Tenant/Branch Management)              │
│  - TenantContextHolder (테넌트 컨텍스트)                     │
│  - BaseTenantService (공통 CRUD 패턴)                        │
│  - 프로시저 호출 서비스 (StoredProcedureService)            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  마인드가든     │  │  학원 시스템    │  │  ERP 공통 기능  │
│  (상담소)      │  │  (Academy)     │  │  (Common ERP)  │
│                │  │                │  │                │
│  [기반 시스템]  │  │  [마인드가든    │  │  - 재무 거래    │
│                │  │   패턴 적용]    │  │  - 회계 분개    │
│  - 상담 예약   │  │                │  │  - 급여 계산    │
│  - 세션 관리   │  │  - 강좌 관리    │  │  - 정산 계산    │
│  - 상담 이력   │  │  - 반 관리      │  │  - 리포트 생성  │
│  - 결제 연동   │  │  - 수강 등록    │  │  (프로시저 기반)│
│  - ERP 연동    │  │  - 출결 관리    │  │                │
│                │  │                │  │                │
│  BaseTenant   │  │  BaseTenant    │  │  BaseTenant    │
│  Service 사용  │  │  Service 사용  │  │  Service 사용  │
└────────────────┘  └────────────────┘  └────────────────┘
```

## 4. Phase 1: 코어솔루션 테넌트 시스템 통합 (2주)

### 4.1 목표
- 코어솔루션을 완전한 테넌트 시스템으로 통합
- TenantContextHolder 활용
- 모든 서비스에서 테넌트 필터링 적용

### 4.2 작업 내용

#### Week 1: 테넌트 컨텍스트 통합

**Day 1-2: TenantContextHolder 통합**
- [x] `TenantContextFilter`를 코어솔루션에 적용
- [x] 모든 Controller에서 테넌트 컨텍스트 자동 설정
- [x] SecurityConfig에 필터 등록

**Day 3-4: Repository 레벨 테넌트 필터링**
- [ ] `BaseRepository`에 테넌트 필터링 메서드 추가
- [ ] 모든 Repository에서 `tenant_id` 자동 필터링
- [ ] 쿼리 메서드에 테넌트 조건 자동 추가

**Day 5: 테넌트 접근 제어 서비스 통합**
- [ ] `TenantAccessControlService`를 마인드가든에 적용
- [ ] 모든 서비스에서 테넌트 접근 검증
- [ ] 테스트 코드 작성

#### Week 2: 데이터 마이그레이션 및 검증

**Day 1-2: 기존 데이터 테넌트 매핑**
- [x] 기존 Branch 데이터를 Tenant로 매핑 (V2 마이그레이션)
- [x] Branch 테이블에 `tenant_id` 컬럼 추가 (V3 마이그레이션)
- [x] 주요 엔티티 테이블에 `tenant_id` 컬럼 추가 (V4 마이그레이션)
- [x] 마이그레이션 스크립트 작성 및 실행 (V2, V3, V4)
- [x] 검증 스크립트 작성 (V20)

**Day 3-4: 서비스 레이어 테넌트 필터링 적용**
- [x] `ConsultationService`에 테넌트 필터링 적용
- [ ] `ClientService`에 테넌트 필터링 적용 (Client는 User 엔티티로 관리되는 것으로 보임)
- [x] `ConsultantService`에 테넌트 필터링 적용
- [x] `ScheduleService`에 테넌트 필터링 적용
- [x] `PaymentService`에 테넌트 필터링 적용
- [ ] 기타 주요 서비스들에 테넌트 필터링 적용

**Day 5: 통합 테스트**
- [x] 멀티테넌트 시나리오 테스트 (MultiTenantIntegrationTest)
- [x] 테넌트 간 데이터 격리 검증 (Consultation, Consultant, Schedule, Payment)
- [x] Repository 레벨 데이터 격리 검증
- [x] 테넌트 컨텍스트 전환 시나리오
- [x] tenant_id 자동 설정 검증
- [ ] 성능 테스트 (추후 진행)

## 5. Phase 2: 마인드가든 BaseTenantService 패턴 적용 (2주)

### 5.1 목표
- 마인드가든 서비스를 BaseTenantService 패턴으로 리팩토링
- 공통 CRUD 로직 추출
- 일관된 API 패턴 적용

### 5.2 작업 내용

#### Week 1: 핵심 서비스 리팩토링

**Day 1-2: ConsultationService 리팩토링**
- [x] `BaseTenantEntityService` 인터페이스 생성 (엔티티 기반 BaseTenantService)
- [x] `BaseTenantEntityServiceImpl` 구현체 생성
- [x] `ConsultationServiceImpl` → `BaseTenantEntityServiceImpl` 상속
- [x] 공통 CRUD 메서드를 BaseTenantEntityService로 위임
- [x] 비즈니스 로직만 유지 (기존 로직 100% 보존)

**Day 3-4: ClientService 리팩토링**
- [x] `Client` 엔티티 → `BaseEntity` 상속 (테넌트 시스템 지원)
- [x] `ClientRepository` → `BaseRepository` 상속 (테넌트 필터링 지원)
- [x] `ClientService` 인터페이스 생성
- [x] `ClientServiceImpl` → `BaseTenantEntityServiceImpl` 상속
- [x] 공통 CRUD 메서드를 BaseTenantEntityService로 위임
- [x] ClientService 특화 메서드 구현 (이메일, 이름, 전화번호 등 검색)

**Day 5: ConsultantService 리팩토링**
- [x] `ConsultantServiceImpl` → `BaseTenantEntityServiceImpl` 상속
- [x] 추상 메서드 구현 (findEntityById, findEntitiesByTenantAndBranch)
- [x] 공통 CRUD 메서드를 BaseTenantEntityService로 위임
- [x] 기존 비즈니스 로직 100% 보존

#### Week 2: 나머지 서비스 리팩토링

**Day 1-2: PaymentService, ScheduleService 리팩토링**
- [x] `PaymentServiceImpl` → `BaseTenantEntityServiceImpl` 상속
- [x] `ScheduleServiceImpl` → `BaseTenantEntityServiceImpl` 상속
- [x] 추상 메서드 구현 (findEntityById, findEntitiesByTenantAndBranch)
- [x] 공통 CRUD 메서드를 BaseTenantEntityService로 위임
- [x] 기존 DTO 기반 메서드 유지 (PaymentResponse, ScheduleDto 등)

**Day 3-4: 기타 서비스 리팩토링**
- [x] `ConsultationMessageServiceImpl` → `BaseTenantEntityServiceImpl` 상속
- [x] `AlertServiceImpl` → `BaseTenantEntityServiceImpl` 상속
- [x] `BranchServiceImpl` → `BaseTenantEntityServiceImpl` 상속
- [x] 추상 메서드 구현 (findEntityById, findEntitiesByTenantAndBranch)
- [x] BaseService 메서드 구현 (save, update, findAllActive 등)
- [x] 공통 CRUD 메서드를 BaseTenantEntityService로 위임

**Day 5: 통합 테스트**
- [x] `BaseTenantEntityServiceIntegrationTest` 작성
- [x] 리팩토링된 서비스 테스트 (ConsultationService, ClientService, ConsultantService, PaymentService, ScheduleService, ConsultationMessageService, AlertService, BranchService)
- [x] BaseTenantEntityService 패턴 동작 검증 (create, update, findAllByTenant 등)
- [x] 테넌트 필터링 검증
- [x] 여러 서비스 동시 사용 시나리오 테스트
- [x] 성능 테스트 (10개 엔티티 생성)
- [ ] 기존 기능 동작 검증 (추가 테스트 필요)
- [ ] 성능 비교 (추후 진행)

## 6. Phase 3: 통합 로그인 시스템 구축 (2주) ⭐

### 6.1 목표
- **SSO 기반 통합 로그인 시스템 완성**
- JWT 토큰에 tenantId, branchId, permissions 포함
- 테넌트별 자동 라우팅
- 모든 업종 통합 로그인

### 6.2 작업 내용

#### Week 1: JWT 토큰 확장 및 통합 로그인 플로우

**Day 1-2: JWT 토큰 확장**
- [x] `JwtService.generateToken()` 확장
  - `tenantId`, `branchId`, `permissions` 포함
  - 사용자 정보에서 자동 추출
- [x] JWT Payload 구조 확장 (userId, email, username, role, tenantId, branchId, permissions)
- [x] JWT 검증 로직 확장 (extractTenantId, extractBranchId, extractPermissions 메서드 추가)
- [x] `AuthServiceImpl` 수정 (확장된 JWT 토큰 생성 메서드 사용)
- [x] `DynamicPermissionService` 통합 (사용자 권한 조회 및 JWT 토큰에 포함)

**Day 3-4: 통합 로그인 플로우**
- [x] `JwtAuthenticationFilter` 확장 (JWT 토큰에서 tenantId, branchId 추출하여 TenantContextHolder 자동 설정)
- [x] `AbstractOAuth2Service` 수정 (확장된 JWT 토큰 생성 메서드 사용)
- [x] `OAuth2Controller` 수정 (확장된 JWT 토큰 생성 메서드 사용)
- [x] 소셜 로그인 통합 (Kakao/Naver) - 확장된 JWT 토큰 생성 적용
- [x] 테넌트 자동 감지 로직 (TenantContextFilter에 이미 구현됨)
- [x] **프론트엔드: 통합 로그인 페이지 구현**
  - [x] 통합 로그인 컴포넌트 생성 (`components/auth/UnifiedLogin.js`)
  - [x] ID/PW 로그인 폼 통합
  - [x] 소셜 로그인 버튼 통합 (Kakao/Naver/Google) - MindGarden 기존 구현 참고
  - [x] 테넌트 자동 감지 및 라우팅 로직
  - [x] App.js 라우트 추가 (`/login` → `UnifiedLogin`)
- [x] **프론트엔드: 테넌트 선택 화면**
  - [x] 테넌트 선택 컴포넌트 생성 (`components/auth/TenantSelection.js`)
  - [x] 접근 가능한 테넌트 목록 표시
  - [x] 테넌트 선택 시 전환 API 호출 (`/api/auth/tenant/switch`)
  - [x] 멀티 테넌트 사용자 감지 및 자동 표시
- [x] **프론트엔드: 테넌트별 대시보드 자동 라우팅**
  - [x] 로그인 성공 후 테넌트 정보 기반 자동 라우팅
  - [x] 역할별 대시보드 자동 이동 로직 (`redirectToDashboardWithFallback` 사용)
  - [x] 멀티 테넌트 사용자 선택 화면 연동
  - [x] 테넌트 전환 후 자동 라우팅 (TenantSelection 컴포넌트에서 처리)

**Day 5: 테넌트 컨텍스트 자동 설정**
- [x] JWT 토큰에서 테넌트 정보 추출 (JwtAuthenticationFilter에서 구현)
- [x] TenantContextHolder 자동 설정 (JwtAuthenticationFilter에서 구현)
- [ ] 테스트 코드 작성 (추후 진행)

#### Week 2: Refresh Token 및 고급 기능

**Day 1-2: Refresh Token 구현**
- [x] `refresh_token_store` 테이블 생성 (V21 마이그레이션)
- [x] `RefreshToken` 엔티티 생성
- [x] `RefreshTokenRepository` 생성
- [x] `RefreshTokenService` 생성 (저장/조회/로테이션 로직)
- [x] `AuthServiceImpl` 수정 (Refresh Token 저장 로직 추가)
- [ ] Refresh Token API 개선 (tokenId 기반 검증, 추후 구현)

**Day 3-4: 멀티 테넌트 사용자 지원**
- [x] `MultiTenantUserService` 생성 (멀티 테넌트 사용자 감지, 접근 가능한 테넌트 목록 조회)
- [x] `MultiTenantController` 생성 (테넌트 목록 조회, 테넌트 전환 API)
- [x] 멀티 테넌트 사용자 감지 로직 (2개 이상의 테넌트에 접근 가능한 경우)
- [x] 테넌트 전환 기능 (세션 및 TenantContextHolder 업데이트)
- [x] **프론트엔드: 테넌트 선택 화면**
  - [x] 테넌트 선택 컴포넌트 생성 (`components/auth/TenantSelection.js`)
  - [x] 접근 가능한 테넌트 목록 표시
  - [x] 테넌트 선택 시 전환 API 호출 (`/api/auth/tenant/switch`)
  - [x] 선택된 테넌트로 자동 라우팅

**Day 5: 통합 테스트**
- [x] `UnifiedLoginIntegrationTest` 작성 (통합 로그인 시스템 통합 테스트)
- [x] ID/PW 로그인 테스트 (JWT 토큰에 tenantId, branchId, permissions 포함 확인)
- [x] Refresh Token 저장 및 갱신 테스트
- [x] 멀티 테넌트 사용자 감지 테스트
- [x] 테넌트 접근 권한 확인 테스트
- [x] 테넌트별 라우팅 테스트 (현재 테넌트, 기본 테넌트 조회)
- [x] 보안 검증 (Refresh Token 무효화, 사용자별 토큰 무효화)
- [x] JWT 토큰에서 TenantContextHolder 자동 설정 테스트
- [ ] 소셜 로그인 테스트 (추후 진행)

## 7. Phase 4: 온보딩 및 내부 시스템 통합 (2주)

### 6.1 목표
- 온보딩 시스템을 마인드가든과 통합
- 내부 시스템(ops 포털)을 마인드가든과 통합
- 테넌트 온보딩 프로세스 자동화

### 6.2 작업 내용

#### Week 1: 온보딩 시스템 통합

**Day 1-2: OnboardingService 통합**
- [x] `OnboardingRequest` 엔티티 생성 (`com.coresolution.core.domain.onboarding`)
- [x] `OnboardingStatus`, `RiskLevel` enum 생성
- [x] `OnboardingRequestRepository` 생성
- [x] `OnboardingService` 인터페이스 및 구현체 생성
- [x] `OnboardingApprovalService` 통합 (PL/SQL 프로시저 호출)
- [x] `decide()` 메서드에서 승인 시 자동으로 PL/SQL 프로시저 호출

**Day 3-4: 온보딩 API 통합**
- [x] `OnboardingCreateRequest` DTO 생성
- [x] `OnboardingDecisionRequest` DTO 생성
- [x] `OnboardingController` 생성
- [x] 온보딩 요청 API 통합
  - GET /api/onboarding/requests/pending (대기 중인 요청 목록)
  - GET /api/onboarding/requests/{id} (요청 상세 조회)
  - POST /api/onboarding/requests (요청 생성)
- [x] 온보딩 승인 API 통합
  - POST /api/onboarding/requests/{id}/decision (요청 결정 - 승인/거부)
- [x] 온보딩 상태 조회 API 통합
  - GET /api/onboarding/requests?status={status} (상태별 요청 목록)
  - GET /api/onboarding/requests/count?status={status} (상태별 요청 개수)
- [ ] **프론트엔드: 온보딩 페이지 구현** (내일 진행)
  - [ ] 온보딩 요청 페이지 (`components/onboarding/OnboardingRequest.js`)
    - [ ] 테넌트 정보 입력 폼 (tenantName, businessType 등)
    - [ ] 체크리스트 입력 (checklistJson)
    - [ ] 위험도 선택 (riskLevel)
    - [ ] 요청 제출 API 연동
  - [ ] 온보딩 승인 페이지 (`components/ops/OnboardingApproval.js`)
    - [ ] 대기 중인 요청 목록 표시
    - [ ] 요청 상세 정보 표시
    - [ ] 승인/거부 결정 UI
    - [ ] 승인/거부 API 연동
  - [ ] 온보딩 상태 조회 페이지 (`components/onboarding/OnboardingStatus.js`)
    - [ ] 상태별 요청 목록 필터링
    - [ ] 요청 상세 정보 조회

**Day 5: 온보딩 프로세스 자동화**
- [x] 테넌트 자동 생성 프로세스 (ProcessOnboardingApproval 프로시저 내부에서 처리)
  - `CreateOrActivateTenant` 프로시저 호출
  - 테넌트 생성 또는 활성화 자동 처리
- [x] ERD 자동 생성 프로세스 (ProcessOnboardingApproval 프로시저 내부에서 처리)
  - `GenerateErdOnOnboardingApproval` 프로시저 호출
  - 전체 시스템 ERD 및 업종별 모듈 ERD 자동 생성
  - ERD 생성 실패 시 경고만 (온보딩 프로세스는 계속 진행)
- [x] 기본 권한 템플릿 자동 적용 (ProcessOnboardingApproval 프로시저 내부에서 처리)
  - `ApplyDefaultRoleTemplates` 프로시저 호출
  - 업종별 기본 역할 템플릿 자동 적용
  - 템플릿 권한 자동 복제
- [x] **자동 승인 시스템 구현** ⭐
  - `AutoApprovalService` 인터페이스 및 구현체 생성
  - 자동 승인 조건 체크 로직 구현
    - 위험도 체크 (기본값: LOW만 허용)
    - 결제 수단 등록 여부 체크 (checklistJson의 paymentMethodId)
    - 구독 생성 여부 체크 (checklistJson의 subscriptionId)
    - 허용 업종 체크 (선택적, 설정 가능)
  - `OnboardingServiceImpl.create()`에서 요청 생성 후 자동 승인 체크
  - 조건 만족 시 자동으로 `APPROVED` 상태로 변경 및 PL/SQL 프로시저 호출
  - `application.yml`에 자동 승인 설정 추가
    - `onboarding.auto-approval.enabled`: 자동 승인 활성화 여부
    - `onboarding.auto-approval.allowed-risk-levels`: 허용 위험도 (쉼표로 구분)
    - `onboarding.auto-approval.allowed-business-types`: 허용 업종 (쉼표로 구분, 비어있으면 모든 업종 허용)
    - `onboarding.auto-approval.require-payment-method`: 결제 수단 필수 여부
    - `onboarding.auto-approval.require-subscription`: 구독 필수 여부
- [ ] **입점사 PG 등록 단계 추가** ⭐ (추후 구현)
  - 온보딩 프로세스에 PG사 등록 단계 추가
  - `TenantPgConfiguration` 엔티티 활용 (이미 구현됨)
  - 온보딩 요청 시 PG 설정 정보 수집
  - PG 설정 승인 프로세스 통합
  - ERP 자동 구성 연계 준비
- [ ] **ERP 자동 구성 연계** ⭐ (추후 구현)
  - PG 등록 완료 후 ERP 자동 구성 트리거
  - 테넌트별 PG 설정 기반 ERP 모듈 자동 활성화
  - 결제/정산 ERP 모듈 자동 연동
  - PL/SQL 프로시저 확장 (`ProcessOnboardingApproval`에 ERP 구성 로직 추가)
- [x] 추가 자동화 프로세스
  - 카테고리 매핑 자동 설정 (SetupTenantCategoryMapping)
  - 기본 컴포넌트 자동 활성화 (ActivateDefaultComponents)
  - 기본 요금제 구독 생성 (CreateDefaultSubscription)
- [x] OnboardingServiceImpl.decide() 메서드에서 승인 시 자동으로 모든 프로세스 실행

#### Week 2: 내부 시스템(ops 포털) 통합

**Day 1-2: ops 포털 서비스 통합**
- [x] `DashboardService` 생성 (코어솔루션 통합)
  - 대시보드 메트릭 조회 (온보딩, 요금제, Feature Flag)
  - OnboardingRequestRepository, PricingPlanRepository, FeatureFlagRepository 통합
- [x] `PricingPlanService` 생성 (코어솔루션 통합)
  - 요금제 조회 메서드 (findAllPlans, findAllActivePlans, findByPlanCode, findByPlanId)
  - 활성 요금제 개수 조회
  - PricingPlanRepository 통합
- [x] `FeatureFlagService` 생성 (코어솔루션 통합)
  - Feature Flag 조회 메서드 (findAll, findAllEnabled, findByFlagKey)
  - 상태별 Feature Flag 개수 조회
  - FeatureFlagRepository 통합
- [x] `FeatureFlag` 엔티티 생성 (ops 포털용)
- [x] `FeatureFlagState` enum 생성 (DISABLED, SHADOW, ENABLED)
- [x] `FeatureFlagRepository` 생성
- [x] `PricingPlanRepository` 생성

**Day 3-4: ops 포털 API 통합**
- [x] `DashboardOpsController` 생성
  - GET /api/ops/dashboard/metrics (대시보드 메트릭 조회)
- [x] `PricingPlanOpsController` 생성
  - GET /api/ops/plans (모든 요금제 목록)
  - GET /api/ops/plans/active (활성화된 요금제 목록)
  - GET /api/ops/plans/code/{planCode} (plan_code로 조회)
  - GET /api/ops/plans/{planId} (plan_id로 조회)
  - TODO: createPlan, updatePlan, deactivatePlan 등 CRUD 메서드 추가 필요
- [x] `FeatureFlagOpsController` 생성
  - GET /api/ops/feature-flags (모든 Feature Flag 목록)
  - GET /api/ops/feature-flags/enabled (활성화된 Feature Flag 목록)
  - GET /api/ops/feature-flags/key/{flagKey} (flag_key로 조회)
  - TODO: create, toggle 등 CRUD 메서드 추가 필요 (FeatureFlagService 확장 필요)
- [x] DTO 생성
  - PricingPlanCreateRequest, PricingPlanUpdateRequest
  - FeatureFlagCreateRequest, FeatureFlagToggleRequest
- [ ] **프론트엔드: Ops 포털 대시보드 구현** (내일 진행)
  - [ ] Ops 대시보드 메인 페이지 (`components/ops/OpsDashboard.js`)
    - [ ] 대시보드 메트릭 표시 (온보딩 대기, 활성 요금제, Feature Flag 등)
    - [ ] 온보딩 요청 목록 위젯
    - [ ] 요금제 관리 링크
    - [ ] Feature Flag 관리 링크
    - [ ] 통합 로그인 연동 (세션 기반 인증)
  - [ ] 요금제 관리 페이지 (`components/ops/PricingPlanManagement.js`)
    - [ ] 요금제 목록 표시
    - [ ] 요금제 생성/수정/비활성화 UI
    - [ ] 요금제 상세 정보 표시
  - [ ] Feature Flag 관리 페이지 (`components/ops/FeatureFlagManagement.js`)
    - [ ] Feature Flag 목록 표시
    - [ ] Feature Flag 생성/토글 UI
    - [ ] Feature Flag 상세 정보 표시
- [ ] **백엔드: Ops 포털 인증/권한 강화** (내일 진행)
  - [ ] `DashboardOpsController` 권한 체크 추가 (`@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")`)
  - [ ] `PricingPlanOpsController` 권한 체크 추가
  - [ ] `FeatureFlagOpsController` 권한 체크 추가
  - [ ] `OnboardingController` 권한 체크 추가 (요청 생성은 공개, 승인은 관리자만)
  - [ ] 통합 로그인 시스템과 연동 확인 (JWT/Session 기반 인증)
  - [ ] **선택적 인증**: 일부 메뉴만 로그인 필요하도록 설정 (공개 메뉴와 보호된 메뉴 분리)

**Day 5: 통합 테스트**
- [x] `OnboardingOpsIntegrationTest` 생성
  - 온보딩 프로세스 전체 테스트 (요청 생성 → 승인 → 자동화 프로세스)
  - Ops 포털 기능 테스트 (대시보드 메트릭, 요금제 조회, Feature Flag 조회)
  - 통합 시나리오 테스트 (온보딩 → Ops 포털 연동)
- [x] 단위 테스트 작성 및 실행 완료
  - `DashboardServiceTest`: 2개 테스트 모두 통과 (메트릭 조회)
  - `PricingPlanServiceTest`: 6개 테스트 모두 통과 (조회 메서드 전체)
  - `FeatureFlagServiceTest`: 6개 테스트 모두 통과 (조회 메서드 전체)
  - `OnboardingServiceTest`: 7개 테스트 모두 통과 (CRUD 및 승인 프로세스)
  - **총 21개 단위 테스트 모두 성공** ✅

## 8. Phase 5: 학원 시스템을 마인드가든 패턴으로 고도화 (2주)

### 6.1 목표
- 마인드가든 패턴을 학원 시스템에 적용
- BaseTenantService 패턴 활용
- 마인드가든과 동일한 구조로 통일

### 6.2 작업 내용

#### Week 1: 학원 시스템 구조 정리

**Day 1-2: 학원 엔티티 검토 및 보완**
- [ ] `Course`, `Class`, `ClassEnrollment`, `Attendance` 엔티티 검토
- [ ] 마인드가든 엔티티 패턴 적용 (BaseEntity 상속, tenant_id 활용)
- [ ] 필요한 필드 추가

**Day 3-4: 학원 서비스 BaseTenantService 패턴 적용**
- [ ] `CourseServiceImpl` → `BaseTenantServiceImpl` 상속
- [ ] `ClassServiceImpl` → `BaseTenantServiceImpl` 상속
- [ ] `ClassEnrollmentServiceImpl` 구현
- [ ] `AttendanceServiceImpl` 구현

**Day 5: 학원 Repository 정리**
- [ ] Repository 인터페이스 정리
- [ ] 테넌트 필터링 메서드 추가
- [ ] 커스텀 쿼리 메서드 추가

#### Week 2: 학원 API 및 통합

**Day 1-2: 학원 API 컨트롤러 구현**
- [ ] `CourseController` 구현 (마인드가든 패턴 적용)
- [ ] `ClassController` 구현
- [ ] `ClassEnrollmentController` 구현
- [ ] `AttendanceController` 구현

**Day 3-4: 학원 시스템 통합 테스트**
- [ ] 학원 시스템 전체 테스트
- [ ] 마인드가든과 학원 시스템 통합 테스트
- [ ] 멀티테넌트 시나리오 테스트

**Day 5: 문서화**
- [ ] 학원 시스템 API 문서 작성
- [ ] 통합 아키텍처 문서 업데이트

## 7. Phase 4: ERP 시스템 특화 및 고도화 (3주) ⭐ 핵심 특화 영역

### 7.1 목표
- **소상공인 맞춤형 ERP 시스템 특화** (핵심 가치)
- 대기업 수준의 ERP 기능을 저비용으로 제공
- 프로시저는 유지하되 Java 서비스 레이어로 통합
- 업종별 정산 로직 확장
- 마인드가든 배치 시스템 공통 활용
- **상품성 있는 ERP 대시보드 및 리포트**

### 7.2 소상공인 맞춤형 ERP 특화 전략

**핵심 가치 제안:**
- ✅ **저비용**: 대기업 ERP 대비 1/10 비용
- ✅ **간편함**: 복잡한 설정 없이 바로 사용 가능
- ✅ **자동화**: 급여, 정산, 세금 자동 계산
- ✅ **업종별 특화**: 상담소, 학원, 요식업 등 업종별 맞춤

**ERP 핵심 기능 (모두 자동화):**
1. **재무 관리 (자동화)**
   - ✅ 매출/지출 자동 기록 (PG 연동, 영수증 OCR)
   - ✅ 현금흐름 자동 관리
   - ✅ 손익계산서 자동 생성 (입력 불필요)

2. **급여 관리 (자동화)**
   - ✅ 급여 자동 계산 (근태 데이터 기반)
   - ✅ 4대보험 자동 계산
   - ✅ 급여 명세서 자동 발급 (이메일/SMS)

3. **정산 관리 (자동화)**
   - ✅ 업종별 정산 자동 계산 (매월 자동)
   - ✅ 정산 리포트 자동 생성
   - ✅ 정산 승인 프로세스 (알림만)

4. **세무 관리 (자동화)**
   - ✅ 부가세 자동 계산
   - ✅ 세금 신고서 자동 생성
   - ✅ 세무 대행 연동 (자동 전송)

5. **구매 관리 (최소 입력)**
   - ✅ 구매 요청 (영수증 촬영만)
   - ✅ 구매 승인 (원클릭)
   - ✅ 공급업체 관리 (자동 등록)

### 7.2 작업 내용

#### Week 1: ERP 핵심 기능 고도화

**Day 1-2: ERP 서비스 BaseTenantService 패턴 적용 및 특화**
- [ ] `FinancialTransactionService` → `BaseTenantService` 패턴 적용
- [ ] `AccountingEntryService` → `BaseTenantService` 패턴 적용
- [ ] 프로시저 호출 서비스 표준화
- [ ] **소상공인 맞춤형 간편 API 설계** (복잡한 설정 최소화)

**Day 3-4: ERP 공통 API 구현 및 사용성 강화**
- [ ] `FinancialTransactionController` 구현
- [ ] `AccountingEntryController` 구현
- [ ] `SettlementController` 구현
- [ ] **ERP 대시보드 API** (한눈에 보는 재무 현황, 입력 불필요)
- [ ] **자동화 API** (PG 연동, 영수증 OCR, 자동 기록)
- [ ] **원클릭 작업 API** (모든 작업을 한 번의 클릭으로)

**Day 5: ERP 리포트 통합 및 자동화 강화**
- [ ] 재무 리포트 자동 생성 API (손익계산서, 현금흐름표) - 입력 불필요
- [ ] 정산 리포트 자동 생성 API - 입력 불필요
- [ ] 프로시저 호출 통합
- [ ] **세무 신고서 자동 생성** (부가세 신고서 등) - 입력 불필요
- [ ] **PDF/Excel 자동 내보내기** (원클릭)
- [ ] **이메일/SMS 자동 발송** (리포트 자동 전송)

#### Week 2: 업종별 ERP 확장 및 배치 통합

**Day 1-2: 정산 프로시저 확장**
- [ ] 학원 정산 프로시저 작성
- [ ] 상담소 정산 프로시저 확장
- [ ] 공통 정산 프로시저 인터페이스 정의

**Day 3-4: 정산 자동화 및 배치 통합**
- [ ] 정산 배치 스케줄러 구현 (마인드가든 패턴 활용)
  - `SettlementBatchScheduler` 생성
  - `@Scheduled` 어노테이션으로 자동 실행
  - 테넌트별 정산 배치 처리
- [ ] 정산 알림 기능
- [ ] 정산 승인 프로세스

**Day 5: ERP 통합 테스트**
- [ ] ERP 전체 기능 테스트
- [ ] 업종별 정산 테스트
- [ ] 배치 스케줄러 테스트
- [ ] 성능 테스트

## 8. 통합 후 패키지 구조

### 8.1 최종 구조

```
src/main/java/com/coresolution/
├── core/
│   ├── domain/
│   │   ├── Tenant, Branch (공통)
│   │   ├── consultation/ (마인드가든 상담소)
│   │   │   ├── Consultation
│   │   │   ├── Client
│   │   │   ├── Consultant
│   │   │   ├── Schedule
│   │   │   └── Payment
│   │   ├── academy/ (학원)
│   │   │   ├── Course
│   │   │   ├── Class
│   │   │   ├── ClassEnrollment
│   │   │   └── Attendance
│   │   └── erp/ (ERP 공통)
│   │       ├── FinancialTransaction
│   │       ├── AccountingEntry
│   │       ├── SalaryCalculation
│   │       └── Settlement
│   ├── service/
│   │   ├── BaseTenantService (공통)
│   │   ├── consultation/ (상담소 서비스)
│   │   ├── academy/ (학원 서비스)
│   │   └── erp/ (ERP 서비스)
│   ├── repository/
│   │   ├── consultation/
│   │   ├── academy/
│   │   └── erp/
│   ├── controller/
│   │   ├── consultation/
│   │   ├── academy/
│   │   └── erp/
│   ├── scheduler/ (공통 배치 스케줄러)
│   │   ├── SalaryBatchScheduler (급여 배치)
│   │   ├── SettlementBatchScheduler (정산 배치)
│   │   ├── AcademyAttendanceBatchScheduler (학원 출결 배치)
│   │   └── CommonBatchScheduler (공통 배치)
│   └── context/
│       └── TenantContextHolder
│
└── mindgarden/
    └── consultation/ (레거시 - 점진적 마이그레이션)
        ├── scheduler/ (기존 배치 스케줄러)
        │   ├── SalaryBatchScheduler
        │   ├── ConsultationRecordAlertScheduler
        │   ├── SessionCleanupScheduler
        │   └── WellnessNotificationScheduler
        └── ... (기존 코드 유지)
```

### 8.2 배치 시스템 통합 전략

**공통 배치 스케줄러 패턴:**
```java
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "batch.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SettlementBatchScheduler {
    
    private final SettlementService settlementService;
    
    /**
     * 매월 정산 배치 자동 실행
     * 매일 새벽 3시에 배치 실행
     */
    @Scheduled(cron = "0 0 3 * * ?") // 매일 새벽 3시
    public void executeSettlementBatch() {
        log.info("🕐 정산 배치 스케줄러 실행: {}", LocalDate.now());
        
        try {
            // 테넌트별 정산 배치 실행
            List<Tenant> tenants = tenantRepository.findAllActiveTenants();
            
            for (Tenant tenant : tenants) {
                TenantContextHolder.setTenantId(tenant.getId());
                try {
                    settlementService.executeMonthlySettlement(
                        tenant.getId(),
                        LocalDate.now().minusMonths(1)
                    );
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
        } catch (Exception e) {
            log.error("❌ 정산 배치 스케줄러 실행 중 오류 발생", e);
        }
    }
}
```

**배치 시스템 활용:**
- ✅ 마인드가든의 `@EnableScheduling` 활용
- ✅ Spring `@Scheduled` 어노테이션 사용
- ✅ 테넌트별 배치 처리 (TenantContextHolder 활용)
- ✅ 배치 실행 상태 모니터링
- ✅ 배치 실패 시 알림 기능

### 8.2 마이그레이션 전략

**점진적 마이그레이션:**
1. **Phase 1-2**: 마인드가든을 테넌트 시스템으로 통합, BaseTenantService 패턴 적용
2. **Phase 3**: 학원 시스템을 마인드가든 패턴으로 구현
3. **Phase 4**: ERP 공통 레이어 구축
4. **Phase 5**: 기존 `com.mindgarden.consultation` 코드를 `com.coresolution.core.domain.consultation`으로 점진적 이동

**하위 호환성:**
- 기존 API는 유지
- 새로운 API는 `/api/core/` 경로 사용
- 점진적 전환

## 9. 장점

### 9.1 마인드가든 기반 통합의 장점

1. **검증된 패턴 활용**
   - 마인드가든은 이미 운영 중인 시스템
   - 검증된 비즈니스 로직 활용
   - 안정적인 구조

2. **일관된 구조**
   - 모든 업종이 동일한 패턴 사용
   - 코드 가독성 향상
   - 유지보수 용이

3. **공통화 효율성**
   - BaseTenantService로 CRUD 로직 공통화
   - 코드 중복 제거
   - 일관된 API 패턴

4. **확장성**
   - 새로운 업종 추가 시 마인드가든 패턴만 따르면 됨
   - ERP 기능은 자동으로 사용 가능

5. **테넌트 시스템 통합**
   - 모든 시스템이 테넌트 기반으로 동작
   - 멀티테넌트 지원
   - 데이터 격리 보장

6. **배치 시스템 공통 활용**
   - 마인드가든의 검증된 배치 시스템 활용
   - Spring `@Scheduled` 어노테이션으로 간단한 구현
   - 테넌트별 배치 처리 지원
   - 배치 모니터링 및 알림 기능

## 10. 구현 로드맵

### Phase 1: 마인드가든 테넌트 시스템 통합 (2주)
- [ ] TenantContextHolder 통합
- [ ] Repository 레벨 테넌트 필터링
- [ ] 서비스 레이어 테넌트 필터링 적용
- [ ] 데이터 마이그레이션

### Phase 2: 마인드가든 BaseTenantService 패턴 적용 (2주)
- [ ] ConsultationService 리팩토링
- [ ] ClientService 리팩토링
- [ ] ConsultantService 리팩토링
- [ ] 기타 서비스 리팩토링

### Phase 3: 학원 시스템 고도화 (2주)
- [ ] 학원 엔티티 검토 및 보완
- [ ] 학원 서비스 BaseTenantService 패턴 적용
- [ ] 학원 API 컨트롤러 구현
- [ ] 통합 테스트

### Phase 3: 통합 로그인 시스템 구축 (2주) ⭐
- [ ] JWT 토큰 확장 (tenantId, branchId, permissions)
- [ ] 통합 로그인 플로우
- [ ] 테넌트별 자동 라우팅
- [ ] Refresh Token 구현

### Phase 4: 온보딩 및 내부 시스템 통합 (2주) ✅ (백엔드 완료, 프론트엔드 진행 예정)

### Phase 5: Trinity 홈페이지 및 온보딩 시스템 (2주) ⭐ (내일 시작)
- [ ] OnboardingService 통합
- [ ] ops 포털 서비스 통합
- [ ] 온보딩 프로세스 자동화

### Phase 5: 학원 시스템 고도화 (2주)
- [ ] 학원 엔티티 검토 및 보완
- [ ] 학원 서비스 BaseTenantService 패턴 적용
- [ ] 학원 API 컨트롤러 구현
- [ ] 통합 테스트

### Phase 6: 권한 확장 시스템 특화 (2주) ⭐
- [ ] 업종별 권한 템플릿 확장
- [ ] ABAC 정책 확장
- [ ] 권한 관리 UI/UX 개선
- [ ] 권한 감사 및 로깅

### Phase 7: ERP 시스템 특화 및 고도화 (3주) ⭐
- [ ] ERP 서비스 BaseTenantService 패턴 적용
- [ ] 소상공인 맞춤형 ERP 기능 구현
- [ ] ERP 대시보드 및 리포트
- [ ] 업종별 정산 프로시저 확장
- [ ] ERP 통합 테스트

### Phase 8: 브랜딩 시스템 구현 (1주)
- [ ] 로고 업로드 및 관리 API
- [ ] 상호(회사명) 관리
- [ ] 브랜딩 정보 저장 (branding_json)
- [ ] **헤더에 로고 및 상호 표시** (모든 페이지)
- [ ] **대시보드에 로고 및 상호 표시** (고객 니즈 부합)
- [ ] **Fallback 로직 구현** (코어시스템 로고/상호로 대체)
- [ ] 브랜딩 커스터마이징 UI

### Phase 9: 사용성 강화 및 모바일 앱 준비 (2주)
- [ ] 사용성 테스트 (실제 소상공인 대상)
- [ ] 자동화 검증 (입력 최소화 확인)
- [ ] 모바일 반응형 UI 완성
- [ ] 모바일 앱 개발 환경 구축
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 벤치마크
- [ ] 문서화

### Phase 9: 모바일 앱 개발 (추후)
- [ ] React Native 기반 크로스 플랫폼 앱
- [ ] 대시보드 화면
- [ ] 간편 입력 기능 (영수증 OCR, 음성 입력)
- [ ] 리포트 조회
- [ ] 푸시 알림
- [ ] 오프라인 모드

## 11. 주의사항

1. **점진적 마이그레이션**
   - 한 번에 모든 것을 바꾸지 말 것
   - 기존 마인드가든 코드는 레거시로 유지
   - 단계적으로 통합

2. **하위 호환성**
   - 기존 API는 유지
   - 새로운 API는 `/api/core/` 경로 사용
   - 점진적 전환

3. **테스트**
   - 각 단계마다 충분한 테스트
   - 통합 테스트 필수
   - 성능 테스트

4. **문서화**
   - 통합 아키텍처 문서
   - 마이그레이션 가이드
   - API 문서

## 12. 확장성 전략 (추후 업종 추가 대응)

### 12.1 현재 지원 업종

**현재 구현된 업종:**
- ✅ **CONSULTATION** (상담소) - 마인드가든 기반
- ✅ **ACADEMY** (학원) - 구현 중

**추후 추가 예정 업종:**
- ⬜ **FOOD_SERVICE** (요식업) - 카페, 레스토랑, 배달 등
- ⬜ **RETAIL** (소매) - 편의점, 마트 등
- ⬜ **BEAUTY** (미용) - 미용실, 네일샵 등
- ⬜ **HEALTH** (건강) - 병원, 약국 등

### 12.2 확장 가능한 아키텍처

**업종별 확장 패턴:**
```
com.coresolution.core/
├── domain/
│   ├── consultation/ (상담소)
│   ├── academy/ (학원)
│   ├── foodservice/ (요식업 - 추후 추가)
│   │   ├── Menu (메뉴)
│   │   ├── Order (주문)
│   │   ├── Delivery (배달)
│   │   └── Kitchen (주방)
│   ├── cafe/ (카페 - 추후 추가)
│   │   ├── Menu (메뉴)
│   │   ├── Order (주문)
│   │   └── Reservation (예약)
│   └── retail/ (소매 - 추후 추가)
│       ├── Product (상품)
│       ├── Inventory (재고)
│       └── Sale (판매)
├── service/
│   ├── BaseTenantService (공통)
│   ├── consultation/
│   ├── academy/
│   ├── foodservice/ (추후 추가)
│   ├── cafe/ (추후 추가)
│   └── retail/ (추후 추가)
└── controller/
    ├── consultation/
    ├── academy/
    ├── foodservice/ (추후 추가)
    ├── cafe/ (추후 추가)
    └── retail/ (추후 추가)
```

### 12.3 새로운 업종 추가 프로세스

**Step 1: 데이터베이스 스키마 설계**
- [ ] 업종별 엔티티 테이블 설계
- [ ] `tenant_id`, `branch_id` 필드 포함
- [ ] BaseEntity 상속 구조
- [ ] Flyway 마이그레이션 스크립트 작성

**Step 2: 엔티티 클래스 생성**
- [ ] `com.coresolution.core.domain.{업종}/` 패키지 생성
- [ ] 엔티티 클래스 생성 (BaseEntity 상속)
- [ ] Enum 클래스 정의 (상태, 타입 등)

**Step 3: Repository 인터페이스 생성**
- [ ] `JpaRepository` 상속
- [ ] 테넌트 필터링 메서드 추가
- [ ] 커스텀 쿼리 메서드 정의

**Step 4: 서비스 클래스 구현**
- [ ] `BaseTenantService<Entity, ID>` 인터페이스 구현
- [ ] `BaseTenantServiceImpl<Entity, ID, Request, Response>` 상속
- [ ] 업종별 비즈니스 로직 구현
  - `validateBusinessRules()` 오버라이드
  - `beforeCreate()`, `afterCreate()` 훅 구현
  - 업종별 특화 메서드 추가

**Step 5: DTO 클래스 생성**
- [ ] Request DTO (생성, 수정)
- [ ] Response DTO (조회, 목록)
- [ ] 업종별 특화 필드 포함

**Step 6: Controller 구현**
- [ ] RESTful API 엔드포인트 구현
- [ ] 마인드가든 패턴 적용
- [ ] 권한 검증 (`@PreAuthorize`)
- [ ] Swagger 문서화

**Step 7: ERP 통합**
- [ ] 업종별 정산 프로시저 작성
- [ ] 정산 배치 스케줄러 추가
- [ ] ERP 리포트 생성

**Step 8: 테스트**
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 멀티테넌트 시나리오 테스트

### 12.4 업종별 특화 로직 처리

**공통 로직 (BaseTenantService):**
- ✅ CRUD 기본 작업
- ✅ 테넌트 접근 제어
- ✅ DTO 변환
- ✅ 이력 관리
- ✅ 승인 프로세스

**업종별 특화 로직:**
- ❌ 비즈니스 규칙 검증
- ❌ 상태 전이 로직
- ❌ 업종별 계산 로직
- ❌ 업종별 리포트 생성

**예시: 요식업 특화 로직**
```java
@Service
@RequiredArgsConstructor
public class OrderServiceImpl extends BaseTenantServiceImpl<Order, Long, OrderRequest, OrderResponse> {
    
    @Override
    protected void validateBusinessRules(OrderRequest request) {
        // 요식업 특화 검증
        // - 메뉴 재고 확인
        // - 주문 가능 시간 확인
        // - 최소 주문 금액 확인
    }
    
    @Override
    protected void afterCreate(Order entity) {
        // 요식업 특화 후처리
        // - 주방 알림 발송
        // - 배달 배정
        // - 재고 차감
    }
    
    // 요식업 특화 메서드
    public Order assignDelivery(Long orderId, Long deliveryId) {
        // 배달 배정 로직
    }
    
    public Order updateOrderStatus(Long orderId, OrderStatus status) {
        // 주문 상태 업데이트 (요식업 특화)
    }
}
```

### 12.5 업종별 컴포넌트 매핑

**BusinessCategoryItem 시스템 활용:**
- `business_category_items.default_components_json`에 업종별 기본 컴포넌트 정의
- 온보딩 시 자동으로 컴포넌트 활성화

**예시:**
```json
{
  "CONSULTATION": ["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"],
  "ACADEMY": ["ACADEMY", "ENROLLMENT", "ATTENDANCE", "PAYMENT", "NOTIFICATION"],
  "FOOD_SERVICE": ["MENU", "ORDER", "DELIVERY", "PAYMENT", "NOTIFICATION"],
  "CAFE": ["MENU", "ORDER", "RESERVATION", "PAYMENT", "NOTIFICATION"]
}
```

### 12.6 확장성 보장 원칙

1. **개방-폐쇄 원칙 (OCP)**
   - 기존 코드 수정 없이 새로운 업종 추가 가능
   - BaseTenantService 확장으로 새로운 업종 지원

2. **의존성 역전 원칙 (DIP)**
   - 업종별 서비스는 BaseTenantService 인터페이스에 의존
   - 구체적인 구현이 아닌 추상화에 의존

3. **단일 책임 원칙 (SRP)**
   - 각 업종별 서비스는 해당 업종의 비즈니스 로직만 담당
   - 공통 로직은 BaseTenantService에서 처리

4. **인터페이스 분리 원칙 (ISP)**
   - 업종별 특화 인터페이스 분리
   - 필요한 기능만 구현

### 12.7 확장성 체크리스트

**새로운 업종 추가 시 확인 사항:**
- [ ] `BusinessType` enum에 업종 추가
- [ ] `business_category_items` 테이블에 업종 추가
- [ ] 업종별 엔티티 패키지 생성
- [ ] BaseTenantService 패턴 적용
- [ ] 업종별 정산 프로시저 작성
- [ ] 업종별 배치 스케줄러 추가
- [ ] ERP 리포트 생성
- [ ] API 문서 작성
- [ ] 테스트 코드 작성

### 12.8 확장성 예시: 카페 시스템 추가

**1. 데이터베이스 스키마:**
```sql
-- 카페 메뉴 테이블
CREATE TABLE cafe_menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id BIGINT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2),
    -- ... BaseEntity 필드
);

-- 카페 주문 테이블
CREATE TABLE cafe_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id BIGINT,
    menu_id BIGINT,
    quantity INT,
    total_price DECIMAL(10,2),
    -- ... BaseEntity 필드
);
```

**2. 엔티티 클래스:**
```java
@Entity
@Table(name = "cafe_menus")
public class CafeMenu extends BaseEntity {
    // BaseEntity의 tenant_id, branch_id 자동 상속
    private String name;
    private String category;
    private BigDecimal price;
    // ...
}
```

**3. 서비스 클래스:**
```java
@Service
public class CafeMenuServiceImpl extends BaseTenantServiceImpl<CafeMenu, Long, CafeMenuRequest, CafeMenuResponse> {
    // BaseTenantService의 CRUD 자동 제공
    // 카페 특화 로직만 추가
}
```

**4. Controller:**
```java
@RestController
@RequestMapping("/api/core/cafe/menus")
public class CafeMenuController {
    // 마인드가든 패턴 적용
}
```

## 13. 상품성 강화 전략

### 13.1 소상공인 맞춤형 가치 제안

**핵심 메시지:**
- "대기업 수준의 ERP를 저비용으로"
- "복잡한 설정 없이 바로 사용 가능"
- "업종별 맞춤 솔루션"

**차별화 요소:**
1. **저비용**: 대기업 ERP 대비 1/10 비용
2. **간편함**: 복잡한 설정 없이 템플릿 기반 자동 설정
3. **자동화**: 급여, 정산, 세금 자동 계산 (입력 최소화)
4. **업종별 특화**: 상담소, 학원, 요식업 등 업종별 맞춤
5. **사용성**: **입력은 회원가입 때만, 그 외는 모두 자동화**
6. **모바일**: 모바일 앱으로 언제 어디서나 접근
7. **브랜딩**: **자신의 로고 및 상호로 운영** (브랜드 일관성)

### 13.2 사용성 우선 원칙 (Usability First)

**핵심 원칙:**
- ✅ **입력은 회원가입 때만** - 그 외 모든 것은 자동화
- ✅ **복잡한 설정 없음** - 템플릿 기반 자동 설정
- ✅ **한 번의 클릭으로 모든 것** - 최소한의 클릭으로 최대한의 기능
- ✅ **어려우면 안 씀** - 직관적이고 간단해야 함

**자동화 전략:**
1. **온보딩 시 자동 설정**
   - 업종 선택 → 모든 설정 자동 완료
   - 권한 템플릿 자동 적용
   - 기본 데이터 자동 생성

2. **일상 운영 자동화**
   - 매출/지출 자동 기록 (PG 연동)
   - 급여 자동 계산
   - 정산 자동 계산
   - 세금 자동 계산

3. **리포트 자동 생성**
   - 손익계산서 자동 생성
   - 현금흐름표 자동 생성
   - 세금 신고서 자동 생성

**UI/UX 개선:**
- [ ] **원클릭 작업** - 모든 주요 작업을 한 번의 클릭으로
- [ ] **대시보드 중심** - 모든 정보를 한 화면에
- [ ] **자동 완성** - 입력이 필요한 경우 자동 완성
- [ ] **스마트 제안** - 시스템이 자동으로 제안
- [ ] **모바일 반응형 디자인** - 모바일에서도 완벽하게 동작
- [ ] **모바일 앱** - 추후 네이티브 앱 개발 필수

**마케팅 기능 (추후 논의):**
- [ ] 데모 모드 (체험 가능)
- [ ] 온보딩 가이드 (튜토리얼)
- [ ] 성공 사례 페이지
- [ ] 가격 비교 페이지

**고객 지원:**
- [ ] 실시간 채팅 지원
- [ ] FAQ 및 도움말
- [ ] 비디오 튜토리얼
- [ ] 커뮤니티 포럼
- [ ] **원클릭 지원 요청** - 문제 발생 시 한 번의 클릭으로 지원 요청

### 13.3 모바일 앱 개발 계획

**앱 개발 필수성:**
- ✅ 소상공인은 모바일에서 주로 작업
- ✅ 언제 어디서나 접근 가능해야 함
- ✅ 푸시 알림으로 실시간 정보 제공
- ✅ 오프라인 모드 지원 (네트워크 없이도 기본 기능)

**앱 기능:**
1. **대시보드**
   - 매출/지출 현황 한눈에
   - 오늘의 할 일
   - 알림 및 공지

2. **간편 입력**
   - 영수증 촬영 → 자동 입력
   - 음성 입력 → 자동 전사
   - QR 코드 스캔 → 자동 입력

3. **리포트 조회**
   - 손익계산서
   - 현금흐름표
   - 정산 내역

4. **알림**
   - 급여 지급 알림
   - 정산 완료 알림
   - 세금 신고 기한 알림

**앱 개발 로드맵:**
- Phase 1: React Native 기반 크로스 플랫폼 앱 (iOS + Android)
- Phase 2: 네이티브 기능 통합 (카메라, GPS, 푸시 알림)
- Phase 3: 오프라인 모드 지원
- Phase 4: 고급 기능 (AI 영수증 인식, 음성 입력 등)

### 13.3 가격 전략

**요금제 구조:**
- **스타터**: 기본 기능 (월 10만원)
- **프로**: ERP 포함 (월 30만원)
- **엔터프라이즈**: 모든 기능 (월 50만원)

**가격 경쟁력:**
- 대기업 ERP 대비 1/10 비용
- 소상공인 맞춤형 가격
- 업종별 특화 기능 포함

## 14. Phase 5: Trinity 홈페이지 및 온보딩 시스템 (2주) ⭐

> **참고 문서:**
> - `docs/mgsb/feature/ONBOARDING_AND_BILLING_OVERVIEW.md` - 온보딩 & 자동결제 통합 개요
> - `docs/mgsb/internal-ops/feature/ONBOARDING_REGISTRATION_PLAN.md` - 온보딩 등록 페이지 구현 계획
> - `docs/mgsb/feature/BILLING_DOMAIN_DESIGN.md` - 결제·구독 도메인 설계
> - `docs/mgsb/feature/PG_INTEGRATION_GUIDE.md` - PG 연동 가이드
> - `docs/mgsb/feature/OPS_SOP_ONBOARDING_BILLING.md` - 온보딩 & 자동결제 운영 표준 절차
> - `docs/mgsb/DOMAIN_MIGRATION_PLAN.md` - 도메인 변경 및 회사 홈페이지 연동 계획

### 14.1 목표
- **Trinity 회사 홈페이지 개발** (`e-trinity.co.kr`)
- 온보딩 등록 화면을 Trinity 홈페이지에 통합 (`apply.e-trinity.co.kr/onboarding`)
- 과금 정보 실시간 연동 및 결제 시스템 구축 (PG 토큰화 기반)
- 내부 시스템(ops 포털) 선택적 인증 구현 (`ops.e-trinity.co.kr`)

### 14.2 작업 내용

#### Week 1: Trinity 홈페이지 개발

**Day 1-2: Trinity 홈페이지 기본 구조**
- [ ] Trinity 홈페이지 프로젝트 생성 (Next.js 기반, 별도 프론트엔드 또는 통합)
- [ ] 회사 소개, 서비스 소개, 가격 정보 페이지 (`e-trinity.co.kr`)
- [ ] 반응형 디자인 (모바일/태블릿/데스크탑)
- [ ] CoreSolution 브랜딩 적용
- [ ] DNS 및 SSL 설정 (`dev.e-trinity.co.kr` 개발 환경)

**Day 3-4: 온보딩 등록 화면 (Trinity 홈페이지)**
- [ ] 온보딩 등록 페이지 (`apply.e-trinity.co.kr/onboarding` 또는 `e-trinity.co.kr/onboarding`)
- [ ] 테넌트 정보 입력 폼 (회사명, 업종, 연락처 등)
- [ ] 요금제 선택 UI (실시간 가격 정보 표시, `GET /api/ops/plans/active`)
- [ ] 결제 수단 등록 (PG 토큰화 방식, Stripe/토스페이먼츠)
- [ ] **입점사 PG사 등록 단계 추가** ⭐ (추후 구현)
  - [ ] PG사 선택 UI (TOSS, IAMPORT, KAKAO, NAVER, PAYPAL, STRIPE 등)
  - [ ] PG 설정 정보 입력 폼 (API Key, Secret Key, Merchant ID 등)
  - [ ] PG 설정 정보 암호화 저장 (`POST /api/v1/tenant/pg-configurations`)
  - [ ] PG 설정 승인 대기 상태 표시
  - [ ] 온보딩 요청에 PG 설정 정보 포함 (`checklistJson`에 `pgConfigId` 추가)
- [ ] 온보딩 요청 API 연동 (`POST /api/onboarding/requests`)
- [ ] 등록 완료 페이지 및 상태 조회 링크

**Day 5: 과금 정보 실시간 연동**
- [ ] 요금제 정보 API 연동 (`GET /api/ops/plans/active`)
- [ ] 실시간 가격 정보 표시
- [ ] 요금제 비교 테이블
- [ ] 애드온/옵션 가격 정보 표시

#### Week 2: 결제 시스템 및 통합

**Day 1-2: 결제 시스템 통합**
- [ ] PG 연동 (토스페이먼츠 또는 Stripe, 토큰화 기반)
- [ ] 결제 수단 토큰 저장 API (`POST /api/v1/billing/payment-methods`)
- [ ] 구독 생성 API (`POST /api/v1/billing/subscriptions`)
- [ ] 결제 프로세스 구현 (요금제 선택 → 결제 수단 등록 → 구독 생성 → 첫 결제)
- [ ] 결제 성공/실패 처리
- [ ] PG Webhook 처리 (`POST /api/v1/billing/payments/webhook`)

**Day 3-4: 실시간 과금 연동**
- [ ] 구독 정보 실시간 조회 API (`GET /api/subscriptions/{tenantId}`)
- [ ] 구독 상태 머신 구현 (DRAFT → PENDING_ACTIVATION → ACTIVE → SUSPENDED → CANCELLED)
- [ ] 사용량 기반 과금 계산 (필요 시, `ops_addon_usage` 테이블 활용)
- [ ] 결제 알림 시스템 (결제 실패, 갱신 등)
- [ ] 구독 관리 페이지 (변경/취소)

**Day 5: 내부 시스템 선택적 인증 및 ERP 자동 구성 연계**
- [ ] Ops 포털 메뉴별 인증 설정
  - [ ] 공개 메뉴: 인증 불필요 (홈, 서비스 소개 등)
  - [ ] 보호된 메뉴: 인증 필요 (온보딩 승인, 요금제 관리 등)
- [ ] SecurityConfig에 선택적 인증 경로 설정
- [ ] 통합 로그인 시스템과 연동
- [ ] **ERP 자동 구성 연계** ⭐ (추후 구현)
  - [ ] PG 등록 완료 후 ERP 자동 구성 트리거
  - [ ] `ProcessOnboardingApproval` PL/SQL 프로시저에 ERP 구성 로직 추가
  - [ ] 테넌트별 PG 설정 기반 ERP 모듈 자동 활성화
  - [ ] 결제/정산 ERP 모듈 자동 연동
  - [ ] ERP 초기 데이터 자동 생성 (계정과목, 정산 계좌 등)
  - [ ] ERP 권한 템플릿 자동 적용
- [ ] 테스트 및 검증

### 14.3 기술 스택

**Trinity 홈페이지:**
- Next.js (App Router, SSR 지원)
- CoreSolution 디자인 시스템 적용
- 반응형 디자인 (모바일 우선)
- SEO 최적화

**결제 시스템:**
- PG사 연동 (토스페이먼츠 또는 Stripe)
- 토큰화 기반 결제 (PCI DSS 준수)
- 정기 결제 API (Subscription 관리)
- Webhook 처리

**과금 연동:**
- 실시간 API 호출 (`/api/ops/plans/active`)
- 구독 정보 조회 (`/api/subscriptions/{tenantId}`)
- 사용량 추적 (`ops_addon_usage` 테이블)
- 월말 배치 프로세스 (정기 결제 실행)

### 14.4 API 엔드포인트

**온보딩 등록:**
- `POST /api/onboarding/requests` - 온보딩 요청 생성
- `GET /api/onboarding/requests/{id}` - 요청 상태 조회

**과금 정보:**
- `GET /api/ops/plans/active` - 활성 요금제 목록
- `GET /api/ops/plans/{planId}` - 요금제 상세 정보

**결제/구독:**
- `POST /api/v1/billing/payment-methods` - 결제 수단 토큰 등록 및 검증
- `POST /api/v1/billing/subscriptions` - 구독 생성 (결제 토큰 + 요금제 정보)
- `POST /api/v1/billing/subscriptions/{id}/activate` - 첫 결제 수행
- `GET /api/subscriptions/{tenantId}` - 구독 정보 조회
- `POST /api/subscriptions/{subscriptionId}/cancel` - 구독 취소
- `POST /api/v1/billing/payments/webhook` - PG Webhook 수신

**입점사 PG 등록:**
- `POST /api/v1/tenant/pg-configurations` - PG 설정 등록 (암호화 저장)
- `GET /api/v1/tenant/pg-configurations` - 테넌트별 PG 설정 목록 조회
- `GET /api/v1/tenant/pg-configurations/{configId}` - PG 설정 상세 조회
- `PUT /api/v1/tenant/pg-configurations/{configId}` - PG 설정 수정
- `POST /api/v1/tenant/pg-configurations/{configId}/test` - PG 연결 테스트
- `POST /api/ops/pg-configurations/{configId}/approve` - PG 설정 승인 (운영 포털)
- `POST /api/ops/pg-configurations/{configId}/reject` - PG 설정 거부 (운영 포털)

### 14.5 데이터 모델

**구독 관련 테이블:**
- `ops_subscription` - 테넌트별 구독 기본 정보
- `ops_subscription_cycle` - 구독 청구 주기별 기록
- `ops_subscription_payment` - 실제 결제 내역
- `ops_payment_method` - 결제 수단 토큰 (암호화 저장)
- `ops_addon_usage` - 애드온 사용량 기록 (Usage 기반 과금)
- `ops_invoice` - 영수/세금계산서 정보

**PG 설정 관련 테이블:**
- `tenant_pg_configurations` - 테넌트별 PG 설정 (암호화 저장)
- `tenant_pg_configuration_history` - PG 설정 변경 이력
- ERP 연동을 위한 테이블 (추후 확장)

### 14.6 도메인 구조

**도메인 분리 원칙:**
- **Trinity 코퍼레이트 웹/온보딩**: `e-trinity.co.kr`, `apply.e-trinity.co.kr`
- **MindGarden 서비스(테넌트/소비자)**: `m-garden.co.kr`, `app.m-garden.co.kr`, `{tenant}.m-garden.co.kr`
- **운영 포털(내부)**: `ops.e-trinity.co.kr` (VPN 또는 IP ACL + MFA 필수)

## 15. 결론

**시스템 목적:**
- ✅ **소상공인이 필요한 시스템을 저비용으로 활용**할 수 있도록 제공
- ✅ 대기업 수준의 ERP 시스템을 저렴하게 사용 가능
- ✅ 복잡한 권한 관리 없이 간단하게 운영 가능
- ✅ 상품성 있는 솔루션으로 시장 경쟁력 확보

**핵심 특화 영역:**
1. **ERP 시스템 특화** ⭐
   - 소상공인 맞춤형 재무/회계/정산 시스템
   - 자동화된 급여, 정산, 세금 계산
   - 업종별 맞춤 기능

2. **권한 확장 시스템 특화** ⭐
   - 업종별, 역할별 세밀한 권한 관리
   - 템플릿 기반 간편한 권한 설정
   - ABAC 기반 세밀한 접근 제어

3. **상품성**
   - 직관적인 UI/UX
   - 마케팅 가능한 완성도
   - 경쟁력 있는 가격

**마인드가든 기반 통합 전략:**
- ✅ 마인드가든을 테넌트 시스템으로 완전 통합
- ✅ BaseTenantService 패턴을 마인드가든에 먼저 적용
- ✅ 마인드가든 패턴을 학원 시스템에 적용
- ✅ **ERP는 핵심 특화 영역으로 고도화**
- ✅ **권한 확장 시스템은 핵심 특화 영역으로 고도화**
- ✅ 단일 코드베이스에서 모든 업종 관리
- ✅ 점진적 마이그레이션으로 리스크 최소화
- ✅ **확장 가능한 아키텍처로 추후 업종 추가 용이**

이 방식이 소상공인을 위한 저비용, 고품질 SaaS 솔루션을 제공하는 가장 효율적이고 안정적이며 확장 가능한 통합 전략입니다.

