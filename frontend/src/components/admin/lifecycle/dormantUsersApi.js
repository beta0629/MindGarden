/**
 * 관리자 휴면 사용자 API 엔드포인트 상수 + 호출 헬퍼 — Phase 4
 * (USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 + §10.12).
 *
 * StandardizedApi 사용 강제 (utils/standardizedApi). 직접 ajax 호출 금지.
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import StandardizedApi from '../../../utils/standardizedApi';

const BASE = '/api/v1/admin/lifecycle/dormant-users';

/** GET 페이지네이션 목록. */
export const ADMIN_DORMANT_USERS_LIST_URL = BASE;

/** GET 상세 / POST reactivate / DELETE 강제 익명화 — userId 치환. */
export const adminDormantUserDetailUrl = (userId) => `${BASE}/${userId}`;

/** POST reactivate. */
export const adminDormantUserReactivateUrl = (userId) =>
  `${BASE}/${userId}/reactivate`;

/**
 * 휴면 사용자 페이지네이션 목록 조회.
 *
 * @param {Object} params {page, size}
 * @returns {Promise<Object>} 표준 API 응답 (data 가 Spring Page 객체)
 */
export function fetchDormantUsers(params = {}) {
  return StandardizedApi.get(ADMIN_DORMANT_USERS_LIST_URL, params);
}

/**
 * 휴면 사용자 상세.
 *
 * @param {number|string} userId users.id
 * @returns {Promise<Object>} 표준 API 응답
 */
export function fetchDormantUserDetail(userId) {
  return StandardizedApi.get(adminDormantUserDetailUrl(userId));
}

/**
 * 휴면 사용자 강제 복귀 — DORMANT → ACTIVE.
 *
 * @param {number|string} userId users.id
 * @returns {Promise<Object>}
 */
export function reactivateDormantUser(userId) {
  return StandardizedApi.post(adminDormantUserReactivateUrl(userId), {});
}

/**
 * 휴면 사용자 강제 즉시 익명화 — DORMANT → ANONYMIZED.
 *
 * @param {number|string} userId users.id
 * @returns {Promise<Object>}
 */
export function forceAnonymizeDormantUser(userId) {
  return StandardizedApi.delete(adminDormantUserDetailUrl(userId));
}
