-- =====================================================
-- SALARY_BASE_DATE 공통코드 등록
-- =====================================================
-- 목적: SalaryScheduleServiceImpl에서 MONTHLY_BASE_DAY, CUTOFF_DAY, PAYMENT_DAY
--       조회 시 CommonCode not found 오류(3,060건) 해결
-- 작성일: 2026-03-23
-- 참조: docs/troubleshooting/DEV_SERVER_ERROR_LOG_REPORT_20260323.md
-- =====================================================

-- code_group_metadata에 SALARY_BASE_DATE 그룹 등록 (SYSTEM 타입)
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES ('SALARY_BASE_DATE', '급여 기산일 설정', 'SYSTEM', 'FINANCE', '급여 기산일/마감일/지급일 설정 코드', 'calendar', 1, 150)
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    code_type = VALUES(code_type),
    description = VALUES(description);

-- SALARY_BASE_DATE 코어 코드 등록 (tenant_id = NULL)
-- MONTHLY_BASE_DAY: 월별 기산일 (기본: 매월 말일)
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
SELECT
    NULL,
    'SALARY_BASE_DATE',
    'MONTHLY_BASE_DAY',
    '매월 말일',
    '매월 말일',
    '급여 기산일 (매월 말일 기준)',
    '{"default_day":"LAST_DAY"}',
    1,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes
    WHERE code_group = 'SALARY_BASE_DATE' AND code_value = 'MONTHLY_BASE_DAY' AND tenant_id IS NULL
);

-- CUTOFF_DAY: 마감일 (기본: 매월 말일)
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
SELECT
    NULL,
    'SALARY_BASE_DATE',
    'CUTOFF_DAY',
    '매월 말일',
    '매월 말일',
    '급여 마감일 (매월 말일 기준)',
    '{"default_day":"LAST_DAY"}',
    2,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes
    WHERE code_group = 'SALARY_BASE_DATE' AND code_value = 'CUTOFF_DAY' AND tenant_id IS NULL
);

-- PAYMENT_DAY: 지급일 (기본: 익월 5일)
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
SELECT
    NULL,
    'SALARY_BASE_DATE',
    'PAYMENT_DAY',
    '익월 5일',
    '익월 5일',
    '급여 지급일 (익월 5일 기준)',
    '{"default_day":5}',
    3,
    TRUE,
    NOW(),
    NOW(),
    FALSE,
    0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes
    WHERE code_group = 'SALARY_BASE_DATE' AND code_value = 'PAYMENT_DAY' AND tenant_id IS NULL
);
