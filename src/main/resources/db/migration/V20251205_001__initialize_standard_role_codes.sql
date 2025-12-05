-- ====================================================================
-- 표준 역할 코드 초기화 마이그레이션
-- 작성일: 2025-12-05
-- 목적: 표준 역할(ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER, CONSULTANT, CLIENT, STAFF, PARENT)을 공통코드에 등록
--       - 시스템 공통코드(tenant_id = NULL): 기본 역할들
--       - 테넌트별 공통코드(tenant_id = UUID): 비즈니스 타입별 역할들
-- ====================================================================

-- ROLE 코드 그룹이 없으면 생성
-- 표준 관리자 역할들
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
    NULL as tenant_id,  -- 시스템 공통코드
    'ROLE' as code_group,
    'ADMIN' as code_value,
    '관리자' as code_label,
    '관리자' as korean_name,
    '시스템 관리자 역할' as code_description,
    1 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true}' as extra_data
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE code_group = 'ROLE' AND code_value = 'ADMIN' AND tenant_id IS NULL
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
    NULL as tenant_id,
    'ROLE' as code_group,
    'TENANT_ADMIN' as code_value,
    '테넌트 관리자' as code_label,
    '테넌트 관리자' as korean_name,
    '테넌트 관리자 역할' as code_description,
    2 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true}' as extra_data
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE code_group = 'ROLE' AND code_value = 'TENANT_ADMIN' AND tenant_id IS NULL
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
    NULL as tenant_id,
    'ROLE' as code_group,
    'PRINCIPAL' as code_value,
    '원장' as code_label,
    '원장' as korean_name,
    '원장 역할 (상담소/학원)' as code_description,
    3 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true}' as extra_data
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE code_group = 'ROLE' AND code_value = 'PRINCIPAL' AND tenant_id IS NULL
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
    NULL as tenant_id,
    'ROLE' as code_group,
    'OWNER' as code_value,
    '사장' as code_label,
    '사장' as korean_name,
    '사장 역할 (최고 권한)' as code_description,
    4 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true}' as extra_data
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE code_group = 'ROLE' AND code_value = 'OWNER' AND tenant_id IS NULL
);

-- 일반 역할들
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
    NULL as tenant_id,
    'ROLE' as code_group,
    'CONSULTANT' as code_value,
    '상담사' as code_label,
    '상담사' as korean_name,
    '상담사 역할 (상담소/학원/병원)' as code_description,
    5 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": false, "roleType": "CONSULTANT", "isDefault": true}' as extra_data
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE code_group = 'ROLE' AND code_value = 'CONSULTANT' AND tenant_id IS NULL
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
    NULL as tenant_id,
    'ROLE' as code_group,
    'CLIENT' as code_value,
    '내담자' as code_label,
    '내담자' as korean_name,
    '내담자 역할 (상담소/학원/병원)' as code_description,
    6 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": false, "roleType": "CLIENT", "isDefault": true}' as extra_data
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE code_group = 'ROLE' AND code_value = 'CLIENT' AND tenant_id IS NULL
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
    NULL as tenant_id,
    'ROLE' as code_group,
    'STAFF' as code_value,
    '사무원' as code_label,
    '사무원' as korean_name,
    '사무원 역할 (상담소/학원/병원)' as code_description,
    7 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": false, "isStaff": true, "roleType": "STAFF", "isDefault": true}' as extra_data
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE code_group = 'ROLE' AND code_value = 'STAFF' AND tenant_id IS NULL
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
    NULL as tenant_id,
    'ROLE' as code_group,
    'PARENT' as code_value,
    '학부모' as code_label,
    '학부모' as korean_name,
    '학부모 역할 (학원 전용)' as code_description,
    8 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": false, "roleType": "PARENT", "isDefault": true}' as extra_data
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE code_group = 'ROLE' AND code_value = 'PARENT' AND tenant_id IS NULL
);

-- 레거시 역할들 업데이트 (비활성화 또는 extraData 업데이트)
-- 표준화 2025-12-05: 레거시 역할은 더 이상 사용하지 않지만, 하위 호환성을 위해 유지
UPDATE common_codes 
SET 
    is_active = FALSE,
    extra_data = JSON_SET(COALESCE(extra_data, '{}'), '$.isDeprecated', true, '$.deprecatedDate', '2025-12-05'),
    updated_at = NOW()
WHERE code_group = 'ROLE' 
  AND code_value IN ('BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'BRANCH_MANAGER', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN')
  AND tenant_id IS NULL
  AND is_active = TRUE;

