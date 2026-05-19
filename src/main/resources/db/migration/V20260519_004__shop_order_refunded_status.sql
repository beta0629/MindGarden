-- shop_client_orders.status: REFUNDED 추가 (VARCHAR(32) — enum 확장, DDL 변경 없음)
-- @author MindGarden
-- @since 2026-05-19

ALTER TABLE shop_client_orders
    MODIFY COLUMN status VARCHAR(32) NOT NULL
    COMMENT 'CREATED|PENDING_PAYMENT|PAID|CANCELLED|EXPIRED|REFUNDED';
