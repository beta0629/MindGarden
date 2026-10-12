-- 상품 구성(조합 패키지) 항목 — 몰 카탈로그 SKU 기반 (추가형).
-- 기존 공통코드 extraData.items(레거시 구성)는 그대로 두고, 다음 저장 때 서버가 비운다.
-- @author MindGarden
-- @since 2026-10-12

CREATE TABLE IF NOT EXISTS shop_package_composition_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    package_code VARCHAR(50) NOT NULL COMMENT '구성 대상 CONSULTATION_PACKAGE code_value',
    item_sku_id BIGINT NOT NULL COMMENT '구성 항목 shop_catalog_skus.id',
    quantity INT NOT NULL DEFAULT 1 COMMENT '수량 (1 이상)',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
    unit_price_snapshot BIGINT NOT NULL COMMENT '저장 시점 몰 판매가(원)',
    session_count_snapshot INT NOT NULL DEFAULT 0 COMMENT '저장 시점 회기 (실물 0)',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_shop_pkg_comp_quantity CHECK (quantity >= 1),
    KEY idx_shop_pkg_comp_tenant_package (tenant_id, package_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상품 구성 항목 (몰 SKU 기반)';
