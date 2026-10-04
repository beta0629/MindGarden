-- =============================================================================
-- V20261009_031 — shop_client_orders 어드민 전액 환불 PG 취소 진행 표시 컬럼 보장
--
-- 배경:
--   어드민 전액 환불은 PortOne 취소를 DB 트랜잭션 밖에서 호출한다.
--   (1) 주문 잠금 + 진행 표시 커밋 → (2) PortOne 취소(트랜잭션 없음) → (3) 새 트랜잭션에서 결과 기록.
--   동시 요청이 PG 취소를 두 번 부르지 않도록 임대 만료 시각을, 재시도 시 PG 기취소를
--   인정할 근거로 PG 취소 요청 시각을 남긴다.
--
-- 수정 대상 (모두 NULL 허용, 기본값 NULL — 기존 행 변경 없음):
--   shop_client_orders.refund_pg_lease_until   DATETIME NULL
--   shop_client_orders.refund_pg_attempted_at  DATETIME NULL
--
-- 멱등: information_schema.COLUMNS 확인 후 컬럼이 없을 때만 ALTER TABLE.
--       V20260929_004 와 같은 저장 프로시저 IF 구조 (PREPARE/EXECUTE 없음).
--
-- @author MindGarden
-- @since 2026-10-04
-- =============================================================================

DROP PROCEDURE IF EXISTS mg_ensure_shop_client_order_refund_pg_lease;

DELIMITER $$

CREATE PROCEDURE mg_ensure_shop_client_order_refund_pg_lease()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_client_orders'
          AND COLUMN_NAME  = 'refund_pg_lease_until'
    ) = 0 THEN
        ALTER TABLE shop_client_orders
            ADD COLUMN refund_pg_lease_until DATETIME NULL
            COMMENT '어드민 전액 환불 PG 취소 진행 임대 만료 시각 (이 시각 전 동시 요청 거부)';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'shop_client_orders'
          AND COLUMN_NAME  = 'refund_pg_attempted_at'
    ) = 0 THEN
        ALTER TABLE shop_client_orders
            ADD COLUMN refund_pg_attempted_at DATETIME NULL
            COMMENT '어드민 전액 환불 PG 취소 요청 시각 (재시도 시 PG 기취소 인정 근거)';
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_shop_client_order_refund_pg_lease();

DROP PROCEDURE IF EXISTS mg_ensure_shop_client_order_refund_pg_lease;
