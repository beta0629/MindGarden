-- =============================================================================
-- V20260829_005 — SALARY_TAX_RATE 공통코드 SSOT (원천 국세/지방·VAT·4대보험·소득세 구간)
-- ---------------------------------------------------------------------------
-- tip 기준: V20260829_004. 세율 리터럴 제거용 SSOT.
-- 정책:
--   • 프리랜서 원천 = WITHHOLDING_NATIONAL(0.03) + WITHHOLDING_LOCAL(0.003)
--     (합산 0.033 / TAX_TYPE.WITHHOLDING_TAX 단일 요율 사용 금지)
--   • LOCAL_INCOME_OF_INCOME_TAX(0.10) = 정규직 소득세의 10% (프리랜서 지방 0.3%와 구분)
--   • 코어(tenant_id IS NULL) 멱등 INSERT. SP는 (tenant OR NULL) ORDER BY tenant NULL ASC.
-- =============================================================================

INSERT INTO code_group_metadata (
    group_name, korean_name, code_type, category, description, icon, is_active, display_order
)
VALUES (
    'SALARY_TAX_RATE',
    '급여 세율·보험요율',
    'SYSTEM',
    'FINANCE',
    '급여 Confirm/Recalc/Adjust SP 및 Java 원천세 계산 SSOT. extra_data.rate / amount / monthlyMax',
    'percent',
    1,
    160
)
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    code_type = VALUES(code_type),
    description = VALUES(description),
    is_active = TRUE;

-- 합산 0.033 TAX_TYPE 시드 비활성 (이원화 SSOT와 충돌 방지). 표시용 라벨은 호환 유지 가능.
UPDATE common_codes
SET
    is_active = FALSE,
    updated_at = NOW(),
    code_description = CONCAT(
        IFNULL(code_description, ''),
        ' [DEPRECATED V20260829_005: 합산 0.033 폐기 → SALARY_TAX_RATE WITHHOLDING_NATIONAL+LOCAL]'
    )
WHERE code_group = 'TAX_TYPE'
  AND code_value = 'WITHHOLDING_TAX'
  AND (is_deleted = FALSE OR is_deleted IS NULL);

UPDATE common_codes
SET
    is_active = FALSE,
    updated_at = NOW(),
    code_description = CONCAT(
        IFNULL(code_description, ''),
        ' [DEPRECATED V20260829_005: 합산 0.033 폐기 → SALARY_TAX_RATE]'
    )
WHERE code_group = 'TAX_CALCULATION_OPTION'
  AND code_value = 'WITHHOLDING_3_3'
  AND (is_deleted = FALSE OR is_deleted IS NULL);

-- ---------------------------------------------------------------------------
-- SALARY_TAX_RATE 코어 시드 (멱등)
-- ---------------------------------------------------------------------------
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'WITHHOLDING_NATIONAL', '원천징수 국세', '원천징수 국세',
       '프리랜서 사업소득 원천징수 국세 3%', '{"rate": 0.03}', 1, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'WITHHOLDING_NATIONAL'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'WITHHOLDING_LOCAL', '원천징수 지방세', '원천징수 지방세',
       '프리랜서 사업소득 원천징수 지방세 0.3%', '{"rate": 0.003}', 2, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'WITHHOLDING_LOCAL'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'VAT', '부가가치세', '부가가치세',
       '사업자 등록 프리랜서 부가세 10%', '{"rate": 0.10}', 3, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'VAT'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'LOCAL_INCOME_OF_INCOME_TAX', '지방소득세(소득세의 10%)', '지방소득세(소득세의 10%)',
       '정규직 지방소득세 = 소득세 × 10% (프리랜서 원천 지방 0.3%와 구분)', '{"rate": 0.10}', 4, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'LOCAL_INCOME_OF_INCOME_TAX'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'PENSION', '국민연금', '국민연금',
       '정규직 4대보험 국민연금 근로자 부담', '{"rate": 0.045}', 10, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'PENSION'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'HEALTH', '건강보험', '건강보험',
       '정규직 4대보험 건강보험 근로자 부담', '{"rate": 0.03545}', 11, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'HEALTH'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'LONGTERM', '장기요양보험', '장기요양보험',
       '정규직 4대보험 장기요양 근로자 부담', '{"rate": 0.00545}', 12, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'LONGTERM'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'EMPLOYMENT', '고용보험', '고용보험',
       '정규직 4대보험 고용보험 근로자 부담', '{"rate": 0.009}', 13, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'EMPLOYMENT'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'FOUR_INSURANCE_ANNUAL_MIN', '4대보험 연봉 하한', '4대보험 연봉 하한',
       '월급여×12 이 금액 이상일 때 4대보험 적용', '{"amount": 12000000}', 14, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'FOUR_INSURANCE_ANNUAL_MIN'
);

