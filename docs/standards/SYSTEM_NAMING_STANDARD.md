# 시스템 명칭 통일 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

CoreSolution 플랫폼의 시스템 명칭 통일 표준입니다. MindGarden에서 CoreSolution으로 명칭을 변경하고, 온보딩 시스템 및 OPS 시스템의 명칭을 표준화합니다.

### 참조 문서
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)

---

## 🎯 시스템 명칭 원칙

### ⭐ 공식 표준: CoreSolution (코어솔루션)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  공식 시스템 명칭: CoreSolution (코어솔루션)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

영문 명칭: CoreSolution
한글 명칭: 코어솔루션
영문 약자: CS
로마자 표기: coresolution (소문자, 공백 없음)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**✅ 필수 사용 범위**:
- ✅ 플랫폼 전체 명칭
- ✅ 시스템 공통코드
- ✅ 공통 컴포넌트
- ✅ 데이터베이스 스키마
- ✅ API 엔드포인트
- ✅ 패키지명
- ✅ 프로젝트 문서
- ✅ 환경 변수
- ✅ 로그 메시지

**📋 표준 사용 예시**:
```java
// ✅ 패키지명 (필수)
com.coresolution.core
com.coresolution.consultation
com.coresolution.ops

// ✅ 클래스명 (필수)
CoreSolutionApplication
CoreSolutionConfig
CoreSolutionConstants

// ✅ 데이터베이스명 (필수)
core_solution
core_solution_ops

// ✅ 환경 변수 (필수)
CS_DB_URL
CS_JWT_SECRET
CORESOLUTION_API_KEY

// ✅ 로그 메시지 (필수)
log.info("CoreSolution 플랫폼 시작");
log.info("코어솔루션 테넌트 생성 완료");
```

**❌ 금지 사항**:
```java
// ❌ 금지 - MindGarden을 시스템 명칭으로 사용
com.mindgarden.core          // 금지
MindGardenApplication        // 금지
mindgarden_db                // 금지

// ❌ 금지 - 임의 약어 사용
com.cs.core                  // 금지
CSApp                        // 금지
cs_system                    // 금지

// ❌ 금지 - 혼용
CoreSolution + MindGarden    // 금지
```

---

### 1. 플랫폼 명칭

#### CoreSolution (코어솔루션) - 공식 표준 ⭐
```
공식 명칭: CoreSolution
한글 명칭: 코어솔루션
영문 약자: CS
```

**사용 범위**:
- 플랫폼 전체
- 시스템 공통코드
- 공통 컴포넌트
- 데이터베이스 스키마
- API 엔드포인트

**예시**:
```java
// 패키지명
com.coresolution.core
com.coresolution.consultation

// 클래스명
CoreSolutionApplication
CoreSolutionConfig

// 데이터베이스
core_solution
```

---

#### MindGarden (마인드가든)
```
공식 명칭: MindGarden
한글 명칭: 마인드가든
영문 약자: MG
```

**사용 범위**:
- 특정 테넌트 프로젝트명
- 디자인 시스템 (mg- 접두사)
- 프론트엔드 CSS 클래스
- 브랜딩 관련

**예시**:
```css
/* CSS 클래스 */
.mg-button
.mg-card
.mg-modal

/* CSS 변수 */
--mg-primary-500
--mg-spacing-4
```

---

### 2. 시스템 구분

#### Core System (코어 시스템)
```
공식 명칭: Core System
한글 명칭: 코어 시스템
폴더명: core/
```

**포함 시스템**:
- 메인 백엔드 (src/)
- 메인 프론트엔드 (frontend/)
- 모바일 앱 (mobile/)

**설명**:
- 테넌트가 실제 사용하는 핵심 비즈니스 시스템
- 상담 관리, 회원 관리, 일정 관리, ERP 등

---

#### Ops System (운영 시스템)
```
공식 명칭: Ops System
한글 명칭: 운영 시스템
폴더명: ops/
영문 약자: OPS
```

**포함 시스템**:
- 백엔드 운영 도구 (backend-ops/)
- 프론트엔드 운영 도구 (frontend-ops/)
- Trinity 홈페이지 (frontend-trinity/)

**설명**:
- 내부 운영진이 사용하는 관리 시스템
- 테넌트 관리, 온보딩 관리, 요금제 관리, 모니터링 등

---

## 📋 온보딩 시스템 명칭

### 1. 온보딩 시스템 (Onboarding System)

```
공식 명칭: Onboarding System
한글 명칭: 온보딩 시스템
영문 약자: OBS
```

