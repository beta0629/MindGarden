-- LNB: 설정(ADM_SETTINGS) 하위에 카카오 알림톡 설정 메뉴 추가
-- - 경로는 `ADMIN_ROUTES.KAKAO_ALIMTALK_SETTINGS` 와 동일: /admin/kakao-alimtalk-settings
-- - 역할은 테넌트 공통코드·브랜딩과 동일 계열(STAFF)
-- - sort_order 7 고정, PG(6) 다음. 컴플라이언스(ADM_REPORTS_COMP) 등 기존 동위 항목은 8로 정리
-- 멱등: INSERT 는 menu_code 기준 NOT EXISTS; UPDATE 는 menu_code 별 고정 sort_order

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_KAKAO_ALIMTALK', '카카오 알림톡', 'Kakao Alimtalk', '/admin/kakao-alimtalk-settings', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'MessageCircle', 7, 1, '카카오 알림톡 비시크릿 설정(템플릿 코드·키 참조)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_KAKAO_ALIMTALK');

-- 기대 순서(설정 하위): 테넌트 프로필 → 브랜딩 → 시스템 설정 → 공통코드 → 테넌트 공통코드 → PG → 카카오 알림톡 → 컴플라이언스(동위 유지 시)
UPDATE menus SET sort_order = 1, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT';
UPDATE menus SET sort_order = 2, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_BRANDING';
UPDATE menus SET sort_order = 3, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_SYSTEM';
UPDATE menus SET sort_order = 4, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_CODES';
UPDATE menus SET sort_order = 5, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT_CODES';
UPDATE menus SET sort_order = 6, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_PG';
UPDATE menus SET sort_order = 7, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_KAKAO_ALIMTALK';
UPDATE menus SET sort_order = 8, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_REPORTS_COMP';
