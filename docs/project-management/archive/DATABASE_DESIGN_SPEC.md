# Core-Solution 데이터베이스 설계 명세서

> **작성일:** 2025-01-XX  
> **목적:** MindGarden → Core-Solution 전환을 위한 확장 가능한 데이터베이스 설계  
> **원칙:** 멀티테넌시, 확장성, 성능, 데이터 중앙화

## 1. 설계 원칙

### 1.1 핵심 원칙
1. **데이터 중앙화**: 모든 데이터는 `core_solution` DB에 저장
2. **멀티테넌시**: `tenant_id` 기반 파티셔닝 전략
3. **확장성**: 업종별 모듈 테이블 추가 가능한 구조
4. **성능**: 인덱스 최적화, 파티셔닝 전략
5. **하위 호환성**: 기존 Branch 구조 유지하면서 Tenant 레이어 추가

### 1.2 네이밍 규칙
- 테이블명: `snake_case`, 복수형 (예: `tenants`, `users`, `consultations`)
- 컬럼명: `snake_case` (예: `tenant_id`, `created_at`, `is_deleted`)
- 인덱스명: `idx_{table}_{column}` (예: `idx_users_tenant_id`)
- 외래키명: `fk_{table}_{referenced_table}` (예: `fk_users_tenants`)

### 1.3 공통 필드 규칙
모든 주요 테이블은 다음 필드를 포함:
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `tenant_id`: VARCHAR(36) - 테넌트 식별자 (UUID)
- `branch_id`: BIGINT - 지점 ID (기존 구조 유지)
- `created_at`: TIMESTAMP - 생성일시
- `updated_at`: TIMESTAMP - 수정일시
- `deleted_at`: TIMESTAMP NULL - 삭제일시 (소프트 삭제)
- `is_deleted`: BOOLEAN DEFAULT FALSE - 삭제 여부
- `version`: BIGINT DEFAULT 0 - 낙관적 잠금
- `lang_code`: VARCHAR(10) DEFAULT 'ko' - 언어 코드
- `created_by`: VARCHAR(100) - 생성자
- `updated_by`: VARCHAR(100) - 수정자

## 2. 핵심 테이블 설계

### 2.1 Tenant 테이블 (신규)

**목적**: 멀티테넌시의 최상위 엔티티

```sql
CREATE TABLE tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) UNIQUE NOT NULL COMMENT '테넌트 UUID',
    name VARCHAR(255) NOT NULL COMMENT '테넌트명',
    business_type VARCHAR(50) NOT NULL COMMENT '업종: CONSULTATION, ACADEMY, FOOD_SERVICE 등',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, ACTIVE, SUSPENDED, CLOSED',
    
    -- 구독 정보
    subscription_plan_id BIGINT COMMENT '구독 요금제 ID',
    subscription_status VARCHAR(20) DEFAULT 'INACTIVE' COMMENT '구독 상태',
    subscription_start_date DATE COMMENT '구독 시작일',
    subscription_end_date DATE COMMENT '구독 종료일',
    
    -- 연락처 정보
    contact_email VARCHAR(100) COMMENT '연락 이메일',
    contact_phone VARCHAR(20) COMMENT '연락 전화번호',
    contact_person VARCHAR(100) COMMENT '담당자명',
    
    -- 주소 정보
    postal_code VARCHAR(10) COMMENT '우편번호',
    address VARCHAR(255) COMMENT '주소',
    address_detail VARCHAR(255) COMMENT '상세 주소',
    
    -- 설정 정보
    settings_json JSON COMMENT '테넌트별 설정 (JSON)',
    branding_json JSON COMMENT '브랜딩 정보 (로고, 색상 등)',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_business_type (business_type),
    INDEX idx_status (status),
    INDEX idx_subscription_plan (subscription_plan_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_deleted (is_deleted),
    
    -- 제약조건
    CONSTRAINT chk_tenant_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED')),
    CONSTRAINT chk_business_type CHECK (business_type IN ('CONSULTATION', 'ACADEMY', 'FOOD_SERVICE', 'RETAIL', 'SERVICE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트(사업장) 정보 테이블';
```

**확장 고려사항:**
- 향후 `parent_tenant_id` 추가 가능 (프랜차이즈 구조)
- `metadata_json` 필드로 업종별 커스텀 필드 저장 가능
- `settings_json`으로 테넌트별 설정 확장 가능

### 2.2 Branch 테이블 (기존 확장)

**목적**: 테넌트 하위 지점 관리 (기존 구조 유지 + Tenant 연계)

```sql
-- 기존 branches 테이블에 tenant_id 추가
ALTER TABLE branches 
    ADD COLUMN tenant_id VARCHAR(36) AFTER id,
    ADD COLUMN lang_code VARCHAR(10) DEFAULT 'ko' AFTER updated_at,
    ADD COLUMN created_by VARCHAR(100) AFTER created_at,
    ADD COLUMN updated_by VARCHAR(100) AFTER updated_at;

-- 외래키 추가
ALTER TABLE branches
    ADD CONSTRAINT fk_branches_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 인덱스 추가
CREATE INDEX idx_branches_tenant_id ON branches(tenant_id);
CREATE INDEX idx_branches_tenant_status ON branches(tenant_id, branch_status);
```

**기존 구조 유지:**
- `branch_code`, `branch_name`, `branch_type`, `branch_status` 등 기존 필드 유지
- 기존 인덱스 유지
- 기존 관계 유지 (parent_branch_id 등)

### 2.3 AuthUser 테이블 (통합 계정)

