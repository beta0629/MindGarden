/**
 * 앱 메뉴 노출 관리 — Clinic-OS container
 * SSOT: docs/design-system/clinic-os-app-menu-visibility-spec.md
 *
 * @author Core Solution
 * @since 2025-12-03
 * @updated 2026-09-12 — 행 Switch 즉시 grant(canView), 일괄 저장 제거
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import TabChipRow from '../common/TabChipRow';
import notificationManager from '../../utils/notification';
import {
  getRoleMenuPermissions,
  grantMenuPermission,
  fetchTenantRolesForMenuPermission
} from '../../utils/menuPermissionApi';
import MenuPermissionManagementUI from '../ui/MenuPermissionManagementUI';
import MenuPermissionQuietHeader from './menu-permission/MenuPermissionQuietHeader';
import MenuPermissionBadgeRail from './menu-permission/MenuPermissionBadgeRail';
import {
  MENU_PERM_MSG,
  MENU_PERM_PAGE,
  MENU_PERM_ROLE_CHIPS,
  MENU_PERM_SURFACE,
  MENU_PERM_TOAST,
  MENU_PERM_MOCK_ROLES
} from '../../constants/menuPermissionManagementStrings';
import {
  getMenuPermissionLock,
  isCenterCustomPermission,
  normalizeRoleCode
} from '../../utils/menuPermissionLockPolicy';
import {
  MENU_PERM_SURFACE_FILTER,
  filterMenusBySurface,
  pickDefaultRoleId,
  sortMenusForAppVisibility,
  withSurfaceLabel
} from '../../utils/menuPermissionSurface';
import '../../styles/unified-design-tokens.css';
import './menu-permission/MenuPermissionClinicOs.css';

const roleChipLabel = (role) => {
  const code = normalizeRoleCode(role?.nameEn || role?.templateCode);
  if (code === 'ADMIN') return MENU_PERM_ROLE_CHIPS.ADMIN;
  if (code === 'STAFF') return MENU_PERM_ROLE_CHIPS.STAFF;
  if (code === 'CONSULTANT') return MENU_PERM_ROLE_CHIPS.CONSULTANT;
  if (code === 'CLIENT') return MENU_PERM_ROLE_CHIPS.CLIENT;
  return role?.nameKo || role?.name || code || '역할';
};

const MenuPermissionManagement = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [menuPermissions, setMenuPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surfaceFilter, setSurfaceFilter] = useState(MENU_PERM_SURFACE_FILTER.APP);
  const [pendingMenuIds, setPendingMenuIds] = useState(() => new Set());
  const pendingRef = useRef(new Set());

  const selectedRole = useMemo(
    () => roles.find((r) => r.tenantRoleId === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const roleCode = normalizeRoleCode(selectedRole?.nameEn || selectedRole?.templateCode);

  const badgeCounts = useMemo(() => {
    let defaultCount = 0;
    let centerCount = 0;
    menuPermissions.forEach((m) => {
      if (isCenterCustomPermission(m)) {
        centerCount += 1;
      } else {
        defaultCount += 1;
      }
    });
    return { defaultCount, centerCount };
  }, [menuPermissions]);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchTenantRolesForMenuPermission();
      const next = Array.isArray(list) && list.length > 0 ? list : [...MENU_PERM_MOCK_ROLES];
      setRoles(next);
      setSelectedRoleId((prev) => prev || pickDefaultRoleId(next));
    } catch (err) {
      console.error('역할 조회 오류:', err);
      setRoles([...MENU_PERM_MOCK_ROLES]);
      setSelectedRoleId((prev) => prev || pickDefaultRoleId(MENU_PERM_MOCK_ROLES));
      setError(MENU_PERM_MSG.ERR_LOAD_ROLES);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMenuPermissions = useCallback(async (roleId) => {
    if (!roleId) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await getRoleMenuPermissions(roleId);
      if (response.success) {
        setMenuPermissions(response.data || []);
      } else {
        setError(response.message || MENU_PERM_MSG.QUERY_FAIL);
        setMenuPermissions([]);
      }
    } catch (err) {
      console.error('메뉴 권한 조회 오류:', err);
      setError(MENU_PERM_MSG.ERR_LOAD_MENU_PERM);
      setMenuPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchMenuPermissions(selectedRoleId);
    }
  }, [selectedRoleId, fetchMenuPermissions]);

  const handleRoleChipChange = (roleId) => {
    setSelectedRoleId(roleId);
    setMenuPermissions([]);
    setError(null);
    const nextRole = roles.find((r) => r.tenantRoleId === roleId);
    const nextCode = normalizeRoleCode(nextRole?.nameEn || nextRole?.templateCode);
    if (nextCode === 'CLIENT' || nextCode === 'CONSULTANT') {
      setSurfaceFilter(MENU_PERM_SURFACE_FILTER.APP);
    }
  };

  const setMenuPending = (menuId, pending) => {
    const next = new Set(pendingRef.current);
    if (pending) {
      next.add(menuId);
    } else {
      next.delete(menuId);
    }
    pendingRef.current = next;
    setPendingMenuIds(next);
  };

  /**
   * 행 Switch 즉시 적용.
   * 숨김도 grant(canView=false) — revoke 시 행 비활성 후 min-role 기본노출로 되돌아감.
   */
  const handleVisibilityChange = async (menuId, visible) => {
    if (!selectedRole) {
      return;
    }
    const menu = menuPermissions.find((m) => m.menuId === menuId);
    if (!menu) {
      return;
    }
    const lock = getMenuPermissionLock(roleCode, menu);
    if (lock.locked) {
      setError(MENU_PERM_MSG.LOCKED_DENY);
      return;
    }
    if (pendingRef.current.has(menuId)) {
      return;
    }

    const previous = { ...menu };
    const optimistic = {
      ...menu,
      canView: visible,
      hasPermission: true,
      canCreate: visible ? Boolean(menu.canCreate) : false,
      canUpdate: visible ? Boolean(menu.canUpdate) : false,
      canDelete: visible ? Boolean(menu.canDelete) : false
    };

    setMenuPermissions((prev) =>
      prev.map((m) => (m.menuId === menuId ? optimistic : m))
    );
    setMenuPending(menuId, true);
    setError(null);

    try {
      const response = await grantMenuPermission({
        roleId: selectedRole.tenantRoleId,
        menuId,
        canView: visible,
        canCreate:
          roleCode === 'CONSULTANT' ? false : Boolean(optimistic.canCreate && visible),
        canUpdate: Boolean(optimistic.canUpdate && visible),
        canDelete: Boolean(optimistic.canDelete && visible)
      });

      if (response.success) {
        notificationManager.success(
          visible ? MENU_PERM_TOAST.VISIBLE_ON : MENU_PERM_TOAST.VISIBLE_OFF
        );
      } else {
        setMenuPermissions((prev) =>
          prev.map((m) => (m.menuId === menuId ? previous : m))
        );
        setError(response.message || MENU_PERM_MSG.PERM_CHANGE_FAIL);
      }
    } catch (err) {
      console.error('메뉴 노출 즉시 적용 오류:', err);
      setMenuPermissions((prev) =>
        prev.map((m) => (m.menuId === menuId ? previous : m))
      );
      setError(MENU_PERM_MSG.ERR_PERM_CHANGE);
    } finally {
      setMenuPending(menuId, false);
    }
  };

  const chipItems = roles.map((role) => ({
    key: role.tenantRoleId,
    label: roleChipLabel(role)
  }));

  const surfaceChipItems = [
    { key: MENU_PERM_SURFACE_FILTER.ALL, label: MENU_PERM_SURFACE.ALL },
    { key: MENU_PERM_SURFACE_FILTER.APP, label: MENU_PERM_SURFACE.APP },
    { key: MENU_PERM_SURFACE_FILTER.WEB, label: MENU_PERM_SURFACE.WEB }
  ];

  const visibleMenuCount = useMemo(
    () => menuPermissions.filter((m) => Boolean(m.canView)).length,
    [menuPermissions]
  );

  const displayedMenus = useMemo(
    () =>
      sortMenusForAppVisibility(
        filterMenusBySurface(menuPermissions, surfaceFilter)
      ).map(withSurfaceLabel),
    [menuPermissions, surfaceFilter]
  );

  return (
    <AdminCommonLayout
      title={MENU_PERM_PAGE.TITLE}
      loading={loading && !selectedRole}
      loadingText={MENU_PERM_PAGE.LOADING}
    >
      <ContentArea
        className="mg-v2-menu-permission menu-permission--clinic-os"
        ariaLabel={MENU_PERM_PAGE.ARIA_MAIN}
      >
        <div className="menu-permission-shell">
          <MenuPermissionQuietHeader />
          <TabChipRow
            ariaLabel={MENU_PERM_ROLE_CHIPS.ARIA}
            items={chipItems}
            activeKey={selectedRoleId || ''}
            onChange={handleRoleChipChange}
            size="sm"
            className="menu-permission-role-chips"
          />
          <MenuPermissionBadgeRail
            defaultCount={badgeCounts.defaultCount}
            centerCount={badgeCounts.centerCount}
            visibleCount={visibleMenuCount}
            totalCount={menuPermissions.length}
          />
          <div
            className="menu-permission__stage"
            data-testid="menu-permission-stage"
          >
            <TabChipRow
              ariaLabel={MENU_PERM_SURFACE.ARIA}
              items={surfaceChipItems}
              activeKey={surfaceFilter}
              onChange={setSurfaceFilter}
              size="sm"
              className="menu-permission-surface-chips"
            />
            <main aria-labelledby={MENU_PERM_PAGE.TITLE_ID}>
              <MenuPermissionManagementUI
                selectedRole={selectedRole}
                menuPermissions={displayedMenus}
                loading={loading && Boolean(selectedRole)}
                error={error}
                pendingMenuIds={pendingMenuIds}
                onVisibilityChange={handleVisibilityChange}
              />
            </main>
          </div>
        </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default MenuPermissionManagement;
