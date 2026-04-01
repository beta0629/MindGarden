-- tenants.subdomain 및 인덱스 (재실행·부분 적용: 이미 있으면 스킵)
-- 참고: MySQL은 부분 인덱스(WHERE 절) 미지원 — UNIQUE(subdomain)은 NULL 행 다중 허용
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'subdomain') > 0,
    'SELECT 1',
    'ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(100) NULL COMMENT ''서브도메인 (예: mycompany.dev.core-solution.co.kr의 mycompany 부분)'' AFTER tenant_id'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tenants' AND INDEX_NAME = 'idx_subdomain') > 0,
    'SELECT 1',
    'CREATE UNIQUE INDEX idx_subdomain ON tenants (subdomain)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'tenants' AND INDEX_NAME = 'idx_subdomain_lookup') > 0,
    'SELECT 1',
    'CREATE INDEX idx_subdomain_lookup ON tenants (subdomain)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
