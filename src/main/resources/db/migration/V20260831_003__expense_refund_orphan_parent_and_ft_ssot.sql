-- =============================================================================
-- V20260831_003 — EXPENSE SSOT: 환불 서브카테고리 부모 OTHER 재배치
--                  + orphan EXPENSE_SUBCATEGORY parent 수리
--                  + 환불 FT category → OTHER (금액 미변경)
--                  + 잔여 한글 EXPENSE category → EN SSOT (금액 미변경)
--
-- • 장부 amount / polarity 변경 금지
-- • 운영자 커스텀 codeValue(EAT, internst 등) 삭제 금지 — parent 만 수리
-- • 원천세·급여 계산식 미변경
-- • MySQL: UPDATE 대상 테이블 self-ref 회피용 파생 테이블 사용
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A. CONSULTATION_REFUND 등 환불 SSOT: parent 상담료(INCOME) orphan → OTHER
-- ---------------------------------------------------------------------------
UPDATE common_codes cc
LEFT JOIN (
    SELECT tenant_id AS p_tenant_id, code_value AS p_code_value
    FROM common_codes
    WHERE code_group = 'EXPENSE_CATEGORY'
      AND is_active = TRUE
      AND (is_deleted IS NULL OR is_deleted = FALSE)
) parent
  ON parent.p_code_value = cc.parent_code_value
 AND (
     (cc.tenant_id IS NULL AND parent.p_tenant_id IS NULL)
     OR (cc.tenant_id IS NOT NULL AND (
         parent.p_tenant_id = cc.tenant_id
         OR parent.p_tenant_id IS NULL
     ))
 )
SET cc.parent_code_group = 'EXPENSE_CATEGORY',
    cc.parent_code_value = 'OTHER',
    cc.updated_at = NOW()
WHERE cc.code_group = 'EXPENSE_SUBCATEGORY'
  AND cc.code_value IN (
      'CONSULTATION_REFUND',
      'CONSULTATION_PARTIAL_REFUND',
      'SESSION_REFUND',
      'PARTIAL_SESSION_REFUND'
  )
  AND (
      cc.parent_code_value = '상담료'
      OR cc.parent_code_value IS NULL
      OR cc.parent_code_value = ''
      OR parent.p_code_value IS NULL
  );

-- ---------------------------------------------------------------------------
-- B. 기타 EXPENSE_SUBCATEGORY orphan parent → OTHER
--    (부모 code_value 가 해당 tenant/core EXPENSE_CATEGORY 에 없음)
--    커스텀 codeValue 보존 — DELETE 없음
-- ---------------------------------------------------------------------------
-- orphan EXPENSE_SUBCATEGORY parent → OTHER (custom codeValues preserved)
UPDATE common_codes cc
LEFT JOIN (
    SELECT tenant_id AS p_tenant_id, code_value AS p_code_value
    FROM common_codes
    WHERE code_group = 'EXPENSE_CATEGORY'
      AND is_active = TRUE
      AND (is_deleted IS NULL OR is_deleted = FALSE)
) parent
  ON parent.p_code_value = cc.parent_code_value
 AND (
     (cc.tenant_id IS NULL AND parent.p_tenant_id IS NULL)
     OR (cc.tenant_id IS NOT NULL AND (
         parent.p_tenant_id = cc.tenant_id
         OR parent.p_tenant_id IS NULL
     ))
 )
SET cc.parent_code_group = 'EXPENSE_CATEGORY',
    cc.parent_code_value = 'OTHER',
    cc.updated_at = NOW()
WHERE cc.code_group = 'EXPENSE_SUBCATEGORY'
  AND (cc.is_deleted IS NULL OR cc.is_deleted = FALSE)
  AND (
      cc.parent_code_value IS NULL
      OR cc.parent_code_value = ''
      OR parent.p_code_value IS NULL
  );

-- ---------------------------------------------------------------------------
-- C. 환불 FT write-value: category 상담료/CONSULTATION → OTHER (금액 미변경)
-- ---------------------------------------------------------------------------
UPDATE financial_transactions
SET category = 'OTHER',
    updated_at = NOW()
WHERE transaction_type = 'EXPENSE'
  AND subcategory IN (
      'CONSULTATION_REFUND',
      'CONSULTATION_PARTIAL_REFUND',
      'SESSION_REFUND',
      'PARTIAL_SESSION_REFUND'
  )
  AND category IN ('상담료', 'CONSULTATION');

-- ---------------------------------------------------------------------------
-- D. (optional, scoped) 잔여 한글 EXPENSE category → remapCategoryToSsot 쌍
--    V20260829_001 이후 잔존분만. amount 미변경.
-- ---------------------------------------------------------------------------
UPDATE financial_transactions
SET category = 'SALARY',
    updated_at = NOW()
WHERE transaction_type = 'EXPENSE'
  AND category = '급여';

UPDATE financial_transactions
SET category = 'RENT',
    updated_at = NOW()
WHERE transaction_type = 'EXPENSE'
  AND category = '임대료';

UPDATE financial_transactions
SET category = 'UTILITY',
    updated_at = NOW()
WHERE transaction_type = 'EXPENSE'
  AND category IN ('MANAGEMENT_FEE', '관리비');

UPDATE financial_transactions
SET category = 'TAX',
    updated_at = NOW()
WHERE transaction_type = 'EXPENSE'
  AND category = '세금';

UPDATE financial_transactions
SET category = 'MEAL',
    updated_at = NOW()
WHERE transaction_type = 'EXPENSE'
  AND category = '식대';

UPDATE financial_transactions
SET category = 'OTHER',
    updated_at = NOW()
WHERE transaction_type = 'EXPENSE'
  AND category IN ('기타', '기타잡비');
