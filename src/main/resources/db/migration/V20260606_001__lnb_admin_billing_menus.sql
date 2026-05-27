-- =====================================================================
-- V20260606_001 — 어드민 LNB 「결제/구독」 그룹 신설 (rename from V20260530_003)
--
-- ⚠ rename 이력:
--   • 원본 채번: V20260530_003 (PR #28, 2026-05-27 머지 — commit 230484aea)
--   • 충돌: V20260530_003__notification_scheduler_flags_upsert.sql
--     (2026-05-26 wellness-tip 핫픽스) 와 동일 버전 (Flyway 거부)
--   • 사고: deploy-production runId 26514871448 FAILURE
--     — green 슬롯 기동 시 Flyway 가
--       "Found more than one migration with version 20260530.003" 로 거부
--   • 결정: lnb_admin_billing_menus 측을 V20260606_001 으로 rename (안전 채번)
--          notification_scheduler_flags_upsert.sql 는 그대로 보존
--          (의미적 정합 = 2026-05-26 wellness-tip 핫픽스 시점)
--   • PR #28 원본 머지 (230484aea) 는 유지, 본 핫픽스 PR 에서
--     파일 rename 만 진행 (DDL 본문·로직 변경 없음)
--
-- 본 마이그 내용·로직은 원본 V20260530_003 본문 그대로 보존한다.
-- =====================================================================

-- =============================================================================
-- LNB: 어드민 「결제/구독」 최상위 그룹 (ADM_BILLING + 하위 2종) — 신설
-- - 배경: 테넌트 구독·결제 관리 액션 SSOT 분리 (옵션 C, 2026-05-27).
--         디자이너 핸드오프 §A 따라 LNB 최상위 그룹 "결제/구독" 을 신설하고,
--         하위 메뉴 2종 (구독 관리 / 결제 수단) 을 라우트 페이지로 연결한다.
--         (`menus` 테이블이 SSOT — `DEFAULT_MENU_ITEMS` 폴백은 미사용)
-- - 경로:
--    * /admin/billing/subscriptions  (= `ADMIN_ROUTES.BILLING_SUBSCRIPTIONS`)
--    * /admin/billing/payment-methods (= `ADMIN_ROUTES.BILLING_PAYMENT_METHODS`)
-- - 역할: required_role='ADMIN', min_required_role='ADMIN'
--    * 테넌트 결제/구독 운영 도구 — 비용 변경·구독 취소 등 운영 임팩트 大.
--      ADMIN 으로 보수 게이트 (STAFF 노출 차단).
--    * `MenuServiceImpl.getLnbMenus` 의 ADMIN 가시 집합에 포함 → ADMIN 사용자에게 정상 노출.
-- - menu_location = 'ADMIN_ONLY' → 어드민 LNB 전용
-- - icon: CreditCard (그룹), Receipt (구독), CreditCard (결제 수단)
-- - sort_order: ADM_SHOP(35) 와 ADM_ERP(40) 사이 → 38 으로 배치
-- - 멱등: INSERT 는 menu_code 기준 NOT EXISTS, UPDATE 는 고정 sort_order
-- - 멀티테넌트: `menus` 테이블은 전역 마스터 (테넌트 컬럼 없음) — row INSERT 3건
-- - 운영 영향: menus 테이블에 row 3건 추가 (다른 메뉴 sort_order 재정렬 없음)
-- =============================================================================

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_BILLING', '결제/구독', 'Billing & Subscription',
  '/admin/billing/subscriptions',
  NULL, 0, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'CreditCard', 38, 1,
  '테넌트 구독·결제 수단 운영 도구 (옵션 C 라우트 + UnifiedModal 분리, 2026-05-27)',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_BILLING');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_BILLING_SUBSCRIPTIONS', '구독 관리', 'Subscriptions',
  '/admin/billing/subscriptions',
  (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_BILLING' LIMIT 1) AS p),
  1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Receipt', 1, 1,
  '구독 목록·요금제 변경·취소 (옵션 C 라우트 페이지)',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_BILLING_SUBSCRIPTIONS');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_BILLING_PAYMENT_METHODS', '결제 수단', 'Payment Methods',
  '/admin/billing/payment-methods',
  (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_BILLING' LIMIT 1) AS p),
  1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'CreditCard', 2, 1,
  '결제 수단 등록·기본 설정·삭제 (옵션 C 라우트 페이지)',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_BILLING_PAYMENT_METHODS');

UPDATE menus SET sort_order = 38, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_BILLING';
UPDATE menus SET sort_order = 1, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_BILLING_SUBSCRIPTIONS';
UPDATE menus SET sort_order = 2, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_BILLING_PAYMENT_METHODS';