**구성 요소**:
1. **Onboarding Request (온보딩 요청)**
   - 테넌트가 플랫폼 입점을 신청하는 프로세스
   - Trinity 홈페이지에서 신청
   
2. **Onboarding Approval (온보딩 승인)**
   - HQ 관리자가 온보딩 요청을 검토하고 승인/거부
   - Ops 포털에서 관리

3. **Onboarding Process (온보딩 프로세스)**
   - 승인 후 테넌트 생성 및 초기 설정
   - PL/SQL 프로시저 자동 실행

---

### 2. 온보딩 관련 용어 표준

| 한글 | 영문 | 설명 |
|------|------|------|
| 온보딩 요청 | Onboarding Request | 테넌트 입점 신청 |
| 온보딩 승인 | Onboarding Approval | HQ 관리자의 승인 처리 |
| 온보딩 프로세스 | Onboarding Process | 승인 후 자동 실행되는 전체 프로세스 |
| 온보딩 체크리스트 | Onboarding Checklist | 필수 확인 사항 목록 |
| 온보딩 상태 | Onboarding Status | PENDING, APPROVED, REJECTED |

---

### 3. 온보딩 엔티티 및 API

#### 엔티티
```java
@Entity
@Table(name = "onboarding_requests")
public class OnboardingRequest extends BaseEntity {
    
    @Column(name = "tenant_id", nullable = false, length = 100)
    private String tenantId;
    
    @Column(name = "tenant_name", nullable = false, length = 255)
    private String tenantName;
    
    @Column(name = "business_type", nullable = false, length = 50)
    private String businessType;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status;  // PENDING, APPROVED, REJECTED
    
    @Column(name = "requested_by", nullable = false, length = 255)
    private String requestedBy;
    
    @Column(name = "approved_by", length = 255)
    private String approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
```

#### API 엔드포인트
```
# 온보딩 요청 생성 (Trinity 홈페이지)
POST /api/v1/onboarding/requests

# 온보딩 요청 목록 조회 (Ops 포털)
GET /api/v1/onboarding/requests

# 온보딩 승인/거부 (Ops 포털)
POST /api/v1/onboarding/requests/{id}/approve
POST /api/v1/onboarding/requests/{id}/reject
```

---

### 4. 온보딩 프로시저

```sql
-- 온보딩 승인 처리 프로시저
CALL ProcessOnboardingApproval(
    p_request_id,
    p_tenant_id,
    p_tenant_name,
    p_business_type,
    p_approved_by,
    p_decision_note,
    @p_success,
    @p_message
);
```

**프로시저 실행 순서**:
1. CreateOrActivateTenant (테넌트 생성/활성화)
2. SetupTenantCategoryMapping (카테고리 매핑 설정)
3. ActivateDefaultComponents (기본 컴포넌트 활성화)
4. CreateDefaultSubscription (기본 구독 생성)
5. ApplyDefaultRoleTemplates (기본 역할 템플릿 적용)
6. GenerateErdOnOnboardingApproval (ERD 자동 생성)

---

## 🏢 Ops 시스템 명칭

### 1. Ops 시스템 구성

```
Ops System (운영 시스템)
├── Backend Ops (백엔드 운영 도구)
│   ├── 폴더: backend-ops/
│   ├── 포트: 8080
│   └── 용도: 운영 API 제공
│
├── Frontend Ops (프론트엔드 운영 도구)
│   ├── 폴더: frontend-ops/
│   ├── 포트: 4300
│   └── 용도: 운영 포털 UI (Ops Portal)
│
└── Trinity (트리니티 홈페이지)
    ├── 폴더: frontend-trinity/
    ├── 포트: 3000
    └── 용도: 공식 홈페이지 및 온보딩 신청
```

---

### 2. Ops 관련 용어 표준

| 한글 | 영문 | 설명 |
|------|------|------|
| 운영 시스템 | Ops System | 내부 운영진용 시스템 |
| 운영 포털 | Ops Portal | 운영 시스템 웹 UI |
| 운영 API | Ops API | 운영 시스템 백엔드 API |
| 운영 관리자 | Ops Admin | 운영 시스템 관리자 |
| HQ 관리자 | HQ Admin | 본사 최고 관리자 |
| 운영 대시보드 | Ops Dashboard | 운영 현황 모니터링 |

---

### 3. Ops 엔티티 및 API

