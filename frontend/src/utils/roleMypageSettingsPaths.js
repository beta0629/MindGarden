/**
 * 역할별 마이페이지·설정 경로 (대시보드 라우팅과 동일 기준)
 *
 * @author CoreSolution
 * @since 2026-04-02
 */

import { getDashboardPathByRole } from '../constants/session';

const DASHBOARD_TO_MYPAGE = {
  '/client/dashboard': '/client/mypage',
  '/consultant/dashboard': '/consultant/mypage',
  '/admin/dashboard': '/admin/mypage',
  '/super_admin/dashboard': '/super_admin/mypage'
};

const DASHBOARD_TO_SETTINGS = {
  '/client/dashboard': '/client/settings',
  '/consultant/dashboard': '/tenant/settings',
  '/admin/dashboard': '/admin/settings',
  '/super_admin/dashboard': '/admin/settings'
};

/**
 * @param {string|null|undefined} role 세션 user.role
 * @returns {string|null} 리다이렉트 경로, role 없으면 null
 */
export function getMypagePathForRole(role) {
  if (!role) {
    return null;
  }
  const dashboardPath = getDashboardPathByRole(role);
  const mapped = DASHBOARD_TO_MYPAGE[dashboardPath];
  if (mapped) {
    return mapped;
  }
  return `/${String(role).toLowerCase()}/mypage`;
}

/**
 * @param {string|null|undefined} role 세션 user.role
 * @returns {string|null} 리다이렉트 경로, role 없으면 null
 */
export function getSettingsPathForRole(role) {
  if (!role) {
    return null;
  }
  const dashboardPath = getDashboardPathByRole(role);
  const mapped = DASHBOARD_TO_SETTINGS[dashboardPath];
  if (mapped) {
    return mapped;
  }
  return '/admin/settings';
}
