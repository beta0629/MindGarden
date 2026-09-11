-- =============================================================================
-- App Store 메뉴 권한 RBAC — CLIENT/CONSULTANT 커뮤니티(UGC) 메뉴 시드
-- SSOT: docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md
-- Admin /admin/menu-permissions 에서 역할별 canView 토글 가능해야 함.
-- =============================================================================

INSERT INTO menus (
    menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
    required_role, min_required_role, is_admin_only, menu_location,
    icon, sort_order, is_active, description, created_at, updated_at
)
SELECT * FROM (
    SELECT
        'CLT_COMMUNITY' AS menu_code,
        '커뮤니티' AS menu_name,
        'Community' AS menu_name_en,
        '/client/more/community' AS menu_path,
        NULL AS parent_menu_id,
        0 AS depth,
        'CLIENT' AS required_role,
        'CLIENT' AS min_required_role,
        0 AS is_admin_only,
        'CLIENT' AS menu_location,
        'Users' AS icon,
        45 AS sort_order,
        1 AS is_active,
        '내담자 커뮤니티(UGC) — RoleMenuPermission.canView 로 원격 on/off' AS description,
        CURRENT_TIMESTAMP AS created_at,
        CURRENT_TIMESTAMP AS updated_at
    UNION ALL
    SELECT
        'CST_COMMUNITY',
        '커뮤니티',
        'Community',
        '/consultant/more/community',
        NULL,
        0,
        'CONSULTANT',
        'CONSULTANT',
        0,
        'CONSULTANT',
        'Users',
        25,
        1,
        '상담사 커뮤니티(UGC) — RoleMenuPermission.canView 로 원격 on/off',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
) AS t
WHERE NOT EXISTS (SELECT 1 FROM menus m WHERE m.menu_code = t.menu_code);
