/**
 * 역할별 접근 가능 내부 경로 접두 SSOT — 로그인 복귀(login return) 허용 목록.
 *
 * App.js ProtectedRoute 정책과 정합:
 * - `/erp/*` = ADMIN 전용 (STAFF 불가)
 * - ADMIN(+ HQ_ADMIN 등 관리자 계열): `/admin/` + ERP LNB 접두
 * - STAFF: `/admin/` 만 (ERP 접두 제외)
 * - CLIENT / CONSULTANT: 각 랜딩 구역
 *
 * 접두는 {@link isReturnPathAllowedForPrefixes} 규칙에 맞게 trailing `/` 로 정규화한다.
 *
 * @author CoreSolution
 * @since 2026-10-13
 */

import { ERP_LNB_PATH_PREFIXES } from '../components/dashboard-v2/constants/menuItems';
import {
  getNormalizedRole,
  hasCounselorCapability,
  hasOperatorCapability,
  isAdmin,
  isClient,
  isStaff,
  ROLE_ADMIN,
  ROLE_CLIENT,
  ROLE_CONSULTANT,
  ROLE_STAFF
} from './RoleUtils';

/** @param {string} prefix */
const withTrailingSlash = (prefix) => {
  if (typeof prefix !== 'string' || !prefix.startsWith('/')) {
    return '';
  }
  return prefix.endsWith('/') ? prefix : `${prefix}/`;
};

const PATH_ZONE = Object.freeze({
  ADMIN: '/admin/',
  CLIENT: '/client/',
  CONSULTANT: '/consultant/'
});

/**
 * ERP LNB 접두를 로그인 복귀용 trailing-slash 형태로 정규화.
 * `/admin/erp` 는 `/admin/` 하위이므로 ADMIN 목록에 중복 넣지 않는다.
 */
export const ERP_LOGIN_RETURN_PATH_PREFIXES = Object.freeze(
  ERP_LNB_PATH_PREFIXES
    .map(withTrailingSlash)
    .filter((prefix) => prefix && !prefix.startsWith(PATH_ZONE.ADMIN))
);

/**
 * 정규화 역할 → 로그인 복귀 허용 접두 (불변).
 * STAFF 에 ERP 접두를 넣지 않는다 (STAFF_PERMISSION_POLICY / ProtectedRoute ADMIN only).
 */
export const ROLE_LOGIN_RETURN_ALLOWED_PREFIXES = Object.freeze({
  [ROLE_ADMIN]: Object.freeze([PATH_ZONE.ADMIN, ...ERP_LOGIN_RETURN_PATH_PREFIXES]),
  [ROLE_STAFF]: Object.freeze([PATH_ZONE.ADMIN]),
  [ROLE_CLIENT]: Object.freeze([PATH_ZONE.CLIENT]),
  [ROLE_CONSULTANT]: Object.freeze([PATH_ZONE.CONSULTANT])
});

/**
 * 사용자 역할·역량에 따른 로그인 복귀 허용 경로 접두.
 *
 * @param {{ role?: string, counselingEnabled?: boolean, hasOperatorRole?: boolean, hasCounselorRole?: boolean }|null|undefined} user
 * @returns {string[]}
 */
export const resolveRoleLoginReturnAllowedPrefixes = (user) => {
  if (!user) {
    return [];
  }
  if (isAdmin(user)) {
    return [...ROLE_LOGIN_RETURN_ALLOWED_PREFIXES[ROLE_ADMIN]];
  }
  if (isStaff(user)) {
    return [...ROLE_LOGIN_RETURN_ALLOWED_PREFIXES[ROLE_STAFF]];
  }
  // 레거시 플래그만 있는 운영자 — STAFF 와 동일(ERP 제외). ADMIN 은 위에서 처리.
  if (hasOperatorCapability(user)) {
    return [...ROLE_LOGIN_RETURN_ALLOWED_PREFIXES[ROLE_STAFF]];
  }
  if (hasCounselorCapability(user)) {
    return [...ROLE_LOGIN_RETURN_ALLOWED_PREFIXES[ROLE_CONSULTANT]];
  }
  if (isClient(user)) {
    return [...ROLE_LOGIN_RETURN_ALLOWED_PREFIXES[ROLE_CLIENT]];
  }
  const normalized = getNormalizedRole(user);
  if (normalized && ROLE_LOGIN_RETURN_ALLOWED_PREFIXES[normalized]) {
    return [...ROLE_LOGIN_RETURN_ALLOWED_PREFIXES[normalized]];
  }
  return [];
};

export { PATH_ZONE };