-- 기존 ROLE 코드 그룹의 extraData 업데이트 (isAdmin, isStaff 정보 추가)
UPDATE common_codes 
SET 
    extra_data = JSON_SET(
        COALESCE(extra_data, '{}'), 
        '$.isAdmin', 
        CASE 
            WHEN code_value IN ('ADMIN', 'TENANT_ADMIN', 'PRINCIPAL', 'OWNER') THEN true 
            ELSE false 
        END,
        '$.isStaff',
        CASE 
            WHEN code_value = 'STAFF' THEN true 
            ELSE false 
        END,
        '$.roleType',
        CASE 
            WHEN code_value IN ('ADMIN', 'TENANT_ADMIN', 'PRINCIPAL', 'OWNER') THEN 'ADMIN'
            WHEN code_value = 'CONSULTANT' THEN 'CONSULTANT'
            WHEN code_value = 'CLIENT' THEN 'CLIENT'
            WHEN code_value = 'STAFF' THEN 'STAFF'
            WHEN code_value = 'PARENT' THEN 'PARENT'
            ELSE 'OTHER'
        END
    ),
    updated_at = NOW()
WHERE code_group = 'ROLE' 
  AND tenant_id IS NULL
  AND (extra_data IS NULL OR extra_data NOT LIKE '%"isAdmin"%');

-- ====================================================================
-- 테넌트별 비즈니스 타입별 역할 코드 생성
-- ====================================================================

-- 상담소(CONSULTATION) 비즈니스 타입 테넌트에 역할 코드 생성
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
    t.tenant_id as tenant_id,
    'ROLE' as code_group,
    'ADMIN' as code_value,
    '원장' as code_label,
    '원장' as korean_name,
    '상담소 원장 역할' as code_description,
    1 as sort_order,
    TRUE as is_active,
    FALSE as is_deleted,
    0 as version,
    NOW() as created_at,
    NOW() as updated_at,
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true, "businessType": "CONSULTATION"}' as extra_data
FROM tenants t
WHERE t.business_type = 'CONSULTATION'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id 
      AND code_group = 'ROLE' 
      AND code_value = 'ADMIN'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CONSULTANT', '상담사', '상담사', '상담사 역할',
    2, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CONSULTANT", "isDefault": true, "businessType": "CONSULTATION"}' 
FROM tenants t
WHERE t.business_type = 'CONSULTATION'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CONSULTANT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CLIENT', '내담자', '내담자', '내담자 역할',
    3, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CLIENT", "isDefault": true, "businessType": "CONSULTATION"}' 
FROM tenants t
WHERE t.business_type = 'CONSULTATION'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CLIENT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'STAFF', '사무원', '사무원', '사무원 역할',
    4, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "isStaff": true, "roleType": "STAFF", "isDefault": true, "businessType": "CONSULTATION"}' 
FROM tenants t
WHERE t.business_type = 'CONSULTATION'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'STAFF'
  );

-- 학원(ACADEMY) 비즈니스 타입 테넌트에 역할 코드 생성
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'ADMIN', '원장', '원장', '학원 원장 역할',
    1, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true, "businessType": "ACADEMY"}' 
FROM tenants t
WHERE t.business_type = 'ACADEMY'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'ADMIN'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CONSULTANT', '강사', '강사', '강사 역할',
    2, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CONSULTANT", "isDefault": true, "businessType": "ACADEMY"}' 
FROM tenants t
WHERE t.business_type = 'ACADEMY'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CONSULTANT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CLIENT', '학생', '학생', '학생 역할',
    3, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CLIENT", "isDefault": true, "businessType": "ACADEMY"}' 
FROM tenants t
WHERE t.business_type = 'ACADEMY'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CLIENT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'PARENT', '학부모', '학부모', '학부모 역할 (학원 전용)',
    4, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "PARENT", "isDefault": true, "businessType": "ACADEMY"}' 
FROM tenants t
WHERE t.business_type = 'ACADEMY'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'PARENT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'STAFF', '행정직원', '행정직원', '행정직원 역할',
    5, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "isStaff": true, "roleType": "STAFF", "isDefault": true, "businessType": "ACADEMY"}' 
FROM tenants t
WHERE t.business_type = 'ACADEMY'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'STAFF'
  );

-- 요식업(FOOD_SERVICE) 비즈니스 타입 테넌트에 역할 코드 생성
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'ADMIN', '사장', '사장', '요식업 사장 역할',
    1, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true, "businessType": "FOOD_SERVICE"}' 
FROM tenants t
WHERE t.business_type = 'FOOD_SERVICE'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'ADMIN'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CONSULTANT', '요리사', '요리사', '요리사 역할',
    2, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CONSULTANT", "isDefault": true, "businessType": "FOOD_SERVICE"}' 
FROM tenants t
WHERE t.business_type = 'FOOD_SERVICE'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CONSULTANT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CLIENT', '고객', '고객', '고객 역할',
    3, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CLIENT", "isDefault": true, "businessType": "FOOD_SERVICE"}' 
