-- =====================================================================
-- V20260727_001 — 어드민 LNB 1차 단독 「사용자 관리」 숏컷
--
-- 목적: 대시보드 · 통합 스케줄 바로 아래(알림보다 위)에 사용자 관리 단독 링크 노출.
--       기존 「사용자/권한」(ADM_USERS) 그룹은 유지. destination 은 ADM_USERS_LIST 와 동일.
-- path: /admin/user-management
-- 권한: ADM_USERS / ADM_USERS_LIST 와 동일 (STAFF)
-- 멱등: menu_code 기준 WHERE NOT EXISTS
-- =====================================================================

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_USER_MANAGEMENT', '사용자 관리', 'User Management',
       '/admin/user-management',
       NULL, 0, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Users', 17, 1,
       'LNB 1차 단독 숏컷 — ADM_USERS_LIST(/admin/user-management) 와 동일 destination (사용자 추가·스케줄 등록 빈도용). ADM_USERS 그룹 유지.',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_USER_MANAGEMENT');

-- 정렬 보장: 대시보드(10) · 통합 스케줄(15) · 사용자 관리(17) · 알림(20) …
UPDATE menus
SET sort_order = 17,
    menu_path = '/admin/user-management',
    menu_name = '사용자 관리',
    required_role = 'STAFF',
    min_required_role = 'STAFF',
    is_active = 1,
    parent_menu_id = NULL,
    depth = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_USER_MANAGEMENT';
