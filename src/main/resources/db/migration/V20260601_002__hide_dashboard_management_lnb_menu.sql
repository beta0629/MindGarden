-- 위젯 대시보드 관리 LNB 메뉴 숨김 (Phase 2, Q1=A 결정)
-- 합의서: docs/standards/WIDGET_DASHBOARD_DECOMMISSION_PLAN.md (e61ece86)
-- Phase 4 에서 row 자체 DELETE 예정
--
-- 근거:
--   V45__add_dashboard_management_menu.sql
--     - ('ADMIN_MENU',    'ADMIN_DASHBOARD_MANAGEMENT', ...) → 어드민 시스템관리 서브
--     - ('HQ_ADMIN_MENU', 'HQ_DASHBOARD_MANAGEMENT',    ...) → 본사관리자 시스템관리 서브
--
-- 처리:
--   1) is_active=false 로 LNB 렌더 차단 (FE 편집기 5종 + DashboardManagement + Dashboard3DPreview 동시 제거)
--   2) updated_at 갱신으로 LNB 캐시(common_code 기반) 무효화 트리거
--   3) is_deleted 는 유지(보존) — Phase 4 에서 DELETE 일괄 처리
--
-- 적용 범위: core_solution 단독 (mind_garden 미접촉)

UPDATE common_codes
SET is_active = false,
    updated_at = NOW()
WHERE code_group IN ('ADMIN_MENU', 'HQ_ADMIN_MENU')
  AND code_value IN ('ADMIN_DASHBOARD_MANAGEMENT', 'HQ_DASHBOARD_MANAGEMENT');
