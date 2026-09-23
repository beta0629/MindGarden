-- ============================================================================
-- consultation_messages 목록 조회 성능 인덱스
-- 작성일: 2026-09-22
-- 목적: tenant_id + is_deleted + created_at 정렬/필터 (관리자 전체 메시지)
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
    'consultation_messages',
    'idx_consultation_messages_tenant_deleted_created',
    'tenant_id, is_deleted, created_at'
);

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;
