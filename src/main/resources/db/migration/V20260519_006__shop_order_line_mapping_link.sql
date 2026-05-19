-- CONSULTATION fulfillment → ERP/매핑 연동용 주문 라인 매핑 링크 (nullable)
-- @author MindGarden
-- @since 2026-05-19

ALTER TABLE shop_client_order_lines
    ADD COLUMN consultant_client_mapping_id BIGINT NULL
        COMMENT '상담 패키지 ERP confirm-payment 연동 매핑 ID'
        AFTER line_total_minor,
    ADD KEY idx_shop_order_line_mapping (consultant_client_mapping_id);
