-- 상담 상품에 묶는 상담사 식별자.
-- consultant_client_mappings.consultant_id 와 같은 users.id.
-- 이름 컬럼은 두지 않는다. 기존 행은 NULL 이라 목록을 비우지 않는다.
-- @author MindGarden
-- @since 2026-09-27

SET @db := DATABASE();

SET @ddl_col := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_catalog_skus'
       AND COLUMN_NAME = 'consultant_id') = 0,
    'ALTER TABLE shop_catalog_skus ADD COLUMN consultant_id BIGINT NULL COMMENT ''상담사 users.id (consultant_client_mappings.consultant_id)'' AFTER field_code',
    'SELECT 1'
);
PREPARE stmt_col FROM @ddl_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

SET @ddl_idx := IF(
    (SELECT COUNT(*)
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_catalog_skus'
       AND INDEX_NAME = 'idx_shop_sku_tenant_consultant') = 0,
    'CREATE INDEX idx_shop_sku_tenant_consultant ON shop_catalog_skus (tenant_id, consultant_id)',
    'SELECT 1'
);
PREPARE stmt_idx FROM @ddl_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
