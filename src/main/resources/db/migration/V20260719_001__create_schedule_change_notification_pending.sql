-- =============================================================================
-- V20260719_001__create_schedule_change_notification_pending.sql
-- 일정 변경(SCHEDULE_CHANGED) 외부 채널(알림톡/SMS) 10분 디바운스 pending
--
-- 슬롯 변경 시 즉시 발송하지 않고 본 테이블에 upsert 후,
-- ScheduleChangeNotificationScheduler 가 fire_at 경과 시 1회 발송한다.
-- 동일 schedule_id 의 재변경은 fire_at 연장 + 최종 슬롯 기준 1통.
-- 멱등: (tenant_id, schedule_id, slot_version, status=SENT) 애플리케이션 조회.
-- 운영 영향: 신규 테이블 1건. CREATE TABLE IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS schedule_change_notification_pending (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id            VARCHAR(36)  NOT NULL,
    schedule_id          BIGINT       NOT NULL,
    fire_at              DATETIME(6)  NOT NULL,
    previous_date        DATE         NOT NULL,
    previous_start_time  TIME         NULL,
    slot_version         VARCHAR(128) NOT NULL COMMENT '발송 대상 슬롯 스냅샷(또는 updatedAt) — 멱등 키',
    status               VARCHAR(32)  NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING|SENT|SKIPPED_CANCELLED|SKIPPED_DUPLICATE',
    processed_at         DATETIME(6)  NULL,
    created_at           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at           DATETIME(6)  NULL,
    is_deleted           BOOLEAN      NOT NULL DEFAULT FALSE,
    version              BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_scnp_due (status, fire_at, is_deleted),
    KEY idx_scnp_tenant_schedule_status (tenant_id, schedule_id, status),
    KEY idx_scnp_idem (tenant_id, schedule_id, slot_version, status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='일정 변경 SCHEDULE_CHANGED 외부채널 디바운스 pending';
