-- shop_catalog_skus — 온라인 상품 유효기간(개월). 저장만 하며 상한 검증은 하지 않는다.
-- NULL = 기한 없음. 기존 행은 NULL 로 두어 과거 주문에 소급하지 않는다.
-- @author MindGarden
-- @since 2026-09-29

SET @db := DATABASE();

SET @ddl_col := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_catalog_skus'
       AND COLUMN_NAME = 'validity_months') = 0,
    'ALTER TABLE shop_catalog_skus ADD COLUMN validity_months INT NULL COMMENT ''유효기간(개월, 결제일부터·당일 포함). NULL=기한 없음'' AFTER session_count',
    'SELECT 1'
);
PREPARE stmt_col FROM @ddl_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;
