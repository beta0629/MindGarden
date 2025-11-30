# 비즈니스 타입 동적 관리 시스템

**작성일:** 2025-11-30  
**작성자:** AI Assistant & User  
**버전:** 1.0.0  
**목적:** 다양한 업종(상담소, 학원, 요식업 등)을 지원하는 멀티테넌트 시스템의 비즈니스 타입 관리 체계 정의

---

## 📋 목차

1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 구조](#데이터베이스-구조)
4. [TenantContext 구조](#tenantcontext-구조)
5. [기능 플래그 시스템](#기능-플래그-시스템)
6. [사용 예시](#사용-예시)
7. [확장 가이드](#확장-가이드)

---

## 개요

### 배경

MindGarden 플랫폼은 **멀티테넌트 SaaS**로, 다양한 업종의 고객사를 지원합니다:
- **상담소** (CONSULTATION): 심리상담, 가족상담, 부부상담 등
- **학원** (ACADEMY): 교육기관, 학원, 과외 등
- **요식업** (RESTAURANT): 음식점, 카페, 베이커리 등
- **기타** (OTHER): 향후 확장 가능

각 업종마다 필요한 기능이 다르므로, **동적으로 기능을 관리**할 수 있는 시스템이 필요합니다.

### 핵심 원칙

1. **동적 관리**: 모든 업종 및 기능 정의는 **DB에서 관리** (하드코딩 금지)
2. **확장성**: 새로운 업종 추가 시 코드 수정 없이 DB 데이터만 추가
3. **유연성**: 각 테넌트별로 기능 ON/OFF 가능
4. **성능**: TenantContext를 통한 빠른 접근

---

## 시스템 아키텍처

### 계층 구조

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Controller, Service, Repository)      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      TenantContext (ThreadLocal)        │
│  - tenantId: String                     │
│  - businessType: String                 │
│  - branchId: String                     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│    BusinessCategoryService              │
│  - canUseFeature()                      │
│  - getSupportedFeatures()               │
│  - getDefaultComponents()               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Database Layer                  │
│  - business_categories                  │
│  - business_category_items              │
│  - tenant_category_mappings             │
└─────────────────────────────────────────┘
```

### 데이터 흐름

1. **로그인 시**: TenantContextFilter가 User 정보에서 tenantId, businessType 추출
2. **요청 처리 중**: TenantContext에서 현재 테넌트 정보 조회
3. **기능 체크**: BusinessCategoryService로 기능 사용 가능 여부 확인
4. **요청 종료 시**: TenantContext 정리 (메모리 누수 방지)

---

## 데이터베이스 구조

### 1. business_categories (대분류)

업종의 대분류를 정의합니다.

```sql
CREATE TABLE business_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(36) UNIQUE NOT NULL,      -- 카테고리 UUID
    category_code VARCHAR(50) UNIQUE NOT NULL,    -- 카테고리 코드 (CONSULTATION, EDUCATION, FOOD_SERVICE)
    name_ko VARCHAR(255) NOT NULL,                -- 카테고리명 (한글)
    name_en VARCHAR(255),                         -- 카테고리명 (영문)
    description_ko TEXT,                          -- 설명 (한글)
    description_en TEXT,                          -- 설명 (영문)
    icon_url VARCHAR(500),                        -- 아이콘 URL
    display_order INT DEFAULT 0,                  -- 표시 순서
    is_active BOOLEAN DEFAULT TRUE,               -- 활성화 여부
    
    -- 확장 필드
    parent_category_id VARCHAR(36) NULL,          -- 상위 카테고리 (다단계 계층)
    level INT DEFAULT 1,                          -- 계층 레벨 (1=대분류, 2=중분류, 3=소분류)
    metadata_json JSON,                           -- 카테고리별 메타데이터
    settings_json JSON,                           -- 카테고리별 설정
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);
```

**예시 데이터:**
```json
{
  "category_id": "cat-consultation-001",
  "category_code": "CONSULTATION",
  "name_ko": "상담",
  "name_en": "Consultation",
  "description_ko": "심리상담, 가족상담, 부부상담 등",
  "level": 1,
  "is_active": true
}
```

### 2. business_category_items (소분류)

각 업종의 세부 타입과 기능을 정의합니다.

```sql
CREATE TABLE business_category_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id VARCHAR(36) UNIQUE NOT NULL,          -- 아이템 UUID
    category_id VARCHAR(36) NOT NULL,             -- 대분류 카테고리 ID
    item_code VARCHAR(50) UNIQUE NOT NULL,        -- 아이템 코드
    name_ko VARCHAR(255) NOT NULL,                -- 아이템명 (한글)
    name_en VARCHAR(255),                         -- 아이템명 (영문)
    description_ko TEXT,                          -- 설명 (한글)
    description_en TEXT,                          -- 설명 (영문)
    business_type VARCHAR(50) NOT NULL,           -- ⭐ tenants.business_type과 매핑
    icon_url VARCHAR(500),                        -- 아이콘 URL
    display_order INT DEFAULT 0,                  -- 표시 순서
    is_active BOOLEAN DEFAULT TRUE,               -- 활성화 여부
    
    -- ⭐ 핵심 확장 필드
    default_components_json JSON,                 -- 기본 컴포넌트 목록
    recommended_plan_ids_json JSON,               -- 추천 요금제 ID 목록
    default_role_template_ids_json JSON,          -- 기본 역할 템플릿 ID 목록
    onboarding_flow_json JSON,                    -- 온보딩 플로우 설정
    feature_flags_json JSON,                      -- ⭐ 기능 플래그 (핵심!)
    metadata_json JSON,                           -- 추가 메타데이터
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT fk_business_category_items_category 
    FOREIGN KEY (category_id) REFERENCES business_categories(category_id)
);
```

**예시 데이터 (상담소):**
```json
{
  "item_id": "item-consultation-psychology-001",
  "category_id": "cat-consultation-001",
  "item_code": "PSYCHOLOGY_CONSULTATION",
  "name_ko": "심리상담",
  "business_type": "CONSULTATION",
  "feature_flags_json": {
    "common": [
      "USER_MANAGEMENT",
      "ROLE_MANAGEMENT",
      "BRANCH_MANAGEMENT",
      "PAYMENT_MANAGEMENT",
      "STATISTICS_DASHBOARD",
      "NOTIFICATION",
      "MESSAGE_SYSTEM"
    ],
    "consultation_specific": [
      "CONSULTANT_MANAGEMENT",
      "CLIENT_MANAGEMENT",
      "CONSULTATION_SCHEDULE",
      "CONSULTATION_RECORD",
      "SESSION_MANAGEMENT",
      "QUALITY_EVALUATION",
      "CONSULTANT_RATING"
    ]
  },
  "default_components_json": [
    "dashboard",
    "consultant-management",
    "client-management",
    "schedule-management",
    "consultation-records"
  ],
  "recommended_plan_ids_json": [1, 2, 3],
  "default_role_template_ids_json": [1, 2, 3, 4]
}
```

**예시 데이터 (학원):**
```json
{
  "item_id": "item-academy-elementary-001",
  "category_id": "cat-education-001",
  "item_code": "ELEMENTARY_ACADEMY",
  "name_ko": "초등학원",
  "business_type": "ACADEMY",
  "feature_flags_json": {
    "common": [
      "USER_MANAGEMENT",
      "ROLE_MANAGEMENT",
      "BRANCH_MANAGEMENT",
      "PAYMENT_MANAGEMENT",
      "STATISTICS_DASHBOARD",
      "NOTIFICATION",
      "MESSAGE_SYSTEM"
    ],
    "academy_specific": [
      "STUDENT_MANAGEMENT",
      "TEACHER_MANAGEMENT",
      "COURSE_MANAGEMENT",
      "CLASS_MANAGEMENT",
      "CLASS_SCHEDULE",
      "ATTENDANCE_MANAGEMENT",
      "GRADE_MANAGEMENT",
      "ACADEMY_BILLING",
      "ACADEMY_SETTLEMENT"
    ]
  },
  "default_components_json": [
    "dashboard",
    "student-management",
    "teacher-management",
    "class-management",
    "attendance"
  ],
  "recommended_plan_ids_json": [10, 11, 12],
  "default_role_template_ids_json": [10, 11, 12, 13]
}
```

### 3. tenant_category_mappings (테넌트-카테고리 매핑)

각 테넌트가 어떤 카테고리를 사용하는지 매핑합니다.

```sql
CREATE TABLE tenant_category_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,               -- 테넌트 UUID
    category_item_id VARCHAR(36) NOT NULL,        -- 카테고리 아이템 ID
    is_primary BOOLEAN DEFAULT FALSE,             -- 주 카테고리 여부
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    
    CONSTRAINT fk_tenant_category_mappings_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id),
    
    CONSTRAINT fk_tenant_category_mappings_category_item 
    FOREIGN KEY (category_item_id) REFERENCES business_category_items(item_id),
    
    UNIQUE KEY uk_tenant_category (tenant_id, category_item_id)
);
```

**예시:**
```json
{
  "tenant_id": "tenant-seoul-consultation-001",
  "category_item_id": "item-consultation-psychology-001",
  "is_primary": true
}
```

---

## TenantContext 구조

### ThreadLocal 기반 컨텍스트

```java
public class TenantContext {
    private static final ThreadLocal<String> tenantId = new ThreadLocal<>();
    private static final ThreadLocal<String> branchId = new ThreadLocal<>();
    private static final ThreadLocal<String> businessType = new ThreadLocal<>();
    
