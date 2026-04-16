/**
 * 마이페이지 프로필 API 분기
 * - 상담사(CONSULTANT): UserProfileController `/api/v1/users/profile/{userId}`
 * - 그 외 역할: 세션 기반 ClientProfileController `/api/v1/clients/profile`
 *   (CLIENT, ADMIN, STAFF 및 레거시 SUPER_ADMIN·BRANCH_SUPER_ADMIN 등 비상담사 역할)
 *
 * @author CoreSolution
 * @since 2026-04-17
 */

/**
 * @param {string|undefined|null} role
 * @returns {boolean}
 */
export function isConsultantUserProfileRole(role) {
  return role === 'CONSULTANT';
}

/**
 * @param {string|undefined|null} role
 * @returns {boolean}
 */
export function usesSessionClientProfileApi(role) {
  return !isConsultantUserProfileRole(role);
}
