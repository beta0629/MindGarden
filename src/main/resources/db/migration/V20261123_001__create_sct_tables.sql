-- SCT 온라인 질문지 테이블 생성 (결제·일정·상담일지 스키마 무변경)
-- @author MindGarden
-- @since 2026-11-23

CREATE TABLE IF NOT EXISTS sct_form_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL DEFAULT '' COMMENT '코어 시드=빈 문자열, 테넌트 커스텀 시 테넌트 ID',
    form_type VARCHAR(20) NOT NULL COMMENT 'ADULT/ADOLESCENT/CHILD',
    version VARCHAR(20) NOT NULL COMMENT '예: v3',
    title VARCHAR(200) NOT NULL,
    instruction_text TEXT NOT NULL,
    target_desc VARCHAR(200) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version_lock BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_sct_form_tenant_type_ver (tenant_id, form_type, version),
    KEY idx_sct_form_active (form_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 질문지 템플릿';

CREATE TABLE IF NOT EXISTS sct_form_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    form_template_id BIGINT NOT NULL,
    item_no INT NOT NULL,
    prompt_text VARCHAR(1000) NOT NULL,
    domain_code VARCHAR(64) NOT NULL,
    domain_label VARCHAR(100) NOT NULL,
    valence VARCHAR(16) NULL,
    tense VARCHAR(16) NULL,
    allows_not_applicable TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_sct_form_item (form_template_id, item_no),
    CONSTRAINT fk_sct_form_items_template FOREIGN KEY (form_template_id) REFERENCES sct_form_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 문항';

CREATE TABLE IF NOT EXISTS sct_invitations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    form_template_id BIGINT NOT NULL,
    client_id BIGINT NULL,
    mapping_id BIGINT NULL,
    consultant_id BIGINT NULL,
    target_phone VARCHAR(512) NULL,
    target_email VARCHAR(512) NULL,
    target_phone_hash CHAR(64) NULL,
    target_email_hash CHAR(64) NULL,
    token_hash CHAR(64) NOT NULL,
    token_expires_at DATETIME(6) NOT NULL,
    status VARCHAR(20) NOT NULL,
    sent_at DATETIME(6) NULL,
    draft_saved_at DATETIME(6) NULL,
    submitted_at DATETIME(6) NULL,
    cancelled_at DATETIME(6) NULL,
    sent_by_user_id BIGINT NOT NULL,
    sms_dispatch_result VARCHAR(40) NULL,
    link_opened_at DATETIME(6) NULL,
    verify_fail_count INT NOT NULL DEFAULT 0,
    verify_locked_until DATETIME(6) NULL,
    respondent_meta_json TEXT NULL,
    requires_guardian TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_sct_inv_token_hash (token_hash),
    KEY idx_sct_inv_tenant_status (tenant_id, status, created_at),
    KEY idx_sct_inv_tenant_client (tenant_id, client_id, submitted_at),
    KEY idx_sct_inv_tenant_mapping (tenant_id, mapping_id),
    KEY idx_sct_inv_phone_hash (tenant_id, target_phone_hash),
    CONSTRAINT fk_sct_inv_form FOREIGN KEY (form_template_id) REFERENCES sct_form_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 발송 건';

CREATE TABLE IF NOT EXISTS sct_response_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    invitation_id BIGINT NOT NULL,
    form_item_id BIGINT NOT NULL,
    answer_text_enc TEXT NULL,
    not_applicable TINYINT(1) NOT NULL DEFAULT 0,
    is_blank TINYINT(1) NOT NULL DEFAULT 0,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_sct_answer (invitation_id, form_item_id),
    KEY idx_sct_answer_tenant (tenant_id, invitation_id),
    CONSTRAINT fk_sct_answer_inv FOREIGN KEY (invitation_id) REFERENCES sct_invitations(id),
    CONSTRAINT fk_sct_answer_item FOREIGN KEY (form_item_id) REFERENCES sct_form_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 문항별 응답';

CREATE TABLE IF NOT EXISTS sct_consents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    invitation_id BIGINT NOT NULL,
    consent_type VARCHAR(40) NOT NULL,
    consent_template_version VARCHAR(40) NULL,
    agreed TINYINT(1) NOT NULL,
    guardian_name_enc VARCHAR(512) NULL,
    guardian_relation VARCHAR(40) NULL,
    agreed_at DATETIME(6) NOT NULL,
    ip_hash CHAR(64) NOT NULL,
    user_agent_hash CHAR(64) NULL,
    KEY idx_sct_consent_inv (tenant_id, invitation_id),
    CONSTRAINT fk_sct_consent_inv FOREIGN KEY (invitation_id) REFERENCES sct_invitations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 동의';

CREATE TABLE IF NOT EXISTS sct_invite_access_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    invitation_id BIGINT NOT NULL,
    success TINYINT(1) NOT NULL,
    ip_hash CHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY idx_sct_attempt_inv (tenant_id, invitation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 연락처 검증 시도';

CREATE TABLE IF NOT EXISTS sct_access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    invitation_id BIGINT NULL,
    client_id BIGINT NULL,
    actor_id BIGINT NULL,
    actor_role VARCHAR(40) NULL,
    action VARCHAR(20) NOT NULL,
    accessed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ip_hash CHAR(64) NULL,
    user_agent_hash CHAR(64) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    KEY idx_sct_al_tenant_accessed (tenant_id, accessed_at),
    KEY idx_sct_al_tenant_inv (tenant_id, invitation_id, accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 열람 감사 로그(append-only)';

CREATE TABLE IF NOT EXISTS sct_consent_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL DEFAULT '' COMMENT '코어=빈 문자열',
    consent_type VARCHAR(40) NOT NULL,
    version VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body_text TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_sct_consent_tpl (tenant_id, consent_type, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT 동의 문구 버전 템플릿';