#### 엔티티
```java
// backend-ops/src/main/java/com/coresolution/ops/entity/

@Entity
@Table(name = "ops_tenants")
public class OpsTenant extends BaseEntity {
    
    @Column(name = "tenant_id", nullable = false, unique = true)
    private String tenantId;
    
    @Column(name = "tenant_name", nullable = false)
    private String tenantName;
    
    @Column(name = "status", nullable = false)
    private String status;  // ACTIVE, SUSPENDED, CLOSED
}

@Entity
@Table(name = "ops_subscriptions")
public class OpsSubscription extends BaseEntity {
    
    @Column(name = "tenant_id", nullable = false)
    private String tenantId;
    
    @Column(name = "plan_id", nullable = false)
    private String planId;
    
    @Column(name = "status", nullable = false)
    private String status;  // ACTIVE, CANCELLED, EXPIRED
}
```

#### API 엔드포인트
```
# 테넌트 관리
GET /api/v1/ops/tenants
GET /api/v1/ops/tenants/{tenantId}
PUT /api/v1/ops/tenants/{tenantId}/status

# 구독 관리
GET /api/v1/ops/subscriptions
GET /api/v1/ops/subscriptions/{subscriptionId}
POST /api/v1/ops/subscriptions

# 온보딩 관리
GET /api/v1/ops/onboarding/requests
POST /api/v1/ops/onboarding/requests/{id}/approve

# 모니터링
GET /api/v1/ops/monitoring/dashboard
GET /api/v1/ops/monitoring/metrics
```

---

## 📁 폴더 구조 표준

### 1. 프로젝트 루트 구조

```
/Users/mind/mindGarden/  (또는 /coresolution/)
├── core/                          # 코어 시스템
│   ├── src/                       # 메인 백엔드
│   ├── frontend/                  # 메인 프론트엔드
│   └── mobile/                    # 모바일 앱
│
├── ops/                           # 운영 시스템
│   ├── backend-ops/               # 백엔드 운영 도구
│   ├── frontend-ops/              # 프론트엔드 운영 도구
│   └── frontend-trinity/          # Trinity 홈페이지
│
├── database/                      # 데이터베이스
│   ├── schema/
│   ├── migrations/
│   └── procedures/
│
├── docs/                          # 문서
│   ├── standards/                 # 표준 문서
│   ├── architecture/              # 아키텍처
│   └── guides/                    # 가이드
│
└── scripts/                       # 스크립트
    ├── automation/
    ├── database/
    └── development/
```

---

### 2. 패키지 구조 표준

#### Core System (메인 백엔드)
```
com.coresolution
├── core                           # 코어 도메인
│   ├── controller
│   ├── service
│   ├── repository
│   └── domain
│
├── consultation                   # 상담 도메인
│   ├── controller
│   ├── service
│   ├── repository
│   └── entity
│
└── common                         # 공통
    ├── config
    ├── util
    └── exception
```

#### Ops System (운영 백엔드)
```
com.coresolution.ops
├── onboarding                     # 온보딩 관리
│   ├── controller
│   ├── service
│   └── entity
│
├── tenant                         # 테넌트 관리
│   ├── controller
│   ├── service
│   └── entity
│
├── subscription                   # 구독 관리
│   ├── controller
│   ├── service
│   └── entity
│
└── monitoring                     # 모니터링
    ├── controller
    ├── service
    └── entity
```

---

## 🔤 네이밍 규칙

### 1. 데이터베이스 테이블

#### Core System
```sql
-- 테넌트 관련
tenants
tenant_roles
tenant_dashboards
tenant_permissions

-- 사용자 관련
users
user_profiles
user_sessions

-- 비즈니스 도메인
consultations
consultant_client_mappings
sessions
```

#### Ops System
```sql
-- Ops 전용 테이블 (ops_ 접두사)
ops_tenants
ops_subscriptions
ops_pricing_plans
ops_audit_logs
ops_feature_flags

-- 온보딩 관련
onboarding_requests
onboarding_checklists
```

---

### 2. API 엔드포인트

#### Core System
```
/api/v1/{domain}/{resource}

예시:
/api/v1/users
/api/v1/consultations
/api/v1/tenant/dashboards
/api/v1/common-codes
```

#### Ops System
```
/api/v1/ops/{domain}/{resource}

예시:
/api/v1/ops/tenants
/api/v1/ops/subscriptions
/api/v1/ops/onboarding/requests
/api/v1/ops/monitoring/metrics
```

---

### 3. 환경 변수

