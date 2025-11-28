# 전체 시스템 분석 - 소스코드부터 프로시저까지 (2025-11-27)

**작성일**: 2025-11-27  
**작성자**: AI Assistant  
**목적**: 일관성 있는 코딩을 위한 전체 시스템 완전 파악

---

## 📁 **프로젝트 구조 전체 현황**

### 패키지 구조 (3개 메인 모듈)
```
src/main/java/com/coresolution/
├── core/                           # 코어 패키지 (공통 기능, 멀티테넌시)
│   ├── domain/          47개       # 도메인 엔티티 (Tenant, TenantRole 등)
│   ├── service/         105개      # 서비스 (테넌트 관리, 온보딩 등)
│   ├── controller/      44개       # API 컨트롤러 (표준화 완료)
│   ├── repository/      32개       # 리포지토리 
│   ├── dto/            48개       # DTO (Academy 15개 포함)
│   ├── security/        8개       # 보안 관련
│   └── config/                     # 설정 (멀티테넌시, 캐시 등)
│
├── consultation/                    # 상담소 모델 (MindGarden 기존 코드)
│   ├── entity/          69개       # 엔티티 (User, Client, Consultant 등)
│   ├── service/         204개      # 서비스 (상담 관리, ERP 등)
│   ├── controller/      77개       # API 컨트롤러
│   ├── repository/      61개       # 리포지토리
│   ├── dto/            91개       # DTO
│   ├── config/                     # 설정 (보안, OAuth2 등)
│   └── util/                       # 유틸리티 (암호화, JWT 등)
│
└── user/                           # 사용자 관리 (테마 시스템 등)
    ├── controller/      1개        # ThemeController
    ├── service/         1개        # ThemeService  
    └── dto/            2개        # ThemeResponse, ThemeUpdateRequest
```

### 파일 수 집계
- **총 Java 파일**: 924개
- **핵심 엔티티**: 116개 (core: 47개, consultation: 69개)
- **서비스 클래스**: 309개 (core: 105개, consultation: 204개)
- **컨트롤러**: 122개 (core: 44개, consultation: 77개, user: 1개)
- **리포지토리**: 93개
- **DTO**: 141개

---

## 🗄️ **데이터베이스 스키마 구조**

### 1. 멀티테넌시 핵심 테이블
```sql
-- 테넌트 최상위 테이블
tenants (
    tenant_id VARCHAR(36) PRIMARY KEY,  -- UUID
    name VARCHAR(255),                   -- 테넌트명
    business_type VARCHAR(50),           -- 업종 (CONSULTATION, ACADEMY 등)
    status ENUM('PENDING','ACTIVE','SUSPENDED','CLOSED'),
    subscription_plan_id BIGINT,         -- 구독 요금제
    created_at, updated_at, is_deleted
)

-- 모든 엔티티가 상속받는 BaseEntity 구조
BaseEntity {
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),               -- 멀티테넌시 키
    created_at, updated_at, deleted_at,
    is_deleted BOOLEAN,
    version BIGINT                       -- 낙관적 락
}
```

### 2. 역할 및 권한 시스템
```sql
-- 역할 템플릿 (업종별 기본 역할)
role_templates (
    role_template_id VARCHAR(36) PRIMARY KEY,
    template_code VARCHAR(50),           -- CONSULTATION_CLIENT, ACADEMY_STUDENT 등
    name_ko VARCHAR(100),                -- 한국어 역할명
    business_type VARCHAR(20),           -- 업종
    default_widgets_json JSON            -- 기본 위젯 설정
)

-- 테넌트별 커스텀 역할
tenant_roles (
    tenant_role_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36),
    role_template_id VARCHAR(36),       -- 템플릿 참조 (선택적)
    name_ko VARCHAR(100),               -- 커스터마이징 가능한 역할명
    metadata_json JSON                  -- 역할 메타데이터
)

-- 사용자 역할 할당 (동적 역할 시스템)
user_role_assignments (
    assignment_id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT,
    tenant_id VARCHAR(36),
    tenant_role_id VARCHAR(36),
    branch_id BIGINT,                   -- 브랜치별 역할
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN
)

-- 역할별 권한
role_permissions (
    tenant_role_id VARCHAR(36),
    permission_code VARCHAR(100),
    policy_json JSON,                   -- ABAC 정책
    scope ENUM('SELF','BRANCH','TENANT','ALL')
)
```

