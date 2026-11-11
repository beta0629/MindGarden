-- shop_catalog_skus — 홈페이지 공개용 event_only·session_minutes
-- shop_catalog_sku_event_prices — SKU별 다중 이벤트 가격 기간(테넌트 격리)
-- 멱등: SKU 컬럼은 information_schema 에 없으면 ALTER. 새 테이블은 CREATE IF NOT EXISTS.
-- AFTER 절 없음(운영 안전). 단가·기간 컬럼은 SKU 에 두지 않는다(미배포 재작성).
-- @author MindGarden
-- @since 2026-11-11

DROP PROCEDURE IF EXISTS mg_ensure_shop_catalog_sku_event_price_flags;

DELIMITER $$

CREATE PROCEDURE mg_ensure_shop_catalog_sku_event_price_flags()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_catalog_skus'
          AND COLUMN_NAME = 'event_only'
    ) = 0 THEN
        ALTER TABLE shop_catalog_skus
            ADD COLUMN event_only TINYINT(1) NOT NULL DEFAULT 0
            COMMENT '이벤트 기간에만 공개(1). 활성 이벤트 없으면 목록에서 제외';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_catalog_skus'
          AND COLUMN_NAME = 'session_minutes'
    ) = 0 THEN
        ALTER TABLE shop_catalog_skus
            ADD COLUMN session_minutes INT NULL
            COMMENT '회기당 분(안내용). NULL=미지정';
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_shop_catalog_sku_event_price_flags();

DROP PROCEDURE IF EXISTS mg_ensure_shop_catalog_sku_event_price_flags;

CREATE TABLE IF NOT EXISTS shop_catalog_sku_event_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    sku_id BIGINT NOT NULL COMMENT 'shop_catalog_skus.id',
    event_price_minor BIGINT NOT NULL COMMENT '이벤트 단가(원, minor=won)',
    start_date DATE NOT NULL COMMENT '이벤트 시작일(Asia/Seoul LocalDate 포함)',
    end_date DATE NOT NULL COMMENT '이벤트 종료일(Asia/Seoul LocalDate 포함)',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    KEY idx_shop_sku_event_price_tenant_sku_start (tenant_id, sku_id, start_date),
    CONSTRAINT fk_shop_sku_event_price_sku FOREIGN KEY (sku_id) REFERENCES shop_catalog_skus (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='카탈로그 SKU 이벤트 가격 기간(다중, soft-delete)';