    // Getter/Setter 메서드들...
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `tenantId` | String | ✅ | 테넌트 UUID (1차 필터링) | `tenant-seoul-consultation-001` |
| `businessType` | String | ✅ | 비즈니스 타입 (기능 분기) | `CONSULTATION`, `ACADEMY` |
| `branchId` | String | ❌ | 지점 ID (2차 필터링) | `branch-gangnam-001` |

### 설정 시점

**TenantContextFilter**에서 요청마다 자동 설정:

```java
@Override
protected void doFilterInternal(HttpServletRequest request, ...) {
    try {
        String tenantId = extractTenantId(request, session);
        String branchId = extractBranchId(request, session);
        String businessType = extractBusinessType(request, session);
        
        TenantContextHolder.setTenantId(tenantId);
        TenantContextHolder.setBranchId(branchId);
        TenantContextHolder.setBusinessType(businessType);
        
        chain.doFilter(request, response);
    } finally {
        TenantContextHolder.clear(); // 메모리 누수 방지
    }
}
```

### 추출 우선순위

#### 1. tenantId 추출
1. HTTP 헤더 `X-Tenant-Id`
2. Host 헤더에서 서브도메인 추출
3. 세션의 User 엔티티 `tenantId` 필드
4. User의 branchCode → Branch의 tenantId

#### 2. businessType 추출
1. HTTP 헤더 `X-Business-Type`
2. 세션의 `businessType` 속성
3. User → Branch → Tenant → businessType 조회
4. **기본값: "CONSULTATION"** (현재 운영 중)

#### 3. branchId 추출
1. HTTP 헤더 `X-Branch-Id`
2. 세션의 User 엔티티 `branchCode` 필드
3. 세션의 `branchCode` 속성

---

## 기능 플래그 시스템

### 공통 기능 (모든 업종)

```json
{
  "common_features": [
    "USER_MANAGEMENT",          // 사용자 관리
    "ROLE_MANAGEMENT",          // 역할 관리
    "BRANCH_MANAGEMENT",        // 지점 관리
    "PAYMENT_MANAGEMENT",       // 결제 관리
    "STATISTICS_DASHBOARD",     // 통계 대시보드
    "NOTIFICATION",             // 알림
    "MESSAGE_SYSTEM"            // 메시지 시스템
  ]
}
```

### 상담소 전용 기능

```json
{
  "consultation_features": [
    "CONSULTANT_MANAGEMENT",    // 상담사 관리
    "CLIENT_MANAGEMENT",        // 내담자 관리
    "CONSULTATION_SCHEDULE",    // 상담 일정
    "CONSULTATION_RECORD",      // 상담 기록
    "SESSION_MANAGEMENT",       // 회기 관리
    "QUALITY_EVALUATION",       // 품질 평가
    "CONSULTANT_RATING"         // 상담사 평점
  ]
}
```

### 학원 전용 기능

```json
{
  "academy_features": [
    "STUDENT_MANAGEMENT",       // 학생 관리
    "TEACHER_MANAGEMENT",       // 강사 관리
    "COURSE_MANAGEMENT",        // 과정 관리
    "CLASS_MANAGEMENT",         // 수업 관리
    "CLASS_SCHEDULE",           // 수업 일정
    "ATTENDANCE_MANAGEMENT",    // 출결 관리
    "GRADE_MANAGEMENT",         // 성적 관리
    "ACADEMY_BILLING",          // 학원 청구
    "ACADEMY_SETTLEMENT"        // 학원 정산
  ]
}
```

### 요식업 전용 기능

```json
{
  "restaurant_features": [
    "MENU_MANAGEMENT",          // 메뉴 관리
    "ORDER_MANAGEMENT",         // 주문 관리
    "TABLE_MANAGEMENT",         // 테이블 관리
    "INVENTORY_MANAGEMENT",     // 재고 관리
    "POS_INTEGRATION"           // POS 연동
  ]
}
```

---

## 사용 예시

### 1. 기능 사용 가능 여부 확인

```java
@Service
public class ConsultantServiceImpl implements ConsultantService {
    
    @Autowired
    private BusinessCategoryService businessCategoryService;
    
    public void registerConsultant(ConsultantDto dto) {
        // 현재 테넌트가 상담사 관리 기능을 사용할 수 있는지 확인
        if (!businessCategoryService.canUseFeatureInCurrentContext("CONSULTANT_MANAGEMENT")) {
            throw new BusinessException("이 기능은 현재 업종에서 사용할 수 없습니다.");
        }
        
        // 상담사 등록 로직...
    }
}
```

### 2. 업종별 분기 처리

```java
@Service
public class ScheduleServiceImpl implements ScheduleService {
    
    public List<Schedule> getSchedules() {
        String businessType = TenantContext.getBusinessType();
        
        switch (businessType) {
            case "CONSULTATION":
                return getConsultationSchedules();
            case "ACADEMY":
                return getClassSchedules();
            case "RESTAURANT":
                return getReservationSchedules();
            default:
                return getDefaultSchedules();
        }
    }
}
```

### 3. 프론트엔드 메뉴 동적 생성

```java
@RestController
@RequestMapping("/api/menu")
public class MenuController {
    
    @Autowired
    private BusinessCategoryService businessCategoryService;
    
    @GetMapping("/available")
    public ResponseEntity<List<MenuItem>> getAvailableMenu() {
        String tenantId = TenantContext.getTenantId();
        Set<String> features = businessCategoryService.getSupportedFeatures(
            TenantContext.getBusinessType()
        );
        
        List<MenuItem> menu = new ArrayList<>();
        
        if (features.contains("CONSULTANT_MANAGEMENT")) {
            menu.add(new MenuItem("상담사 관리", "/consultants"));
        }
        if (features.contains("STUDENT_MANAGEMENT")) {
            menu.add(new MenuItem("학생 관리", "/students"));
        }
        // ... 기타 메뉴 항목
        
        return ResponseEntity.ok(menu);
    }
}
```

### 4. 온보딩 시 기본 설정 적용

```java
@Service
public class OnboardingServiceImpl implements OnboardingService {
    
    @Autowired
    private BusinessCategoryService businessCategoryService;
    
    public void setupNewTenant(String tenantId, String businessType) {
        // 기본 컴포넌트 활성화
        List<String> components = businessCategoryService.getDefaultComponents(businessType);
        componentService.activateComponents(tenantId, components);
        
        // 추천 요금제 설정
        List<Long> planIds = businessCategoryService.getRecommendedPlanIds(businessType);
        subscriptionService.setRecommendedPlans(tenantId, planIds);
        
        // 기본 역할 템플릿 적용
        List<Long> roleTemplateIds = businessCategoryService.getDefaultRoleTemplateIds(businessType);
        roleService.applyRoleTemplates(tenantId, roleTemplateIds);
    }
}
```

---

## 확장 가이드

### 새로운 업종 추가하기

#### 1. 대분류 추가 (선택사항)

```sql
INSERT INTO business_categories (
    category_id, category_code, name_ko, name_en, 
    description_ko, level, is_active
) VALUES (
    'cat-healthcare-001',
    'HEALTHCARE',
    '의료',
    'Healthcare',
    '병원, 의원, 한의원 등',
    1,
    TRUE
);
```

#### 2. 소분류 및 business_type 추가

```sql
INSERT INTO business_category_items (
    item_id, category_id, item_code, name_ko, business_type,
    feature_flags_json, default_components_json,
    recommended_plan_ids_json, default_role_template_ids_json,
    is_active
) VALUES (
    'item-healthcare-clinic-001',
    'cat-healthcare-001',
    'GENERAL_CLINIC',
    '일반 의원',
    'CLINIC',
    JSON_OBJECT(
        'common', JSON_ARRAY(
            'USER_MANAGEMENT',
            'ROLE_MANAGEMENT',
            'BRANCH_MANAGEMENT',
            'PAYMENT_MANAGEMENT',
            'STATISTICS_DASHBOARD',
            'NOTIFICATION'
        ),
        'clinic_specific', JSON_ARRAY(
            'PATIENT_MANAGEMENT',
            'DOCTOR_MANAGEMENT',
            'APPOINTMENT_SCHEDULE',
            'MEDICAL_RECORD',
            'PRESCRIPTION_MANAGEMENT',
            'INSURANCE_CLAIM'
        )
    ),
    JSON_ARRAY('dashboard', 'patient-management', 'appointment', 'medical-records'),
    JSON_ARRAY(20, 21, 22),
    JSON_ARRAY(20, 21, 22, 23),
    TRUE
);
```

#### 3. 테넌트에 카테고리 매핑

```sql
INSERT INTO tenant_category_mappings (
    tenant_id, category_item_id, is_primary
) VALUES (
    'tenant-seoul-clinic-001',
    'item-healthcare-clinic-001',
    TRUE
);
```

#### 4. 코드 수정 없음!

- 기존 코드는 **수정 불필요**
- `BusinessCategoryService`가 자동으로 DB에서 읽어옴
- 프론트엔드 메뉴도 자동 생성

### 기능 추가/제거하기

#### 특정 테넌트의 기능 활성화

```sql
-- business_category_items의 feature_flags_json 업데이트
UPDATE business_category_items
SET feature_flags_json = JSON_SET(
    feature_flags_json,
    '$.consultation_specific',
    JSON_ARRAY_APPEND(
        JSON_EXTRACT(feature_flags_json, '$.consultation_specific'),
        '$',
        'NEW_FEATURE_CODE'
    )
)
WHERE business_type = 'CONSULTATION';
```

#### 특정 테넌트의 기능 비활성화

```sql
-- tenant별 커스텀 설정이 필요한 경우
-- tenants 테이블의 settings_json 활용
UPDATE tenants
SET settings_json = JSON_SET(
    COALESCE(settings_json, '{}'),
    '$.disabled_features',
    JSON_ARRAY('FEATURE_TO_DISABLE')
)
WHERE tenant_id = 'tenant-seoul-consultation-001';
```

---

## 모범 사례

### ✅ DO

1. **항상 DB에서 기능 정의 관리**
   ```java
   if (businessCategoryService.canUseFeature(tenantId, "CONSULTANT_MANAGEMENT")) {
       // 기능 실행
   }
   ```

2. **TenantContext 사용**
   ```java
   String businessType = TenantContext.getBusinessType();
   ```

3. **기능별 분기 처리**
   ```java
   switch (businessType) {
       case "CONSULTATION": ...
       case "ACADEMY": ...
   }
   ```

4. **공통 기능 우선 사용**
   - 가능한 한 모든 업종에서 사용 가능한 공통 기능으로 설계

### ❌ DON'T

1. **하드코딩 금지**
   ```java
   // ❌ 나쁜 예
   if (businessType.equals("CONSULTATION")) {
       // 상담소 전용 로직
   }
   
   // ✅ 좋은 예
   if (businessCategoryService.supportsFeature(businessType, "CONSULTANT_MANAGEMENT")) {
       // 기능 기반 로직
   }
   ```

2. **Enum으로 업종 정의 금지**
   ```java
   // ❌ 나쁜 예
   public enum BusinessType {
       CONSULTATION, ACADEMY, RESTAURANT
   }
   ```

3. **기능을 코드에 직접 정의 금지**
   ```java
   // ❌ 나쁜 예
   private static final Set<String> CONSULTATION_FEATURES = Set.of(...);
   ```

---

## 성능 최적화

### 캐싱 전략

```java
@Service
@CacheConfig(cacheNames = "businessCategory")
public class BusinessCategoryServiceImpl implements BusinessCategoryService {
    
    @Cacheable(key = "#businessType")
    public Set<String> getSupportedFeatures(String businessType) {
        // DB 조회 (캐시됨)
    }
    
    @Cacheable(key = "'common'")
    public Set<String> getCommonFeatures() {
        // 공통 기능은 한 번만 조회
    }
}
```

### 인덱스 최적화

```sql
-- business_category_items 테이블
CREATE INDEX idx_business_type ON business_category_items(business_type);
CREATE INDEX idx_is_active ON business_category_items(is_active);

-- tenant_category_mappings 테이블
CREATE INDEX idx_tenant_id ON tenant_category_mappings(tenant_id);
CREATE INDEX idx_is_primary ON tenant_category_mappings(is_primary);
```

---

## 마이그레이션 가이드

### 기존 시스템에서 전환

1. **현재 상태 확인**
   ```sql
   SELECT DISTINCT business_type FROM tenants;
   ```

2. **카테고리 데이터 생성**
   - V5 마이그레이션 실행 (이미 완료)
   - 기본 카테고리 데이터 삽입

3. **테넌트 매핑**
   ```sql
   INSERT INTO tenant_category_mappings (tenant_id, category_item_id, is_primary)
   SELECT 
       t.tenant_id,
       bci.item_id,
       TRUE
   FROM tenants t
   JOIN business_category_items bci ON bci.business_type = t.business_type
   WHERE t.is_deleted = FALSE;
   ```

4. **코드 업데이트**
   - 하드코딩된 업종 체크 제거
   - BusinessCategoryService 사용으로 변경

---

## 참고 문서

- [멀티테넌시 아키텍처](./MULTI_TENANCY_ARCHITECTURE.md)
- [TenantContext 가이드](./TENANT_CONTEXT_GUIDE.md)
- [데이터베이스 스키마](../database/SCHEMA.md)
- [API 표준화](./API_STANDARDIZATION.md)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2025-11-30 | AI Assistant | 초기 문서 작성 |

---

**문의:** 시스템 아키텍처 팀  
**최종 검토:** 2025-11-30


