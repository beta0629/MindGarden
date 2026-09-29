-- 카탈로그 SKU 분야 공통코드(code_value).
-- CONSULTATION → SPECIALTY, ASSESSMENT → ASSESSMENT_TYPE.
-- 기존 행은 NULL. 일괄 비노출하지 않는다.
-- @author MindGarden
-- @since 2026-09-26

SET @db := DATABASE();

SET @ddl_col := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_catalog_skus'
       AND COLUMN_NAME = 'field_code') = 0,
    'ALTER TABLE shop_catalog_skus ADD COLUMN field_code VARCHAR(50) NULL COMMENT ''분야 공통코드 code_value'' AFTER source_package_code',
    'SELECT 1'
);
PREPARE stmt_col FROM @ddl_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;
