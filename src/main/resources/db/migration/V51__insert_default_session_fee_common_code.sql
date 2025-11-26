-- 기본 세션비 CommonCode 추가 (하드코딩 제거)
-- 통계 계산 시 사용되는 기본 세션비를 CommonCode로 관리
-- code_value에 코드 식별자, extra_data에 실제 값을 JSON으로 저장

-- 기본 세션비 CommonCode 추가 (하드코딩 제거)
-- 통계 계산 시 사용되는 기본 세션비를 CommonCode로 관리
-- code_value에 코드 식별자, extra_data에 실제 값을 JSON으로 저장
-- tenant_id = NULL: 코어 솔루션 코드 (모든 테넌트에서 공통 사용)

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    code_label,
    code_description,
    korean_name,
    sort_order,
    is_active,
    extra_data,
    created_at,
    updated_at
)
VALUES (
    NULL, -- 코어 솔루션 코드 (모든 테넌트 공통)
    'SYSTEM_CONFIG',
    'DEFAULT_SESSION_FEE',
    '기본 세션비',
    '통계 계산 시 사용되는 기본 세션비 (원). 매핑 정보가 없을 때 사용됩니다.',
    '기본 세션비',
    1,
    true,
    '{"value": 50000, "unit": "원", "description": "기본 세션비"}',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    code_description = VALUES(code_description),
    korean_name = VALUES(korean_name),
    extra_data = VALUES(extra_data),
    updated_at = NOW();

