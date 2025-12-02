# 데이터베이스 스키마 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 데이터베이스 스키마 설계 및 관리 표준입니다.  
**테넌트 기반 멀티 테넌시 아키텍처**를 기반으로 합니다.

### 참조 문서
- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [보안 정책](../guides/SECURITY_POLICY.md)

---

## 🎯 핵심 원칙

### 1. 테넌트 격리
- ✅ 모든 테이블에 `tenant_id` 필수
- ✅ 테넌트별 데이터 완전 격리
- ❌ 테넌트 간 데이터 공유 금지

### 2. 소프트 삭제
- ✅ `is_deleted` BOOLEAN 필드 필수
- ✅ `deleted_at` TIMESTAMP 필드 필수
- ❌ 하드 삭제 금지 (법적 요구 시 제외)

### 3. 감사 추적
- ✅ `created_at` TIMESTAMP 필수
- ✅ `updated_at` TIMESTAMP 필수
- ✅ `created_by` VARCHAR 권장
- ✅ `updated_by` VARCHAR 권장

### 4. 브랜치 개념 제거 ⚠️ **2025-12-02 현행화**
- ❌ `branch_code` 컬럼 사용 금지 (신규 테이블)
- ❌ `branch_id` 컬럼 사용 금지 (신규 테이블)
- ✅ `tenant_id`로 대체
- ⚠️ 기존 `branch_code` 컬럼은 NULL 허용으로 유지 (레거시 호환)
- ⚠️ 브랜치 관련 로직은 주석처리됨 (2025-12-02)

---

## 📋 명명 규칙

### 테이블명
```sql
-- 형식: 복수형, snake_case
users                    -- ✅ 올바름
user                     -- ❌ 단수형
UserTable                -- ❌ CamelCase
```

### 컬럼명
```sql
-- 형식: snake_case
user_id                  -- ✅ 올바름
userId                   -- ❌ camelCase
USER_ID                  -- ❌ UPPER_CASE
```

### 인덱스명
```sql
-- 형식: idx_{테이블명}_{컬럼명}
idx_users_email          -- ✅ 올바름
idx_users_tenant_id_email -- ✅ 복합 인덱스
user_email_idx           -- ❌ 순서 잘못됨
```

### 외래키명
```sql
-- 형식: fk_{테이블명}_{참조테이블명}
fk_consultants_users     -- ✅ 올바름
consultants_users_fk     -- ❌ 순서 잘못됨
```

---

## 🔑 필수 컬럼

### 모든 테이블
```sql
CREATE TABLE example_table (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,          -- 테넌트 ID (필수)
    
    -- 비즈니스 컬럼들
    name VARCHAR(255) NOT NULL,
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    
    -- 인덱스
    INDEX idx_example_tenant_id (tenant_id),
    INDEX idx_example_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 사용자 테이블 예시
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    
    -- 사용자 정보
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- 역할 (테넌트별)
    role VARCHAR(50) NOT NULL,              -- ADMIN, CONSULTANT, CLIENT, STAFF
    
    -- 개인정보 (암호화 필수)
    name VARCHAR(255),                      -- 암호화
    phone VARCHAR(50),                      -- 암호화
    birth_date DATE,                        -- 암호화
    
    -- 상태
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    
    -- 인덱스
    INDEX idx_users_tenant_id (tenant_id),
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_role (role),
    INDEX idx_users_is_deleted (is_deleted),
    UNIQUE KEY uk_users_tenant_email (tenant_id, email),
    UNIQUE KEY uk_users_tenant_username (tenant_id, username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🚫 사용 금지 컬럼

### 브랜치 관련 (레거시)
```sql
-- ❌ 사용 금지
branch_code VARCHAR(50)
branch_id BIGINT
branch_name VARCHAR(255)
```

**대체 방법**: `tenant_id` 사용

### 하드코딩된 역할
```sql
-- ❌ 사용 금지
is_admin BOOLEAN
is_consultant BOOLEAN
is_client BOOLEAN
```

**대체 방법**: `role` VARCHAR 컬럼 + 동적 역할 테이블

---

## 📊 테넌트 격리 전략

### 1. 테넌트 ID 기반 격리
```sql
-- 모든 쿼리에 tenant_id 조건 필수
SELECT * FROM users 
WHERE tenant_id = 'tenant-001' 
  AND is_deleted = FALSE;

-- ❌ 잘못된 예시 (tenant_id 없음)
SELECT * FROM users WHERE email = 'user@example.com';
```

### 2. 복합 유니크 키
```sql
-- tenant_id를 포함한 유니크 키
UNIQUE KEY uk_users_tenant_email (tenant_id, email)

-- ❌ 잘못된 예시 (tenant_id 제외)
UNIQUE KEY uk_users_email (email)
```

### 3. 외래키 제약
```sql
-- 같은 테넌트 내에서만 참조
ALTER TABLE consultants
ADD CONSTRAINT fk_consultants_users
FOREIGN KEY (user_id, tenant_id)
REFERENCES users(id, tenant_id);
```

---

## 🔒 개인정보 암호화

### 암호화 대상 컬럼
```sql
-- 개인식별정보
name VARCHAR(255)           -- 이름
phone VARCHAR(50)           -- 전화번호
birth_date DATE             -- 생년월일
gender VARCHAR(10)          -- 성별
address TEXT                -- 주소

