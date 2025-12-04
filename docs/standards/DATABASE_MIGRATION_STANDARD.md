# 데이터베이스 마이그레이션 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 데이터베이스 마이그레이션 표준입니다.  
Flyway를 사용한 데이터베이스 스키마 버전 관리 및 마이그레이션 파일 작성 규칙을 정의합니다.

### 참조 문서
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [백엔드 코딩 표준](./BACKEND_CODING_STANDARD.md)

### 구현 위치
- **마이그레이션 파일**: `src/main/resources/db/migration/`
- **Flyway 설정**: `application.yml` (spring.flyway.*)

---

## 🎯 마이그레이션 원칙

### 1. 버전 관리 필수
```
모든 스키마 변경은 마이그레이션 파일로 관리
```

**원칙**:
- ✅ 모든 DDL 변경은 마이그레이션 파일로 작성
- ✅ 데이터 변경도 마이그레이션 파일로 작성
- ✅ 직접 SQL 실행 금지
- ❌ 데이터베이스에 직접 접속하여 수동 변경 금지

### 2. 롤백 가능성
```
모든 마이그레이션은 롤백 가능하도록 작성
```

**원칙**:
- ✅ 되돌리기 마이그레이션 파일 작성 권장
- ✅ 데이터 변경 시 백업 전략 수립
- ✅ 비가역적 변경 시 주의 표시
- ❌ 데이터 손실 가능성 있는 변경 금지

### 3. 테넌트 격리 준수
```
모든 마이그레이션은 테넌트 격리 원칙 준수
```

**원칙**:
- ✅ 테넌트별 데이터 격리 유지
- ✅ `tenant_id` 필수 포함
- ❌ 테넌트 간 데이터 공유 마이그레이션 금지

---

## 📋 마이그레이션 파일 명명 규칙

### 1. 기본 형식

```
V{버전}__{설명}.sql
```

**구성 요소**:
- **V**: 버전 접두사 (대문자 필수)
- **{버전}**: 순차적 번호 또는 날짜 형식
- **__**: 구분자 (언더스코어 2개)
- **{설명}**: snake_case로 작성된 설명

### 2. 버전 번호 규칙

#### 방식 1: 순차적 번호 (권장)
```
V61__add_user_status_field.sql
V62__create_notification_table.sql
V63__add_index_to_users_email.sql
```

**사용 시기**:
- 일상적인 스키마 변경
- 단순한 변경 사항

#### 방식 2: 날짜 형식 (대량 작업 또는 중요 변경)
```
V20251203_009__setup_common_code_system.sql
V20251203_010__create_widget_groups_table.sql
```

**사용 시기**:
- 대규모 기능 추가
- 여러 관련 파일을 한 번에 추가하는 경우
- 날짜별 그룹화가 필요한 경우

**형식**: `V{YYYYMMDD}_{순번}__{설명}.sql`

### 3. 설명 작성 규칙

#### 명명 규칙
- **언어**: 영어 (snake_case)
- **형식**: 동사 + 목적어 (예: `create_user_table`, `add_status_field`)
- **길이**: 최대 50자 (파일명 제한 고려)

#### 좋은 예시
```sql
V61__create_user_profile_table.sql          ✅
V62__add_email_verification_field.sql       ✅
V63__update_role_permissions_structure.sql  ✅
V64__insert_default_common_codes.sql        ✅
```

#### 나쁜 예시
```sql
V61__user.sql                               ❌ (너무 짧음)
V62__테이블생성.sql                           ❌ (한글 사용)
V63__create-user-table.sql                  ❌ (하이픈 사용)
V64__fix_bug.sql                            ❌ (모호함)
```

### 4. 특수 마이그레이션

#### 되돌리기 마이그레이션 (선택)
```
V61__create_user_profile_table.sql
V61R__rollback_user_profile_table.sql
```

**규칙**:
- 원본 버전 번호 + `R` 접미사
- 되돌리기 파일은 선택사항

#### 반복 가능 마이그레이션
```
R__update_statistics_view.sql
```

**규칙**:
- `R` 접두사 사용
- 항상 실행되는 마이그레이션 (반복 가능)

---

## 📝 마이그레이션 파일 구조

### 1. 기본 구조

```sql
-- ============================================
-- {제목}
-- ============================================
-- 목적: {변경 목적}
-- 작성일: {YYYY-MM-DD}
-- 표준: DATABASE_SCHEMA_STANDARD.md 준수
-- ============================================

-- ============================================
-- 1. {섹션 제목}
-- ============================================

-- SQL 문 작성

-- ============================================
-- 2. {섹션 제목}
-- ============================================

-- SQL 문 작성

-- ============================================
-- 검증 (선택)
-- ============================================

-- 검증 쿼리 작성
```