**목적**: 모든 사용자 계정 통합 관리 (직원/소비자 공통)

```sql
CREATE TABLE auth_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auth_user_id VARCHAR(36) UNIQUE NOT NULL COMMENT '인증 사용자 UUID',
    login_id VARCHAR(100) UNIQUE NOT NULL COMMENT '로그인 ID (이메일 또는 사용자명)',
    password_hash VARCHAR(255) NOT NULL COMMENT '비밀번호 해시 (bcrypt)',
    
    -- 계정 상태
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '상태: ACTIVE, INACTIVE, LOCKED, SUSPENDED',
    email_verified BOOLEAN DEFAULT FALSE COMMENT '이메일 인증 여부',
    phone_verified BOOLEAN DEFAULT FALSE COMMENT '전화번호 인증 여부',
    
    -- MFA 설정
    mfa_enabled BOOLEAN DEFAULT FALSE COMMENT 'MFA 활성화 여부',
    mfa_secret VARCHAR(255) COMMENT 'MFA Secret (암호화)',
    mfa_backup_codes JSON COMMENT 'MFA 백업 코드',
    
    -- 로그인 정보
    last_login_at TIMESTAMP NULL COMMENT '마지막 로그인 일시',
    last_login_ip VARCHAR(45) COMMENT '마지막 로그인 IP',
    failed_login_count INT DEFAULT 0 COMMENT '실패 로그인 횟수',
    locked_until TIMESTAMP NULL COMMENT '계정 잠금 해제 일시',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_auth_user_id (auth_user_id),
    INDEX idx_login_id (login_id),
    INDEX idx_status (status),
    INDEX idx_last_login (last_login_at),
    INDEX idx_is_deleted (is_deleted),
    
    -- 제약조건
    CONSTRAINT chk_auth_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='통합 인증 사용자 테이블';
```

**확장 고려사항:**
- 소셜 로그인 매핑은 별도 테이블 `auth_user_social`로 관리
- 기기 등록 정보는 별도 테이블 `auth_user_devices`로 관리
- 세션 정보는 Redis 또는 별도 테이블로 관리

### 2.4 AuthUserSocial 테이블 (소셜 로그인 매핑)

**목적**: 소셜 로그인 계정 매핑

```sql
CREATE TABLE auth_user_social (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auth_user_id VARCHAR(36) NOT NULL COMMENT '인증 사용자 ID',
    provider VARCHAR(20) NOT NULL COMMENT '제공자: KAKAO, NAVER, GOOGLE 등',
    provider_user_id VARCHAR(255) NOT NULL COMMENT '제공자 사용자 ID',
    email VARCHAR(100) COMMENT '이메일',
    profile_json JSON COMMENT '프로필 정보 (JSON)',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_auth_user_id (auth_user_id),
    INDEX idx_provider_user (provider, provider_user_id),
    UNIQUE KEY uk_provider_user (provider, provider_user_id),
    
    -- 외래키
    CONSTRAINT fk_auth_user_social_auth_users 
    FOREIGN KEY (auth_user_id) REFERENCES auth_users(auth_user_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='소셜 로그인 계정 매핑 테이블';
```

### 2.5 StaffAccount 테이블 (직원 계정)

**목적**: 테넌트/지점 직원 계정 정보

```sql
CREATE TABLE staff_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(36) UNIQUE NOT NULL COMMENT '직원 UUID',
    auth_user_id VARCHAR(36) UNIQUE NOT NULL COMMENT '인증 사용자 ID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    branch_id BIGINT COMMENT '지점 ID',
    
    -- 직원 정보
    employee_number VARCHAR(50) COMMENT '사번',
    position VARCHAR(100) COMMENT '직책',
    department VARCHAR(100) COMMENT '부서',
    hire_date DATE COMMENT '입사일',
    leave_date DATE COMMENT '퇴사일',
    
    -- 권한 정보
    role VARCHAR(50) NOT NULL COMMENT '역할: HQ_ADMIN, TENANT_OWNER, BRANCH_MANAGER, STAFF 등',
    permissions_json JSON COMMENT '권한 목록 (JSON)',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_staff_id (staff_id),
    INDEX idx_auth_user_id (auth_user_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_tenant_branch (tenant_id, branch_id),
    INDEX idx_role (role),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_staff_accounts_auth_users 
    FOREIGN KEY (auth_user_id) REFERENCES auth_users(auth_user_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_staff_accounts_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_staff_accounts_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='직원 계정 테이블';
```

**확장 고려사항:**
- 다중 역할 지원: 별도 테이블 `staff_role_assignments`로 관리 가능
- 권한 템플릿: `role_template` 테이블과 연계

### 2.6 ConsumerAccount 테이블 (소비자 계정)

**목적**: 테넌트 고객/회원 계정 정보

```sql
CREATE TABLE consumer_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consumer_id VARCHAR(36) UNIQUE NOT NULL COMMENT '소비자 UUID',
    auth_user_id VARCHAR(36) UNIQUE NOT NULL COMMENT '인증 사용자 ID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    
    -- 소비자 정보
    customer_number VARCHAR(50) COMMENT '고객번호',
    membership_level VARCHAR(50) COMMENT '멤버십 등급',
    membership_points BIGINT DEFAULT 0 COMMENT '적립 포인트',
    
    -- 동의 정보
    consent_flags JSON COMMENT '동의 플래그 (마케팅, 개인정보 등)',
    marketing_consent BOOLEAN DEFAULT FALSE COMMENT '마케팅 동의',
    privacy_consent BOOLEAN DEFAULT FALSE COMMENT '개인정보 동의',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_auth_user_id (auth_user_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_customer_number (customer_number),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_consumer_accounts_auth_users 
    FOREIGN KEY (auth_user_id) REFERENCES auth_users(auth_user_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_consumer_accounts_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='소비자 계정 테이블';
```

