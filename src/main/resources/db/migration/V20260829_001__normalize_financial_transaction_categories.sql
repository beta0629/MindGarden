-- =============================================================================
-- V20260829_001 — financial_transactions category SSOT 정규화 + common_codes 정합
--
-- 확정 쌍만 UPDATE (행 삭제 금지). subcategory 컬럼은 변경하지 않음.
--
-- 안전성:
--   • INCOME CONSULTATION → 상담료 (transaction_type = 'INCOME' 만)
--   • EXPENSE CONSULTATION → 상담료 (환불 등; subcategory 유지)
--   • 결제수단 category(카드결제/현금결제/PAYMENT 등) → 상담료 UPDATE 금지 (본 스크립트에 없음)
--   • PACKAGE ↔ 상담료 합치기 없음
--   • MEAL 공통코드 시드(V20260828_003) 로직 미변경
--   • common_codes: uk_tenant_code_group_value 충돌 시 CONSULTATION 은 비활성(통합), 없으면 code_value 갱신
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. financial_transactions category 정규화 (is_deleted 무관, UPDATE만)
-- ---------------------------------------------------------------------------

-- INCOME: CONSULTATION → 상담료
UPDATE financial_transactions
SET category = '상담료',
    updated_at = NOW()
WHERE category = 'CONSULTATION'
  AND transaction_type = 'INCOME';

-- EXPENSE 환불 등: category CONSULTATION → 상담료 (subcategory 유지)
UPDATE financial_transactions
SET category = '상담료',
    updated_at = NOW()
WHERE category = 'CONSULTATION'
  AND transaction_type = 'EXPENSE';

-- EXPENSE: 한글/레거시 → EN SSOT
UPDATE financial_transactions
SET category = 'SALARY',
    updated_at = NOW()
WHERE category = '급여'
  AND transaction_type = 'EXPENSE';

UPDATE financial_transactions
SET category = 'RENT',
    updated_at = NOW()
WHERE category = '임대료'
  AND transaction_type = 'EXPENSE';

UPDATE financial_transactions
SET category = 'UTILITY',
    updated_at = NOW()
WHERE category IN ('MANAGEMENT_FEE', '관리비')
  AND transaction_type = 'EXPENSE';

UPDATE financial_transactions
SET category = 'TAX',
    updated_at = NOW()
WHERE category = '세금'
  AND transaction_type = 'EXPENSE';

UPDATE financial_transactions
SET category = 'MEAL',
    updated_at = NOW()
WHERE category = '식대'
  AND transaction_type = 'EXPENSE';

UPDATE financial_transactions
SET category = 'OTHER',
    updated_at = NOW()
WHERE category IN ('기타', '기타잡비')
  AND transaction_type = 'EXPENSE';

-- INCOME: 기타/기타수입 → OTHER
UPDATE financial_transactions
SET category = 'OTHER',
    updated_at = NOW()
WHERE category IN ('기타', '기타수입')
  AND transaction_type = 'INCOME';

-- ---------------------------------------------------------------------------
-- B. common_codes INCOME_CATEGORY / parent 참조
-- ---------------------------------------------------------------------------

-- B1. 서브카테고리 parent_code_value CONSULTATION → 상담료
UPDATE common_codes
SET parent_code_value = '상담료',
    updated_at = NOW()
WHERE code_group IN ('INCOME_SUBCATEGORY', 'EXPENSE_SUBCATEGORY')
  AND parent_code_value = 'CONSULTATION';

-- B2. 이미 code_value='상담료' 인 INCOME_CATEGORY 가 있으면 CONSULTATION 행은 비활성(중복 통합)
UPDATE common_codes cc
INNER JOIN (
    SELECT tenant_id
    FROM common_codes
    WHERE code_group = 'INCOME_CATEGORY'
      AND code_value = '상담료'
) existing
    ON (cc.tenant_id <=> existing.tenant_id)
SET cc.is_active = FALSE,
    cc.updated_at = NOW()
WHERE cc.code_group = 'INCOME_CATEGORY'
  AND cc.code_value = 'CONSULTATION';

-- B3. 상담료 행이 없는 테넌트/글로벌: CONSULTATION → 상담료 (유니크 충돌 없음)
UPDATE common_codes cc
LEFT JOIN (
    SELECT tenant_id
    FROM common_codes
    WHERE code_group = 'INCOME_CATEGORY'
      AND code_value = '상담료'
) existing
    ON (cc.tenant_id <=> existing.tenant_id)
SET cc.code_value = '상담료',
    cc.updated_at = NOW()
WHERE cc.code_group = 'INCOME_CATEGORY'
  AND cc.code_value = 'CONSULTATION'
  AND existing.tenant_id IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM (
          SELECT tenant_id
          FROM common_codes
          WHERE code_group = 'INCOME_CATEGORY'
            AND code_value = '상담료'
      ) chk
      WHERE chk.tenant_id <=> cc.tenant_id
  );

-- B3 보완: LEFT JOIN 만으로 부족할 수 있어, 잔여 CONSULTATION 을 상담료로 재시도
-- (동일 tenant 에 상담료가 없을 때만 — uk 보호)
UPDATE common_codes cc
SET cc.code_value = '상담료',
    cc.updated_at = NOW()
WHERE cc.code_group = 'INCOME_CATEGORY'
  AND cc.code_value = 'CONSULTATION'
  AND NOT EXISTS (
      SELECT 1
      FROM common_codes other
      WHERE other.code_group = 'INCOME_CATEGORY'
        AND other.code_value = '상담료'
        AND (other.tenant_id <=> cc.tenant_id)
  );

-- label 이 비어 있거나 CONSULTATION 인 경우 표시명 유지/보정
UPDATE common_codes
SET code_label = CASE
        WHEN code_label IS NULL OR TRIM(code_label) = '' OR code_label = 'CONSULTATION'
            THEN '상담료'
        ELSE code_label
    END,
    korean_name = CASE
        WHEN korean_name IS NULL OR TRIM(korean_name) = '' OR korean_name = 'CONSULTATION'
            THEN '상담료'
        ELSE korean_name
    END,
    updated_at = NOW()
WHERE code_group = 'INCOME_CATEGORY'
  AND code_value = '상담료';