-- 정규직 월 소득세 구간 (Confirm/Recalc/Adjust CASE와 동일 숫자)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'INCOME_TAX_BRACKET_1', '소득세 구간1', '소득세 구간1',
       '월 120만원 이하 6%', '{"rate": 0.06, "monthlyMax": 1200000}', 20, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'INCOME_TAX_BRACKET_1'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'INCOME_TAX_BRACKET_2', '소득세 구간2', '소득세 구간2',
       '월 120만원 초과~460만원 15%', '{"rate": 0.15, "monthlyMax": 4600000}', 21, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'INCOME_TAX_BRACKET_2'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'INCOME_TAX_BRACKET_3', '소득세 구간3', '소득세 구간3',
       '월 460만원 초과~880만원 24%', '{"rate": 0.24, "monthlyMax": 8800000}', 22, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'INCOME_TAX_BRACKET_3'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'INCOME_TAX_BRACKET_4', '소득세 구간4', '소득세 구간4',
       '월 880만원 초과~1500만원 35%', '{"rate": 0.35, "monthlyMax": 15000000}', 23, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'INCOME_TAX_BRACKET_4'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'INCOME_TAX_BRACKET_5', '소득세 구간5', '소득세 구간5',
       '월 1500만원 초과~3000만원 38%', '{"rate": 0.38, "monthlyMax": 30000000}', 24, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'INCOME_TAX_BRACKET_5'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'INCOME_TAX_BRACKET_6', '소득세 구간6', '소득세 구간6',
       '월 3000만원 초과~5000만원 40%', '{"rate": 0.40, "monthlyMax": 50000000}', 25, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'INCOME_TAX_BRACKET_6'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'INCOME_TAX_BRACKET_7', '소득세 구간7', '소득세 구간7',
       '월 5000만원 초과 42%', '{"rate": 0.42}', 26, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'INCOME_TAX_BRACKET_7'
);

-- 기존 행이 있으면 rate/amount 동기화 (숫자 정책 고정)
UPDATE common_codes
SET extra_data = CASE code_value
        WHEN 'WITHHOLDING_NATIONAL' THEN '{"rate": 0.03}'
        WHEN 'WITHHOLDING_LOCAL' THEN '{"rate": 0.003}'
        WHEN 'VAT' THEN '{"rate": 0.10}'
        WHEN 'LOCAL_INCOME_OF_INCOME_TAX' THEN '{"rate": 0.10}'
        WHEN 'PENSION' THEN '{"rate": 0.045}'
        WHEN 'HEALTH' THEN '{"rate": 0.03545}'
        WHEN 'LONGTERM' THEN '{"rate": 0.00545}'
        WHEN 'EMPLOYMENT' THEN '{"rate": 0.009}'
        WHEN 'FOUR_INSURANCE_ANNUAL_MIN' THEN '{"amount": 12000000}'
        WHEN 'INCOME_TAX_BRACKET_1' THEN '{"rate": 0.06, "monthlyMax": 1200000}'
        WHEN 'INCOME_TAX_BRACKET_2' THEN '{"rate": 0.15, "monthlyMax": 4600000}'
        WHEN 'INCOME_TAX_BRACKET_3' THEN '{"rate": 0.24, "monthlyMax": 8800000}'
        WHEN 'INCOME_TAX_BRACKET_4' THEN '{"rate": 0.35, "monthlyMax": 15000000}'
        WHEN 'INCOME_TAX_BRACKET_5' THEN '{"rate": 0.38, "monthlyMax": 30000000}'
        WHEN 'INCOME_TAX_BRACKET_6' THEN '{"rate": 0.40, "monthlyMax": 50000000}'
        WHEN 'INCOME_TAX_BRACKET_7' THEN '{"rate": 0.42}'
        ELSE extra_data
    END,
    is_active = TRUE,
    is_deleted = FALSE,
    deleted_at = NULL,
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'SALARY_TAX_RATE'
  AND code_value IN (
      'WITHHOLDING_NATIONAL', 'WITHHOLDING_LOCAL', 'VAT', 'LOCAL_INCOME_OF_INCOME_TAX',
      'PENSION', 'HEALTH', 'LONGTERM', 'EMPLOYMENT', 'FOUR_INSURANCE_ANNUAL_MIN',
      'INCOME_TAX_BRACKET_1', 'INCOME_TAX_BRACKET_2', 'INCOME_TAX_BRACKET_3',
      'INCOME_TAX_BRACKET_4', 'INCOME_TAX_BRACKET_5', 'INCOME_TAX_BRACKET_6', 'INCOME_TAX_BRACKET_7'
  );