## 3. 카테고리 모델 설계

### 3.1 개요

**목적**: 소상공인 업종 카테고리 관리 시스템 (상담소, 학원, 요식업 등)
- 업종별 분류 및 계층 구조 지원
- 테넌트와 카테고리의 다대다 관계
- 카테고리별 자동 설정 (컴포넌트, 요금제, 권한 템플릿 등)
- 확장 가능한 구조 (다단계 계층, 메타데이터, 통계)

**확장 고려사항:**
- 다단계 계층 구조 지원 (대분류 > 중분류 > 소분류)
- 카테고리별 자동 온보딩 설정
- 카테고리별 통계 및 분석
- 다국어 지원 (한글, 영문, 향후 확장)

### 3.2 BusinessCategory 테이블 (대분류)

**목적**: 업종 대분류 관리 (예: 교육, 요식, 서비스, 소매 등)

```sql
CREATE TABLE business_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(36) UNIQUE NOT NULL COMMENT '카테고리 UUID',
    category_code VARCHAR(50) UNIQUE NOT NULL COMMENT '카테고리 코드',
    name_ko VARCHAR(255) NOT NULL COMMENT '카테고리명 (한글)',
    name_en VARCHAR(255) COMMENT '카테고리명 (영문)',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    icon_url VARCHAR(500) COMMENT '아이콘 URL',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 확장 필드 (다단계 계층 지원)
    parent_category_id VARCHAR(36) NULL COMMENT '상위 카테고리 (다단계 계층 지원)',
    level INT DEFAULT 1 COMMENT '계층 레벨 (1=대분류, 2=중분류, 3=소분류)',
    metadata_json JSON COMMENT '카테고리별 메타데이터 (컴포넌트 매핑, 요금제 추천 등)',
    settings_json JSON COMMENT '카테고리별 설정 (온보딩 플로우, 권한 템플릿 등)',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_category_id (category_id),
    INDEX idx_category_code (category_code),
    INDEX idx_parent_category_id (parent_category_id),
    INDEX idx_level (level),
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_business_categories_parent 
    FOREIGN KEY (parent_category_id) REFERENCES business_categories(category_id) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='업종 대분류 카테고리 테이블';
```

**확장 고려사항:**
- `parent_category_id`로 무제한 계층 구조 지원
- `metadata_json`에 카테고리별 컴포넌트 자동 매핑 정보 저장
- `settings_json`에 카테고리별 온보딩 플로우, 권한 템플릿 등 저장
- 향후 다국어 확장 시 `name_zh`, `name_ja` 등 추가 가능

### 3.3 BusinessCategoryItem 테이블 (소분류)

**목적**: 업종 소분류 관리 (예: 학원, 과외, 태권도장 / 한식, 중식, 양식 등)

```sql
CREATE TABLE business_category_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id VARCHAR(36) UNIQUE NOT NULL COMMENT '카테고리 아이템 UUID',
    category_id VARCHAR(36) NOT NULL COMMENT '대분류 카테고리 ID',
    item_code VARCHAR(50) UNIQUE NOT NULL COMMENT '아이템 코드',
    name_ko VARCHAR(255) NOT NULL COMMENT '아이템명 (한글)',
    name_en VARCHAR(255) COMMENT '아이템명 (영문)',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    business_type VARCHAR(50) NOT NULL COMMENT 'business_type 코드 (tenants.business_type과 매핑)',
    icon_url VARCHAR(500) COMMENT '아이콘 URL',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 확장 필드 (자동 설정)
    default_components_json JSON COMMENT '기본 컴포넌트 목록 (자동 활성화)',
    recommended_plan_ids_json JSON COMMENT '추천 요금제 ID 목록',
    default_role_template_ids_json JSON COMMENT '기본 역할 템플릿 ID 목록',
    onboarding_flow_json JSON COMMENT '온보딩 플로우 설정',
    feature_flags_json JSON COMMENT '카테고리별 Feature Flag 기본값',
    metadata_json JSON COMMENT '추가 메타데이터 (통계, 분석 등)',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_item_id (item_id),
    INDEX idx_category_id (category_id),
    INDEX idx_item_code (item_code),
    INDEX idx_business_type (business_type),
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_business_category_items_category 
    FOREIGN KEY (category_id) REFERENCES business_categories(category_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='업종 소분류 카테고리 아이템 테이블';
```

**확장 고려사항:**
- `default_components_json`: 테넌트 온보딩 시 자동 활성화할 컴포넌트 목록
- `recommended_plan_ids_json`: 카테고리별 추천 요금제 목록
- `default_role_template_ids_json`: 카테고리별 기본 역할 템플릿
- `onboarding_flow_json`: 카테고리별 커스텀 온보딩 플로우
- `feature_flags_json`: 카테고리별 Feature Flag 기본값

### 3.4 TenantCategoryMapping 테이블

**목적**: 테넌트와 카테고리의 다대다 관계 (하나의 테넌트가 여러 카테고리에 속할 수 있음)

