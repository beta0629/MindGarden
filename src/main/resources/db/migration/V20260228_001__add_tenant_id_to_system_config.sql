-- system_config 테이블에 tenant_id 컬럼 추가 (엔티티와 스키마 불일치로 Hibernate 기동 실패 방지)
-- 기존 create_system_config_table.sql에는 tenant_id가 없으나 JPA 엔티티에는 tenantId 필드 존재

-- 1. tenant_id 컬럼 추가 (없을 때만: MySQL은 IF NOT EXISTS 미지원이므로 프로시저로 처리)
SET @dbname = DATABASE();
SET @tablename = 'system_config';
SET @columnname = 'tenant_id';

SET @prepared = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
);

SET @sql = IF(
    @prepared,
    'ALTER TABLE system_config ADD COLUMN tenant_id VARCHAR(100) NULL DEFAULT NULL COMMENT ''테넌트 ID'' AFTER id',
    'SELECT ''Column tenant_id already exists'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 기존 행에 tenant_id 빈 문자열 설정 (조회 시 tenantId 필터링과 호환)
UPDATE system_config SET tenant_id = '' WHERE tenant_id IS NULL;

-- 3. config_key 단일 UNIQUE 제거 후 (tenant_id, config_key) 복합 UNIQUE 추가
--    (기존 제약 이름이 config_key인 경우)
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename
      AND INDEX_NAME = 'config_key' AND NON_UNIQUE = 0
);
SET @dropsql = IF(@idx_exists > 0, 'ALTER TABLE system_config DROP INDEX config_key', 'SELECT 1');
PREPARE stmt2 FROM @dropsql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 복합 unique가 없을 때만 추가
SET @uk_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename
      AND INDEX_NAME = 'uk_system_config_tenant_key'
);
SET @addsql = IF(@uk_exists = 0, 'ALTER TABLE system_config ADD UNIQUE KEY uk_system_config_tenant_key (tenant_id, config_key)', 'SELECT 1');
PREPARE stmt3 FROM @addsql;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
