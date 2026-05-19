-- R3: SKU 단가 변경 이력 (audit·어드민 조회)
-- @author MindGarden
-- @since 2026-05-20

CREATE TABLE IF NOT EXISTS shop_catalog_sku_price_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    sku_id BIGINT NOT NULL COMMENT 'shop_catalog_skus.id',
    sku_code VARCHAR(64) NOT NULL COMMENT '변경 시점 SKU 코드 스냅샷',
    unit_price_minor BIGINT NOT NULL COMMENT '적용 단가(원, 정수)',
    currency CHAR(3) NOT NULL COMMENT '통화',
    changed_at DATETIME(6) NOT NULL COMMENT '단가 변경 시각',
    changed_by VARCHAR(100) NULL COMMENT '변경자(이메일·식별자)',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    KEY idx_shop_sku_price_hist_tenant_sku (tenant_id, sku_id, changed_at),
    CONSTRAINT fk_shop_sku_price_hist_sku FOREIGN KEY (sku_id) REFERENCES shop_catalog_skus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='카탈로그 SKU 단가 변경 이력(append-only)';
