/**
 * 마이페이지 프로필 API 분기 + 듀얼 역할(운영+상담) 헬퍼
 *
 * @author CoreSolution
 * @since 2026-04-17
 */

import { USER_ROLES } from './roles';
import { ROLE_DISPLAY_LABELS } from './mypageUi';

/**
 * @param {string|undefined|null} role
 * @returns {boolean}
 */
export function isConsultantUserProfileRole(role) {
  return role === USER_ROLES.CONSULTANT;
}

/**
 * @param {string|undefined|null} role
 * @returns {boolean}
 */
export function usesSessionClientProfileApi(role) {
  return !isConsultantUserProfileRole(role);
}

/**
 * 상담 역량 보유 여부 (순수 상담사 또는 counselingEnabled 운영자)
 *
 * @param {{ role?: string, counselingEnabled?: boolean }|null|undefined} user
 * @returns {boolean}
 */
export function isCounselingDualRole(user) {
  if (!user) {
    return false;
  }
  const role = user.role ? String(user.role).toUpperCase() : '';
  if (role === USER_ROLES.CONSULTANT) {
    return true;
  }
  return Boolean(user.counselingEnabled);
}

/**
 * 운영+상담 겸직 (ADMIN/STAFF 등 + counselingEnabled). 순수 CONSULTANT 제외.
 *
 * @param {{ role?: string, counselingEnabled?: boolean }|null|undefined} user
 * @returns {boolean}
 */
export function isOperatorCounselingDualRole(user) {
  if (!user) {
    return false;
  }
  const role = user.role ? String(user.role).toUpperCase() : '';
  if (isConsultantUserProfileRole(role)) {
    return false;
  }
  return Boolean(user.counselingEnabled) && usesSessionClientProfileApi(role);
}

/**
 * 알림 채널 선호 UI 노출 여부
 *
 * @param {{ role?: string, counselingEnabled?: boolean }|null|undefined} user
 * @returns {boolean}
 */
export function shouldShowNotificationChannelPreference(user) {
  if (!user) {
    return false;
  }
  const role = user.role ? String(user.role).toUpperCase() : '';
  if (role === USER_ROLES.CLIENT) {
    return true;
  }
  return isCounselingDualRole(user);
}

/**
 * 마이페이지 역할 배지 라벨
 *
 * @param {{ role?: string, counselingEnabled?: boolean }|null|undefined} user
 * @returns {string}
 */
export function getMypageRoleDisplayLabel(user) {
  if (!user?.role) {
    return '—';
  }
  if (isOperatorCounselingDualRole(user)) {
    return '운영 · 상담';
  }
  const role = String(user.role).toUpperCase();
  return ROLE_DISPLAY_LABELS[role] || role;
}

/**
 * 센터 표시명 추출 (UI copy: 센터)
 *
 * @param {object|null|undefined} user
 * @returns {string}
 */
export function resolveMypageCenterName(user) {
  if (!user) {
    return '';
  }
  return (
    user.tenant?.name ||
    user.tenantName ||
    user.companyName ||
    user.branchName ||
    ''
  );
}
