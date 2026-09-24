-- 온라인 카탈로그 SKU → 패키지 요금(CONSULTATION_PACKAGE code_value) 연결
-- 상품명·단가·회기수의 원본은 요금 관리.
-- 이 컬럼이 있는 행은 노출·설명·이미지만 담당한다.
-- @author MindGarden
-- @since 2026-09-24

SET @db := DATABASE();

SET @ddl_col := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_catalog_skus'
       AND COLUMN_NAME = 'source_package_code') = 0,
    'ALTER TABLE shop_catalog_skus ADD COLUMN source_package_code VARCHAR(50) NULL COMMENT ''CONSULTATION_PACKAGE code_value'' AFTER session_count',
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
       AND INDEX_NAME = 'idx_shop_sku_tenant_source_package') = 0,
    'CREATE INDEX idx_shop_sku_tenant_source_package ON shop_catalog_skus (tenant_id, source_package_code)',
    'SELECT 1'
);
PREPARE stmt_idx FROM @ddl_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
