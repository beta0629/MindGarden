-- Clinic-OS Operator Ledger: 지출 고정 카테고리 '식대'(MEAL) 테넌트 백필
-- 신규 테넌트는 TenantOnboardingSalaryAndFinancialSeedDefinitions / FinancialCommonCodeInitializer 경로로 시드됨

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    created_at,
    updated_at,
    is_deleted,
    version
)
SELECT DISTINCT
    cc.tenant_id,
    'EXPENSE_CATEGORY',
    'MEAL',
    '식대',
    '식대',
    '식대·간식 등',
    6,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
FROM common_codes cc
WHERE cc.code_group = 'EXPENSE_CATEGORY'
  AND cc.tenant_id IS NOT NULL
  AND TRIM(cc.tenant_id) <> ''
  AND (cc.is_deleted = FALSE OR cc.is_deleted IS NULL)
  AND NOT EXISTS (
    SELECT 1
    FROM common_codes existing
    WHERE existing.tenant_id = cc.tenant_id
      AND existing.code_group = 'EXPENSE_CATEGORY'
      AND existing.code_value = 'MEAL'
      AND (existing.is_deleted = FALSE OR existing.is_deleted IS NULL)
  );