### 2. 헤더 필수 항목

```sql
-- ============================================
-- 사용자 프로필 테이블 생성
-- ============================================
-- 목적: 사용자 프로필 정보 저장 테이블 생성
-- 작성일: 2025-12-03
-- 표준: DATABASE_SCHEMA_STANDARD.md 준수
-- 관련 이슈: #123
-- ============================================
```

### 3. 주석 작성 규칙

#### 섹션 구분
```sql
-- ============================================
-- 1. 테이블 생성
-- ============================================
```

#### 중요 사항 주석
```sql
-- ⚠️ 주의: 이 마이그레이션은 데이터 손실이 발생할 수 있습니다.
-- ⚠️ 주의: 롤백 불가능한 변경 사항입니다.
-- ✅ 테스트 완료: 2025-12-03
```

#### TODO 주석
```sql
-- TODO: 추후 인덱스 추가 예정 (성능 최적화)
-- FIXME: 레거시 데이터 호환성을 위한 임시 처리
```

---

## 🔒 테넌트 격리 준수

### 1. 테이블 생성 시

```sql
CREATE TABLE user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,  -- ✅ 필수
    user_id BIGINT NOT NULL,
    -- ... 기타 컬럼
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_tenant_user (tenant_id, user_id),
    
    CONSTRAINT fk_user_profiles_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 프로필 테이블';
```

### 2. 데이터 변경 시

```sql
-- ✅ 올바른 예시: 테넌트별로 데이터 변경
UPDATE users 
SET status = 'ACTIVE' 
WHERE tenant_id = 'tenant-001' 
  AND status = 'PENDING';

-- ❌ 잘못된 예시: 테넌트 구분 없이 일괄 변경
UPDATE users 
SET status = 'ACTIVE' 
WHERE status = 'PENDING';
```

### 3. 인덱스 생성 시

```sql
-- ✅ 테넌트 ID 포함 인덱스
CREATE INDEX idx_users_tenant_status 
ON users(tenant_id, status);

-- ❌ 테넌트 ID 없는 인덱스 (일반적으로 비권장)
CREATE INDEX idx_users_status 
ON users(status);
```

---

## 🔄 롤백 전략

### 1. 되돌리기 마이그레이션 작성 (권장)

```sql
-- V61__create_user_profile_table.sql
CREATE TABLE user_profiles (
    -- 테이블 구조
);

-- V61R__rollback_user_profile_table.sql
DROP TABLE IF EXISTS user_profiles;
```

### 2. 데이터 백업 전략

```sql
-- 1단계: 백업 테이블 생성
CREATE TABLE user_profiles_backup AS 
SELECT * FROM user_profiles;

-- 2단계: 데이터 변경
UPDATE user_profiles 
SET status = 'INACTIVE' 
WHERE created_at < '2025-01-01';

-- 3단계: 롤백 시 복구
-- INSERT INTO user_profiles 
-- SELECT * FROM user_profiles_backup 
-- WHERE id NOT IN (SELECT id FROM user_profiles);
```

### 3. 비가역적 변경 표시

```sql
-- ============================================
-- ⚠️ 주의: 이 마이그레이션은 롤백 불가능합니다
-- ============================================
-- 목적: 기존 데이터 구조 변경 (데이터 손실 가능)
-- 작성일: 2025-12-03
-- 롤백: 불가능 (데이터 백업 권장)
-- ============================================

-- 1. 백업 생성
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2. 비가역적 변경 실행
ALTER TABLE users DROP COLUMN old_field;

-- ⚠️ 롤백 불가능: 백업 테이블에서만 복구 가능
```

---

## ✅ 마이그레이션 작성 체크리스트

### 작성 전
- [ ] 데이터베이스 스키마 표준 확인
- [ ] 테넌트 격리 원칙 확인
- [ ] 기존 마이그레이션 파일 확인 (충돌 방지)
- [ ] 버전 번호 결정 (순차적 또는 날짜 형식)

### 작성 중
- [ ] 파일명 규칙 준수 (V{버전}__{설명}.sql)
- [ ] 헤더 정보 작성 (목적, 작성일, 표준 참조)
- [ ] 섹션별 주석 작성
- [ ] 테넌트 격리 확인
- [ ] 인덱스 생성 확인
- [ ] 외래키 제약조건 확인

### 작성 후
- [ ] 로컬 환경에서 테스트
- [ ] 롤백 전략 수립 (되돌리기 파일 작성)
- [ ] 데이터 백업 계획 (필요 시)
- [ ] 검증 쿼리 작성 (선택)
- [ ] 문서화 (중요 변경 시)

---

## 🚫 금지 사항