#### Core System
```bash
# 데이터베이스
CS_DB_URL=jdbc:mysql://localhost:3306/core_solution
CS_DB_USERNAME=coresolution_user
CS_DB_PASSWORD=***

# JWT
CS_JWT_SECRET=***
CS_JWT_ISSUER=https://auth.coresolution.com

# 서버
CS_SERVER_PORT=8080
```

#### Ops System
```bash
# 데이터베이스
OPS_DB_URL=jdbc:postgresql://localhost:5432/coresolution_ops
OPS_DB_USERNAME=ops_user
OPS_DB_PASSWORD=***

# JWT
OPS_JWT_SECRET=***
OPS_JWT_ISSUER=https://ops.coresolution.com

# 서버
OPS_SERVER_PORT=8080
```

---

## ✅ 체크리스트

### 명칭 변경 시
- [ ] MindGarden → CoreSolution 변경 확인
- [ ] 패키지명 확인 (com.coresolution)
- [ ] 데이터베이스명 확인 (core_solution)
- [ ] 환경 변수 접두사 확인 (CS_, OPS_)
- [ ] API 엔드포인트 확인 (/api/v1/ops/)
- [ ] 문서 업데이트

### 온보딩 시스템 구현 시
- [ ] OnboardingRequest 엔티티 사용
- [ ] /api/v1/onboarding/ 엔드포인트 사용
- [ ] ProcessOnboardingApproval 프로시저 호출
- [ ] 온보딩 상태 관리 (PENDING, APPROVED, REJECTED)

### Ops 시스템 구현 시
- [ ] backend-ops/ 폴더 사용
- [ ] frontend-ops/ 폴더 사용
- [ ] /api/v1/ops/ 엔드포인트 사용
- [ ] ops_ 접두사 테이블 사용
- [ ] OPS_ 환경 변수 사용

---

## 🚫 금지 사항

### ⭐ 중요: CoreSolution 표준 준수 필수

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  모든 시스템 명칭은 CoreSolution 표준을 따라야 합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1. 시스템 명칭 혼용 금지
```
❌ 절대 금지:
- MindGarden을 시스템 명칭으로 사용
- MindGarden과 CoreSolution 혼용
- 임의의 약어 사용 (CS_APP, CORE_SYS 등)

✅ 필수 준수:
- CoreSolution으로 통일
- 공식 약자 CS 사용
- 일관된 표기법 유지
```

**예시**:
```java
// ❌ 금지
public class MindGardenService { }
String systemName = "MindGarden";
log.info("MindGarden 시스템 시작");

// ✅ 필수
public class CoreSolutionService { }
String systemName = "CoreSolution";
log.info("CoreSolution 플랫폼 시작");
```

### 2. 용어 혼용 금지
```
❌ 금지:
- Onboarding과 Registration 혼용
- Ops와 Admin 혼용
- Tenant와 Client 혼용

✅ 권장:
- Onboarding으로 통일
- Ops로 통일
- Tenant로 통일
```

### 2. 임의 명칭 사용 금지
```
❌ 금지:
- 임의의 약자 사용 (MG_SYSTEM, CS_APP 등)
- 한글 로마자 표기 (mindgarden, coreso 등)
- 카멜케이스 혼용 (mindGarden, CoreSolution 등)

✅ 권장:
- 표준 약자 사용 (CS, OPS, OBS)
- 공식 영문명 사용 (CoreSolution, MindGarden)
- 일관된 케이스 사용 (snake_case, camelCase, PascalCase)
```

---

## 💡 베스트 프랙티스

### 1. 명확한 구분
```java
// Core System
@RestController
@RequestMapping("/api/v1/consultations")
public class ConsultationController { }

// Ops System
@RestController
@RequestMapping("/api/v1/ops/tenants")
public class OpsTenantController { }
```

### 2. 일관된 네이밍
```sql
-- Core System
CREATE TABLE tenants ( ... );
CREATE TABLE users ( ... );

-- Ops System
CREATE TABLE ops_tenants ( ... );
CREATE TABLE ops_subscriptions ( ... );
```

### 3. 명확한 문서화
```java
/**
 * 온보딩 요청 서비스
 * 
 * 테넌트가 CoreSolution 플랫폼에 입점을 신청하는 프로세스를 관리합니다.
 * Trinity 홈페이지에서 신청한 온보딩 요청을 처리하고,
 * HQ 관리자의 승인 후 테넌트를 생성합니다.
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Service
public class OnboardingService { }
```

---

## 📞 문의

시스템 명칭 통일 표준 관련 문의:
- 아키텍처 팀
- 개발 팀

**최종 업데이트**: 2025-12-02