### 3. 상담소 핵심 테이블
```sql
-- 사용자 (기본 정보)
users (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    name VARCHAR(100),
    role VARCHAR(50),                   -- 레거시 역할 (nullable)
    branch_id BIGINT
) EXTENDS BaseEntity

-- 내담자 (상담 받는 사람)
clients (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    medical_history TEXT,
    branch_code VARCHAR(20)
) EXTENDS BaseEntity

-- 상담사 (상담 제공자)  
consultants (
    id BIGINT PRIMARY KEY,
    license_number VARCHAR(100),
    speciality VARCHAR(100),
    career_years INT,
    introduction TEXT,
    is_available BOOLEAN
) EXTENDS BaseEntity

-- 상담 세션
consultations (
    id BIGINT PRIMARY KEY,
    client_id BIGINT,
    consultant_id BIGINT,
    session_date DATETIME,
    duration_minutes INT,
    status VARCHAR(20),
    notes TEXT
) EXTENDS BaseEntity
```

### 4. 학원 시스템 테이블
```sql
-- 강좌
academy_courses (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    course_name VARCHAR(200),
    description TEXT,
    instructor_id BIGINT,
    max_students INT,
    course_fee DECIMAL(10,2)
) EXTENDS BaseEntity

-- 반 (클래스)
academy_classes (
    id BIGINT PRIMARY KEY,
    course_id BIGINT,
    class_name VARCHAR(200),
    start_date DATE,
    end_date DATE,
    schedule_json JSON,                  -- 수업 일정 정보
    status VARCHAR(20)
) EXTENDS BaseEntity

-- 수강 등록
academy_class_enrollments (
    id BIGINT PRIMARY KEY,
    class_id BIGINT,
    student_id BIGINT,
    enrollment_date DATE,
    status VARCHAR(20),
    payment_status VARCHAR(20)
) EXTENDS BaseEntity

-- 출석
academy_attendances (
    id BIGINT PRIMARY KEY,
    class_id BIGINT,
    student_id BIGINT,
    attendance_date DATE,
    status VARCHAR(20),                  -- PRESENT, ABSENT, LATE
    notes TEXT
) EXTENDS BaseEntity
```

### 5. ERP 시스템 테이블
```sql
-- 재무 거래
financial_transactions (
    id BIGINT PRIMARY KEY,
    transaction_type VARCHAR(50),       -- INCOME, EXPENSE, RECEIVABLES
    amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    description TEXT,
    status VARCHAR(20),                 -- PENDING, APPROVED, COMPLETED
    related_entity_type VARCHAR(50),    -- 연관 엔티티 타입
    related_entity_id BIGINT           -- 연관 엔티티 ID
) EXTENDS BaseEntity

-- 회계 분개 (확장 예정)
accounting_entries (
    id BIGINT PRIMARY KEY,
    entry_date DATE,
    entry_type ENUM('DEBIT','CREDIT'), -- 차변/대변
    account_code VARCHAR(20),
    account_name VARCHAR(100),
    amount DECIMAL(15,2),
    description TEXT,
    related_transaction_id BIGINT      -- FinancialTransaction 참조
)

-- 급여 계산
salary_calculations (
    id BIGINT PRIMARY KEY,
    consultant_id BIGINT,
    calculation_period VARCHAR(10),     -- YYYYMM
    base_salary DECIMAL(15,2),
    consultation_bonus DECIMAL(15,2),
    gross_salary DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    net_salary DECIMAL(15,2)
) EXTENDS BaseEntity
```

