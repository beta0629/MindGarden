-- =============================================================================
-- V20260729_001__create_immediate_reservation_sms_pending.sql
-- 예약 즉시 SMS 업무시간 외 지연 발송 pending
--
-- 스케줄 등록 시 업무시간(09:00~18:00 Asia/Seoul) 밖이면 본 테이블에 enqueue 후
-- ImmediateReservationSmsScheduler 가 fire_at 경과 시 1회 발송한다.
-- 규칙: t<09:00 → 당일 09:00 / t≥18:00 → 익일 09:00 / 그 외 즉시.
-- 멱등: (tenant_id, schedule_id, template_code, status=SENT) 애플리케이션 조회.
-- 운영 영향: 신규 테이블 1건. CREATE TABLE IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS immediate_reservation_sms_pending (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id       VARCHAR(36)  NOT NULL,
    schedule_id     BIGINT       NOT NULL,
    template_code   VARCHAR(64)  NOT NULL COMMENT 'RESERVATION_IMMEDIATE_SINGLE|LATE|REMINDER_D2',
    fire_at         DATETIME(6)  NOT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING|SENT|SKIPPED_CANCELLED|SKIPPED_DUPLICATE',
    processed_at    DATETIME(6)  NULL,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at      DATETIME(6)  NULL,
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    version         BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_irsp_due (status, fire_at, is_deleted),
    KEY idx_irsp_tenant_schedule_status (tenant_id, schedule_id, status),
    KEY idx_irsp_idem (tenant_id, schedule_id, template_code, status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='예약 즉시 SMS 업무시간 외 지연 발송 pending';
