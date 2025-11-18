-- ============================================
-- Week 0 Day 2: branches 테이블에 tenant_id 컬럼 추가 및 외래키 설정
-- ============================================
-- 목적: 기존 branches 테이블에 tenant_id 추가 및 tenants와 연계
-- 작성일: 2025-01-XX
-- ============================================

-- 1. branches 테이블에 tenant_id 컬럼 추가 (이미 추가된 경우 스킵)
SET @dbname = DATABASE();
SET @tablename = 'branches';
SET @columnname = 'tenant_id';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(36) NULL COMMENT ''테넌트 UUID (tenants.tenant_id 참조)'' AFTER id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. branches 테이블에 lang_code, created_by, updated_by 컬럼 추가 (BaseEntity 필드)
SET @columnname = 'lang_code';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(10) DEFAULT ''ko'' COMMENT ''언어 코드'' AFTER updated_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'created_by';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL COMMENT ''생성자'' AFTER created_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'updated_by';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL COMMENT ''수정자'' AFTER updated_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. tenant_id가 NULL인 기존 branches에 대한 처리
--    (V2 마이그레이션에서 처리되지 않은 경우를 대비)
UPDATE branches b
INNER JOIN tenants t ON (
    t.tenant_id = CASE 
        WHEN b.branch_code REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN b.branch_code
        ELSE CONCAT('TENANT-', b.branch_code)
    END
)
SET b.tenant_id = t.tenant_id
WHERE b.tenant_id IS NULL
  AND b.is_deleted = FALSE;

-- 4. 외래키 추가 (tenant_id가 NULL이 아닌 경우에만)
--    MySQL 8.0.19+ 에서는 IF NOT EXISTS 지원하지 않으므로, 기존 외래키 확인 후 추가
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'branches'
      AND CONSTRAINT_NAME = 'fk_branches_tenants'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE branches ADD CONSTRAINT fk_branches_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT "Foreign key fk_branches_tenants already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 인덱스 추가
-- 인덱스 생성 (이미 존재하면 스킵)
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'branches'
      AND INDEX_NAME = 'idx_branches_tenant_id'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_branches_tenant_id ON branches(tenant_id)',
    'SELECT "Index idx_branches_tenant_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'branches'
      AND INDEX_NAME = 'idx_branches_tenant_status'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_branches_tenant_status ON branches(tenant_id, branch_status)',
    'SELECT "Index idx_branches_tenant_status already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. tenant_id NOT NULL 제약조건 추가 (모든 branch가 tenant에 연결된 후)
--    주의: 이 단계는 모든 branch가 tenant에 연결된 후에만 실행
--    현재는 NULL 허용으로 두고, 추후 모든 branch가 연결된 후 NOT NULL로 변경 가능
-- ALTER TABLE branches MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL;

