-- =============================================================================
-- V20260908_001 — PG 설정 LNB 라벨 → 「결제 연결」 + PG 승인(운영) 센터 비노출 재확인
--
-- 목적:
--   센터 LNB SSOT: ADM_SETTINGS_PG 표시명을 「결제 연결」로 통일 (path 유지).
--   ADM_PG_OPS_APPROVAL 은 센터 LNB 비노출(is_active=0) 유지·재확인 (path 유지).
--
-- 정책: DELETE 금지. UPDATE 만. 멱등.
-- =============================================================================

-- ADM_SETTINGS_PG: menu_name(한국어 표시) → 「결제 연결」
UPDATE menus
SET menu_name = '결제 연결',
    menu_name_en = 'Payment Connection',
    description = '결제 연결 (센터 PG 설정)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_SETTINGS_PG';

-- ADM_PG_OPS_APPROVAL: 센터 LNB 비노출 재확인 (path /admin/ops/pg-approval 유지)
UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_PG_OPS_APPROVAL'
  AND is_active = 1;
