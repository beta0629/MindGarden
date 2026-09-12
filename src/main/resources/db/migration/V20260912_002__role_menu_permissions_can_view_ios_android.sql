-- =============================================================================
-- RoleMenuPermission: can_view_ios / can_view_android (앱 플랫폼별 메뉴 노출)
-- SSOT: docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md §4
-- - 기존 can_view = 웹/레거시
-- - 신규 컬럼은 can_view 복사 후, CLT/CST 커뮤니티만 ios=0, android=1, can_view(웹)=1
-- - V20260912_001(양쪽 can_view=0)이 선행해도 본 시드가 ios OFF / android ON / web ON 으로 정정
-- =============================================================================

-- 1) can_view_ios
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'role_menu_permissions'
       AND COLUMN_NAME = 'can_view_ios') = 0,
    'ALTER TABLE role_menu_permissions ADD COLUMN can_view_ios BOOLEAN DEFAULT TRUE COMMENT ''iOS 앱 메뉴 노출'' AFTER can_view',
    'SELECT ''can_view_ios column already exists'''
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) can_view_android
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'role_menu_permissions'
       AND COLUMN_NAME = 'can_view_android') = 0,
    'ALTER TABLE role_menu_permissions ADD COLUMN can_view_android BOOLEAN DEFAULT TRUE COMMENT ''Android 앱 메뉴 노출'' AFTER can_view_ios',
    'SELECT ''can_view_android column already exists'''
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) 기존 행 backfill: can_view → ios/android 복사
UPDATE role_menu_permissions
SET can_view_ios = COALESCE(can_view, TRUE),
    can_view_android = COALESCE(can_view, TRUE);

-- 4) CLIENT 커뮤니티 — 멱등 INSERT (없으면) / UPDATE (있으면 → ios OFF / android ON / web ON)
INSERT INTO role_menu_permissions (
    tenant_id,
    tenant_role_id,
    menu_id,
    can_view,
    can_view_ios,
    can_view_android,
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
    1,
    0,
    1,
    0,
    0,
    0,
    1,
    'FLYWAY_V20260912_002_COMMUNITY',
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

UPDATE role_menu_permissions rmp
INNER JOIN menus m
    ON m.id = rmp.menu_id
   AND m.menu_code = 'CLT_COMMUNITY'
INNER JOIN tenant_roles tr
    ON tr.tenant_role_id = rmp.tenant_role_id
   AND tr.tenant_id = rmp.tenant_id
   AND tr.is_deleted = 0
   AND UPPER(COALESCE(tr.name_en, '')) = 'CLIENT'
SET rmp.can_view = 1,
    rmp.can_view_ios = 0,
    rmp.can_view_android = 1,
    rmp.is_active = 1,
    rmp.assigned_by = 'FLYWAY_V20260912_002_COMMUNITY_UPDATE',
    rmp.updated_at = CURRENT_TIMESTAMP;

-- 5) CONSULTANT 커뮤니티 — 멱등 INSERT / UPDATE
INSERT INTO role_menu_permissions (
    tenant_id,
    tenant_role_id,
    menu_id,
    can_view,
    can_view_ios,
    can_view_android,
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
    1,
    0,
    1,
    0,
    0,
    0,
    1,
    'FLYWAY_V20260912_002_COMMUNITY',
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

UPDATE role_menu_permissions rmp
INNER JOIN menus m
    ON m.id = rmp.menu_id
   AND m.menu_code = 'CST_COMMUNITY'
INNER JOIN tenant_roles tr
    ON tr.tenant_role_id = rmp.tenant_role_id
   AND tr.tenant_id = rmp.tenant_id
   AND tr.is_deleted = 0
   AND UPPER(COALESCE(tr.name_en, '')) = 'CONSULTANT'
SET rmp.can_view = 1,
    rmp.can_view_ios = 0,
    rmp.can_view_android = 1,
    rmp.is_active = 1,
    rmp.assigned_by = 'FLYWAY_V20260912_002_COMMUNITY_UPDATE',
    rmp.updated_at = CURRENT_TIMESTAMP;
