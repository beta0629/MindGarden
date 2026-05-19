-- PLP 카테고리 (상담 패키지 / 심리 검사)
-- 구버전 V20260519_001__shop_catalog_category_column 이 적용된 DB에서도 idempotent
-- @author MindGarden
-- @since 2026-05-19

SET @db := DATABASE();

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'shop_catalog_skus' AND COLUMN_NAME = 'catalog_category') = 0,
    'ALTER TABLE shop_catalog_skus ADD COLUMN catalog_category VARCHAR(32) NULL COMMENT ''CONSULTATION|ASSESSMENT'' AFTER sort_order',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;
