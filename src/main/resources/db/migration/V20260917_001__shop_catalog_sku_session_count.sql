-- 카탈로그 SKU 회기수(결제 PAID 시 매핑 total/remaining 가산 SSOT)
-- @author MindGarden
-- @since 2026-09-17

SET @db := DATABASE();

SET @ddl_sku := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_catalog_skus'
       AND COLUMN_NAME = 'session_count') = 0,
    'ALTER TABLE shop_catalog_skus ADD COLUMN session_count INT NOT NULL DEFAULT 1 COMMENT ''결제 완료 시 매핑 가산 회기수(양의 정수)'' AFTER thumbnail_url',
    'SELECT 1'
);
PREPARE stmt_sku FROM @ddl_sku;
EXECUTE stmt_sku;
DEALLOCATE PREPARE stmt_sku;

SET @ddl_line := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_client_order_lines'
       AND COLUMN_NAME = 'session_count_snapshot') = 0,
    'ALTER TABLE shop_client_order_lines ADD COLUMN session_count_snapshot INT NULL COMMENT ''결제 시점 SKU 회기수 스냅샷'' AFTER unit_price_minor',
    'SELECT 1'
);
PREPARE stmt_line FROM @ddl_line;
EXECUTE stmt_line;
DEALLOCATE PREPARE stmt_line;
