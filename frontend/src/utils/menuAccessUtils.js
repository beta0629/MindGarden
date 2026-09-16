/**
 * LNB 메뉴 트리 menuCode 접근 헬퍼 (fail-closed)
 *
 * @author MindGarden
 * @since 2026-09-11
 */

/**
 * @param {Array<{ menuCode?: string, children?: Array }>|null|undefined} menus
 * @param {string} menuCode
 * @returns {boolean}
 */
export function hasMenuCodeInTree(menus, menuCode) {
  if (!menuCode || menus == null || !Array.isArray(menus) || menus.length === 0) {
    return false;
  }
  for (let i = 0; i < menus.length; i += 1) {
    const node = menus[i];
    if (!node) {
      continue;
    }
    if (node.menuCode === menuCode) {
      return true;
    }
    if (hasMenuCodeInTree(node.children, menuCode)) {
      return true;
    }
  }
  return false;
}

/**
 * @param {{ menus: Array|null|undefined, menuCode: string, ready: boolean }} options
 * @returns {boolean}
 */
export function isCommunityMenuVisible({ menus, menuCode, ready }) {
  if (!ready) {
    return false;
  }
  return hasMenuCodeInTree(menus, menuCode);
}

export const MENU_PERMISSION_CODES = Object.freeze({
  CLT_COMMUNITY: 'CLT_COMMUNITY',
  CST_COMMUNITY: 'CST_COMMUNITY'
});
