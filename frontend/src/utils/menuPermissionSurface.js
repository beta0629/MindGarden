/**
 * App vs web menu surface — Clinic-OS 앱 메뉴 노출 필터
 * SSOT: docs/design-system/clinic-os-app-menu-visibility-spec.md
 *
 * @author Core Solution
 * @since 2026-09-12
 */

import { normalizeRoleCode } from './menuPermissionLockPolicy';

export const MENU_PERM_SURFACE_FILTER = Object.freeze({
  ALL: 'ALL',
  APP: 'APP',
  WEB: 'WEB'
});

const APP_LOCATIONS = new Set(['CLIENT', 'CONSULTANT']);
const APP_CODE_PREFIXES = ['CLT_', 'CST_'];
const APP_PATH_HINTS = ['/client/', '/consultant/'];

/**
 * Expo/mobile more-hub menus (커뮤니티 등).
 * @param {object} menu
 * @returns {boolean}
 */
export function isAppFacingMenu(menu) {
  if (!menu) {
    return false;
  }
  const loc = String(menu.menuLocation || '').toUpperCase();
  if (APP_LOCATIONS.has(loc)) {
    return true;
  }
  const code = String(menu.menuCode || '');
  if (APP_CODE_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    return true;
  }
  const path = String(menu.menuPath || '').toLowerCase();
  return APP_PATH_HINTS.some((hint) => path.includes(hint));
}

/**
 * CLIENT 역할을 기본 선택 (App Store UGC 심사 동선).
 * @param {Array<{ tenantRoleId?: string, nameEn?: string, templateCode?: string }>} roles
 * @returns {string|null}
 */
export function pickDefaultRoleId(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return null;
  }
  const client = roles.find(
    (role) => normalizeRoleCode(role?.nameEn || role?.templateCode) === 'CLIENT'
  );
  return client?.tenantRoleId || roles[0]?.tenantRoleId || null;
}

/**
 * @param {Array<object>} menus
 * @param {string} surface ALL|APP|WEB
 * @returns {Array<object>}
 */
export function filterMenusBySurface(menus, surface) {
  if (!Array.isArray(menus)) {
    return [];
  }
  if (surface === MENU_PERM_SURFACE_FILTER.ALL || !surface) {
    return menus;
  }
  return menus.filter((menu) => {
    const app = isAppFacingMenu(menu);
    return surface === MENU_PERM_SURFACE_FILTER.APP ? app : !app;
  });
}

/**
 * 앱 메뉴(커뮤니티 등)를 목록 상단으로.
 * @param {Array<object>} menus
 * @returns {Array<object>}
 */
export function sortMenusForAppVisibility(menus) {
  if (!Array.isArray(menus)) {
    return [];
  }
  return [...menus].sort((a, b) => {
    const aApp = isAppFacingMenu(a) ? 0 : 1;
    const bApp = isAppFacingMenu(b) ? 0 : 1;
    if (aApp !== bApp) {
      return aApp - bApp;
    }
    const aName = String(a?.menuName || '');
    const bName = String(b?.menuName || '');
    return aName.localeCompare(bName, 'ko');
  });
}

/**
 * UI용 surface 라벨 필드만 부여 (본문에 menuCode 비노출).
 * @param {object} menu
 * @returns {object}
 */
export function withSurfaceLabel(menu) {
  const code = String(menu?.menuCode || '');
  const name = String(menu?.menuName || '');
  return {
    ...menu,
    surface: isAppFacingMenu(menu)
      ? MENU_PERM_SURFACE_FILTER.APP
      : MENU_PERM_SURFACE_FILTER.WEB,
    reviewCaution: code.includes('COMMUNITY') || name.includes('커뮤니티')
  };
}