### 6. 공통 코드 시스템
```sql
-- 공통 코드 (테넌트별 독립성)
common_codes (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),              -- NULL: 코어 코드, 값: 테넌트 코드
    code_group VARCHAR(50),
    code_value VARCHAR(50),
    code_label VARCHAR(100),
    korean_name VARCHAR(100),           -- 한국어 명 필수
    sort_order INT,
    is_active BOOLEAN,
    UNIQUE KEY uk_tenant_code (tenant_id, code_group, code_value)
)

-- 코드 그룹 메타데이터
code_group_metadata (
    group_name VARCHAR(50) PRIMARY KEY,
    code_type VARCHAR(20),              -- 'CORE' 또는 'TENANT'
    description TEXT,
    display_options JSON                -- 표시 옵션
)
```

---

## ⚙️ **PL/SQL 프로시저 시스템 (17개)**

### 급여 관리 프로시저
```sql
-- 상담사 급여 계산 (복잡한 비즈니스 로직)
PROCEDURE CalculateConsultantSalary(
    IN p_consultant_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    OUT p_gross_salary DECIMAL(15,2),
    OUT p_net_salary DECIMAL(15,2),
    OUT p_tax_amount DECIMAL(15,2)
)
-- 기능: 상담 횟수, 시급, 등급별 요율, 세금 계산

-- 통합 급여-ERP 동기화
PROCEDURE ProcessIntegratedSalaryCalculation(...)
-- 기능: 급여 계산 + 회계 분개 + ERP 동기화
```

### 승인 관리 프로시저
```sql
-- 통합 승인 요청 생성
PROCEDURE CreateApprovalRequest(
    IN p_entity_type VARCHAR(50),       -- 승인 대상 유형
    IN p_entity_id BIGINT,
    IN p_approval_type VARCHAR(50),
    OUT p_approval_id BIGINT
)

-- 승인 처리
PROCEDURE ProcessApproval(
    IN p_approval_id BIGINT,
    IN p_action VARCHAR(20),           -- APPROVE, REJECT
    IN p_approved_by VARCHAR(100)
)
```

### 회계 관리 프로시저
```sql
-- 통합 회계 관리 (integrated_accounting_management.sql)
-- 복잡한 분개 처리, 원장 업데이트, 재무제표 생성
```

### 기타 프로시저들
```sql
procedures/
├── salary_management_procedures.sql          # 급여 계산
├── integrated_salary_erp_system.sql         # 급여-ERP 통합
├── integrated_accounting_management.sql      # 통합 회계
├── approval_management_procedures.sql        # 승인 관리
├── item_management_procedures.sql           # 아이템/재고 관리
├── budget_management_procedures.sql         # 예산 관리
├── update_consultant_performance.sql        # 상담사 성과 분석
├── consultation_record_alert_procedures.sql # 상담 알림
├── mapping_session_integration.sql          # 매칭-세션 통합
├── refund_session_integration.sql           # 환불-세션 통합
├── discount_accounting_procedures.sql       # 할인 회계 처리
├── create_or_activate_tenant.sql           # 테넌트 생성/활성화
├── copy_default_tenant_codes.sql           # 기본 코드 복사
├── mapping_permission_procedures.sql        # 매핑 권한
├── update_daily_statistics.sql             # 일일 통계 업데이트
├── simple_test.sql                         # 테스트용
└── consultation_record_alert_procedures.sql # 상담 기록 알림
```

---

## 🏗️ **아키텍처 패턴**

### 1. 멀티테넌시 구현
```java
// ThreadLocal 기반 테넌트 컨텍스트
public class TenantContext {
    private static final ThreadLocal<String> tenantId = new ThreadLocal<>();
    
    public static void setTenantId(String tenantId) {
        TenantContext.tenantId.set(tenantId);
    }
    
    public static String getTenantId() {
        return tenantId.get();
    }
}

// Hibernate 멀티테넌시 통합
@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {
    @Override
    public String resolveCurrentTenantIdentifier() {
        return TenantContext.getTenantId();
    }
}

// 모든 엔티티가 상속받는 기본 클래스
@MappedSuperclass
public abstract class BaseEntity {
    @Column(name = "tenant_id", length = 36)
    private String tenantId;  // 멀티테넌시 키
    
    // 공통 필드: id, created_at, updated_at, is_deleted, version
}
```