```sql
CREATE TABLE tenant_category_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    category_item_id VARCHAR(36) NOT NULL COMMENT '카테고리 아이템 ID',
    is_primary BOOLEAN DEFAULT FALSE COMMENT '주요 업종 여부',
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '활성화 일시',
    deactivated_at TIMESTAMP NULL COMMENT '비활성화 일시',
    settings_json JSON COMMENT '테넌트별 카테고리 설정',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_category_item_id (category_item_id),
    INDEX idx_is_primary (is_primary),
    INDEX idx_activated_at (activated_at),
    UNIQUE KEY uk_tenant_category (tenant_id, category_item_id),
    
    -- 외래키
    CONSTRAINT fk_tenant_category_mappings_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_tenant_category_mappings_category_items 
    FOREIGN KEY (category_item_id) REFERENCES business_category_items(item_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트-카테고리 매핑 테이블';
```

**확장 고려사항:**
- 하나의 테넌트가 여러 카테고리에 속할 수 있음 (예: 학원 + 과외)
- `is_primary`로 주요 업종 표시
- `settings_json`에 테넌트별 카테고리 커스텀 설정 저장

### 3.5 CategoryStatistics 테이블 (확장)

**목적**: 카테고리별 통계 및 분석 데이터

```sql
CREATE TABLE category_statistics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_item_id VARCHAR(36) NOT NULL COMMENT '카테고리 아이템 ID',
    statistic_date DATE NOT NULL COMMENT '통계 날짜',
    tenant_count INT DEFAULT 0 COMMENT '테넌트 수',
    active_tenant_count INT DEFAULT 0 COMMENT '활성 테넌트 수',
    total_revenue DECIMAL(15, 2) DEFAULT 0 COMMENT '총 매출',
    avg_revenue_per_tenant DECIMAL(15, 2) DEFAULT 0 COMMENT '테넌트당 평균 매출',
    new_tenant_count INT DEFAULT 0 COMMENT '신규 테넌트 수',
    churned_tenant_count INT DEFAULT 0 COMMENT '이탈 테넌트 수',
    metadata_json JSON COMMENT '추가 통계 데이터',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_category_item_id (category_item_id),
    INDEX idx_statistic_date (statistic_date),
    INDEX idx_category_date (category_item_id, statistic_date),
    UNIQUE KEY uk_category_date (category_item_id, statistic_date),
    
    -- 외래키
    CONSTRAINT fk_category_statistics_category_items 
    FOREIGN KEY (category_item_id) REFERENCES business_category_items(item_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='카테고리별 통계 테이블';
```

**확장 고려사항:**
- 일별/월별/연별 통계 집계
- 카테고리별 성장률, 이탈률 분석
- `metadata_json`에 추가 통계 지표 저장

### 3.6 초기 카테고리 데이터

**대분류 카테고리 예시:**

```sql
-- 대분류 카테고리 초기 데이터
INSERT INTO business_categories (category_id, category_code, name_ko, name_en, description_ko, level, display_order, is_active) VALUES
(UUID(), 'EDUCATION', '교육', 'Education', '교육 관련 업종', 1, 1, TRUE),
(UUID(), 'FOOD_SERVICE', '요식', 'Food Service', '요식업 관련 업종', 1, 2, TRUE),
(UUID(), 'SERVICE', '서비스', 'Service', '서비스업 관련 업종', 1, 3, TRUE),
(UUID(), 'RETAIL', '소매', 'Retail', '소매업 관련 업종', 1, 4, TRUE),
(UUID(), 'BEAUTY', '미용', 'Beauty', '미용업 관련 업종', 1, 5, TRUE),
(UUID(), 'HEALTH', '건강', 'Health', '건강 관련 업종', 1, 6, TRUE);
```

**소분류 카테고리 아이템 예시:**

```sql
-- 소분류 카테고리 아이템 초기 데이터
-- 교육 카테고리
INSERT INTO business_category_items (item_id, category_id, item_code, name_ko, name_en, business_type, display_order, is_active, default_components_json, recommended_plan_ids_json) VALUES
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'EDUCATION'), 'ACADEMY', '학원', 'Academy', 'ACADEMY', 1, TRUE, 
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ATTENDANCE", "NOTIFICATION"]', 
 '[]'),
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'EDUCATION'), 'TUTORING', '과외', 'Tutoring', 'TUTORING', 2, TRUE,
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"]',
 '[]'),
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'EDUCATION'), 'TAEKWONDO', '태권도장', 'Taekwondo', 'TAEKWONDO', 3, TRUE,
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ATTENDANCE", "NOTIFICATION"]',
 '[]');

-- 요식 카테고리
INSERT INTO business_category_items (item_id, category_id, item_code, name_ko, name_en, business_type, display_order, is_active, default_components_json, recommended_plan_ids_json) VALUES
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'FOOD_SERVICE'), 'KOREAN_FOOD', '한식', 'Korean Food', 'FOOD_SERVICE', 1, TRUE,
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ORDER_MANAGEMENT", "NOTIFICATION"]',
 '[]'),
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'FOOD_SERVICE'), 'CHINESE_FOOD', '중식', 'Chinese Food', 'FOOD_SERVICE', 2, TRUE,
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ORDER_MANAGEMENT", "NOTIFICATION"]',
 '[]'),
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'FOOD_SERVICE'), 'WESTERN_FOOD', '양식', 'Western Food', 'FOOD_SERVICE', 3, TRUE,
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ORDER_MANAGEMENT", "NOTIFICATION"]',
 '[]');

-- 서비스 카테고리
INSERT INTO business_category_items (item_id, category_id, item_code, name_ko, name_en, business_type, display_order, is_active, default_components_json, recommended_plan_ids_json) VALUES
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'SERVICE'), 'CONSULTATION', '상담소', 'Consultation', 'CONSULTATION', 1, TRUE,
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"]',
 '[]');

-- 미용 카테고리
INSERT INTO business_category_items (item_id, category_id, item_code, name_ko, name_en, business_type, display_order, is_active, default_components_json, recommended_plan_ids_json) VALUES
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'BEAUTY'), 'HAIR_SALON', '미용실', 'Hair Salon', 'BEAUTY', 1, TRUE,
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"]',
 '[]'),
(UUID(), (SELECT category_id FROM business_categories WHERE category_code = 'BEAUTY'), 'NAIL_SALON', '네일샵', 'Nail Salon', 'BEAUTY', 2, TRUE,
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"]',
 '[]');
```

