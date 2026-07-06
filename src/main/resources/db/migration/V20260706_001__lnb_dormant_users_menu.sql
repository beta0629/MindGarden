-- LNB: 사용자/권한(ADM_USERS) 하위에 휴면 사용자 메뉴 추가
-- - 라우트: /admin/lifecycle/dormant-users (App.js 등록 완료)
-- - ADM_ACCOUNTS(sort_order=3) 다음 sort_order=4
-- 멱등: menu_code 기준 WHERE NOT EXISTS

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_DORMANT_USERS', '휴면 사용자', 'Dormant Users', '/admin/lifecycle/dormant-users', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_USERS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Moon', 4, 1, '휴면 사용자 관리 (DORMANT 모니터링)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_DORMANT_USERS');
