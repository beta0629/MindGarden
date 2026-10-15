-- =============================================================================
-- V20261015_005 — shop_client_orders 지정 상품 필수 약관 동의 기록
--
-- 내담자 전용 지정 상품(/client/offers) 결제는 화면 체크만으로 통과하지 않는다.
-- 체크아웃 때 필수 약관 3종을 주문에 남기고, 결제 준비·결제 확정에서 다시 읽는다.
-- 지정 상품이 아닌 기존 주문은 0(미동의)이며 그 경로의 게이트는 이 컬럼을 요구하지 않는다.
--
-- 수정 대상:
--   shop_client_orders.consent_purchase
--   shop_client_orders.consent_usage_refund
--   shop_client_orders.consent_third_party
--
-- 멱등: information_schema.COLUMNS 확인 후 컬럼이 없을 때만 ALTER TABLE.
--
-- @author MindGarden
-- @since 2026-10-15
-- =============================================================================

DROP PROCEDURE IF EXISTS mg_ensure_shop_client_order_offer_consents;

DELIMITER $$

CREATE PROCEDURE mg_ensure_shop_client_order_offer_consents()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_client_orders'
          AND COLUMN_NAME  = 'consent_purchase'
    ) = 0 THEN
        ALTER TABLE shop_client_orders
            ADD COLUMN consent_purchase TINYINT(1) NOT NULL DEFAULT 0
            COMMENT '지정 상품 필수 약관 — 구매 조건 동의';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_client_orders'
          AND COLUMN_NAME  = 'consent_usage_refund'
    ) = 0 THEN
        ALTER TABLE shop_client_orders
            ADD COLUMN consent_usage_refund TINYINT(1) NOT NULL DEFAULT 0
            COMMENT '지정 상품 필수 약관 — 이용기간·환불 동의';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_client_orders'
          AND COLUMN_NAME  = 'consent_third_party'
    ) = 0 THEN
        ALTER TABLE shop_client_orders
            ADD COLUMN consent_third_party TINYINT(1) NOT NULL DEFAULT 0
            COMMENT '지정 상품 필수 약관 — 제3자 제공 동의';
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_shop_client_order_offer_consents();

DROP PROCEDURE IF EXISTS mg_ensure_shop_client_order_offer_consents;
