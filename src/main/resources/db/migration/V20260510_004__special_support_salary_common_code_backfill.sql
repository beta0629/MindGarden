-- 기존 테넌트에 특별지원금 공통코드(DEFAULT)가 없으면 1건 삽입 (온보딩 시드와 동일 JSON)
-- 신규 테넌트는 TenantOnboardingSalaryAndFinancialSeedDefinitions 경로로 시드됨

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
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
    u.tenant_id,
    'SPECIAL_SUPPORT_SALARY',
    'DEFAULT',
    '특별지원금 설정',
    '특별지원금 설정',
    '매핑별 월 1회 한도 특별지원금. extra_data: amount, minSessions, requirePaidConfirmation',
    '{"amount":10000,"minSessions":10,"requirePaidConfirmation":true}',
    1,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
FROM users u
WHERE u.tenant_id IS NOT NULL
  AND TRIM(u.tenant_id) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM common_codes cc
    WHERE cc.tenant_id = u.tenant_id
      AND cc.code_group = 'SPECIAL_SUPPORT_SALARY'
      AND cc.code_value = 'DEFAULT'
      AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
  );
