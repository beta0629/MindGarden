-- =============================================================================
-- V20260923_002 — shop session_count / fulfill-retry 컬럼 보장 (저장 프로시저 IF)
--
-- 배경:
--   V20260917_001 (PREPARE/EXECUTE) 및 V20260923_001 (PREPARE/EXECUTE) 이
--   Flyway history 에 SUCCESS 로 기록됐으나 DDL 이 실행되지 않는 silent-fail 이
--   일부 MySQL 8 / JDBC 환경에서 재현됨.
--   본 마이그레이션은 저장 프로시저의 IF 안에서 직접 ALTER TABLE 을 수행한다
--   (PREPARE/EXECUTE 없음). V20260919_001/002 와 동일한 구조.
--
-- 수정 대상:
--   1. shop_catalog_skus.session_count          INT NOT NULL DEFAULT 1
--   2. shop_client_order_lines.session_count_snapshot  INT NULL
--   3. shop_client_orders.client_fulfill_retry_attempted  TINYINT(1) NOT NULL DEFAULT 0
--
-- 멱등: information_schema.COLUMNS 확인 후 컬럼이 없을 때만 ALTER TABLE.
--       AFTER 절 없음. 이미 컬럼이 있는 환경에서 재실행해도 안전.
--
-- @author MindGarden
-- @since 2026-09-23
-- =============================================================================

DROP PROCEDURE IF EXISTS mg_ensure_shop_session_count_and_fulfill_retry;

DELIMITER $$

CREATE PROCEDURE mg_ensure_shop_session_count_and_fulfill_retry()
BEGIN
    -- 1. shop_catalog_skus.session_count
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_catalog_skus'
          AND COLUMN_NAME  = 'session_count'
    ) = 0 THEN
        ALTER TABLE shop_catalog_skus
            ADD COLUMN session_count INT NOT NULL DEFAULT 1;
    END IF;

    -- 2. shop_client_order_lines.session_count_snapshot
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_client_order_lines'
          AND COLUMN_NAME  = 'session_count_snapshot'
    ) = 0 THEN
        ALTER TABLE shop_client_order_lines
            ADD COLUMN session_count_snapshot INT NULL;
    END IF;

    -- 3. shop_client_orders.client_fulfill_retry_attempted
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_client_orders'
          AND COLUMN_NAME  = 'client_fulfill_retry_attempted'
    ) = 0 THEN
        ALTER TABLE shop_client_orders
            ADD COLUMN client_fulfill_retry_attempted TINYINT(1) NOT NULL DEFAULT 0;
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_shop_session_count_and_fulfill_retry();

DROP PROCEDURE IF EXISTS mg_ensure_shop_session_count_and_fulfill_retry;
