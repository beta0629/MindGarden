/**
 * 레거시 역할 → 대시보드 경로 SSOT (ajax/session 순환 import 없음).
 *
 * @author Core Solution
 * @since 2026-07-07
 */

/**
 * @param {string|null|undefined} role
 * @returns {string}
 */
export const getLegacyDashboardPath = (role) => {
  if (!role) {
    return '/client/dashboard';
  }

  const normalizedRole = String(role).toUpperCase();
  // STAFF: ERP만 제외 — 대시보드는 ADMIN과 동일 경로 (STAFF_PERMISSION_POLICY_PHASE2)
  const ROLE_DASHBOARD_MAP = {
    CLIENT: '/client/dashboard',
    CONSULTANT: '/consultant/dashboard',
    ADMIN: '/admin/dashboard',
    STAFF: '/admin/dashboard',
    BRANCH_SUPER_ADMIN: '/super_admin/dashboard',
    BRANCH_MANAGER: '/admin/dashboard',
    HQ_ADMIN: '/admin/dashboard',
    SUPER_HQ_ADMIN: '/admin/dashboard',
    HQ_MASTER: '/admin/dashboard',
    HQ_SUPER_ADMIN: '/admin/dashboard'
  };

  return ROLE_DASHBOARD_MAP[normalizedRole] || '/client/dashboard';
};
