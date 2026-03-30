-- ============================================
-- erp_journal_entry_lines에 deleted_by 컬럼 추가
-- ============================================
-- 목적: JournalEntryLine 엔티티의 deleted_by 필드와 DB 스키마 정합성
-- 원인: Unknown column 'deleted_by' in 'field list' → backfill INSERT 실패
-- 참조: JournalEntryLine.deletedBy (Long), docs/troubleshooting
-- 날짜: 2026-03-21
-- ============================================

SET @dbname = DATABASE();
SET @tablename = 'erp_journal_entry_lines';
SET @columnname = 'deleted_by';

SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BIGINT NULL COMMENT ''삭제자 ID'' AFTER deleted_at')
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
