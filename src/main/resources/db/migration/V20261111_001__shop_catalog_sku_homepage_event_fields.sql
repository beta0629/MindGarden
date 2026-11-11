-- shop_catalog_skus — 홈페이지 공개 상품 이벤트·회기 분 필드
-- 멱등: information_schema.COLUMNS 에 없으면 ALTER. AFTER 절 없음(운영 안전).
-- @author MindGarden
-- @since 2026-11-11

DROP PROCEDURE IF EXISTS mg_ensure_shop_catalog_sku_homepage_event_fields;

DELIMITER $$

CREATE PROCEDURE mg_ensure_shop_catalog_sku_homepage_event_fields()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_catalog_skus'
          AND COLUMN_NAME = 'event_price_minor'
    ) = 0 THEN
        ALTER TABLE shop_catalog_skus
            ADD COLUMN event_price_minor BIGINT NULL
            COMMENT '홈페이지 이벤트 단가(원, minor=won). NULL=이벤트 없음';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_catalog_skus'
          AND COLUMN_NAME = 'event_start_date'
    ) = 0 THEN
        ALTER TABLE shop_catalog_skus
            ADD COLUMN event_start_date DATE NULL
            COMMENT '이벤트 시작일(Asia/Seoul LocalDate 포함)';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_catalog_skus'
          AND COLUMN_NAME = 'event_end_date'
    ) = 0 THEN
        ALTER TABLE shop_catalog_skus
            ADD COLUMN event_end_date DATE NULL
            COMMENT '이벤트 종료일(Asia/Seoul LocalDate 포함)';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_catalog_skus'
          AND COLUMN_NAME = 'event_only'
    ) = 0 THEN
        ALTER TABLE shop_catalog_skus
            ADD COLUMN event_only TINYINT(1) NOT NULL DEFAULT 0
            COMMENT '이벤트 기간에만 공개(1). 기간 밖이면 목록에서 제외';
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

CALL mg_ensure_shop_catalog_sku_homepage_event_fields();

DROP PROCEDURE IF EXISTS mg_ensure_shop_catalog_sku_homepage_event_fields;