### 3.7 tenants.business_type과의 연계

**기존 `tenants.business_type` 필드 유지 (하위 호환성):**
- 기존 코드와의 호환성을 위해 `tenants.business_type` 필드는 유지
- `business_category_items.business_type`과 매핑
- 향후 점진적으로 카테고리 시스템으로 전환

**연계 로직:**
1. 테넌트 생성 시 `business_type`으로 기본 카테고리 자동 매핑
2. `tenant_category_mappings` 테이블에 자동 생성
3. 카테고리별 기본 컴포넌트 자동 활성화
4. 카테고리별 추천 요금제 제안

**마이그레이션 스크립트:**
```sql
-- 기존 tenants.business_type을 카테고리 매핑으로 변환
INSERT INTO tenant_category_mappings (tenant_id, category_item_id, is_primary, activated_at)
SELECT 
    t.tenant_id,
    bci.item_id,
    TRUE,
    t.created_at
FROM tenants t
JOIN business_category_items bci ON t.business_type = bci.business_type
WHERE t.is_deleted = FALSE
  AND bci.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM tenant_category_mappings tcm 
    WHERE tcm.tenant_id = t.tenant_id 
      AND tcm.category_item_id = bci.item_id
  );
```

## 4. 컴포넌트 카탈로그 테이블 설계

### 4.1 ComponentCatalog 테이블

**목적**: 제공 컴포넌트 메타데이터

```sql
CREATE TABLE component_catalog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component_id VARCHAR(36) UNIQUE NOT NULL COMMENT '컴포넌트 UUID',
    component_code VARCHAR(50) UNIQUE NOT NULL COMMENT '컴포넌트 코드',
    name VARCHAR(255) NOT NULL COMMENT '컴포넌트명',
    name_ko VARCHAR(255) COMMENT '컴포넌트명 (한글)',
    name_en VARCHAR(255) COMMENT '컴포넌트명 (영문)',
    
    -- 분류 정보
    category VARCHAR(50) NOT NULL COMMENT '카테고리: CORE, ADDON, INTEGRATION 등',
    description TEXT COMMENT '설명',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    
    -- 상태 정보
    is_core BOOLEAN DEFAULT FALSE COMMENT '핵심 컴포넌트 여부',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    version VARCHAR(20) COMMENT '버전',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    
    -- 리소스 정보
    icon_url VARCHAR(500) COMMENT '아이콘 URL',
    documentation_url VARCHAR(500) COMMENT '문서 URL',
    screenshot_urls JSON COMMENT '스크린샷 URL 목록',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_component_id (component_id),
    INDEX idx_component_code (component_code),
    INDEX idx_category (category),
    INDEX idx_is_core (is_core),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 카탈로그 테이블';
```

### 4.2 ComponentFeature 테이블

**목적**: 컴포넌트별 제공 기능 정의

```sql
CREATE TABLE component_features (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    feature_code VARCHAR(50) NOT NULL COMMENT '기능 코드',
    feature_name VARCHAR(255) NOT NULL COMMENT '기능명',
    feature_name_ko VARCHAR(255) COMMENT '기능명 (한글)',
    feature_name_en VARCHAR(255) COMMENT '기능명 (영문)',
    
    -- 의존성 정보
    dependency_json JSON COMMENT '의존성 정보 (JSON)',
    required_components_json JSON COMMENT '필수 컴포넌트 목록',
    conflicts_with_json JSON COMMENT '충돌 컴포넌트 목록',
    
    -- 설명
    notes TEXT COMMENT '비고',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_component_id (component_id),
    INDEX idx_feature_code (feature_code),
    UNIQUE KEY uk_component_feature (component_id, feature_code),
    
    -- 외래키
    CONSTRAINT fk_component_features_component_catalog 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 기능 정의 테이블';
```

### 4.3 ComponentPricing 테이블

**목적**: 컴포넌트별 과금 정책

```sql
CREATE TABLE component_pricing (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    
    -- 과금 정보
    pricing_type VARCHAR(20) NOT NULL COMMENT '과금 유형: FREE, MONTHLY, USAGE, TIERED',
    fee_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '요금',
    currency VARCHAR(10) DEFAULT 'KRW' COMMENT '통화',
    
    -- 사용량 기반 과금
    usage_unit VARCHAR(50) COMMENT '사용량 단위: API_CALL, USER_COUNT, DATA_SIZE 등',
    usage_limit BIGINT COMMENT '사용량 한도',
    overage_rate DECIMAL(15, 4) COMMENT '초과 사용 요금률',
    
    -- 요금제 포함 여부
    is_included_in_plan BOOLEAN DEFAULT FALSE COMMENT '기본 요금제 포함 여부',
    pricing_plan_ids_json JSON COMMENT '포함된 요금제 ID 목록',
    
    -- 메타데이터
    metadata_json JSON COMMENT '추가 메타데이터',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_component_id (component_id),
    INDEX idx_pricing_type (pricing_type),
    INDEX idx_is_included (is_included_in_plan),
    
    -- 외래키
    CONSTRAINT fk_component_pricing_component_catalog 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_pricing_type CHECK (pricing_type IN ('FREE', 'MONTHLY', 'USAGE', 'TIERED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 과금 정책 테이블';
```

