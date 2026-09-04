-- ============================================
-- 상담사(consultants) 차량번호 선택 필드
-- @author MindGarden
-- @since 2026-09-04
-- ============================================
-- V20260904_003 중복 해소: #819 vehicle을 004로 재할당. .dev history 003은 LNB(#820) 적용분.
-- NULL 허용. 컬럼이 이미 있으면 스킵.
-- JOINED 상속: Consultant 전용 컬럼은 consultants 테이블.
-- ============================================

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultants' AND COLUMN_NAME = 'vehicle_plate');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE consultants ADD COLUMN vehicle_plate VARCHAR(32) NULL COMMENT ''차량번호(선택)''',
    'SELECT ''consultants.vehicle_plate already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
