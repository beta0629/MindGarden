-- ============================================================================
-- 복합 인덱스 추가 (성능 최적화)
-- 작성일: 2025-11-30
-- 목적: tenant_id 기반 쿼리 성능 향상
-- 수정일: 2025-12-01 - 프로시저 방식으로 안전한 인덱스 생성
-- ============================================================================


-- 인덱스 생성 프로시저
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists$$
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


-- ============================================================================
-- 1. schedules 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('schedules', 'idx_schedules_tenant_created', 'tenant_id, created_at');
CALL CreateIndexIfNotExists('schedules', 'idx_schedules_tenant_date', 'tenant_id, date');
CALL CreateIndexIfNotExists('schedules', 'idx_schedules_tenant_status_date', 'tenant_id, status, date');
CALL CreateIndexIfNotExists('schedules', 'idx_schedules_tenant_consultant_date', 'tenant_id, consultant_id, date');
CALL CreateIndexIfNotExists('schedules', 'idx_schedules_tenant_client_date', 'tenant_id, client_id, date');

-- ============================================================================
-- 2. financial_transactions 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('financial_transactions', 'idx_financial_tenant_date', 'tenant_id, transaction_date');
CALL CreateIndexIfNotExists('financial_transactions', 'idx_financial_tenant_type_date', 'tenant_id, transaction_type, transaction_date');
CALL CreateIndexIfNotExists('financial_transactions', 'idx_financial_tenant_subcat_date', 'tenant_id, subcategory, transaction_date');
CALL CreateIndexIfNotExists('financial_transactions', 'idx_financial_tenant_active_date', 'tenant_id, is_deleted, transaction_date');

-- ============================================================================
-- 3. consultation_records 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('consultation_records', 'idx_consultation_tenant_date', 'tenant_id, created_at');
CALL CreateIndexIfNotExists('consultation_records', 'idx_consultation_tenant_consultant_date', 'tenant_id, consultant_id, created_at');
CALL CreateIndexIfNotExists('consultation_records', 'idx_consultation_tenant_client_date', 'tenant_id, client_id, created_at');

-- ============================================================================
-- 4. users 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('users', 'idx_users_tenant_role', 'tenant_id, role');
CALL CreateIndexIfNotExists('users', 'idx_users_tenant_active', 'tenant_id, is_active, is_deleted');
CALL CreateIndexIfNotExists('users', 'idx_users_tenant_role_active', 'tenant_id, role, is_active');
CALL CreateIndexIfNotExists('users', 'idx_users_tenant_email', 'tenant_id, email');

-- ============================================================================
-- 5. consultant_client_mappings 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('consultant_client_mappings', 'idx_mapping_tenant_status', 'tenant_id, status');
CALL CreateIndexIfNotExists('consultant_client_mappings', 'idx_mapping_tenant_consultant_status', 'tenant_id, consultant_id, status');
CALL CreateIndexIfNotExists('consultant_client_mappings', 'idx_mapping_tenant_client_status', 'tenant_id, client_id, status');
CALL CreateIndexIfNotExists('consultant_client_mappings', 'idx_mapping_tenant_payment', 'tenant_id, payment_status');
CALL CreateIndexIfNotExists('consultant_client_mappings', 'idx_mapping_tenant_created', 'tenant_id, created_at');

-- ============================================================================
-- 6. clients 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('clients', 'idx_clients_tenant_active_created', 'tenant_id, is_deleted, created_at');

-- ============================================================================
-- 7. consultants 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('consultants', 'idx_consultants_tenant_active', 'tenant_id, is_deleted');

-- ============================================================================
-- 8. common_codes 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('common_codes', 'idx_common_codes_tenant_group_active', 'tenant_id, code_group, is_active');
CALL CreateIndexIfNotExists('common_codes', 'idx_common_codes_tenant_group_sort', 'tenant_id, code_group, sort_order');

-- ============================================================================
-- 9. branches 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('branches', 'idx_branches_tenant_status', 'tenant_id, branch_status');

-- ============================================================================
-- 10. consultant_availability 테이블
-- ============================================================================

CALL CreateIndexIfNotExists('consultant_availability', 'idx_availability_consultant_active', 'consultant_id, is_active');
CALL CreateIndexIfNotExists('consultant_availability', 'idx_availability_consultant_day', 'consultant_id, day_of_week');

-- 프로시저 삭제
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;

-- ============================================================================
-- 성능 확인 쿼리
-- ============================================================================

-- 인덱스 생성 확인
-- SHOW INDEX FROM schedules WHERE Key_name LIKE 'idx_schedules_tenant%';
-- SHOW INDEX FROM financial_transactions WHERE Key_name LIKE 'idx_financial_tenant%';
-- SHOW INDEX FROM users WHERE Key_name LIKE 'idx_users_tenant%';

-- 쿼리 실행 계획 확인 (인덱스 사용 여부)
-- EXPLAIN SELECT * FROM schedules WHERE tenant_id = 'xxx' AND date > '2025-01-01';
-- type이 'range' 또는 'ref'이면 인덱스 사용 중

-- ============================================================================
-- 주의사항
-- ============================================================================
-- 1. 인덱스는 INSERT/UPDATE 성능을 약간 저하시킬 수 있습니다
-- 2. 사용되지 않는 인덱스는 주기적으로 제거해야 합니다
-- 3. 인덱스 크기가 너무 크면 메모리 부족 문제가 발생할 수 있습니다
-- 4. 복합 인덱스의 컬럼 순서가 매우 중요합니다 (tenant_id가 항상 첫 번째)
