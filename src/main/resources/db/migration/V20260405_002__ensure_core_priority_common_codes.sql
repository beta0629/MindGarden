-- ====================================================================
-- 코어 공통코드 보강: PRIORITY (상담일지 우선순위)
-- ====================================================================
-- 배경: GET /api/v1/common-codes?codeGroup=PRIORITY 가 빈 배열이면
--       ConsultationLogModal 등에서 폴백만 동작함. RISK_LEVEL(V35/V20260331_003)은
--       온보딩용 그룹명이며 PRIORITY 그룹은 별도.
-- 목적: tenant_id IS NULL 코어 행 5건을 idempotent하게 보장.
-- 표준: uk_tenant_code_group_value (tenant_id, code_group, code_value)
-- 프론트 정합: ConsultationLogModal.js DEFAULT_RISK_LEVEL_OPTIONS
-- ====================================================================

-- 소프트삭제·비활성으로 남은 동일 키 행 복구 (유니크 충돌 방지)
UPDATE common_codes
SET
    is_deleted = FALSE,
    deleted_at = NULL,
    is_active = TRUE,
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'PRIORITY'
  AND code_value IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');

-- 그룹 메타 (V20260323_002 SALARY_BASE_DATE 와 동일 컬럼 세트)
-- code_type: RISK_LEVEL/ONBOARDING_STATUS 와 동일하게 CORE
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES (
    'PRIORITY',
    '위험도·우선순위',
    'CORE',
    'CONSULT',
    '상담 일지 등에서 사건 우선순위(낮음~위험)를 나타내는 코어 코드',
    '⚡',
    1,
    99
)
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    code_type = VALUES(code_type),
    category = VALUES(category),
    description = VALUES(description),
    icon = VALUES(icon),
    is_active = VALUES(is_active),
    display_order = VALUES(display_order);

-- PRIORITY 코드 (color_code 는 컬럼 길이 제한으로 hex만 저장, RISK_LEVEL 과 동일 계열)
INSERT INTO common_codes (
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    tenant_id,
    color_code,
    icon,
    created_at,
    updated_at,
    is_deleted,
    version
) VALUES
('PRIORITY', 'LOW', 'Low Priority', '낮음', '낮은 우선순위', 1, TRUE, NULL, '#2e7d32', '🟢', NOW(), NOW(), FALSE, 0),
('PRIORITY', 'MEDIUM', 'Medium Priority', '보통', '보통 우선순위', 2, TRUE, NULL, '#e65100', '🟡', NOW(), NOW(), FALSE, 0),
('PRIORITY', 'HIGH', 'High Priority', '높음', '높은 우선순위', 3, TRUE, NULL, '#f57c00', '🟠', NOW(), NOW(), FALSE, 0),
('PRIORITY', 'URGENT', 'Urgent Priority', '긴급', '긴급 우선순위', 4, TRUE, NULL, '#d32f2f', '🔴', NOW(), NOW(), FALSE, 0),
('PRIORITY', 'CRITICAL', 'Critical Priority', '위험', '위험 우선순위', 5, TRUE, NULL, '#6a1b9a', '🚨', NOW(), NOW(), FALSE, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    is_active = VALUES(is_active),
    is_deleted = VALUES(is_deleted),
    updated_at = NOW();
