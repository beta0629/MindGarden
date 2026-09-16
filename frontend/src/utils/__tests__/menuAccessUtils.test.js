/**
 * menuAccessUtils — 권한 off 시 메뉴 제외
 *
 * @author MindGarden
 * @since 2026-09-11
 */

import {
  hasMenuCodeInTree,
  isCommunityMenuVisible,
  MENU_PERMISSION_CODES
} from '../menuAccessUtils';

describe('menuAccessUtils', () => {
  const tree = [
    { menuCode: 'CLT_DASHBOARD', children: [] },
    { menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY, children: [] }
  ];

  test('finds menuCode in tree', () => {
    expect(hasMenuCodeInTree(tree, MENU_PERMISSION_CODES.CLT_COMMUNITY)).toBe(true);
    expect(hasMenuCodeInTree(tree, 'MISSING')).toBe(false);
  });

  test('fail-closed when not ready or menus null', () => {
    expect(
      isCommunityMenuVisible({
        menus: null,
        menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY,
        ready: true
      })
    ).toBe(false);
    expect(
      isCommunityMenuVisible({
        menus: tree,
        menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY,
        ready: false
      })
    ).toBe(false);
  });

  test('hides when permission off (code absent)', () => {
    expect(
      isCommunityMenuVisible({
        menus: [{ menuCode: 'CLT_DASHBOARD' }],
        menuCode: MENU_PERMISSION_CODES.CLT_COMMUNITY,
        ready: true
      })
    ).toBe(false);
  });
});
