-- =============================================================================
-- V20260902_001 — PAYMENT_METHOD SSOT: core/tenant codes, extra_data flags,
--                  legacy alias migration, stored-value unify
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. Core (tenant_id IS NULL) PAYMENT_METHOD canonical codes + extra_data
-- ---------------------------------------------------------------------------
INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id,
    created_at, updated_at, created_by, updated_by, is_deleted, version
)
SELECT * FROM (
    SELECT 'PAYMENT_METHOD' AS code_group, 'CASH' AS code_value,
           '현금' AS korean_name, '현금' AS code_label, '현금 결제' AS code_description,
           '{"cardMerchantFeeEligible":false}' AS extra_data,
           1 AS sort_order, TRUE AS is_active, NULL AS tenant_id,
           NOW() AS created_at, NOW() AS updated_at,
           'SYSTEM_PAYMENT_METHOD_SSOT' AS created_by,
           'SYSTEM_PAYMENT_METHOD_SSOT' AS updated_by,
           FALSE AS is_deleted, 0 AS version
    UNION ALL SELECT 'PAYMENT_METHOD', 'BANK_TRANSFER', '계좌이체', '계좌이체', '계좌이체 결제',
           '{"cardMerchantFeeEligible":false,"legacyAliases":["TRANSFER"]}',
           2, TRUE, NULL, NOW(), NOW(), 'SYSTEM_PAYMENT_METHOD_SSOT', 'SYSTEM_PAYMENT_METHOD_SSOT', FALSE, 0
    UNION ALL SELECT 'PAYMENT_METHOD', 'CREDIT_CARD', '신용카드', '신용카드', '신용카드 결제',
           '{"cardMerchantFeeEligible":true,"legacyAliases":["CARD","카드"]}',
           3, TRUE, NULL, NOW(), NOW(), 'SYSTEM_PAYMENT_METHOD_SSOT', 'SYSTEM_PAYMENT_METHOD_SSOT', FALSE, 0
    UNION ALL SELECT 'PAYMENT_METHOD', 'DEBIT_CARD', '체크카드', '체크카드', '체크카드 결제',
           '{"cardMerchantFeeEligible":true}',
           4, TRUE, NULL, NOW(), NOW(), 'SYSTEM_PAYMENT_METHOD_SSOT', 'SYSTEM_PAYMENT_METHOD_SSOT', FALSE, 0
    UNION ALL SELECT 'PAYMENT_METHOD', 'CARD_TERMINAL', '신용카드(단말)', '신용카드(단말)', '카드 단말기 결제',
           '{"cardMerchantFeeEligible":true}',
           5, TRUE, NULL, NOW(), NOW(), 'SYSTEM_PAYMENT_METHOD_SSOT', 'SYSTEM_PAYMENT_METHOD_SSOT', FALSE, 0
    UNION ALL SELECT 'PAYMENT_METHOD', 'OTHER', '기타', '기타', '기타 결제',
           '{"cardMerchantFeeEligible":false}',
           6, TRUE, NULL, NOW(), NOW(), 'SYSTEM_PAYMENT_METHOD_SSOT', 'SYSTEM_PAYMENT_METHOD_SSOT', FALSE, 0
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes cc
    WHERE cc.tenant_id IS NULL
      AND cc.code_group = seed.code_group
      AND cc.code_value = seed.code_value
      AND cc.is_deleted = FALSE
);

-- 기존 core CARD / TRANSFER 행: 비활성화 (canonical은 CREDIT_CARD / BANK_TRANSFER)
UPDATE common_codes
SET is_active = FALSE,
    updated_at = NOW(),
    updated_by = 'SYSTEM_PAYMENT_METHOD_SSOT'
WHERE tenant_id IS NULL
  AND code_group = 'PAYMENT_METHOD'
  AND code_value IN ('CARD', 'TRANSFER')
  AND is_deleted = FALSE;

-- core canonical 행 extra_data 보강 (이미 존재하는 경우)
UPDATE common_codes
SET extra_data = '{"cardMerchantFeeEligible":false}',
    updated_at = NOW(),
    updated_by = 'SYSTEM_PAYMENT_METHOD_SSOT'
WHERE tenant_id IS NULL AND code_group = 'PAYMENT_METHOD' AND code_value = 'CASH' AND is_deleted = FALSE;

UPDATE common_codes
SET extra_data = '{"cardMerchantFeeEligible":false,"legacyAliases":["TRANSFER"]}',
    updated_at = NOW(),
    updated_by = 'SYSTEM_PAYMENT_METHOD_SSOT'
WHERE tenant_id IS NULL AND code_group = 'PAYMENT_METHOD' AND code_value = 'BANK_TRANSFER' AND is_deleted = FALSE;

UPDATE common_codes
SET extra_data = '{"cardMerchantFeeEligible":true,"legacyAliases":["CARD","카드"]}',
    updated_at = NOW(),
    updated_by = 'SYSTEM_PAYMENT_METHOD_SSOT'
