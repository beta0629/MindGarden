-- shop_client_order_lines — 주문 당시 유효기간(개월) 스냅샷.
-- 체크아웃에서만 채운다. 기존 주문 라인은 NULL(기한 없음)로 두고 현재 상품 값을 소급하지 않는다.
-- @author MindGarden
-- @since 2026-09-29

SET @db := DATABASE();

SET @ddl_col := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_client_order_lines'
       AND COLUMN_NAME = 'validity_months_snapshot') = 0,
    'ALTER TABLE shop_client_order_lines ADD COLUMN validity_months_snapshot INT NULL COMMENT ''주문 당시 유효기간(개월) 스냅샷. NULL=기한 없음'' AFTER session_count_snapshot',
    'SELECT 1'
);
PREPARE stmt_col FROM @ddl_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;
