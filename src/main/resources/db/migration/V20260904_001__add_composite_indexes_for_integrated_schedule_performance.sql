-- ============================================================================
-- 복합 인덱스 추가 (통합 스케줄 / Side Peek 성능 최적화)
-- 작성일: 2026-09-04
-- 목적: tenant_id 기반 집계/NOT EXISTS 서브쿼리 성능 향상
-- 수정일: 2026-09-04 - 프로시저 방식으로 안전한 인덱스 생성
-- ============================================================================


-- 인덱스 생성 프로시저 (Flyway + MySQL 8: DELIMITER로 세미콜론 분리 오류 방지)
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

-- ============================================================================
-- 1. session_extension_requests 테이블
--    (tenant_id, status, created_at)
-- ============================================================================

CALL CreateIndexIfNotExists('session_extension_requests', 'idx_session_extension_requests_tenant_status_created', 'tenant_id, status, created_at');

-- ============================================================================
-- 2. consultation_records 테이블
--    NOT EXISTS 서브쿼리 최적화: (tenant_id, consultation_id, is_deleted)
-- ============================================================================

CALL CreateIndexIfNotExists('consultation_records', 'idx_consultation_records_tenant_consultation_deleted', 'tenant_id, consultation_id, is_deleted');

-- ============================================================================
-- 3. consultant_client_mappings 테이블
--    (tenant_id, consultant_id, client_id, created_at)
-- ============================================================================

CALL CreateIndexIfNotExists('consultant_client_mappings', 'idx_mapping_tenant_consultant_client_created', 'tenant_id, consultant_id, client_id, created_at');

-- 프로시저 삭제
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