WHERE tenant_id IS NULL AND code_group = 'PAYMENT_METHOD' AND code_value = 'CREDIT_CARD' AND is_deleted = FALSE;

UPDATE common_codes
SET extra_data = '{"cardMerchantFeeEligible":true}',
    updated_at = NOW(),
    updated_by = 'SYSTEM_PAYMENT_METHOD_SSOT'
WHERE tenant_id IS NULL AND code_group = 'PAYMENT_METHOD'
  AND code_value IN ('DEBIT_CARD', 'CARD_TERMINAL') AND is_deleted = FALSE;

UPDATE common_codes
SET extra_data = '{"cardMerchantFeeEligible":false}',
    updated_at = NOW(),
    updated_by = 'SYSTEM_PAYMENT_METHOD_SSOT'
WHERE tenant_id IS NULL AND code_group = 'PAYMENT_METHOD' AND code_value = 'OTHER' AND is_deleted = FALSE;

-- ---------------------------------------------------------------------------
-- B. Tenant PAYMENT_METHOD: seed missing canonical rows per tenant
-- ---------------------------------------------------------------------------
INSERT INTO common_codes (
    code_group, code_value, korean_name, code_label, code_description,
    extra_data, sort_order, is_active, tenant_id,
    created_at, updated_at, created_by, updated_by, is_deleted, version
)
SELECT
    core.code_group,
    core.code_value,
    core.korean_name,
    core.code_label,
    core.code_description,
    core.extra_data,
    core.sort_order,
    core.is_active,
    t.tenant_id,
    NOW(),
    NOW(),
    'SYSTEM_PAYMENT_METHOD_SSOT',
    'SYSTEM_PAYMENT_METHOD_SSOT',
    FALSE,
    0
FROM tenants t
CROSS JOIN common_codes core
WHERE core.tenant_id IS NULL
  AND core.code_group = 'PAYMENT_METHOD'
  AND core.code_value IN ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CARD_TERMINAL', 'OTHER')
  AND core.is_deleted = FALSE
  AND core.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM common_codes existing
      WHERE existing.tenant_id = t.tenant_id
        AND existing.code_group = 'PAYMENT_METHOD'
        AND existing.code_value = core.code_value
        AND existing.is_deleted = FALSE
  );

-- Tenant legacy CARD / TRANSFER: deactivate after canonical rows exist
UPDATE common_codes tc
INNER JOIN tenants t ON t.tenant_id = tc.tenant_id
SET tc.is_active = FALSE,
    tc.updated_at = NOW(),
    tc.updated_by = 'SYSTEM_PAYMENT_METHOD_SSOT'
WHERE tc.code_group = 'PAYMENT_METHOD'
  AND tc.code_value IN ('CARD', 'TRANSFER')
  AND tc.is_deleted = FALSE;

-- Tenant canonical rows extra_data sync from core
UPDATE common_codes tc
INNER JOIN common_codes core
    ON core.tenant_id IS NULL
   AND core.code_group = tc.code_group
   AND core.code_value = tc.code_value
   AND core.is_deleted = FALSE
SET tc.extra_data = core.extra_data,
    tc.updated_at = NOW(),
    tc.updated_by = 'SYSTEM_PAYMENT_METHOD_SSOT'
WHERE tc.code_group = 'PAYMENT_METHOD'
  AND tc.tenant_id IS NOT NULL
  AND tc.code_value IN ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CARD_TERMINAL', 'OTHER')
  AND tc.is_deleted = FALSE;

-- ---------------------------------------------------------------------------
-- C. Stored-value migration (mappings, extensions, recurring expenses)
-- ---------------------------------------------------------------------------
UPDATE consultant_client_mappings
SET payment_method = 'CREDIT_CARD',
    updated_at = NOW()
WHERE payment_method IN ('CARD', '카드', 'card', 'Card')
  AND is_deleted = FALSE;

UPDATE consultant_client_mappings
SET payment_method = 'BANK_TRANSFER',
    updated_at = NOW()
WHERE payment_method IN ('TRANSFER', 'transfer')
  AND is_deleted = FALSE;

UPDATE session_extension_requests
SET payment_method = 'CREDIT_CARD',
    updated_at = NOW()
WHERE payment_method IN ('CARD', '카드', 'card', 'Card')
  AND is_deleted = FALSE;

UPDATE session_extension_requests
SET payment_method = 'BANK_TRANSFER',
    updated_at = NOW()
WHERE payment_method IN ('TRANSFER', 'transfer')
  AND is_deleted = FALSE;

UPDATE recurring_expenses
SET payment_method = 'CREDIT_CARD',
    updated_at = NOW()
WHERE payment_method IN ('CARD', '카드', 'card', 'Card')
  AND is_deleted = FALSE;

UPDATE recurring_expenses
SET payment_method = 'BANK_TRANSFER',
    updated_at = NOW()
WHERE payment_method IN ('TRANSFER', 'transfer')
  AND is_deleted = FALSE;