### 4.4 ComponentDependency 테이블

**목적**: 컴포넌트 간 의존성 관계

```sql
CREATE TABLE component_dependencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    required_component_id VARCHAR(36) NOT NULL COMMENT '필수 컴포넌트 ID',
    
    -- 의존성 정보
    dependency_type VARCHAR(20) NOT NULL COMMENT '의존성 유형: REQUIRED, OPTIONAL, RECOMMENDED',
    is_optional BOOLEAN DEFAULT FALSE COMMENT '선택적 의존성 여부',
    notes TEXT COMMENT '비고',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_component_id (component_id),
    INDEX idx_required_component (required_component_id),
    INDEX idx_dependency_type (dependency_type),
    UNIQUE KEY uk_component_dependency (component_id, required_component_id),
    
    -- 외래키
    CONSTRAINT fk_component_dependencies_component 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_component_dependencies_required 
    FOREIGN KEY (required_component_id) REFERENCES component_catalog(component_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_dependency_type CHECK (dependency_type IN ('REQUIRED', 'OPTIONAL', 'RECOMMENDED')),
    CONSTRAINT chk_no_self_dependency CHECK (component_id != required_component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 의존성 테이블';
```

### 4.5 TenantComponent 테이블

**목적**: 테넌트별 활성화된 컴포넌트

```sql
CREATE TABLE tenant_components (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_component_id VARCHAR(36) UNIQUE NOT NULL COMMENT '테넌트 컴포넌트 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    subscription_id BIGINT COMMENT '구독 ID',
    
    -- 상태 정보
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE' COMMENT '상태: INACTIVE, ACTIVE, SUSPENDED',
    activated_at TIMESTAMP NULL COMMENT '활성화 일시',
    deactivated_at TIMESTAMP NULL COMMENT '비활성화 일시',
    activated_by VARCHAR(100) COMMENT '활성화한 사용자',
    deactivated_by VARCHAR(100) COMMENT '비활성화한 사용자',
    
    -- 설정 정보
    feature_flags_json JSON COMMENT 'Feature Flag 설정',
    settings_json JSON COMMENT '컴포넌트별 설정',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_tenant_component_id (tenant_component_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_component_id (component_id),
    INDEX idx_tenant_component (tenant_id, component_id),
    INDEX idx_status (status),
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_is_deleted (is_deleted),
    UNIQUE KEY uk_tenant_component (tenant_id, component_id, is_deleted),
    
    -- 외래키
    CONSTRAINT fk_tenant_components_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_tenant_components_component_catalog 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_tenant_component_status CHECK (status IN ('INACTIVE', 'ACTIVE', 'SUSPENDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트별 활성화된 컴포넌트 테이블';
```

### 4.6 ComponentUsageDaily 테이블

**목적**: 컴포넌트별 일별 사용량 추적

```sql
CREATE TABLE component_usage_daily (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usage_id VARCHAR(36) UNIQUE NOT NULL COMMENT '사용량 UUID',
    tenant_component_id VARCHAR(36) NOT NULL COMMENT '테넌트 컴포넌트 ID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    
    -- 사용량 정보
    metric VARCHAR(50) NOT NULL COMMENT '메트릭: API_CALL, USER_COUNT, DATA_SIZE 등',
    amount DECIMAL(20, 4) DEFAULT 0 COMMENT '사용량',
    usage_date DATE NOT NULL COMMENT '사용일',
    
    -- 메타데이터
    metadata_json JSON COMMENT '추가 메타데이터',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_usage_id (usage_id),
    INDEX idx_tenant_component_id (tenant_component_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_component_id (component_id),
    INDEX idx_usage_date (usage_date),
    INDEX idx_tenant_date (tenant_id, usage_date),
    INDEX idx_component_date (component_id, usage_date),
    UNIQUE KEY uk_tenant_component_date_metric (tenant_id, component_id, usage_date, metric),
    
    -- 외래키
    CONSTRAINT fk_component_usage_tenant_components 
    FOREIGN KEY (tenant_component_id) REFERENCES tenant_components(tenant_component_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_component_usage_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_component_usage_component_catalog 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 일별 사용량 테이블';

-- 파티셔닝 (성능 최적화)
-- ALTER TABLE component_usage_daily 
-- PARTITION BY RANGE (YEAR(usage_date) * 100 + MONTH(usage_date)) (
--     PARTITION p202501 VALUES LESS THAN (202502),
--     PARTITION p202502 VALUES LESS THAN (202503),
--     -- ... 월별 파티션 추가
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );
```

## 4. 요금제/구독 테이블 설계

### 4.1 PricingPlan 테이블

**목적**: 기본 요금제 정의

```sql
CREATE TABLE pricing_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id VARCHAR(36) UNIQUE NOT NULL COMMENT '요금제 UUID',
    plan_code VARCHAR(50) UNIQUE NOT NULL COMMENT '요금제 코드: STARTER, STANDARD, PREMIUM',
    name VARCHAR(255) NOT NULL COMMENT '요금제명',
    name_ko VARCHAR(255) COMMENT '요금제명 (한글)',
    name_en VARCHAR(255) COMMENT '요금제명 (영문)',
    
    -- 요금 정보
    base_fee DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '기본 요금',
    currency VARCHAR(10) DEFAULT 'KRW' COMMENT '통화',
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' COMMENT '청구 주기: MONTHLY, QUARTERLY, YEARLY',
    
    -- 한도 정보
    limits_json JSON COMMENT '한도 정보 (JSON)',
    features_json JSON COMMENT '포함 기능 목록',
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    description TEXT COMMENT '설명',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_plan_id (plan_id),
    INDEX idx_plan_code (plan_code),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='요금제 정의 테이블';
```

