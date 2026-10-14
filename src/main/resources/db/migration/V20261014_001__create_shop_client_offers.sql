-- 내담자별 지정 상품·할인가 (추가형). 지정마다 내담자 전용 숨김 SKU(OFFER_ 접두어)를 연결한다.
-- @author MindGarden
-- @since 2026-10-12

CREATE TABLE IF NOT EXISTS shop_client_offers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NOT NULL COMMENT '대상 내담자 users.id',
    source_sku_code VARCHAR(64) NOT NULL COMMENT '원본 몰 상품 sku_code',
    offer_sku_code VARCHAR(64) NOT NULL COMMENT '내담자 전용 숨김 SKU sku_code',
    discount_type VARCHAR(16) NOT NULL COMMENT 'AMOUNT | RATE',
    discount_value BIGINT NOT NULL COMMENT '금액(원) 또는 율(%)',
    original_price_minor BIGINT NOT NULL COMMENT '지정 시점 원가(원)',
    final_price_minor BIGINT NOT NULL COMMENT '서버 확정 최종가(원)',
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | CANCELED',
    created_by_user_id BIGINT NULL COMMENT '지정한 관리자 users.id',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_shop_client_offer_sku (tenant_id, offer_sku_code),
    KEY idx_shop_client_offer_client (tenant_id, client_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='내담자별 지정 상품·할인가';
