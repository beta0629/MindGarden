-- 모바일 푸시 발송 멱등(동일 이벤트 이중 발송 방지)
-- @author MindGarden
-- @since 2026-05-16

CREATE TABLE IF NOT EXISTS mobile_push_dispatch_dedup (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    push_type VARCHAR(64) NOT NULL COMMENT 'canonical type (booking_reminder 등)',
    entity_id VARCHAR(128) NOT NULL COMMENT '스케줄·결제·매핑 등 비즈니스 키',
    time_bucket VARCHAR(64) NOT NULL COMMENT '시간 창·슬롯 구분자',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_mpd_dedup (tenant_id, push_type, entity_id, time_bucket),
    INDEX idx_mpd_tenant_created (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Expo 푸시 발송 멱등 레코드';
