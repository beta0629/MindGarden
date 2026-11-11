-- ====================================================================
-- 홈페이지 공개 문의 접수 (homepage_inquiries) + 문의유형 공통코드
-- ====================================================================
-- 목적: m-garden 등 센터 홈페이지 문의는 Clinic-OS 에만 저장·관리한다.
-- 표준: DATABASE_MIGRATION_STANDARD.md (additive, tenant_id 필수, soft-delete)
-- @author CoreSolution
-- @since 2026-11-11
-- ====================================================================

CREATE TABLE IF NOT EXISTS homepage_inquiries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    name VARCHAR(512) NOT NULL COMMENT '문의자 이름(암호화)',
    phone VARCHAR(512) NOT NULL COMMENT '문의자 전화(암호화)',
    inquiry_type VARCHAR(64) NOT NULL COMMENT '문의 유형(common_codes.HOMEPAGE_INQUIRY_TYPE.code_value)',
    content TEXT NOT NULL COMMENT '문의 내용',
    privacy_consent_at DATETIME(6) NOT NULL COMMENT '개인정보 동의 시각',
    consent_version VARCHAR(64) NOT NULL COMMENT '동의 문구 버전',
    status VARCHAR(32) NOT NULL DEFAULT 'NEW' COMMENT 'NEW | IN_PROGRESS | CONTACTED',
    client_ip_hash VARCHAR(64) NULL COMMENT '클라이언트 IP SHA-256(원문 미저장)',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    KEY idx_homepage_inquiries_tenant_status_created (tenant_id, status, created_at),
    KEY idx_homepage_inquiries_tenant_deleted_created (tenant_id, is_deleted, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='센터 홈페이지 공개 문의 접수';

INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
SELECT 'HOMEPAGE_INQUIRY_TYPE', '홈페이지문의유형', 'TENANT', 'CONSULT',
       '센터 홈페이지 문의 유형(개인상담·부부·아동·검사·기타)', 'badge', 1, 190
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM code_group_metadata WHERE group_name = 'HOMEPAGE_INQUIRY_TYPE'
);

UPDATE code_group_metadata
SET code_type = 'TENANT', is_active = 1
WHERE group_name = 'HOMEPAGE_INQUIRY_TYPE'
  AND (code_type IS NULL OR code_type <> 'TENANT' OR is_active = 0 OR is_active = FALSE);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT t.tenant_id, 'HOMEPAGE_INQUIRY_TYPE', 'PERSONAL', '개인상담', '개인상담',
       '개인 상담 문의', 0, TRUE, FALSE, 0, NOW(), NOW()
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'HOMEPAGE_INQUIRY_TYPE'
      AND c.code_value = 'PERSONAL'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT t.tenant_id, 'HOMEPAGE_INQUIRY_TYPE', 'COUPLE', '부부', '부부',
       '부부 상담 문의', 1, TRUE, FALSE, 0, NOW(), NOW()
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'HOMEPAGE_INQUIRY_TYPE'
      AND c.code_value = 'COUPLE'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT t.tenant_id, 'HOMEPAGE_INQUIRY_TYPE', 'CHILD', '아동', '아동',
       '아동 상담 문의', 2, TRUE, FALSE, 0, NOW(), NOW()
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'HOMEPAGE_INQUIRY_TYPE'
      AND c.code_value = 'CHILD'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT t.tenant_id, 'HOMEPAGE_INQUIRY_TYPE', 'ASSESSMENT', '검사', '검사',
       '심리검사 문의', 3, TRUE, FALSE, 0, NOW(), NOW()
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'HOMEPAGE_INQUIRY_TYPE'
      AND c.code_value = 'ASSESSMENT'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT t.tenant_id, 'HOMEPAGE_INQUIRY_TYPE', 'OTHER', '기타', '기타',
       '기타 문의', 4, TRUE, FALSE, 0, NOW(), NOW()
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'HOMEPAGE_INQUIRY_TYPE'
      AND c.code_value = 'OTHER'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );
