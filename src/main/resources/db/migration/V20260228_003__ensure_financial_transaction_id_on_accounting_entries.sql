-- ============================================
-- accounting_entries에 financial_transaction_id 컬럼 보장
-- ============================================
-- 목적: V20250314 미적용 환경에서 컬럼 누락 시 추가 (idempotent)
-- 오류: Unknown column 'financial_transaction_id' in 'field list'
-- 날짜: 2026-02-28
-- ============================================

SET @dbname = DATABASE();
SET @tablename = 'accounting_entries';
SET @columnname = 'financial_transaction_id';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BIGINT NULL COMMENT ''거래 ID (분개 추적·중복 방지용)''')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @indexname = 'idx_accounting_entries_financial_transaction_id';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (INDEX_NAME = @indexname)
    ) > 0,
    'SELECT 1',
    CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, ' (financial_transaction_id)')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
