-- CONSULTATION fulfillment → ERP/매핑 연동용 주문 라인 매핑 링크 (nullable, idempotent)
-- @author MindGarden
-- @since 2026-05-19

SET @db := DATABASE();

SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_client_order_lines'
       AND COLUMN_NAME = 'consultant_client_mapping_id') = 0,
    'ALTER TABLE shop_client_order_lines
        ADD COLUMN consultant_client_mapping_id BIGINT NULL
            COMMENT ''상담 패키지 ERP confirm-payment 연동 매핑 ID''
            AFTER line_total_minor',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;

-- 인덱스 (없을 때만)
SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'shop_client_order_lines'
       AND INDEX_NAME = 'idx_shop_order_line_mapping') = 0,
    'ALTER TABLE shop_client_order_lines ADD KEY idx_shop_order_line_mapping (consultant_client_mapping_id)',
    'SELECT 1'
) INTO @stmt;
PREPARE ps FROM @stmt;
EXECUTE ps;
DEALLOCATE PREPARE ps;
