-- V10: 테넌트별 공통 코드 분리
-- CoreSolution 플랫폼: 테넌트별 공통 코드와 코어솔루션 공통 코드 분리

-- 0. Greenfield: 이전 버전 마이그레이션에 DDL이 없어 테이블이 없을 수 있음 (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS code_group_metadata (
    group_name VARCHAR(50) NOT NULL PRIMARY KEY,
    korean_name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    icon VARCHAR(10) NULL,
    color_code VARCHAR(7) NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='코드 그룹 메타데이터';

CREATE TABLE IF NOT EXISTS common_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code_group VARCHAR(50) NOT NULL,
    code_value VARCHAR(50) NOT NULL,
    code_label VARCHAR(100) NOT NULL,
    code_description VARCHAR(500) NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    parent_code_group VARCHAR(50) NULL,
    parent_code_value VARCHAR(50) NULL,
    extra_data VARCHAR(1000) NULL,
    icon VARCHAR(10) NULL,
    color_code VARCHAR(7) NULL,
    korean_name VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_common_code_group (code_group),
    INDEX idx_common_code_value (code_value),
    INDEX idx_common_code_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='공통 코드';

SET @dbname = DATABASE();

-- 1. common_codes.tenant_id (재실행·부분 적용 시 중복 컬럼 방지)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'common_codes' AND COLUMN_NAME = 'tenant_id') > 0,
    'SELECT 1',
    'ALTER TABLE common_codes ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1-1. korean_name 컬럼을 필수로 변경 (한국 사용 필수)
UPDATE common_codes
SET korean_name = code_label
WHERE korean_name IS NULL OR korean_name = '';

ALTER TABLE common_codes
MODIFY COLUMN korean_name VARCHAR(100) NOT NULL;

-- 2. code_group_metadata.code_type (재실행 시 중복 컬럼 방지)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'code_group_metadata' AND COLUMN_NAME = 'code_type') > 0,
    'SELECT 1',
    'ALTER TABLE code_group_metadata ADD COLUMN code_type VARCHAR(20) NULL AFTER group_name'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 인덱스 (이미 있으면 스킵)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'common_codes' AND INDEX_NAME = 'idx_common_code_tenant') > 0,
    'SELECT 1',
    'CREATE INDEX idx_common_code_tenant ON common_codes(tenant_id)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'common_codes' AND INDEX_NAME = 'uk_tenant_code_group_value') > 0,
    'SELECT 1',
    'CREATE UNIQUE INDEX uk_tenant_code_group_value ON common_codes(tenant_id, code_group, code_value)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. CODE_GROUP_TYPE 공통코드 그룹 생성 (코어솔루션 코드)
-- 이 코드 그룹은 시스템 최소 코드로, tenant_id = NULL로 설정
INSERT INTO common_codes (
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    tenant_id,
    created_at,
    updated_at
) VALUES
('CODE_GROUP_TYPE', 'CORE', '코어솔루션 코드', '코어솔루션 코드', '시스템 전역에서 사용하는 코어솔루션 코드 그룹', 1, true, NULL, NOW(), NOW()),
('CODE_GROUP_TYPE', 'TENANT', '테넌트별 코드', '테넌트별 코드', '각 테넌트가 자체적으로 관리하는 코드 그룹', 2, true, NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    updated_at = NOW();

-- 5. 기존 코드 그룹 메타데이터에 기본 code_type 설정
-- 기본값은 TENANT로 설정 (나중에 관리자가 수정 가능)
UPDATE code_group_metadata 
SET code_type = 'TENANT' 
WHERE code_type IS NULL;

-- 6. 주요 코어솔루션 코드 그룹 타입 설정
-- 이 부분은 하드코딩이지만, 초기 설정을 위한 최소한의 코드
-- 이후에는 관리자 UI에서 공통코드로 관리
UPDATE code_group_metadata 
SET code_type = 'CORE' 
WHERE group_name IN (
    'USER_STATUS',
    'USER_ROLE',
    'SYSTEM_CONFIG',
    'NOTIFICATION_TYPE',
    'AUDIT_ACTION',
    'BUSINESS_CATEGORY',
    'CODE_GROUP_TYPE'
);

-- 7. 기존 common_codes 데이터에 tenant_id 설정
-- 코어 코드 그룹: tenant_id = NULL
UPDATE common_codes cc
INNER JOIN code_group_metadata cgm ON cc.code_group = cgm.group_name
SET cc.tenant_id = NULL
WHERE cgm.code_type = 'CORE';

-- 8. 테넌트 코드 그룹: 기본 테넌트에 할당 (임시)
-- 실제 운영에서는 각 테넌트별로 마이그레이션 필요
-- 현재는 첫 번째 활성 테넌트에 할당
UPDATE common_codes cc
INNER JOIN code_group_metadata cgm ON cc.code_group = cgm.group_name
SET cc.tenant_id = (
    SELECT tenant_id 
    FROM tenants 
    WHERE is_deleted = false 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE cgm.code_type = 'TENANT' AND cc.tenant_id IS NULL;

