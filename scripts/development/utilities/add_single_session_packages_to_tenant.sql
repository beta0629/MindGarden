-- 단회기 패키지를 특정 테넌트에 추가하는 SQL 스크립트
-- 사용법: 테넌트 이메일 주소로 tenant_id를 찾아서 단회기 패키지 추가

-- 설정: 이메일 주소 변경
SET @contact_email = 'beta74@live.co.kr';
SET @created_by = 'SYSTEM_MANUAL_ADD';

-- 1. 테넌트 ID 확인 및 변수 설정
SET @tenant_id = (
    SELECT tenant_id 
    FROM tenants 
    WHERE LOWER(contact_email) = LOWER(@contact_email)
    AND is_deleted = FALSE
    LIMIT 1
);

-- 테넌트 정보 확인
SELECT 
    @tenant_id AS tenant_id,
    t.name AS tenant_name,
    t.contact_email,
    t.status,
    t.created_at
FROM tenants t
WHERE t.tenant_id = @tenant_id;

-- tenant_id가 없으면 오류
SELECT IF(@tenant_id IS NULL, 
    CONCAT('❌ 테넌트를 찾을 수 없습니다: ', @contact_email),
    CONCAT('✅ 테넌트 확인 완료: tenant_id=', @tenant_id)
) AS status;

-- 단회기 패키지 추가 (중복 체크 포함)
INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    created_by, updated_by, is_deleted, version
)
SELECT 
    'CONSULTATION_PACKAGE', 'SINGLE_75000', '단회기 75,000원', '단회기 75,000원', '1회기 상담 패키지',
    JSON_OBJECT('price', 75000, 'duration', 50, 'unit', '회', 'sessions', 1),
    4, TRUE, @tenant_id, NOW(), NOW(), @created_by, @created_by, FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'CONSULTATION_PACKAGE' 
    AND code_value = 'SINGLE_75000'
);

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    created_by, updated_by, is_deleted, version
)
SELECT 
    'CONSULTATION_PACKAGE', 'SINGLE_80000', '단회기 80,000원', '단회기 80,000원', '1회기 상담 패키지',
    JSON_OBJECT('price', 80000, 'duration', 50, 'unit', '회', 'sessions', 1),
    5, TRUE, @tenant_id, NOW(), NOW(), @created_by, @created_by, FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'CONSULTATION_PACKAGE' 
    AND code_value = 'SINGLE_80000'
);

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    created_by, updated_by, is_deleted, version
)
SELECT 
    'CONSULTATION_PACKAGE', 'SINGLE_85000', '단회기 85,000원', '단회기 85,000원', '1회기 상담 패키지',
    JSON_OBJECT('price', 85000, 'duration', 50, 'unit', '회', 'sessions', 1),
    6, TRUE, @tenant_id, NOW(), NOW(), @created_by, @created_by, FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'CONSULTATION_PACKAGE' 
    AND code_value = 'SINGLE_85000'
);

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    created_by, updated_by, is_deleted, version
)
SELECT 
    'CONSULTATION_PACKAGE', 'SINGLE_90000', '단회기 90,000원', '단회기 90,000원', '1회기 상담 패키지',
    JSON_OBJECT('price', 90000, 'duration', 50, 'unit', '회', 'sessions', 1),
    7, TRUE, @tenant_id, NOW(), NOW(), @created_by, @created_by, FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'CONSULTATION_PACKAGE' 
    AND code_value = 'SINGLE_90000'
);

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    created_by, updated_by, is_deleted, version
)
SELECT 
    'CONSULTATION_PACKAGE', 'SINGLE_95000', '단회기 95,000원', '단회기 95,000원', '1회기 상담 패키지',
    JSON_OBJECT('price', 95000, 'duration', 50, 'unit', '회', 'sessions', 1),
    8, TRUE, @tenant_id, NOW(), NOW(), @created_by, @created_by, FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'CONSULTATION_PACKAGE' 
    AND code_value = 'SINGLE_95000'
);

INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
    created_by, updated_by, is_deleted, version
)
SELECT 
    'CONSULTATION_PACKAGE', 'SINGLE_100000', '단회기 100,000원', '단회기 100,000원', '1회기 상담 패키지',
    JSON_OBJECT('price', 100000, 'duration', 50, 'unit', '회', 'sessions', 1),
    9, TRUE, @tenant_id, NOW(), NOW(), @created_by, @created_by, FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE tenant_id = @tenant_id 
    AND code_group = 'CONSULTATION_PACKAGE' 
    AND code_value = 'SINGLE_100000'
);

-- 3. 추가된 패키지 확인
SELECT 
    code_group,
    code_value,
    korean_name,
    code_label,
    extra_data,
    sort_order,
    is_active,
    created_at
FROM common_codes
WHERE tenant_id = @tenant_id
AND code_group = 'CONSULTATION_PACKAGE'
AND code_value LIKE 'SINGLE_%'
ORDER BY sort_order;

