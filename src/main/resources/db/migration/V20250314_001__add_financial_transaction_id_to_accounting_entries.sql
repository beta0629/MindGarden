-- ============================================
-- accounting_entries에 financial_transaction_id 컬럼 추가
-- ============================================
-- 목적: 거래별 분개 추적·중복 방지
-- 날짜: 2025-03-14
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
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

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
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