### 5.2 TenantSubscription 테이블

**목적**: 테넌트별 구독 정보

```sql
CREATE TABLE tenant_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subscription_id VARCHAR(36) UNIQUE NOT NULL COMMENT '구독 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    plan_id VARCHAR(36) NOT NULL COMMENT '요금제 ID',
    
    -- 구독 정보
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE' COMMENT '상태: INACTIVE, ACTIVE, SUSPENDED, CANCELLED',
    effective_from DATE NOT NULL COMMENT '유효 시작일',
    effective_to DATE COMMENT '유효 종료일',
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' COMMENT '청구 주기',
    
    -- 결제 정보
    payment_method VARCHAR(50) COMMENT '결제 수단',
    auto_renewal BOOLEAN DEFAULT TRUE COMMENT '자동 갱신 여부',
    next_billing_date DATE COMMENT '다음 청구일',
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_status (status),
    INDEX idx_effective_dates (effective_from, effective_to),
    INDEX idx_next_billing (next_billing_date),
    
    -- 외래키
    CONSTRAINT fk_tenant_subscriptions_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_tenant_subscriptions_pricing_plans 
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(plan_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_subscription_status CHECK (status IN ('INACTIVE', 'ACTIVE', 'SUSPENDED', 'CANCELLED')),
    CONSTRAINT chk_billing_cycle CHECK (billing_cycle IN ('MONTHLY', 'QUARTERLY', 'YEARLY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 구독 테이블';
```

## 6. 기존 테이블 확장 전략

### 6.1 Users 테이블 확장

**현재 구조 유지 + Tenant 필드 추가:**

```sql
-- 기존 users 테이블에 tenant_id 추가
ALTER TABLE users 
    ADD COLUMN tenant_id VARCHAR(36) AFTER id,
    ADD COLUMN lang_code VARCHAR(10) DEFAULT 'ko' AFTER updated_at,
    ADD COLUMN created_by VARCHAR(100) AFTER created_at,
    ADD COLUMN updated_by VARCHAR(100) AFTER updated_at;

-- 외래키 추가
ALTER TABLE users
    ADD CONSTRAINT fk_users_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 인덱스 추가
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_tenant_branch ON users(tenant_id, branch_id);
```

### 6.2 Consultations 테이블 확장

```sql
ALTER TABLE consultations 
    ADD COLUMN tenant_id VARCHAR(36) AFTER id,
    ADD COLUMN lang_code VARCHAR(10) DEFAULT 'ko',
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100);

ALTER TABLE consultations
    ADD CONSTRAINT fk_consultations_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX idx_consultations_tenant_id ON consultations(tenant_id);
CREATE INDEX idx_consultations_tenant_date ON consultations(tenant_id, created_at);
```

### 6.3 Payments 테이블 확장

```sql
ALTER TABLE payments 
    ADD COLUMN tenant_id VARCHAR(36) AFTER id,
    ADD COLUMN lang_code VARCHAR(10) DEFAULT 'ko',
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100);

ALTER TABLE payments
    ADD CONSTRAINT fk_payments_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, created_at);
```

## 7. 인덱스 전략

### 7.1 필수 인덱스

**모든 테이블 공통:**
- `idx_{table}_tenant_id`: tenant_id 인덱스 (멀티테넌시 필터링)
- `idx_{table}_is_deleted`: is_deleted 인덱스 (소프트 삭제 필터링)
- `idx_{table}_created_at`: created_at 인덱스 (시간 기반 조회)

**복합 인덱스:**
- `idx_{table}_tenant_deleted`: (tenant_id, is_deleted) - 가장 자주 사용되는 조합
- `idx_{table}_tenant_date`: (tenant_id, created_at) - 시간 범위 조회

### 7.2 성능 최적화 인덱스

**파티셔닝 고려:**
- 대용량 테이블 (component_usage_daily, audit_logs 등)은 날짜 기반 파티셔닝
- tenant_id 기반 파티셔닝은 향후 고려 (테넌트 수가 많아질 경우)

**커버링 인덱스:**
- 자주 조회되는 컬럼 조합에 대한 커버링 인덱스 생성

## 8. 확장성 고려사항

### 8.1 업종별 모듈 테이블

**학원 모듈:**
```sql
CREATE TABLE academy_classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id VARCHAR(36) UNIQUE NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36),
    capacity INT,
    -- ... 학원 특화 필드
    -- 공통 필드 (tenant_id, created_at 등)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**요식업 모듈:**
```sql
CREATE TABLE food_service_menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_id VARCHAR(36) UNIQUE NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(15, 2),
    -- ... 요식업 특화 필드
    -- 공통 필드
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8.2 다국어 지원

**모든 주요 테이블에 다국어 필드:**
- `name_ko`, `name_en` (필수)
- `description_ko`, `description_en` (선택)
- `lang_code` 필드로 기본 언어 설정

### 8.3 JSON 필드 활용

**확장 가능한 필드:**
- `settings_json`: 테넌트별 설정
- `metadata_json`: 추가 메타데이터
- `branding_json`: 브랜딩 정보

