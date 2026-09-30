-- 쇼핑 주문 사용 기한 연장 이력 (append-only, INSERT 만).
-- 만료는 조회 시 판정만 하며 회기·결제 원장은 건드리지 않는다. 최신 행의 new_expire_date 가 유효 만료일.
-- @author MindGarden
-- @since 2026-09-29

CREATE TABLE IF NOT EXISTS shop_order_expiry_extensions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    order_public_id VARCHAR(36) NOT NULL COMMENT 'shop_client_orders.public_id',
    previous_expire_date DATE NOT NULL COMMENT '연장 전 만료일(당일 포함)',
    new_expire_date DATE NOT NULL COMMENT '연장 후 만료일(당일 포함)',
    reason VARCHAR(500) NOT NULL COMMENT '연장 사유(필수)',
    extended_by_user_id BIGINT NULL COMMENT '처리자 users.id',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    KEY idx_shop_expiry_ext_order (tenant_id, order_public_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='쇼핑 주문 사용 기한 연장 이력(append-only)';
