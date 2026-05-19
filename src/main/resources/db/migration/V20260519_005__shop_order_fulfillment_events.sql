-- Phase 2c: PAID 후 주문 이행(fulfillment) 이벤트 (append-only)
-- @author MindGarden
-- @since 2026-05-19

CREATE TABLE IF NOT EXISTS shop_order_fulfillment_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    order_public_id VARCHAR(36) NOT NULL COMMENT 'shop_client_orders.public_id',
    sku_code VARCHAR(64) NOT NULL COMMENT '이행 대상 SKU 코드',
    category VARCHAR(32) NOT NULL COMMENT 'CONSULTATION|ASSESSMENT (스냅샷)',
    status VARCHAR(32) NOT NULL COMMENT 'PENDING|COMPLETED|SKIPPED',
    message VARCHAR(500) NULL COMMENT '이행 결과·대기 사유',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_shop_fulfillment_order_sku (tenant_id, order_public_id, sku_code),
    KEY idx_shop_fulfillment_order (tenant_id, order_public_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='쇼핑 주문 PAID 후 이행 이벤트(append-only, 라인별)';
