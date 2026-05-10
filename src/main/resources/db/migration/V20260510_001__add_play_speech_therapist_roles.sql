-- ====================================================================
-- 전문가 역할 확장: 놀이치료·언어치료 (ROLE 공통코드 + role_permissions)
-- ====================================================================
-- 목적: UserRole PLAY_THERAPIST, SPEECH_THERAPIST와 동일한 권한 집합을
--       CONSULTANT role_permissions에서 복제. 전역 ROLE 공통코드 보강.
-- 작성: 2026-05-10
-- 표준: DATABASE_MIGRATION_STANDARD.md
-- ====================================================================

-- --------------------------------------------------------------------
-- 1) 전역 common_codes ROLE (tenant_id IS NULL)
-- --------------------------------------------------------------------
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
    NULL,
    'ROLE',
    'PLAY_THERAPIST',
    '놀이치료 선생님',
    '놀이치료 선생님',
    '시스템 표준 놀이치료 전문가 역할',
    35,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"isAdmin":false,"roleType":"PLAY_THERAPIST","isDefault":true}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ROLE'
      AND c.code_value = 'PLAY_THERAPIST'
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
SELECT
    NULL,
    'ROLE',
    'SPEECH_THERAPIST',
    '언어치료 선생님',
    '언어치료 선생님',
    '시스템 표준 언어치료 전문가 역할',
    36,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"isAdmin":false,"roleType":"SPEECH_THERAPIST","isDefault":true}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ROLE'
      AND c.code_value = 'SPEECH_THERAPIST'
);

-- --------------------------------------------------------------------
-- 2) role_permissions: CONSULTANT 행을 PLAY_THERAPIST / SPEECH_THERAPIST에 복제
-- --------------------------------------------------------------------
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'PLAY_THERAPIST', src.permission_code, src.tenant_role_id, 'SYSTEM', NOW(), src.is_active, NOW(), NOW()
FROM role_permissions src
WHERE src.role_name = 'CONSULTANT'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_name = 'PLAY_THERAPIST'
      AND rp.permission_code = src.permission_code
      AND (rp.tenant_role_id <=> src.tenant_role_id)
  );

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'SPEECH_THERAPIST', src.permission_code, src.tenant_role_id, 'SYSTEM', NOW(), src.is_active, NOW(), NOW()
FROM role_permissions src
WHERE src.role_name = 'CONSULTANT'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_name = 'SPEECH_THERAPIST'
      AND rp.permission_code = src.permission_code
      AND (rp.tenant_role_id <=> src.tenant_role_id)
  );
