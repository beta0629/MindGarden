-- ====================================================================
-- 전문가 유형(테넌트 공통코드 연계) + ADMIN 상담 겸직 플래그
-- ====================================================================
-- 목적: users.professional_provider_type_code, users.counseling_enabled 추가,
--       기존 테넌트에 PROFESSIONAL_PROVIDER_TYPE 기본 시드 및 역할별 유형 백필.
-- 표준: DATABASE_MIGRATION_STANDARD.md
-- ====================================================================

ALTER TABLE users
    ADD COLUMN professional_provider_type_code VARCHAR(64) NULL COMMENT 'PROFESSIONAL_PROVIDER_TYPE code_value' AFTER role,
    ADD COLUMN counseling_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'ADMIN 상담 겸직' AFTER professional_provider_type_code;

-- 테넌트별 기본 전문가 유형 1건 (상담사)
INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    is_deleted,
    version,
    created_at,
    updated_at,
    extra_data
)
SELECT
    t.tenant_id,
    'PROFESSIONAL_PROVIDER_TYPE',
    'DEFAULT_COUNSELOR',
    '상담사',
    '상담사',
    '테넌트 기본 전문가 유형(상담)',
    0,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":true,"sortOrder":0}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'DEFAULT_COUNSELOR'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

-- 놀이·언어 역할 사용자가 있는 테넌트에 보조 유형 코드 추가 (표시·분류용)
INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    is_deleted,
    version,
    created_at,
    updated_at,
    extra_data
)
SELECT DISTINCT
    u.tenant_id,
    'PROFESSIONAL_PROVIDER_TYPE',
    'PLAY_THERAPY',
    '놀이치료',
    '놀이치료',
    '마이그레이션: 기존 놀이치료 전문가 유형',
    10,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":10}'
FROM users u
WHERE u.role = 'PLAY_THERAPIST'
  AND (u.is_deleted = 0 OR u.is_deleted IS NULL OR u.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = u.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'PLAY_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    is_deleted,
    version,
    created_at,
    updated_at,
    extra_data
)
SELECT DISTINCT
    u.tenant_id,
    'PROFESSIONAL_PROVIDER_TYPE',
    'SPEECH_THERAPY',
    '언어치료',
    '언어치료',
    '마이그레이션: 기존 언어치료 전문가 유형',
    20,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":20}'
FROM users u
WHERE u.role = 'SPEECH_THERAPIST'
  AND (u.is_deleted = 0 OR u.is_deleted IS NULL OR u.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = u.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'SPEECH_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

UPDATE users u
SET u.professional_provider_type_code = CASE
    WHEN u.role = 'PLAY_THERAPIST' THEN 'PLAY_THERAPY'
    WHEN u.role = 'SPEECH_THERAPIST' THEN 'SPEECH_THERAPY'
    ELSE 'DEFAULT_COUNSELOR'
END
WHERE u.role IN ('CONSULTANT', 'PLAY_THERAPIST', 'SPEECH_THERAPIST')
  AND (u.is_deleted = 0 OR u.is_deleted IS NULL OR u.is_deleted = FALSE)
  AND (u.professional_provider_type_code IS NULL OR u.professional_provider_type_code = '');
