/**
 * hasMenuCodeInTree / isCommunityMenuVisible — 권한 off 시 메뉴 제외
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import {
  hasMenuCodeInTree,
  isCommunityMenuVisible,
} from '@/utils/menuAccessUtils';
import { MENU_PERMISSION_CODES } from '@/constants/menuPermissionCodes';

describe('menuAccessUtils', () => {
  const tree = [
    {
      menuCode: 'CLT_DASHBOARD',
      children: [],
    },
    {
      menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY,
      children: [],
    },
  ];

  it('finds nested menuCode', () => {
    expect(hasMenuCodeInTree(tree, MENU_PERMISSION_CODES.CLT_COMMUNITY)).toBe(true);
    expect(hasMenuCodeInTree(tree, 'MISSING')).toBe(false);
  });

  it('fail-closed when menus null or not ready', () => {
    expect(
      isCommunityMenuVisible({
        menus: null,
        menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY,
        ready: true,
      })
    ).toBe(false);
    expect(
      isCommunityMenuVisible({
        menus: tree,
        menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY,
        ready: false,
      })
    ).toBe(false);
  });

  it('hides community when code absent (permission off)', () => {
    expect(
      isCommunityMenuVisible({
        menus: [{ menuCode: 'CLT_DASHBOARD' }],
        menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY,
        ready: true,
      })
    ).toBe(false);
  });

  it('shows community when code present and ready', () => {
    expect(
      isCommunityMenuVisible({
        menus: tree,
        menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY,
        ready: true,
      })
    ).toBe(true);
  });
});
