-- LNB: 설정(ADM_SETTINGS) 하위에 문자 메시지(SMS) 안내 메뉴 추가
-- - 경로는 `ADMIN_ROUTES.TENANT_SMS_SETTINGS` 와 동일: /admin/tenant-sms-settings
-- - 역할·플래그는 카카오 알림톡(ADM_SETTINGS_KAKAO_ALIMTALK)과 동형(STAFF)
-- - sort_order 8 고정(카카오 7 다음). 컴플라이언스(ADM_REPORTS_COMP) 등 기존 8은 9로 정리
-- 멱등: INSERT 는 menu_code 기준 NOT EXISTS; UPDATE 는 menu_code 별 고정 sort_order

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_TENANT_SMS', '문자 메시지(SMS)', 'Tenant SMS', '/admin/tenant-sms-settings', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'MessageSquare', 8, 1, 'SMS 연동 안내(애플리케이션 설정)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_TENANT_SMS');

UPDATE menus SET sort_order = 1, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT';
UPDATE menus SET sort_order = 2, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_BRANDING';
UPDATE menus SET sort_order = 3, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_SYSTEM';
UPDATE menus SET sort_order = 4, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_CODES';
UPDATE menus SET sort_order = 5, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT_CODES';
UPDATE menus SET sort_order = 6, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_PG';
UPDATE menus SET sort_order = 7, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_KAKAO_ALIMTALK';
UPDATE menus SET sort_order = 8, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT_SMS';
UPDATE menus SET sort_order = 9, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_REPORTS_COMP';
