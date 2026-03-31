-- ====================================================================
-- 전역(common_codes.tenant_id IS NULL) 표준 4역할(ROLE) 보증
-- ====================================================================
-- 배경: V20251205_001에서 전역 ROLE을 넣고, V20260212_002에서 전역 ROLE 중
--       ADMIN·STAFF·CONSULTANT·CLIENT만 남기도록 정리함. 일부 환경에서는
--       전역 ROLE이 0건인 채로 남아
--       /api/v1/common-codes/core/groups/ROLE 이 빈 결과를 반환할 수 있음
--       (코어 조회는 tenant_id IS NULL만 사용).
-- 목적: ADMIN, STAFF, CONSULTANT, CLIENT 4건을 idempotent하게 보장.
-- 표준: DATABASE_MIGRATION_STANDARD.md, 4역할 정책(V20260212_001/002).
-- ====================================================================

-- 소프트삭제·비활성으로 남은 동일 키 행이 있으면 복구(유니크 키 충돌 방지)
UPDATE common_codes
SET
    is_deleted = FALSE,
    deleted_at = NULL,
    is_active = TRUE,
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'ROLE'
  AND code_value IN ('ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT');

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
    'ADMIN',
    '관리자',
    '관리자',
    '시스템 표준 관리자 역할',
    1,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"isAdmin":true,"roleType":"ADMIN","isDefault":true}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ROLE'
      AND c.code_value = 'ADMIN'
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
    'STAFF',
    '사무원',
    '사무원',
    '시스템 표준 사무원 역할',
    2,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"isAdmin":false,"isStaff":true,"roleType":"STAFF","isDefault":true}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ROLE'
      AND c.code_value = 'STAFF'
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
    'CONSULTANT',
    '상담사',
    '상담사',
    '시스템 표준 상담사·전문가 역할',
    3,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"isAdmin":false,"roleType":"CONSULTANT","isDefault":true}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ROLE'
      AND c.code_value = 'CONSULTANT'
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
    'CLIENT',
    '내담자',
    '내담자',
    '시스템 표준 내담자·고객 역할',
    4,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
    '{"isAdmin":false,"roleType":"CLIENT","isDefault":true}'
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'ROLE'
      AND c.code_value = 'CLIENT'
);
