-- shop_client_orders — 내담자 fulfill-retry 성공 1회 소진 플래그
-- (클릭/시도가 아니라 재시도 가능 FAILED 해소 후 true. FAILED 잔존 시 false 유지)
-- @author MindGarden
-- @since 2026-09-19
--
-- 멱등: information_schema.COLUMNS 에 컬럼이 있으면 ALTER 하지 않는다.
-- AFTER 절은 쓰지 않는다. checkout_idempotency_key 위치와 무관하게 추가한다.

DROP PROCEDURE IF EXISTS mg_ensure_shop_client_fulfill_retry_attempted;

DELIMITER $$

CREATE PROCEDURE mg_ensure_shop_client_fulfill_retry_attempted()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'shop_client_orders'
          AND COLUMN_NAME = 'client_fulfill_retry_attempted'
    ) = 0 THEN
        ALTER TABLE shop_client_orders
            ADD COLUMN client_fulfill_retry_attempted TINYINT(1) NOT NULL DEFAULT 0
            COMMENT '내담자 fulfill-retry 성공 1회 소진(FAILED 잔존 시 false)';
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_shop_client_fulfill_retry_attempted();

DROP PROCEDURE IF EXISTS mg_ensure_shop_client_fulfill_retry_attempted;
