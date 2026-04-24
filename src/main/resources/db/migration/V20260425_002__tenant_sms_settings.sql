-- 테넌트별 SMS 비시크릿 설정 (api_key/secret 평문 저장 금지 — 참조 문자열만 nullable)
-- @author CoreSolution
-- @since 2026-04-25

CREATE TABLE IF NOT EXISTS tenant_sms_settings (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '테넌트 SMS 채널 on/off (행 없으면 전역 상속)',
    provider VARCHAR(120) NULL COMMENT '프로바이더 식별자(nhn 등)',
    sender_number VARCHAR(32) NULL COMMENT '발신 번호',
    api_key_ref VARCHAR(200) NULL COMMENT 'Secrets/KMS 별칭·환경 키 이름 등 참조만',
    api_secret_ref VARCHAR(200) NULL COMMENT 'API 시크릿 참조만',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_tenant_sms_settings_tenant (tenant_id),
    INDEX idx_tss_tenant_deleted (tenant_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트별 SMS 비시크릿 설정';
