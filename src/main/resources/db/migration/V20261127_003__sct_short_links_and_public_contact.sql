-- SCT 단축 링크 테이블 + 공개 랜딩 문의 연락처 system_config 키(값 비움 — ops 등록)
-- 실번호 시드 금지. 운영·개발 연락처는 테넌트별 system_config로 등록.
-- @author MindGarden
-- @since 2026-11-27

CREATE TABLE IF NOT EXISTS sct_short_links (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    invitation_id BIGINT NOT NULL,
    short_code VARCHAR(8) NOT NULL COMMENT '6자 단축 코드(혼동 문자 제외 SecureRandom)',
    expires_at DATETIME(6) NOT NULL COMMENT '초대 token_expires_at 미러. 재발급 시 갱신',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_sct_short_code (short_code),
    KEY idx_sct_short_tenant_inv (tenant_id, invitation_id),
    KEY idx_sct_short_tenant_active (tenant_id, is_active, expires_at),
    CONSTRAINT fk_sct_short_inv FOREIGN KEY (invitation_id) REFERENCES sct_invitations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SCT SMS/QR 단축 링크. short_code 전역 UK로 /s/{code} 단순 조회';

-- 전역(tenant_id='') 키만 등록. config_value는 빈 문자열(ops가 실값 등록)
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
) VALUES
    ('', 'sct.public.contact.office', '',
     'SCT 공개 랜딩 사무실 문의 전화. 운영값은 ops 등록. SMS 단문 본문에는 넣지 않음',
     'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()),
    ('', 'sct.public.contact.mobile', '',
     'SCT 공개 랜딩 공개 휴대폰. 운영값은 ops 등록. SMS 단문 본문에는 넣지 않음',
     'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category = VALUES(category),
    updated_at = NOW();