### 2. 서비스 레이어 계층 구조
```java
// 최상위 기본 서비스 (공통 CRUD)
public interface BaseService<T extends BaseEntity, ID> {
    List<T> findAllActive();
    T save(T entity);
    void softDeleteById(ID id);
    // 공통 CRUD 메서드 정의
}

// 테넌트 기반 서비스 (업종 공통)
public interface BaseTenantService<T, ID, REQ, RES> {
    List<RES> findAll(String tenantId, Long branchId);
    RES create(String tenantId, REQ request, String createdBy);
    RES update(String tenantId, ID id, REQ request, String updatedBy);
    // 테넌트 기반 CRUD
}

// 구체적인 서비스 구현
@Service
public class ConsultationServiceImpl extends BaseServiceImpl<Consultation, Long> 
    implements ConsultationService {
    // 상담 관련 비즈니스 로직
}
```

### 3. 표준화된 API 구조
```java
// 표준 API 응답
@Data
public class ApiResponse<T> {
    private boolean success = true;
    private String message;
    private T data;
    private LocalDateTime timestamp = LocalDateTime.now();
}

// 표준 컨트롤러 기본 클래스
public abstract class BaseApiController {
    protected <T> ResponseEntity<ApiResponse<T>> success(T data) {
        return ResponseEntity.ok(ApiResponse.success(data));
    }
    
    protected <T> ResponseEntity<ApiResponse<T>> created(T data) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("생성되었습니다.", data));
    }
}

// 실제 컨트롤러
@RestController
@RequestMapping("/api/admin/branding")
public class BrandingController extends BaseApiController {
    // 표준화된 응답 형식 사용
}
```

### 4. 업종별 컴포넌트 분리
```java
// 업종 검증 어노테이션
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireBusinessType {
    String[] value();  // {"CONSULTATION", "ACADEMY"}
}

// AOP 기반 업종 검증
@Aspect
@Component
public class BusinessTypeAspect {
    @Before("@annotation(requireBusinessType)")
    public void validateBusinessType(JoinPoint joinPoint, RequireBusinessType requireBusinessType) {
        // 테넌트의 업종과 요구 업종 검증
    }
}

// 컨트롤러 적용
@RestController
@RequireBusinessType("CONSULTATION")
public class ConsultationController extends BaseApiController {
    // 상담소 전용 API
}
```

---

## 🔄 **데이터 플로우**

### 1. 일반적인 요청 플로우
```
1. HTTP 요청 → TenantContextFilter
2. 토큰에서 tenant_id 추출 → TenantContext.setTenantId()
3. @RequireBusinessType AOP → 업종 검증
4. Controller → Service → Repository
5. Hibernate MultiTenancy → 자동으로 WHERE tenant_id = ? 추가
6. BaseApiController → 표준화된 ApiResponse 반환
```

### 2. 급여 계산 플로우 (프로시저 활용)
```
1. SalaryService.calculateSalary() 
2. → JdbcTemplate.call(CalculateConsultantSalary)
3. → 프로시저 내부: 상담 횟수, 시급, 등급별 계산
4. → 세금 계산 (원천징수, 4대보험)
5. → SalaryCalculation 엔티티 저장
6. → FinancialTransaction 생성 (ERP 연동)
7. → 회계 분개 처리
```

### 3. 멀티테넌트 데이터 격리
```
모든 쿼리에 자동으로 tenant_id 조건 추가:
SELECT * FROM consultations WHERE id = ? AND tenant_id = ?
INSERT INTO clients (..., tenant_id) VALUES (..., ?)
UPDATE schedules SET ... WHERE id = ? AND tenant_id = ?
```