-- 민감정보
consultation_notes TEXT     -- 상담 기록
medical_history TEXT        -- 병력
payment_info TEXT           -- 결제 정보
```

### 암호화 방식
- **알고리즘**: AES-256-CBC
- **키 관리**: 환경변수 (PERSONAL_DATA_ENCRYPTION_KEY)
- **키 로테이션**: 분기별 또는 보안 이벤트 발생 시

### 구현 예시
```java
// 저장 시 암호화
String encryptedName = encryptionService.encrypt(user.getName());
user.setName(encryptedName);

// 조회 시 복호화
String decryptedName = encryptionService.decrypt(user.getName());
```

---

## 📈 인덱스 전략

### 필수 인덱스
```sql
-- 1. 테넌트 ID (모든 테이블)
INDEX idx_{table}_tenant_id (tenant_id)

-- 2. 소프트 삭제 (모든 테이블)
INDEX idx_{table}_is_deleted (is_deleted)

-- 3. 복합 인덱스 (테넌트 + 비즈니스 키)
INDEX idx_{table}_tenant_key (tenant_id, business_key)
```

### 성능 최적화 인덱스
```sql
-- 자주 조회되는 컬럼
INDEX idx_users_email (email)
INDEX idx_users_role (role)

-- 정렬/필터링 컬럼
INDEX idx_users_created_at (created_at)
INDEX idx_users_is_active (is_active)

-- 복합 인덱스 (조회 조건)
INDEX idx_users_tenant_role_active (tenant_id, role, is_active)
```

---

## 🗑️ 소프트 삭제 구현

### 삭제 처리
```sql
-- 소프트 삭제
UPDATE users 
SET is_deleted = TRUE,
    deleted_at = NOW(),
    updated_by = 'admin@example.com'
WHERE id = 123 
  AND tenant_id = 'tenant-001';

-- ❌ 하드 삭제 금지
DELETE FROM users WHERE id = 123;
```

### 조회 시 필터링
```sql
-- 활성 데이터만 조회
SELECT * FROM users 
WHERE tenant_id = 'tenant-001' 
  AND is_deleted = FALSE;

-- 삭제된 데이터 조회 (복구용)
SELECT * FROM users 
WHERE tenant_id = 'tenant-001' 
  AND is_deleted = TRUE
  AND deleted_at > DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### 자동 정리 (90일 후)
```sql
-- 90일 경과 데이터 하드 삭제 (배치 작업)
DELETE FROM users 
WHERE is_deleted = TRUE 
  AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

## 🔄 마이그레이션 가이드

### 브랜치 컬럼 제거
```sql
-- 1단계: 데이터 백업
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2단계: tenant_id 데이터 마이그레이션
UPDATE users u
JOIN branches b ON u.branch_code = b.branch_code
SET u.tenant_id = b.tenant_id
WHERE u.tenant_id IS NULL;

-- 3단계: branch_code 컬럼 제거
ALTER TABLE users DROP COLUMN branch_code;
ALTER TABLE users DROP COLUMN branch_id;

-- 4단계: 인덱스 재생성
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
```

### 역할 시스템 마이그레이션
```sql
-- 1단계: 기존 역할 매핑
UPDATE users SET role = 'ADMIN' 
WHERE role IN ('BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN');

UPDATE users SET role = 'STAFF' 
WHERE role = 'BRANCH_MANAGER';

-- 2단계: 테넌트 역할 테이블 생성
CREATE TABLE tenant_roles (
    tenant_role_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    role_template_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    name_ko VARCHAR(255),
    name_en VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_roles_tenant_id (tenant_id)
);
```

---

## 📝 데이터 타입 가이드

### 문자열
```sql
VARCHAR(50)      -- 짧은 문자열 (username, code)
VARCHAR(255)     -- 일반 문자열 (name, email)
TEXT             -- 긴 텍스트 (description, notes)
```

### 숫자
```sql
BIGINT           -- ID, 큰 숫자
INT              -- 일반 숫자, 카운트
DECIMAL(10,2)    -- 금액 (정확한 계산 필요)
```

### 날짜/시간
```sql
TIMESTAMP        -- 생성/수정 시간 (자동 관리)
DATETIME         -- 일반 날짜시간
DATE             -- 날짜만
```

### 불린
```sql
BOOLEAN          -- TRUE/FALSE (TINYINT(1)로 저장)
```

---

## ✅ 체크리스트

### 새 테이블 생성 시
- [ ] `tenant_id` 컬럼 추가
- [ ] 감사 필드 추가 (created_at, updated_at, created_by, updated_by)
- [ ] 소프트 삭제 필드 추가 (is_deleted, deleted_at)
- [ ] 필수 인덱스 생성 (tenant_id, is_deleted)
- [ ] 복합 유니크 키에 tenant_id 포함
- [ ] 개인정보 컬럼 암호화 계획
- [ ] 외래키 제약 조건 설정
- [ ] 브랜치 관련 컬럼 없음 확인

### 기존 테이블 수정 시
- [ ] 브랜치 컬럼 제거 계획
- [ ] tenant_id 마이그레이션 계획
- [ ] 데이터 백업
- [ ] 롤백 계획
- [ ] 인덱스 재생성

---

## 📞 문의

데이터베이스 스키마 관련 문의:
- 아키텍처 팀
- DBA 팀

**최종 업데이트**: 2025-12-02

