/**
 * Menu permission hard-lock policy (fail-closed).
 * SSOT: docs/design-system/clinic-os-menu-permissions.md §6
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import {
  MENU_PERM_LOCK,
  MENU_PERM_ROLE_LEVEL
} from '../constants/menuPermissionManagementStrings';

/** Ops finance menu codes — STAFF cannot be granted (ledger / this-month / tax / salary approve-pay). */
export const STAFF_OPS_FINANCE_MENU_CODES = Object.freeze([
  'ADM_ERP',
  'ERP_DASHBOARD',
  'ERP_FINANCIAL',
  'ERP_TAX',
  'ERP_SALARY',
  'ERP_APPROVALS'
]);

const STAFF_OPS_FINANCE_PATH_HINTS = Object.freeze([
  '/erp/dashboard',
  '/erp/financial',
  '/erp/tax',
  '/erp/salary',
  '/erp/approvals'
]);

const SCHEDULE_CREATE_MENU_CODES = Object.freeze(['CST_SCHEDULE']);

/**
 * Normalize tenant role nameEn / template aliases → ADMIN|STAFF|CONSULTANT|CLIENT.
 * @param {string|null|undefined} nameEn
 * @returns {string}
 */
export function normalizeRoleCode(nameEn) {
  const raw = String(nameEn || '').trim().toUpperCase();
  if (!raw) {
    return '';
  }
  if (raw === 'ADMIN' || raw === 'DIRECTOR' || raw === '원장') {
    return 'ADMIN';
  }
  if (raw === 'STAFF' || raw === '사무원') {
    return 'STAFF';
  }
  if (raw === 'CONSULTANT' || raw === 'COUNSELOR' || raw === '상담사') {
    return 'CONSULTANT';
  }
  if (raw === 'CLIENT' || raw === '내담자') {
    return 'CLIENT';
  }
  return raw;
}

/**
 * @param {object} menu
 * @returns {boolean}
 */
export function isOpsFinanceMenu(menu) {
  const code = menu?.menuCode || '';
  if (STAFF_OPS_FINANCE_MENU_CODES.includes(code)) {
    return true;
  }
  const path = String(menu?.menuPath || '').toLowerCase();
  return STAFF_OPS_FINANCE_PATH_HINTS.some((hint) => path.includes(hint));
}

/**
 * Schedule-create related menus (consultant hard-lock; staff may toggle).
 * @param {object} menu
 * @returns {boolean}
 */
export function isScheduleCreateMenu(menu) {
  const code = menu?.menuCode || '';
  if (SCHEDULE_CREATE_MENU_CODES.includes(code)) {
    return true;
  }
  const path = String(menu?.menuPath || '').toLowerCase();
  if (path.includes('/consultant/schedule')) {
    return true;
  }
  const name = String(menu?.menuName || '');
  return name.includes('스케줄 생성') || name.includes('스케줄 등록');
}

/**
 * @param {string} roleCode normalized
 * @param {object} menu
 * @returns {{ locked: boolean, reason: string|null }}
 */
export function getMenuPermissionLock(roleCode, menu) {
  const role = normalizeRoleCode(roleCode);

  if (role === 'CONSULTANT' && isScheduleCreateMenu(menu)) {
    return { locked: true, reason: MENU_PERM_LOCK.SCHEDULE_CREATE };
  }

  if (role === 'STAFF' && isOpsFinanceMenu(menu)) {
    return { locked: true, reason: MENU_PERM_LOCK.STAFF_OPS_FINANCE };
  }

  const userLevel = MENU_PERM_ROLE_LEVEL[role] || 0;
  const requiredLevel = MENU_PERM_ROLE_LEVEL[menu?.minRequiredRole] || 0;
  if (requiredLevel > 0 && userLevel < requiredLevel) {
    return { locked: true, reason: MENU_PERM_LOCK.MIN_ROLE };
  }

  return { locked: false, reason: null };
}

/**
 * Center-custom badge: tenant RoleMenuPermission row exists.
 * @param {object} menu
 * @returns {boolean}
 */
export function isCenterCustomPermission(menu) {
  return Boolean(menu?.hasPermission);
}
