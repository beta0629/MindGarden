-- V20251208_001: 단회기 상담 패키지 데이터 삽입
-- 표준화 2025-12-08: 하드코딩 제거, 데이터베이스에 직접 삽입
-- 단회기 패키지: 75,000원, 80,000원, 85,000원, 90,000원, 95,000원, 100,000원 (각 1회기)

-- 기존 테넌트에 단회기 패키지 추가
-- common_codes 테이블에서 기존 테넌트 ID를 가져와서 단회기 패키지 추가
INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    korean_name,
    code_label,
    code_description,
    extra_data,
    sort_order,
    is_active,
    created_at,
    updated_at,
    is_deleted,
    version
)
SELECT DISTINCT
    cc.tenant_id,
    'CONSULTATION_PACKAGE',
    'SINGLE_75000',
    '단회기 75,000원',
    '단회기 75,000원',
    '1회기 상담 패키지',
    JSON_OBJECT(
        'price', 75000,
        'duration', 50,
        'unit', '회',
        'sessions', 1
    ),
    4,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
FROM common_codes cc
WHERE cc.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM common_codes existing 
    WHERE existing.tenant_id = cc.tenant_id 
    AND existing.code_group = 'CONSULTATION_PACKAGE' 
    AND existing.code_value = 'SINGLE_75000'
  );

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    korean_name,
    code_label,
    code_description,
    extra_data,
    sort_order,
    is_active,
    created_at,
    updated_at,
    is_deleted,
    version
)
SELECT DISTINCT
    cc.tenant_id,
    'CONSULTATION_PACKAGE',
    'SINGLE_80000',
    '단회기 80,000원',
    '단회기 80,000원',
    '1회기 상담 패키지',
    JSON_OBJECT(
        'price', 80000,
        'duration', 50,
        'unit', '회',
        'sessions', 1
    ),
    5,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
FROM common_codes cc
WHERE cc.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM common_codes existing 
    WHERE existing.tenant_id = cc.tenant_id 
    AND existing.code_group = 'CONSULTATION_PACKAGE' 
    AND existing.code_value = 'SINGLE_80000'
  );

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    korean_name,
    code_label,
    code_description,
    extra_data,
    sort_order,
    is_active,
    created_at,
    updated_at,
    is_deleted,
    version
)
SELECT DISTINCT
    cc.tenant_id,
    'CONSULTATION_PACKAGE',
    'SINGLE_85000',
    '단회기 85,000원',
    '단회기 85,000원',
    '1회기 상담 패키지',
    JSON_OBJECT(
        'price', 85000,
        'duration', 50,
        'unit', '회',
        'sessions', 1
    ),
    6,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
FROM common_codes cc
WHERE cc.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM common_codes existing 
    WHERE existing.tenant_id = cc.tenant_id 
    AND existing.code_group = 'CONSULTATION_PACKAGE' 
    AND existing.code_value = 'SINGLE_85000'
  );

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    korean_name,
    code_label,
    code_description,
    extra_data,
    sort_order,
    is_active,
    created_at,
    updated_at,
    is_deleted,
    version
)
SELECT DISTINCT
    cc.tenant_id,
    'CONSULTATION_PACKAGE',
    'SINGLE_90000',
    '단회기 90,000원',
    '단회기 90,000원',
    '1회기 상담 패키지',
    JSON_OBJECT(
        'price', 90000,
        'duration', 50,
        'unit', '회',
        'sessions', 1
    ),
    7,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
FROM common_codes cc
WHERE cc.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM common_codes existing 
    WHERE existing.tenant_id = cc.tenant_id 
    AND existing.code_group = 'CONSULTATION_PACKAGE' 
    AND existing.code_value = 'SINGLE_90000'
  );

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    korean_name,
    code_label,
    code_description,
    extra_data,
    sort_order,
    is_active,
    created_at,
    updated_at,
    is_deleted,
    version
)
SELECT DISTINCT
    cc.tenant_id,
    'CONSULTATION_PACKAGE',
    'SINGLE_95000',
    '단회기 95,000원',
    '단회기 95,000원',
    '1회기 상담 패키지',
    JSON_OBJECT(
        'price', 95000,
        'duration', 50,
        'unit', '회',
        'sessions', 1
    ),
    8,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
FROM common_codes cc
WHERE cc.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM common_codes existing 
    WHERE existing.tenant_id = cc.tenant_id 
    AND existing.code_group = 'CONSULTATION_PACKAGE' 
    AND existing.code_value = 'SINGLE_95000'
  );

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    korean_name,
    code_label,
    code_description,
    extra_data,
    sort_order,
    is_active,
    created_at,
    updated_at,
    is_deleted,
    version
)
SELECT DISTINCT
    cc.tenant_id,
    'CONSULTATION_PACKAGE',
    'SINGLE_100000',
    '단회기 100,000원',
    '단회기 100,000원',
    '1회기 상담 패키지',
    JSON_OBJECT(
        'price', 100000,
        'duration', 50,
        'unit', '회',
        'sessions', 1
    ),
    9,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
FROM common_codes cc
WHERE cc.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM common_codes existing 
    WHERE existing.tenant_id = cc.tenant_id 
    AND existing.code_group = 'CONSULTATION_PACKAGE' 
    AND existing.code_value = 'SINGLE_100000'
  );
