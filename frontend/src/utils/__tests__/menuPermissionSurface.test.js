/**
 * menuPermissionSurface — 앱/웹 필터·CLIENT 기본 역할
 *
 * @author Core Solution
 * @since 2026-09-12
 */

import {
  MENU_PERM_SURFACE_FILTER,
  filterMenusBySurface,
  isAppFacingMenu,
  pickDefaultRoleId,
  sortMenusForAppVisibility,
  withSurfaceLabel
} from '../menuPermissionSurface';

describe('menuPermissionSurface', () => {
  const community = {
    menuId: 1,
    menuCode: 'CLT_COMMUNITY',
    menuName: '커뮤니티',
    menuPath: '/client/community',
    menuLocation: 'CLIENT'
  };
  const adminDash = {
    menuId: 2,
    menuCode: 'ADM_DASHBOARD',
    menuName: '대시보드',
    menuPath: '/admin/dashboard',
    menuLocation: 'ADMIN_ONLY'
  };

  test('isAppFacingMenu detects CLIENT location and CLT_ code', () => {
    expect(isAppFacingMenu(community)).toBe(true);
    expect(isAppFacingMenu(adminDash)).toBe(false);
    expect(isAppFacingMenu(null)).toBe(false);
  });

  test('pickDefaultRoleId prefers CLIENT', () => {
    expect(
      pickDefaultRoleId([
        { tenantRoleId: 'r-admin', nameEn: 'ADMIN' },
        { tenantRoleId: 'r-client', nameEn: 'CLIENT' }
      ])
    ).toBe('r-client');
    expect(pickDefaultRoleId([])).toBeNull();
  });

  test('filterMenusBySurface APP hides web LNB', () => {
    const menus = [community, adminDash];
    expect(filterMenusBySurface(menus, MENU_PERM_SURFACE_FILTER.APP)).toEqual([
      community
    ]);
    expect(filterMenusBySurface(menus, MENU_PERM_SURFACE_FILTER.WEB)).toEqual([
      adminDash
    ]);
    expect(filterMenusBySurface(menus, MENU_PERM_SURFACE_FILTER.ALL)).toHaveLength(
      2
    );
  });

  test('sortMenusForAppVisibility puts app menus first', () => {
    const sorted = sortMenusForAppVisibility([adminDash, community]);
    expect(sorted[0].menuCode).toBe('CLT_COMMUNITY');
  });

  test('withSurfaceLabel does not require UI to read menuCode', () => {
    expect(withSurfaceLabel(community).surface).toBe(MENU_PERM_SURFACE_FILTER.APP);
    expect(withSurfaceLabel(adminDash).surface).toBe(MENU_PERM_SURFACE_FILTER.WEB);
    expect(withSurfaceLabel(community).reviewCaution).toBe(true);
    expect(withSurfaceLabel(adminDash).reviewCaution).toBe(false);
  });
});
