-- =============================================================================
-- 교정: V20260912_002 커뮤니티 전플랫폼 OFF 시드 철회
-- SSOT: docs/project-management/MENU_VISIBILITY_IOS_REVIEW_ONE_BUTTON_ORCHESTRATION_20260912.md
--
-- 정책: 커뮤니티 사전 OFF 시드 금지.
--       심사 시 숨김은 Admin iOS 원버튼(can_view_ios만)으로 적용.
-- 대상: CLT_COMMUNITY / CST_COMMUNITY — can_view·can_view_ios·can_view_android = ON
-- =============================================================================

UPDATE role_menu_permissions rmp
INNER JOIN menus m
    ON m.id = rmp.menu_id
   AND m.menu_code IN ('CLT_COMMUNITY', 'CST_COMMUNITY')
INNER JOIN tenant_roles tr
    ON tr.tenant_role_id = rmp.tenant_role_id
   AND tr.tenant_id = rmp.tenant_id
   AND tr.is_deleted = 0
SET rmp.can_view = 1,
    rmp.can_view_ios = 1,
    rmp.can_view_android = 1,
    rmp.is_active = 1,
    rmp.assigned_by = 'FLYWAY_V20260912_003_REVERT_COMMUNITY_OFF',
    rmp.updated_at = CURRENT_TIMESTAMP
WHERE (
        rmp.assigned_by LIKE 'FLYWAY_V20260912_002_COMMUNITY%'
        OR (
            COALESCE(rmp.can_view, 0) = 0
            AND COALESCE(rmp.can_view_ios, 0) = 0
            AND COALESCE(rmp.can_view_android, 0) = 0
        )
    );
