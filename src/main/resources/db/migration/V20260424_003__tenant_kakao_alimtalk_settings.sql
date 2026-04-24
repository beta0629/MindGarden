-- 테넌트별 카카오 알림톡 비시크릿 설정 (§11.3 tenant_kakao_alimtalk_settings)
-- 시크릿(api_key/sender_key) 평문 저장 금지 — 참조 문자열만 nullable 컬럼으로 보관
-- @author CoreSolution
-- @since 2026-04-24

CREATE TABLE IF NOT EXISTS tenant_kakao_alimtalk_settings (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    alimtalk_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '테넌트 알림톡 기능 on/off (행 없으면 전역 상속)',
    template_consultation_confirmed VARCHAR(120) NULL COMMENT '비즈 템플릿 코드 — CONSULTATION_CONFIRMED',
    template_consultation_reminder VARCHAR(120) NULL COMMENT 'CONSULTATION_REMINDER',
    template_consultation_cancelled VARCHAR(120) NULL COMMENT 'CONSULTATION_CANCELLED',
    template_refund_completed VARCHAR(120) NULL COMMENT 'REFUND_COMPLETED',
    template_schedule_changed VARCHAR(120) NULL COMMENT 'SCHEDULE_CHANGED',
    template_payment_completed VARCHAR(120) NULL COMMENT 'PAYMENT_COMPLETED',
    template_deposit_pending_reminder VARCHAR(120) NULL COMMENT 'DEPOSIT_PENDING_REMINDER',
    kakao_api_key_ref VARCHAR(200) NULL COMMENT 'Secrets/KMS 별칭 등 참조 ID만',
    kakao_sender_key_ref VARCHAR(200) NULL COMMENT '발신 프로필 키 참조 ID만',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_tenant_kakao_alimtalk_tenant (tenant_id),
    INDEX idx_tkas_tenant_deleted (tenant_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트별 카카오 알림톡 비시크릿 설정';
