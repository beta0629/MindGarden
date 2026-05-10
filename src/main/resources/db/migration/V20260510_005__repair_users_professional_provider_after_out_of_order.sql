-- ====================================================================
-- 복구: 20260510.003/004만 선적용되고 002(users 컬럼)가 비어 있는 환경
-- (Flyway 기본 outOfOrder=false → 중간 버전 002가 영구 미적용될 수 있음)
-- ====================================================================
-- users.professional_provider_type_code, counseling_enabled 멱등 추가 +
-- V20260510_002와 동일한 공통코드 시드·백필(이미 있으면 INSERT 0건).
-- ====================================================================

SET @dbname = DATABASE();

-- 1) professional_provider_type_code
SET @col1 = 'professional_provider_type_code';
SET @need1 = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @col1
);
SET @sql1 = IF(
    @need1,
    'ALTER TABLE users ADD COLUMN professional_provider_type_code VARCHAR(64) NULL COMMENT ''PROFESSIONAL_PROVIDER_TYPE code_value'' AFTER role',
    'SELECT ''Column professional_provider_type_code already exists'' AS msg'
);
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- 2) counseling_enabled
SET @col2 = 'counseling_enabled';
SET @need2 = (
    SELECT COUNT(*) = 0
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @col2
);
SET @sql2 = IF(
    @need2,
    'ALTER TABLE users ADD COLUMN counseling_enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''ADMIN 상담 겸직'' AFTER professional_provider_type_code',
    'SELECT ''Column counseling_enabled already exists'' AS msg'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 아래 시드·백필은 V20260510_002와 동일(멱등)
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
