-- SCT 재발급·재문자 후 이전 토큰 해시 이력 (평문 토큰 저장 금지)
-- @author MindGarden
-- @since 2026-11-24

CREATE TABLE IF NOT EXISTS sct_rotated_token_hashes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    invitation_id BIGINT NOT NULL,
    token_hash CHAR(64) NOT NULL COMMENT 'SHA-256 hex of rotated raw token',
    rotated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_sct_rotated_token_hash (token_hash),
    KEY idx_sct_rotated_tenant_inv (tenant_id, invitation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 회전된 공개 토큰 해시(410 Gone 판별)';
