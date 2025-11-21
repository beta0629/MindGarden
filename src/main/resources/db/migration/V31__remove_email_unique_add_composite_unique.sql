-- ============================================================
-- V31: 이메일 unique 제약 조건 제거 및 (email, tenant_id) 복합 unique 추가
-- 한 계정에 멀티 테넌트 구조 지원
-- ============================================================

-- 1. 기존 email unique 제약 조건 제거
-- INFORMATION_SCHEMA를 사용하여 안전하게 인덱스 삭제

-- UK_6dotkott2kjsp8vw4d0m25fb7 인덱스 삭제 (존재하는 경우)
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND INDEX_NAME = 'UK_6dotkott2kjsp8vw4d0m25fb7'
);

SET @sql = IF(@idx_exists > 0,
    'ALTER TABLE users DROP INDEX UK_6dotkott2kjsp8vw4d0m25fb7',
    'SELECT "Index UK_6dotkott2kjsp8vw4d0m25fb7 does not exist" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- UK_users_email 인덱스 삭제 (존재하는 경우)
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND INDEX_NAME = 'UK_users_email'
);

SET @sql = IF(@idx_exists > 0,
    'ALTER TABLE users DROP INDEX UK_users_email',
    'SELECT "Index UK_users_email does not exist" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. (email, tenant_id) 복합 unique 제약 조건 추가
-- 같은 이메일로 여러 테넌트에 계정 생성 가능
-- 이미 존재하는지 확인 후 추가
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND INDEX_NAME = 'UK_users_email_tenant'
);

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE users ADD UNIQUE KEY UK_users_email_tenant (email, tenant_id)',
    'SELECT "Index UK_users_email_tenant already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 인덱스는 유지 (조회 성능 향상)
-- idx_users_email 인덱스는 이미 존재하므로 유지

