-- LNB: 설정(ADM_SETTINGS) 하위에 브랜딩 메뉴 추가
-- - 테넌트 프로필 직후 정렬(sort_order = 2)
-- - 기존 ADM_SETTINGS_* / 컴플라이언스(ADM_REPORTS_COMP) sort_order 를 한 칸씩 뒤로 조정
-- 멱등: INSERT 는 menu_code 기준 NOT EXISTS; UPDATE 는 menu_code 별 고정 sort_order

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_BRANDING', '브랜딩', 'Branding', '/admin/branding', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Image', 2, 1, '브랜딩(로고·파비콘)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_BRANDING');

-- 기존 행 순서 고정 (브랜딩 삽입 후 기대 순서)
UPDATE menus SET sort_order = 1, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT';
UPDATE menus SET sort_order = 2, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_BRANDING';
UPDATE menus SET sort_order = 3, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_SYSTEM';
UPDATE menus SET sort_order = 4, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_CODES';
UPDATE menus SET sort_order = 5, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_PG';
UPDATE menus SET sort_order = 6, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_REPORTS_COMP';
