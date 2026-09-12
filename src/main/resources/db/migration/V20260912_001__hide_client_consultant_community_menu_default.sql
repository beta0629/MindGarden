-- =============================================================================
-- App Store UGC: CLIENT/CONSULTANT 커뮤니티 메뉴 기본 숨김 (can_view=0)
-- SSOT: docs/project-management/APPLE_FOLLOWUP_ORCHESTRATION_20260912.md
-- 행이 없으면 min-role 기본노출 → 명시적 RoleMenuPermission(can_view=false) 시드.
-- 이미 행이 있는 테넌트는 유지(Admin에서 ON/OFF). 멱등 INSERT only.
-- =============================================================================

INSERT INTO role_menu_permissions (
    tenant_id,
    tenant_role_id,
    menu_id,
    can_view,
    can_create,
    can_update,
    can_delete,
    is_active,
    assigned_by,
    assigned_at,
    created_at,
    updated_at
)
SELECT
    tr.tenant_id,
    tr.tenant_role_id,
    m.id,
    0,
    0,
    0,
    0,
    1,
    'FLYWAY_V20260912_001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenant_roles tr
INNER JOIN menus m
    ON m.menu_code = 'CLT_COMMUNITY'
   AND m.is_active = 1
WHERE tr.is_deleted = 0
  AND UPPER(COALESCE(tr.name_en, '')) = 'CLIENT'
  AND NOT EXISTS (
      SELECT 1
      FROM role_menu_permissions rmp
      WHERE rmp.tenant_id = tr.tenant_id
        AND rmp.tenant_role_id = tr.tenant_role_id
        AND rmp.menu_id = m.id
  );

INSERT INTO role_menu_permissions (
    tenant_id,
    tenant_role_id,
    menu_id,
    can_view,
    can_create,
    can_update,
    can_delete,
    is_active,
    assigned_by,
    assigned_at,
    created_at,
    updated_at
)
SELECT
    tr.tenant_id,
    tr.tenant_role_id,
    m.id,
    0,
    0,
    0,
    0,
    1,
    'FLYWAY_V20260912_001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenant_roles tr
INNER JOIN menus m
    ON m.menu_code = 'CST_COMMUNITY'
   AND m.is_active = 1
WHERE tr.is_deleted = 0
  AND UPPER(COALESCE(tr.name_en, '')) = 'CONSULTANT'
  AND NOT EXISTS (
      SELECT 1
      FROM role_menu_permissions rmp
      WHERE rmp.tenant_id = tr.tenant_id
        AND rmp.tenant_role_id = tr.tenant_role_id
        AND rmp.menu_id = m.id
  );
