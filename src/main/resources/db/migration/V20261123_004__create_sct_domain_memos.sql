-- SCT 영역 메모 (상담일지 스키마 무변경)
-- @author MindGarden
-- @since 2026-11-23

CREATE TABLE IF NOT EXISTS sct_domain_memos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    invitation_id BIGINT NOT NULL,
    domain_code VARCHAR(64) NOT NULL,
    memo_text_enc TEXT NULL COMMENT 'ConsultationBodyAttributeConverter(랜덤 IV)',
    author_user_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_sct_domain_memo_inv_domain (invitation_id, domain_code, is_deleted),
    KEY idx_sct_domain_memo_tenant_inv (tenant_id, invitation_id),
    CONSTRAINT fk_sct_domain_memo_inv FOREIGN KEY (invitation_id) REFERENCES sct_invitations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 상담사 영역별 메모(암호화)';
