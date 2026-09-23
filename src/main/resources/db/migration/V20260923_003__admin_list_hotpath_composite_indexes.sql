-- ============================================================================
-- admin list hotpath 복합 인덱스
-- 작성일: 2026-09-23
-- 목적: mappings(updated_at 정렬)·clientId IN·users(role+deleted) 목록 페이지 DB 페이징
-- ============================================================================

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

DELIMITER $$

CREATE PROCEDURE CreateIndexIfNotExists(
    IN tableName VARCHAR(255),
    IN indexName VARCHAR(255),
    IN indexColumns VARCHAR(500)
)
BEGIN
    DECLARE indexExists INT DEFAULT 0;

    SELECT COUNT(*) INTO indexExists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = tableName
      AND index_name = indexName;

    IF indexExists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, '(', indexColumns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

CALL CreateIndexIfNotExists(
    'consultant_client_mappings',
    'idx_mapping_tenant_updated',
    'tenant_id, updated_at'
);

CALL CreateIndexIfNotExists(
    'consultant_client_mappings',
    'idx_mapping_tenant_client_deleted',
    'tenant_id, is_deleted, client_id'
);

-- V60: idx_users_tenant_role / idx_users_tenant_role_active — is_deleted 포함 보완용
CALL CreateIndexIfNotExists(
    'users',
    'idx_users_tenant_role_deleted',
    'tenant_id, role, is_deleted'
);

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;
