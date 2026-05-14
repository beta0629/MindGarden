-- Expo PUSH_API — 모바일 푸시 토큰·카테고리 설정 (서버 권위)
-- @author MindGarden
-- @since 2026-05-14

CREATE TABLE IF NOT EXISTS mobile_push_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID (요청 컨텍스트·사용자와 정합)',
    user_id BIGINT NOT NULL COMMENT 'users.id',
    token_sha256 CHAR(64) NOT NULL COMMENT 'push_token 중복·조회용 SHA-256(hex)',
    push_token TEXT NOT NULL COMMENT 'FCM/APNs 등 원문 토큰',
    platform VARCHAR(16) NOT NULL COMMENT 'ios | android',
    device_info JSON NULL COMMENT '단말 메타(선택)',
    active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '등록=1, 해제=0',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_mpt_tenant_user_tokenhash (tenant_id, user_id, token_sha256),
    INDEX idx_mpt_tenant_user_active (tenant_id, user_id, active),
    CONSTRAINT fk_mpt_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Expo 모바일 푸시 디바이스 토큰(테넌트·사용자 스코프)';

CREATE TABLE IF NOT EXISTS mobile_push_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT NOT NULL COMMENT 'users.id',
    schedule_enabled TINYINT(1) NOT NULL DEFAULT 1,
    payment_enabled TINYINT(1) NOT NULL DEFAULT 1,
    message_enabled TINYINT(1) NOT NULL DEFAULT 1,
    wellness_enabled TINYINT(1) NOT NULL DEFAULT 1,
    system_enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_mps_tenant_user (tenant_id, user_id),
    CONSTRAINT fk_mps_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Expo 푸시 카테고리 on/off (schedule·payment·message·wellness·system)';
