-- shop/cart 500 hotfix — session_count 컬럼 보장
-- @author MindGarden
-- @since 2026-09-19
--
-- 원인 (로컬 재현, Flyway 9.22.3 + MySQL 8.0):
--   cart 는 ShopCatalogSku.session_count / ShopClientOrderLine.session_count_snapshot 을 읽는다.
--   선행 마이그는 V20260917_001 (PREPARE/EXECUTE) 뿐이다.
--   파서는 PREPARE 를 지우지 않고, 스크립트가 실행되면 컬럼이 생긴다.
--   outOfOrder=true 이면 상위 버전이 history 에 있어도 001 은 적용된다.
--   앱이 기동된 채(ddl-auto=none) cart 만 Unknown column 500 이면,
--   그 DB 에서 V20260917 은 success 인데 DDL 이 없거나 history 에 없다.
--   success 행은 재실행되지 않으므로 더 큰 버전으로 누락 컬럼만 다시 넣는다.
--   본 파일은 프로시저 IF + 직접 ALTER 만 쓴다. PREPARE/EXECUTE 는 쓰지 않는다.
--
-- 멱등: information_schema.COLUMNS 에 컬럼이 있으면 ALTER 하지 않는다.
--       V20260917 이 이미 컬럼을 만든 환경에서도 실패하지 않는다.
--       AFTER 절은 쓰지 않는다. thumbnail_url / unit_price_minor 위치와 무관하게 추가한다.
--
-- 수동 1회 (본 마이그 배포 전, history 에 V20260917 success 인데 컬럼이 없을 때):
--   ALTER TABLE shop_catalog_skus
--     ADD COLUMN session_count INT NOT NULL DEFAULT 1;
--   ALTER TABLE shop_client_order_lines
--     ADD COLUMN session_count_snapshot INT NULL;

DROP PROCEDURE IF EXISTS mg_ensure_shop_session_count_columns;

DELIMITER $$

CREATE PROCEDURE mg_ensure_shop_session_count_columns()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_catalog_skus'
          AND COLUMN_NAME = 'session_count'
    ) = 0 THEN
        ALTER TABLE shop_catalog_skus
            ADD COLUMN session_count INT NOT NULL DEFAULT 1
            COMMENT '결제 완료 시 매핑 가산 회기수(양의 정수)';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_client_order_lines'
          AND COLUMN_NAME = 'session_count_snapshot'
    ) = 0 THEN
        ALTER TABLE shop_client_order_lines
            ADD COLUMN session_count_snapshot INT NULL
            COMMENT '결제 시점 SKU 회기수 스냅샷';
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_shop_session_count_columns();

DROP PROCEDURE IF EXISTS mg_ensure_shop_session_count_columns;