---

## 📊 **Flyway 마이그레이션 (54개)**

### 주요 마이그레이션들
```sql
V10__add_tenant_id_to_common_codes.sql         # 공통코드 멀티테넌트
V13__create_onboarding_approval_procedures.sql  # 온보딩 프로시저
V19__create_academy_system_tables.sql          # 학원 시스템
V32__create_user_role_assignments_table.sql    # 동적 역할 시스템
V38__create_business_rule_mappings_table.sql   # 비즈니스 규칙
V42__create_create_or_activate_tenant_procedure.sql # 테넌트 생성
V49__create_statistics_metadata_tables.sql     # 통계 메타데이터
V55__integrate_tenant_code_copy_to_onboarding.sql # 온보딩 개선
V56__increase_merchant_id_length.sql           # 최신 마이그레이션
```

### 마이그레이션 분류
- **테넌트/멀티테넌시**: V10, V26, V27, V28, V29, V42, V55
- **역할/권한 시스템**: V32, V34, V43, V46
- **학원 시스템**: V19, V44, V47, V48
- **온보딩 시스템**: V13, V15, V24, V41, V47
- **ERP/재무**: V22, V24, V36, V49, V50
- **공통코드**: V10, V35, V51, V52, V53

---

## 🎯 **핵심 비즈니스 로직**

### 1. 상담소 비즈니스 로직
- **상담 예약**: 상담사 스케줄 → 클라이언트 매칭 → 결제 처리
- **세션 관리**: 출석 체크 → 상담 기록 → 성과 평가
- **급여 계산**: 상담 횟수 × 시급 + 등급별 보너스 - 세금
- **성과 분석**: 완료율, 평점, 고객 유지율 → 등급 산정

### 2. 학원 비즈니스 로직  
- **수강 등록**: 강좌 선택 → 반 배정 → 결제 처리
- **출석 관리**: 일일 출석 → 출석률 계산 → 알림 발송
- **성적 관리**: 시험 점수 → 성적 산정 → 학부모 알림
- **정산**: 수강료 수입 → 강사료 지출 → 본사 수수료

### 3. ERP 비즈니스 로직
- **재무 거래**: 수입/지출 기록 → 승인 프로세스 → 회계 분개
- **급여 처리**: 급여 계산 → 세금 처리 → 4대보험 → 실지급액
- **구매 관리**: 구매 요청 → 승인 → 주문 → 입고 → 재고 관리
- **통계 생성**: 일일 매출 → 월간 손익 → 연간 재무제표

---

## 🔐 **보안 및 인증**

### 1. 인증 시스템
```java
// JWT 기반 인증
@Component
public class JwtTokenUtil {
    public String generateToken(UserDetails userDetails, String tenantId) {
        // JWT에 tenant_id, role 정보 포함
    }
}

// OAuth2 연동 (카카오, 네이버)
@Configuration
public class KakaoOAuth2Config {
    // 소셜 로그인 설정
}
```

### 2. 권한 관리
```java
// 동적 권한 체크
@Service
public class DynamicPermissionService {
    public boolean hasPermission(String userId, String resource, String action) {
        // RolePermission 테이블에서 동적 권한 확인
        // ABAC 정책 기반 검증
    }
}

// 메서드 레벨 보안
@PreAuthorize("@dynamicPermissionService.hasPermission(authentication.name, 'CONSULTATION', 'CREATE')")
public void createConsultation(...) {
    // 권한이 있는 사용자만 실행 가능
}
```

### 3. 데이터 암호화
```java
@Component
public class PersonalDataEncryptionUtil {
    public String encrypt(String plainText) {
        // AES-256 개인정보 암호화
    }
}
```

---

## 🚀 **성능 최적화**

### 1. 캐싱 전략
```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        // 테넌트별 캐시 설정
        // 공통코드, 역할정보, 설정정보 캐싱
    }
}
```