### 1. 직접 SQL 실행 금지
```sql
-- ❌ 금지: 데이터베이스에 직접 접속하여 실행
ALTER TABLE users ADD COLUMN status VARCHAR(20);

-- ✅ 필수: 마이그레이션 파일로 작성
-- V61__add_user_status_field.sql
```

### 2. 버전 번호 충돌 금지
```sql
-- ❌ 금지: 이미 존재하는 버전 번호 재사용
V61__create_table.sql  (이미 존재)
V61__add_column.sql    (충돌!)

-- ✅ 필수: 다음 버전 번호 사용
V62__add_column.sql
```

### 3. 테넌트 격리 위반 금지
```sql
-- ❌ 금지: 테넌트 구분 없이 데이터 변경
UPDATE users SET status = 'ACTIVE';

-- ✅ 필수: 테넌트별로 처리
UPDATE users 
SET status = 'ACTIVE' 
WHERE tenant_id = 'tenant-001';
```

### 4. 하드 삭제 금지
```sql
-- ❌ 금지: 하드 삭제
DELETE FROM users WHERE status = 'INACTIVE';

-- ✅ 필수: 소프트 삭제
UPDATE users 
SET is_deleted = TRUE, 
    deleted_at = NOW() 
WHERE status = 'INACTIVE';
```

---

## 🔧 Flyway 설정

### application.yml

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 0
    validate-on-migrate: true
    out-of-order: false  # 순서대로만 실행
    clean-disabled: true  # 운영 환경에서 clean 금지
```

### 중요 설정
- **validate-on-migrate**: 마이그레이션 파일 검증
- **out-of-order**: 순서대로만 실행 (false 권장)
- **clean-disabled**: 운영 환경에서 clean 명령어 비활성화

---

## 📖 예시

### 예시 1: 테이블 생성

```sql
-- ============================================
-- 사용자 프로필 테이블 생성
-- ============================================
-- 목적: 사용자 프로필 정보 저장 테이블 생성
-- 작성일: 2025-12-03
-- 표준: DATABASE_SCHEMA_STANDARD.md 준수
-- ============================================

CREATE TABLE user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '프로필 ID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    nickname VARCHAR(100) COMMENT '닉네임',
    bio TEXT COMMENT '자기소개',
    profile_image_url VARCHAR(500) COMMENT '프로필 이미지 URL',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    created_by VARCHAR(100) COMMENT '생성자',
    updated_by VARCHAR(100) COMMENT '수정자',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',
    deleted_at TIMESTAMP NULL COMMENT '삭제일시',
    
    -- 인덱스
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_user_id (user_id),
    INDEX idx_tenant_user (tenant_id, user_id),
    INDEX idx_is_deleted (is_deleted),
    
    -- 제약조건
    CONSTRAINT fk_user_profiles_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_profiles_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    
    UNIQUE KEY uk_tenant_user (tenant_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 프로필 테이블';
```

### 예시 2: 컬럼 추가

```sql
-- ============================================
-- 사용자 테이블에 상태 필드 추가
-- ============================================
-- 목적: 사용자 상태 관리 필드 추가
-- 작성일: 2025-12-03
-- 표준: DATABASE_SCHEMA_STANDARD.md 준수
-- ============================================

ALTER TABLE users 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
COMMENT '상태: PENDING, ACTIVE, INACTIVE, SUSPENDED' 
AFTER email;

-- 인덱스 추가
CREATE INDEX idx_users_status 
ON users(tenant_id, status);

-- 기본 데이터 업데이트
UPDATE users 
SET status = 'ACTIVE' 
WHERE is_deleted = FALSE;
```

### 예시 3: 데이터 마이그레이션

```sql
-- ============================================
-- 공통코드 데이터 추가
-- ============================================
-- 목적: 기본 공통코드 데이터 삽입
-- 작성일: 2025-12-03
-- 표준: DATABASE_SCHEMA_STANDARD.md 준수
-- ============================================

INSERT INTO common_codes (
    code_group, code, code_name, code_name_ko, code_name_en,
    display_order, is_active, created_by
) VALUES
('USER_STATUS', 'PENDING', 'Pending', '대기', 'Pending', 1, TRUE, 'SYSTEM'),
('USER_STATUS', 'ACTIVE', 'Active', '활성', 'Active', 2, TRUE, 'SYSTEM'),
('USER_STATUS', 'INACTIVE', 'Inactive', '비활성', 'Inactive', 3, TRUE, 'SYSTEM'),
('USER_STATUS', 'SUSPENDED', 'Suspended', '정지', 'Suspended', 4, TRUE, 'SYSTEM');
```

---

## 📞 문의

데이터베이스 마이그레이션 표준 관련 문의:
- 백엔드 팀
- 데이터베이스 팀

**최종 업데이트**: 2025-12-03

