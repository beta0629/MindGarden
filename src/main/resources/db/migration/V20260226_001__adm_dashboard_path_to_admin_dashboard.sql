-- 어드민 대시보드 메뉴 경로를 프론트 라우트와 통일: /admin/dashboard
-- (기존 /admin/dashboard-v2 → /admin/dashboard)
UPDATE menus
SET menu_path = '/admin/dashboard', updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_DASHBOARD'
  AND (menu_path = '/admin/dashboard-v2' OR menu_path IS NULL OR menu_path = '');