### 2. 인덱스 전략
```sql
-- 멀티테넌트 복합 인덱스
CREATE INDEX idx_tenant_entity ON table_name(tenant_id, entity_specific_column);

-- 주요 인덱스들
idx_tenant_id_status ON tenants(tenant_id, status)
idx_tenant_code_group ON common_codes(tenant_id, code_group, code_value)
idx_user_tenant_role ON user_role_assignments(user_id, tenant_id, is_active)
```

### 3. 프로시저 활용
- 복잡한 계산 로직 (급여, 정산, 통계)은 PL/SQL 프로시저로 구현
- 네트워크 왕복 최소화 및 데이터베이스 레벨 처리로 성능 향상

---

## 📈 **확장 가능성**

### 1. 새로운 업종 추가
```java
// 1. business_categories 테이블에 새 업종 추가
// 2. RoleTemplate에 업종별 기본 역할 정의
// 3. @RequireBusinessType 어노테이션에 업종 추가
// 4. 업종별 특화 컨트롤러/서비스 구현
```

### 2. 새로운 모듈 추가
```java
// BaseTenantService를 상속받아 공통 CRUD 자동 구현
public class NewModuleServiceImpl extends BaseTenantServiceImpl<NewEntity, Long, NewRequest, NewResponse> {
    // 업종별 특화 비즈니스 로직만 구현
}
```

### 3. 새로운 권한 추가
```java
// RolePermission 테이블에 새 권한 코드 추가
// ABAC 정책 JSON으로 세밀한 권한 제어 가능
{
  "resource": "CONSULTATION",
  "action": "CREATE", 
  "conditions": {
    "branch_id": "${user.branchId}",
    "time_range": "09:00-18:00"
  }
}
```

---

## 📝 **개발 가이드라인**

### 1. 신규 개발 시 준수사항
1. **엔티티**: BaseEntity 상속 필수 (멀티테넌시 지원)
2. **서비스**: BaseTenantService 구현 권장 (공통 CRUD)
3. **컨트롤러**: BaseApiController 상속 (표준 응답)
4. **권한**: @RequireBusinessType 어노테이션 활용
5. **응답**: ApiResponse 래퍼 사용

### 2. 코딩 규칙
- **하드코딩 금지**: 모든 설정값은 공통코드 또는 설정 테이블에서 조회
- **테넌트 독립성**: 모든 데이터는 tenant_id로 격리
- **표준화**: BaseApiController의 표준 메서드 사용
- **한국어 필수**: 모든 사용자 대상 텍스트는 한국어

### 3. 데이터베이스 규칙
- **Flyway 마이그레이션**: 모든 스키마 변경은 마이그레이션 파일로 관리
- **복합 인덱스**: tenant_id를 첫 번째 컬럼으로 하는 인덱스 생성
- **소프트 삭제**: is_deleted 플래그 활용
- **버전 관리**: 낙관적 락을 위한 version 컬럼

---

## 🎯 **결론**

이 시스템은 **멀티테넌트 SaaS 플랫폼**으로서 다음과 같은 특징을 가집니다:

1. **완전한 멀티테넌시**: 모든 데이터가 테넌트별로 격리
2. **업종별 확장성**: 새로운 업종 추가가 용이한 구조
3. **동적 권한 시스템**: 테넌트별 커스텀 역할 및 권한
4. **표준화된 API**: 일관된 응답 구조 및 에러 처리
5. **고성능 프로시저**: 복잡한 비즈니스 로직의 DB 레벨 처리
6. **완전한 ERP 통합**: 급여, 회계, 구매, 재무 관리

**총 924개의 Java 파일, 54개의 마이그레이션, 17개의 프로시저**로 구성된 대규모 엔터프라이즈 시스템입니다.

---

**마지막 업데이트**: 2025-11-27  
**다음 리뷰**: 시스템 변경 시 본 문서 업데이트 필요