FROM tenants t
WHERE t.business_type = 'FOOD_SERVICE'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CLIENT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'STAFF', '직원', '직원', '직원 역할',
    4, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "isStaff": true, "roleType": "STAFF", "isDefault": true, "businessType": "FOOD_SERVICE"}' 
FROM tenants t
WHERE t.business_type = 'FOOD_SERVICE'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'STAFF'
  );

-- 태권도(TAEKWONDO) 비즈니스 타입 테넌트에 역할 코드 생성
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'ADMIN', '관장', '관장', '태권도 관장 역할',
    1, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true, "businessType": "TAEKWONDO"}' 
FROM tenants t
WHERE t.business_type = 'TAEKWONDO'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'ADMIN'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CONSULTANT', '사범', '사범', '태권도 사범 역할',
    2, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CONSULTANT", "isDefault": true, "businessType": "TAEKWONDO"}' 
FROM tenants t
WHERE t.business_type = 'TAEKWONDO'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CONSULTANT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CLIENT', '학생', '학생', '태권도 학생 역할',
    3, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CLIENT", "isDefault": true, "businessType": "TAEKWONDO"}' 
FROM tenants t
WHERE t.business_type = 'TAEKWONDO'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CLIENT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'STAFF', '직원', '직원', '태권도 직원 역할',
    4, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "isStaff": true, "roleType": "STAFF", "isDefault": true, "businessType": "TAEKWONDO"}' 
FROM tenants t
WHERE t.business_type = 'TAEKWONDO'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'STAFF'
  );

-- 과외(TUTORING) 비즈니스 타입 테넌트에 역할 코드 생성
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'ADMIN', '원장', '원장', '과외 원장 역할',
    1, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": true, "roleType": "ADMIN", "isDefault": true, "businessType": "TUTORING"}' 
FROM tenants t
WHERE t.business_type = 'TUTORING'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'ADMIN'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CONSULTANT', '강사', '강사', '과외 강사 역할',
    2, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CONSULTANT", "isDefault": true, "businessType": "TUTORING"}' 
FROM tenants t
WHERE t.business_type = 'TUTORING'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CONSULTANT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CLIENT', '학생', '학생', '과외 학생 역할',
    3, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "roleType": "CLIENT", "isDefault": true, "businessType": "TUTORING"}' 
FROM tenants t
WHERE t.business_type = 'TUTORING'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CLIENT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'STAFF', '직원', '직원', '과외 직원 역할',
    4, TRUE, FALSE, 0, NOW(), NOW(),
    '{"isAdmin": false, "isStaff": true, "roleType": "STAFF", "isDefault": true, "businessType": "TUTORING"}' 
FROM tenants t
WHERE t.business_type = 'TUTORING'
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'STAFF'
  );

-- 기타 비즈니스 타입 테넌트에 기본 역할 코드 생성 (일반적인 역할명 사용)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'ADMIN', '관리자', '관리자', '관리자 역할',
    1, TRUE, FALSE, 0, NOW(), NOW(),
    CONCAT('{"isAdmin": true, "roleType": "ADMIN", "isDefault": true, "businessType": "', t.business_type, '"}') 
FROM tenants t
WHERE t.business_type NOT IN ('CONSULTATION', 'ACADEMY', 'RESTAURANT')
  AND t.business_type IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'ADMIN'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CONSULTANT', '전문가', '전문가', '전문가 역할',
    2, TRUE, FALSE, 0, NOW(), NOW(),
    CONCAT('{"isAdmin": false, "roleType": "CONSULTANT", "isDefault": true, "businessType": "', t.business_type, '"}') 
FROM tenants t
WHERE t.business_type NOT IN ('CONSULTATION', 'ACADEMY', 'RESTAURANT')
  AND t.business_type IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CONSULTANT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'CLIENT', '고객', '고객', '고객 역할',
    3, TRUE, FALSE, 0, NOW(), NOW(),
    CONCAT('{"isAdmin": false, "roleType": "CLIENT", "isDefault": true, "businessType": "', t.business_type, '"}') 
FROM tenants t
WHERE t.business_type NOT IN ('CONSULTATION', 'ACADEMY', 'RESTAURANT')
  AND t.business_type IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'CLIENT'
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description, 
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT 
    t.tenant_id, 'ROLE', 'STAFF', '직원', '직원', '직원 역할',
    4, TRUE, FALSE, 0, NOW(), NOW(),
    CONCAT('{"isAdmin": false, "isStaff": true, "roleType": "STAFF", "isDefault": true, "businessType": "', t.business_type, '"}') 
FROM tenants t
WHERE t.business_type NOT IN ('CONSULTATION', 'ACADEMY', 'RESTAURANT')
  AND t.business_type IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = t.tenant_id AND code_group = 'ROLE' AND code_value = 'STAFF'
  );

