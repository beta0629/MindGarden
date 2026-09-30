-- =============================================================================
-- V20260929_004 — shop_client_orders.checkout_source 컬럼 보장
--
-- 배경:
--   바로 구매는 장바구니를 거치지 않고 SKU 라인만으로 주문을 만든다.
--   PAID 전이 시 장바구니 비우기는 장바구니 주문(CART)에만 적용해야 하므로
--   주문 생성 경로를 기록한다. 기존 주문은 모두 CART.
--
-- 수정 대상:
--   shop_client_orders.checkout_source  VARCHAR(16) NOT NULL DEFAULT 'CART'
--
-- 멱등: information_schema.COLUMNS 확인 후 컬럼이 없을 때만 ALTER TABLE.
--       V20260923_002 와 같은 저장 프로시저 IF 구조 (PREPARE/EXECUTE 없음).
--
-- @author MindGarden
-- @since 2026-09-29
-- =============================================================================

DROP PROCEDURE IF EXISTS mg_ensure_shop_client_order_checkout_source;

DELIMITER $$

CREATE PROCEDURE mg_ensure_shop_client_order_checkout_source()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_client_orders'
          AND COLUMN_NAME  = 'checkout_source'
    ) = 0 THEN
        ALTER TABLE shop_client_orders
            ADD COLUMN checkout_source VARCHAR(16) NOT NULL DEFAULT 'CART'
            COMMENT '주문 생성 경로: CART | BUY_NOW';
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_shop_client_order_checkout_source();

DROP PROCEDURE IF EXISTS mg_ensure_shop_client_order_checkout_source;
