-- =============================================================================
-- V20261127_004 — LNB ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP 라벨 정리
--
-- RCA:
--   V20260905_001 INSERT+trailing UPDATE 가 menu_name='디러티 매칭 정리',
--   description='디러티 매칭(미결제) 정리 — FE 폴백과 DB SSOT 동기화 (P1)' 를 심음.
--   V20260907_001 은 menu_name 만 '디러티 배정 정리' 로 UPDATE 하고 description 은
--   미변경. Flyway out-of-order=true 환경에서 V20260905 가 늦게 적용되면 trailing
--   UPDATE 가 다시 '디러티 매칭 정리' 로 덮어써 런타임 LNB 가 매칭 라벨에 고착됨.
--
-- 목적:
--   menu_name → '미결제 배정 정리', description → '결제 안 된 배정 정리'
--   (구 SSOT 기본값만 치환; 커스텀 라벨/설명은 보존)
--
-- 범위: menu_name / description 만. menu_name_en·menu_code·path·권한·정렬·부모·아이콘 미변경.
-- 멱등: 이미 신규 라벨이면 WHERE 불일치 → 0행.
-- FE: Issue #1958 폴백 카피는 FE 별도 처리 (본 마이그 범위 밖).
--
-- @author CoreSolution
-- @since 2026-11-27
-- =============================================================================

-- 1) menu_name: 구 SSOT 기본값(매칭/배정)만 신규로
UPDATE menus
SET menu_name = '미결제 배정 정리',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP'
  AND TRIM(menu_name) IN ('디러티 매칭 정리', '디러티 배정 정리');

-- 2) description: V20260905 구 SSOT description 만 신규로 (커스텀 description 보존)
UPDATE menus
SET description = '결제 안 된 배정 정리',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP'
  AND TRIM(description) = '디러티 매칭(미결제) 정리 — FE 폴백과 DB SSOT 동기화 (P1)';
