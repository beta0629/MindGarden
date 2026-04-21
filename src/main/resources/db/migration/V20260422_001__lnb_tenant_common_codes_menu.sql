-- LNB: 설정(ADM_SETTINGS) 하위에 테넌트 공통코드 메뉴 추가
-- - 공통코드(ADM_SETTINGS_CODES) 다음 sort_order, PG(ADM_SETTINGS_PG) 한 칸 뒤로
-- - ADM_REPORTS_COMP 는 ADM_REPORTS 하위이므로 여기서 건드리지 않음 (V20260415 정렬 유지)
-- 멱등: INSERT 는 menu_code 기준 NOT EXISTS; UPDATE 는 ADM_SETTINGS 직계 자식만

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_TENANT_CODES', '테넌트 공통코드', 'Tenant Common Codes', '/admin/tenant-common-codes', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Tag', 5, 1, '테넌트 전용 공통코드', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_TENANT_CODES');

-- 기대 순서(설정 하위): 테넌트 프로필 → 브랜딩 → 시스템 설정 → 공통코드 → 테넌트 공통코드 → PG
UPDATE menus SET sort_order = 1, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT';
UPDATE menus SET sort_order = 2, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_BRANDING';
UPDATE menus SET sort_order = 3, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_SYSTEM';
UPDATE menus SET sort_order = 4, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_CODES';
UPDATE menus SET sort_order = 5, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT_CODES';
UPDATE menus SET sort_order = 6, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_PG';
