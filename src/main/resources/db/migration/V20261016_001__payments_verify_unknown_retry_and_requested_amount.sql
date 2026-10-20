-- =============================================================================
-- V20261016_001 — payments: PortOne UNKNOWN 재시도 추적 + 요청/실결제 금액 감사 컬럼
--
-- 배경:
--   (1) UNKNOWN/READY 검증이 상한 없이 재시도되면 expire·웹훅·verify 가 PortOne 을 계속 두드린다.
--       시도 횟수·최초 시각·소진 시각을 남겨 상한 도달 시 재시도를 멈추고 관리자 알림만 한다(자동 취소 없음).
--   (2) 금액 불일치 취소 시 payment.amount 를 PortOne paid 로 덮어쓰면 클라이언트 요청액이 사라진다.
--       requested_amount(준비/청구액)와 portone_paid_amount(실결제액)를 분리 보관한다.
--
-- 수정 대상:
--   payments.verify_unknown_attempt_count   INT NOT NULL DEFAULT 0
--   payments.verify_unknown_first_seen_at   DATETIME NULL
--   payments.verify_unknown_exhausted_at    DATETIME NULL
--   payments.requested_amount               DECIMAL(19,2) NULL
--   payments.portone_paid_amount            DECIMAL(19,2) NULL
--
-- 멱등: information_schema.COLUMNS 확인 후 없을 때만 ALTER (V20261009_031 패턴).
--
-- @author MindGarden
-- @since 2026-10-16
-- =============================================================================

DROP PROCEDURE IF EXISTS mg_ensure_payments_verify_unknown_retry_and_requested_amount;

DELIMITER $$

CREATE PROCEDURE mg_ensure_payments_verify_unknown_retry_and_requested_amount()
BEGIN
    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'payments'
          AND COLUMN_NAME  = 'verify_unknown_attempt_count'
    ) = 0 THEN
        ALTER TABLE payments
            ADD COLUMN verify_unknown_attempt_count INT NOT NULL DEFAULT 0
            COMMENT 'PortOne 검증 UNKNOWN 누적 시도 횟수 (상한 도달 시 재시도 중단)';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'payments'
          AND COLUMN_NAME  = 'verify_unknown_first_seen_at'
    ) = 0 THEN
        ALTER TABLE payments
            ADD COLUMN verify_unknown_first_seen_at DATETIME NULL
            COMMENT 'PortOne 검증 UNKNOWN 최초 관측 시각';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'payments'
          AND COLUMN_NAME  = 'verify_unknown_exhausted_at'
    ) = 0 THEN
        ALTER TABLE payments
            ADD COLUMN verify_unknown_exhausted_at DATETIME NULL
            COMMENT 'PortOne 검증 UNKNOWN 재시도 소진 시각 (관리자 알림 1회 멱등 마커)';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'payments'
          AND COLUMN_NAME  = 'requested_amount'
    ) = 0 THEN
        ALTER TABLE payments
            ADD COLUMN requested_amount DECIMAL(19,2) NULL
            COMMENT '클라이언트/prepare 청구액 (cashDue). amount 가 PortOne paid 로 동기화돼도 유지';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'payments'
          AND COLUMN_NAME  = 'portone_paid_amount'
    ) = 0 THEN
        ALTER TABLE payments
            ADD COLUMN portone_paid_amount DECIMAL(19,2) NULL
            COMMENT 'PortOne amount.paid 실결제액 (MATCH/MISMATCH 검증 시 기록)';
    END IF;
END$$

DELIMITER ;

CALL mg_ensure_payments_verify_unknown_retry_and_requested_amount();

DROP PROCEDURE IF EXISTS mg_ensure_payments_verify_unknown_retry_and_requested_amount;
