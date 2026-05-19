-- MVP+ PLP/PDP 대표 이미지 URL (앱 저장 시 NOT NULL 검증은 서비스 레이어)
-- @author MindGarden
-- @since 2026-05-23

SET @db := DATABASE();

SET @ddl := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_catalog_skus'
       AND COLUMN_NAME = 'thumbnail_url') = 0,
    'ALTER TABLE shop_catalog_skus ADD COLUMN thumbnail_url VARCHAR(512) NULL COMMENT ''PLP/PDP 썸네일 URL'' AFTER catalog_category',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
