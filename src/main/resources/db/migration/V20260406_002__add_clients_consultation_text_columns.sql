-- ============================================
-- 내담자(clients) 상담 목적·이력 TEXT 컬럼
-- 레거시 DB에 이미 있을 수 있어 존재 시 스킵
-- @author CoreSolution
-- @since 2026-04-06
-- ============================================

SET @col_purpose = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'consultation_purpose');
SET @sql_p = IF(@col_purpose = 0,
    'ALTER TABLE clients ADD COLUMN consultation_purpose TEXT NULL COMMENT ''상담 목적''',
    'SELECT ''clients.consultation_purpose already exists''');
PREPARE stmt_p FROM @sql_p;
EXECUTE stmt_p;
DEALLOCATE PREPARE stmt_p;

SET @col_hist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'consultation_history');
SET @sql_h = IF(@col_hist = 0,
    'ALTER TABLE clients ADD COLUMN consultation_history TEXT NULL COMMENT ''상담 이력''',
    'SELECT ''clients.consultation_history already exists''');
PREPARE stmt_h FROM @sql_h;
EXECUTE stmt_h;
DEALLOCATE PREPARE stmt_h;
