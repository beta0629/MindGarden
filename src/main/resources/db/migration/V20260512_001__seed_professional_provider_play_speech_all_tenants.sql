-- ====================================================================
-- 전문가 유형: 놀이치료·언어치료 코드 전 테넌트 시드
-- ====================================================================
-- 배경: V20260510_002 는 해당 역할(PLAY_THERAPIST/SPEECH_THERAPIST) 사용자가
--       있을 때만 PLAY_THERAPY/SPEECH_THERAPY 행을 넣어, 상담사만 있는 테넌트는
--       셀렉트에 '상담사' 한 줄만 노출됨. 관리 화면에서 유형 선택지를 제공하려면
--       테넌트별로 선택 가능한 코드가 존재해야 함.
-- 표준: DATABASE_MIGRATION_STANDARD.md
-- ====================================================================

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
    'PLAY_THERAPY',
    '놀이치료',
    '놀이치료',
    '전문가 유형(놀이치료) — 테넌트 공통 선택지',
    10,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":10}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
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
SELECT
    t.tenant_id,
    'PROFESSIONAL_PROVIDER_TYPE',
    'SPEECH_THERAPY',
    '언어치료',
    '언어치료',
    '전문가 유형(언어치료) — 테넌트 공통 선택지',
    20,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":20}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'SPEECH_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );
