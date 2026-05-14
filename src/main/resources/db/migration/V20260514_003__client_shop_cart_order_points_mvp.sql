-- P1: 내담자 쇼핑몰형 카탈로그·장바구니·주문·포인트 hold(MVP)
-- 가격 권위: shop_catalog_skus.unit_price_minor (원 정수). tenant_id NOT NULL.
-- @author MindGarden
-- @since 2026-05-14

CREATE TABLE IF NOT EXISTS shop_catalog_skus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    sku_code VARCHAR(64) NOT NULL COMMENT 'SKU 코드',
    title VARCHAR(200) NOT NULL COMMENT '노출 상품명',
    description_text TEXT NULL COMMENT '상세 설명(선택)',
    unit_price_minor BIGINT NOT NULL COMMENT '단가(원, 정수)',
    currency CHAR(3) NOT NULL DEFAULT 'KRW' COMMENT '통화',
    catalog_visible TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'PLP 노출',
    active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '판매 활성',
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_shop_sku_tenant_code (tenant_id, sku_code),
    KEY idx_shop_sku_tenant_list (tenant_id, active, catalog_visible, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='온라인 카탈로그 SKU(서버 가격 권위)';

CREATE TABLE IF NOT EXISTS shop_carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    client_id BIGINT NOT NULL COMMENT '내담자 users.id',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_shop_cart_tenant_client (tenant_id, client_id),
    CONSTRAINT fk_shop_cart_client FOREIGN KEY (client_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='내담자 장바구니(테넌트·사용자당 1)';

CREATE TABLE IF NOT EXISTS shop_cart_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    cart_id BIGINT NOT NULL,
    sku_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_shop_cart_line_cart_sku (cart_id, sku_id),
    KEY idx_shop_cart_line_cart (cart_id),
    CONSTRAINT fk_shop_cart_line_cart FOREIGN KEY (cart_id) REFERENCES shop_carts (id) ON DELETE CASCADE,
    CONSTRAINT fk_shop_cart_line_sku FOREIGN KEY (sku_id) REFERENCES shop_catalog_skus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='장바구니 라인';

CREATE TABLE IF NOT EXISTS shop_client_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    public_id VARCHAR(36) NOT NULL COMMENT '외부·PG 연동용 주문 공개 ID(UUID)',
    client_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL COMMENT 'CREATED|PENDING_PAYMENT|PAID|CANCELLED|EXPIRED',
    subtotal_minor BIGINT NOT NULL,
    points_redeem_minor BIGINT NOT NULL DEFAULT 0,
    cash_due_minor BIGINT NOT NULL DEFAULT 0,
    checkout_idempotency_key VARCHAR(128) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_shop_order_public (public_id),
    UNIQUE KEY uk_shop_order_checkout_idem (tenant_id, client_id, checkout_idempotency_key),
    KEY idx_shop_order_tenant_client (tenant_id, client_id, created_at DESC),
    CONSTRAINT fk_shop_order_client FOREIGN KEY (client_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='내담자 온라인 주문(스냅샷·포인트)';

CREATE TABLE IF NOT EXISTS shop_client_order_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    client_order_id BIGINT NOT NULL,
    line_no INT NOT NULL,
    sku_id BIGINT NOT NULL,
    sku_code_snapshot VARCHAR(64) NOT NULL,
    title_snapshot VARCHAR(200) NOT NULL,
    unit_price_minor BIGINT NOT NULL,
    quantity INT NOT NULL,
    line_total_minor BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    KEY idx_shop_order_line_order (client_order_id),
    CONSTRAINT fk_shop_order_line_order FOREIGN KEY (client_order_id) REFERENCES shop_client_orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_shop_order_line_sku FOREIGN KEY (sku_id) REFERENCES shop_catalog_skus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='주문 라인(가격·명칭 스냅샷)';

CREATE TABLE IF NOT EXISTS client_point_wallets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    available_minor BIGINT NOT NULL DEFAULT 0,
    held_minor BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_client_point_wallet (tenant_id, user_id),
    CONSTRAINT fk_client_point_wallet_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='포인트 지갑(가용·예약)';

CREATE TABLE IF NOT EXISTS client_point_ledger_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    order_public_id VARCHAR(36) NULL,
    entry_type VARCHAR(32) NOT NULL COMMENT 'HOLD|RELEASE|COMMIT',
    amount_minor BIGINT NOT NULL COMMENT '양수(의미는 entry_type)',
    idempotency_key VARCHAR(160) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_client_point_ledger_idem (tenant_id, idempotency_key),
    KEY idx_client_point_ledger_user (tenant_id, user_id),
    CONSTRAINT fk_client_point_ledger_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='포인트 원장(append-only, 멱등 키)';
