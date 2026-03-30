-- ============================================
-- 내담자(clients) 차량번호 선택 필드
-- @author MindGarden
-- @since 2026-03-28
-- ============================================
-- NULL 허용. 컬럼이 이미 있으면 스킵.
-- ============================================

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'vehicle_plate');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE clients ADD COLUMN vehicle_plate VARCHAR(32) NULL COMMENT ''차량번호(선택)''',
    'SELECT ''clients.vehicle_plate already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
