/**
 * 메뉴 권한 RBAC — 커뮤니티 등 UGC menuCode SSOT
 *
 * @author MindGarden
 * @since 2026-09-11
 */
export const MENU_PERMISSION_CODES = Object.freeze({
  CLT_COMMUNITY: 'CLT_COMMUNITY',
  CST_COMMUNITY: 'CST_COMMUNITY',
  ADM_COMMUNITY_MODERATION: 'ADM_COMMUNITY_MODERATION',
} as const);

export type MenuPermissionCode =
  (typeof MENU_PERMISSION_CODES)[keyof typeof MENU_PERMISSION_CODES];

export const MENU_API = Object.freeze({
  LNB: '/api/v1/menus/lnb',
} as const);
