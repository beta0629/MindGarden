-- =============================================================================
-- V20261016_002 — payments: PortOne UNKNOWN/IN_PROGRESS 소진 후 장주기 폴링 시각
--
-- 배경:
--   재시도 상한 소진 후에도 PortOne 을 긴 간격으로 계속 조회해, 긴 장애 뒤 PAID 가 되면
--   정상 이행한다. 자동 EXPIRED/취소는 하지 않는다. 마지막 폴링 시각으로 간격을 지킨다.
--
-- 수정 대상:
--   payments.verify_unknown_exhausted_last_polled_at DATETIME NULL
--
-- 멱등: information_schema.COLUMNS 확인 후 없을 때만 ALTER (V20261016_001 패턴).
--
-- @author MindGarden
-- @since 2026-10-16
-- =============================================================================

DROP PROCEDURE IF EXISTS mg_ensure_payments_verify_unknown_exhausted_last_polled_at;

DELIMITER $$

CREATE PROCEDURE mg_ensure_payments_verify_unknown_exhausted_last_polled_at()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'payments'
          AND COLUMN_NAME  = 'verify_unknown_exhausted_last_polled_at'
    ) = 0 THEN
        ALTER TABLE payments
            ADD COLUMN verify_unknown_exhausted_last_polled_at DATETIME NULL
            COMMENT 'PortOne 검증 재시도 소진 후 장주기 폴링 시각';
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_payments_verify_unknown_exhausted_last_polled_at();

DROP PROCEDURE IF EXISTS mg_ensure_payments_verify_unknown_exhausted_last_polled_at;
