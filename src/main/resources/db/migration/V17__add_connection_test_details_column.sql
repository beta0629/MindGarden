-- ============================================
-- V17: 연결 테스트 상세 정보 컬럼 추가
-- ============================================
-- 목적: 연결 테스트 상세 정보를 JSON 형식으로 저장
-- 작성일: 2025-01-XX
-- ============================================

-- tenant_pg_configurations 테이블에 connection_test_details 컬럼 추가
-- MySQL에서는 IF NOT EXISTS를 직접 지원하지 않으므로 동적 SQL 사용
SET @db_name = DATABASE();
SET @table_name = 'tenant_pg_configurations';
SET @column_name = 'connection_test_details';

SET @sql = CONCAT(
    'ALTER TABLE ', @table_name, ' ',
    'ADD COLUMN ', @column_name, ' JSON COMMENT ''연결 테스트 상세 정보 (JSON)'''
);

SET @check_sql = CONCAT(
    'SELECT COUNT(*) INTO @column_exists ',
    'FROM INFORMATION_SCHEMA.COLUMNS ',
    'WHERE TABLE_SCHEMA = ''', @db_name, ''' ',
    'AND TABLE_NAME = ''', @table_name, ''' ',
    'AND COLUMN_NAME = ''', @column_name, ''''
);

PREPARE check_stmt FROM @check_sql;
EXECUTE check_stmt;
DEALLOCATE PREPARE check_stmt;

SET @execute_sql = IF(
    @column_exists = 0,
    @sql,
    CONCAT('SELECT ''Column ', @column_name, ' already exists'' AS message')
);

PREPARE stmt FROM @execute_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

