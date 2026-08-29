-- =============================================================================
-- V20260829_006 — MAPPING_STATUS.CANCELLED (취소) SSOT
-- ---------------------------------------------------------------------------
-- tip 기준: V20260829_005.
-- 목적: 통합결제/매칭 관리자 취소 write-path 가 status=CANCELLED 를 persist 할 때
--       공통코드·배지 라벨(취소)이 TERMINATED(종료됨) 과 구분되도록 시드.
-- 정책:
--   • code_value = CANCELLED (스케줄 CANCELLED 와 동일 스펠링, CANCELED 금지)
--   • code_label = 취소 (TERMINATED=종료됨 과 구분)
--   • 코어(tenant_id IS NULL) + MAPPING_STATUS 보유 테넌트 복사
--   • 레거시 TERMINATED 행 일괄 UPDATE 금지 (단건은 docs/debug 참고)
-- =============================================================================

-- 1) 코어 시드 (tenant_id IS NULL) — 멱등 INSERT
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    icon, color_code, sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT
    NULL,
    'MAPPING_STATUS',
    'CANCELLED',
    '취소',
    '취소',
    '관리자 강제 종료·결제 대기 취소 등 매칭 취소 (종료됨/회기소진과 구분)',
    'x-circle',
    '#dc3545',
    8,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL
      AND c.code_group = 'MAPPING_STATUS'
      AND c.code_value = 'CANCELLED'
);

-- 코어 라벨·설명 정합 (이미 있으면 갱신)
UPDATE common_codes
SET
    code_label = '취소',
    korean_name = '취소',
    code_description = '관리자 강제 종료·결제 대기 취소 등 매칭 취소 (종료됨/회기소진과 구분)',
    icon = 'x-circle',
    color_code = '#dc3545',
    sort_order = 8,
    is_active = TRUE,
    is_deleted = FALSE,
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'MAPPING_STATUS'
  AND code_value = 'CANCELLED';

-- 2) MAPPING_STATUS 보유 테넌트에 CANCELLED 복사 (멱등)
INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    icon, color_code, sort_order, is_active, is_deleted, version, created_at, updated_at
)
SELECT
    t.tenant_id,
    'MAPPING_STATUS',
    'CANCELLED',
    '취소',
    '취소',
    '관리자 강제 종료·결제 대기 취소 등 매칭 취소 (종료됨/회기소진과 구분)',
    'x-circle',
    '#dc3545',
    8,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW()
FROM tenants t
WHERE EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'MAPPING_STATUS'
      AND (c.is_deleted = FALSE OR c.is_deleted IS NULL)
)
AND NOT EXISTS (
    SELECT 1 FROM common_codes x
    WHERE x.tenant_id = t.tenant_id
      AND x.code_group = 'MAPPING_STATUS'
      AND x.code_value = 'CANCELLED'
      AND (x.is_deleted = FALSE OR x.is_deleted IS NULL)
);

UPDATE common_codes
SET
    code_label = '취소',
    korean_name = '취소',
    code_description = '관리자 강제 종료·결제 대기 취소 등 매칭 취소 (종료됨/회기소진과 구분)',
    icon = 'x-circle',
    color_code = '#dc3545',
    sort_order = 8,
    is_active = TRUE,
    is_deleted = FALSE,
    updated_at = NOW()
WHERE tenant_id IS NOT NULL
  AND code_group = 'MAPPING_STATUS'
  AND code_value = 'CANCELLED';
