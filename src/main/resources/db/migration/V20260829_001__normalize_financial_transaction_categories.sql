-- =============================================================================
-- V20260829_001 — financial_transactions category SSOT 정규화 + common_codes 정합
--
-- 확정 쌍만 UPDATE (행 삭제 금지). subcategory 컬럼은 변경하지 않음.
--
-- 안전성:
--   • INCOME CONSULTATION → 상담료 (transaction_type = 'INCOME' 만 — 아래 UPDATE 조건)
--   • EXPENSE CONSULTATION → 상담료 (환불 등; subcategory 유지)
--   • INCOME 결제수단-as-category → 상담료 백필 (카드결제/현금결제/계좌이체/가상계좌/
--     기타결제/PAYMENT/결제). subcategory(신용카드 등)는 변경하지 않음.
--     (과거 "결제수단 UPDATE 금지" 는 본 백필로 대체 — write-path 도 상담료 SSOT)
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

-- INCOME: 결제수단-as-category → 상담료 (subcategory 유지)
UPDATE financial_transactions
SET category = '상담료',
    updated_at = NOW()
WHERE transaction_type = 'INCOME'
  AND category IN (
      '카드결제',
      '현금결제',
      '계좌이체',
      '가상계좌',
      '기타결제',
      'PAYMENT',
      '결제'
  );

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

-- B2. 이미 code_value='상담료' 인 동일 tenant 가 있으면 CONSULTATION 행 비활성
UPDATE common_codes cc
INNER JOIN (
    SELECT tenant_id AS tid
    FROM common_codes
    WHERE code_group = 'INCOME_CATEGORY'
      AND code_value = '상담료'
) existing
    ON (cc.tenant_id <=> existing.tid)
SET cc.is_active = FALSE,
    cc.updated_at = NOW()
WHERE cc.code_group = 'INCOME_CATEGORY'
  AND cc.code_value = 'CONSULTATION';

-- B3. 상담료 행이 없는 경우만 CONSULTATION → 상담료 (유니크 보호)
UPDATE common_codes cc
LEFT JOIN (
    SELECT tenant_id AS tid
    FROM common_codes
    WHERE code_group = 'INCOME_CATEGORY'
      AND code_value = '상담료'
) existing
    ON (cc.tenant_id <=> existing.tid)
SET cc.code_value = '상담료',
    cc.updated_at = NOW()
WHERE cc.code_group = 'INCOME_CATEGORY'
  AND cc.code_value = 'CONSULTATION'
  AND existing.tid IS NULL
  AND cc.tenant_id IS NOT NULL;

-- B3b. tenant_id NULL(글로벌) 행: 상담료 글로벌이 없을 때만 갱신
UPDATE common_codes cc
SET cc.code_value = '상담료',
    cc.updated_at = NOW()
WHERE cc.code_group = 'INCOME_CATEGORY'
  AND cc.code_value = 'CONSULTATION'
  AND cc.tenant_id IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM (
          SELECT id
          FROM common_codes
          WHERE code_group = 'INCOME_CATEGORY'
            AND code_value = '상담료'
            AND tenant_id IS NULL
      ) g
  );

-- B4. 상담료 라벨/한글명 보정 (이미 상담료인 label 유지)
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
