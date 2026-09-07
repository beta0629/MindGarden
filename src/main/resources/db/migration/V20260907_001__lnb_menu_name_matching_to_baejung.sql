-- =============================================================================
-- V20260907_001 — LNB 표시명 「매칭」→「배정」(PR #879 후속, Desktop LNB SSOT)
--
-- 목적:
--   GET /api/v1/menus/lnb 는 DB menus.menu_name 이 SSOT.
--   FE 카피·폴백만 배정으로 바뀌어 런타임 LNB 에 「매칭」이 남던 불일치 해소.
--
-- 범위: menu_name (display Korean) 만 UPDATE. menu_code / path / role 변경 없음.
-- 멱등: menu_code 기준 SET (이미 배정이면 동일 값).
-- =============================================================================

-- ADM_MATCHING_PAYMENT_REFUND: 1차 그룹 라벨
UPDATE menus
SET menu_name = '배정·결제·환불',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND';

-- ADM_MAPPING: 하위 「배정 관리」
UPDATE menus
SET menu_name = '배정 관리(환불·취소)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_MAPPING';

-- ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP: 하위 「디러티 배정 정리」
UPDATE menus
SET menu_name = '디러티 배정 정리',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP';