**주의사항:**
- JSON 필드는 검색이 어려우므로, 자주 검색되는 필드는 별도 컬럼으로 분리
- JSON 필드는 인덱싱이 제한적이므로, 필요한 경우 Generated Column 사용

## 9. 마이그레이션 전략

### 9.1 단계별 마이그레이션

**Step 1: Tenant 테이블 생성**
```sql
-- V1__create_tenant_table.sql
-- (위의 tenants 테이블 생성 스크립트)
```

**Step 2: 기존 Branch → Tenant 마이그레이션**
```sql
-- V2__migrate_branch_to_tenant.sql
INSERT INTO tenants (tenant_id, name, business_type, status, created_at, updated_at)
SELECT 
    UUID() as tenant_id,
    branch_name as name,
    'CONSULTATION' as business_type,
    CASE branch_status
        WHEN 'ACTIVE' THEN 'ACTIVE'
        WHEN 'SUSPENDED' THEN 'SUSPENDED'
        WHEN 'CLOSED' THEN 'CLOSED'
        ELSE 'PENDING'
    END as status,
    created_at,
    updated_at
FROM branches
WHERE is_deleted = FALSE;
```

**Step 3: Branch 테이블에 tenant_id 추가**
```sql
-- V3__add_tenant_id_to_branches.sql
ALTER TABLE branches ADD COLUMN tenant_id VARCHAR(36) AFTER id;

UPDATE branches b
JOIN tenants t ON b.branch_name = t.name 
    AND t.business_type = 'CONSULTATION'
    AND b.created_at = t.created_at
SET b.tenant_id = t.tenant_id
WHERE b.tenant_id IS NULL;
```

**Step 4: 주요 테이블에 tenant_id 추가**
```sql
-- V4__add_tenant_id_to_major_tables.sql
-- users, consultations, payments 등에 tenant_id 추가
-- (위의 ALTER TABLE 스크립트들)
```

### 9.2 데이터 무결성 보장

**제약조건:**
- 모든 tenant_id는 tenants 테이블에 존재해야 함 (FOREIGN KEY)
- 기존 데이터는 Branch를 기반으로 tenant_id 설정
- NULL 값 허용 (마이그레이션 기간 동안)

**검증 스크립트:**
```sql
-- 마이그레이션 후 검증
SELECT 
    'users' as table_name,
    COUNT(*) as total_count,
    COUNT(tenant_id) as with_tenant_id,
    COUNT(*) - COUNT(tenant_id) as missing_tenant_id
FROM users
WHERE is_deleted = FALSE
UNION ALL
SELECT 'consultations', COUNT(*), COUNT(tenant_id), COUNT(*) - COUNT(tenant_id)
FROM consultations
WHERE is_deleted = FALSE;
```

## 10. 성능 최적화 전략

### 10.1 파티셔닝 전략

**날짜 기반 파티셔닝 (대용량 테이블):**
- `component_usage_daily`: 월별 파티셔닝
- `audit_logs`: 월별 파티셔닝
- `payment_logs`: 월별 파티셔닝

**테넌트 기반 파티셔닝 (향후 고려):**
- 테넌트 수가 1000개 이상일 경우 고려
- Hash 파티셔닝 또는 Range 파티셔닝

### 10.2 읽기 전용 복제본

**Master-Slave 구조:**
- Master: 쓰기 전용
- Slave: 읽기 전용 (리포트, 통계 조회)

### 10.3 캐싱 전략

**Redis 캐싱:**
- 테넌트 정보 캐싱
- 컴포넌트 카탈로그 캐싱
- 공통 코드 캐싱

## 11. 보안 및 규정 준수

### 11.1 데이터 암호화

**개인정보 암호화:**
- 이름, 전화번호, 이메일 등은 암호화 저장
- `PersonalDataEncryptionUtil` 활용

**암호화 키 관리:**
- 키 버전 관리
- 키 로테이션 지원

### 11.2 접근 제어

**테넌트 격리:**
- 모든 쿼리에 tenant_id 필터 자동 적용
- HQ/HQ-Admin만 전체 데이터 접근 가능

**감사 로그:**
- 모든 데이터 변경 이력 기록
- `audit_logs` 테이블에 저장

## 12. 모니터링 및 유지보수

### 12.1 성능 모니터링

**쿼리 성능:**
- Slow Query Log 모니터링
- EXPLAIN 분석

**인덱스 사용률:**
- 미사용 인덱스 제거
- 누락 인덱스 추가

### 12.2 데이터 정리

**소프트 삭제 데이터:**
- 일정 기간 후 물리적 삭제 (예: 1년)
- 아카이브 테이블로 이동

**파티션 관리:**
- 오래된 파티션 아카이브
- 자동 파티션 생성 스크립트

## 13. 다음 단계

### 13.1 즉시 실행 가능 항목
1. [ ] Tenant 테이블 생성 스크립트 작성
2. [ ] Branch → Tenant 마이그레이션 스크립트 작성
3. [ ] 주요 테이블 tenant_id 추가 스크립트 작성
4. [ ] 인덱스 생성 스크립트 작성

### 13.2 검토 필요 항목
- [ ] 파티셔닝 전략 최종 확정
- [ ] JSON 필드 사용 범위 확정
- [ ] 다국어 필드 확장 범위 확정
- [ ] 성능 테스트 계획 수립

---

**결론:** 확장 가능한 데이터베이스 설계를 통해 멀티테넌시를 지원하면서도 향후 업종별 모듈 추가, 컴포넌트 시스템, 요금제 시스템 등을 안전하게 확장할 수 있습니다.

