/**
 * 역할별 접근 가능 내부 경로 접두 SSOT — 로그인 복귀(login return) 허용 목록.
 *
 * App.js ProtectedRoute 정책과 정합:
 * - `/erp/*` = ADMIN 전용 (STAFF 불가)
 * - ADMIN(+ HQ_ADMIN 등 관리자 계열): `/admin/` + ERP LNB 접두
 * - STAFF: `/admin/` 만 (ERP 접두 제외)
 * - CLIENT / CONSULTANT: 각 랜딩 구역 (+ CLIENT 몰·오퍼 접두 SSOT)
 *
 * 접두는 {@link isReturnPathAllowedForPrefixes} 규칙에 맞게 trailing `/` 로 정규화한다.
 *
 * @author CoreSolution
 * @since 2026-10-13
 */

import { ERP_LNB_PATH_PREFIXES } from '../components/dashboard-v2/constants/menuItems';
import { CLIENT_SHOP_ROUTES } from '../constants/clientShopConstants';
import { CLIENT_OFFER_ROUTES } from '../constants/shopClientOfferConstants';
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
import {
  isReturnPathAllowedForPrefixes,
  sanitizeLoginReturnPath
} from './loginReturnPath';

/** @param {string} prefix */
const withTrailingSlash = (prefix) => {
  if (typeof prefix !== 'string' || !prefix.startsWith('/')) {
    return '';
  }
  return prefix.endsWith('/') ? prefix : `${prefix}/`;
};

/**
 * trailing-slash 정규화 후 동일 접두 제거(순서 유지).
 *
 * @param {ReadonlyArray<string>} prefixes
 * @returns {string[]}
 */
const dedupeNormalizedPrefixes = (prefixes) => {
  const seen = new Set();
  const out = [];
  prefixes.forEach((raw) => {
    const prefix = withTrailingSlash(raw);
    if (!prefix || seen.has(prefix)) {
      return;
    }
    seen.add(prefix);
    out.push(prefix);
  });
  return out;
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
 * 내담자 몰·맞춤 오퍼 로그인 복귀 접두 — App.js 라우트 상수에서 파생.
 * `/client/` 만으로도 하위는 통과하지만, SSOT·문서·테스트용으로 명시한다.
 * (CATALOG=`/client/shop` → `/client/shop/`, OFFERS=`/client/offers` → `/client/offers/`)
 */
export const CLIENT_LOGIN_RETURN_PATH_PREFIXES = Object.freeze(
  dedupeNormalizedPrefixes([
    CLIENT_SHOP_ROUTES.CATALOG,
    CLIENT_OFFER_ROUTES.OFFERS
  ])
);

/**
 * 정규화 역할 → 로그인 복귀 허용 접두 (불변).
 * STAFF 에 ERP 접두를 넣지 않는다 (STAFF_PERMISSION_POLICY / ProtectedRoute ADMIN only).
 * CLIENT 는 구역 `/client/` + 몰·오퍼 접두(중복 정규화·dedupe).
 */
export const ROLE_LOGIN_RETURN_ALLOWED_PREFIXES = Object.freeze({
  [ROLE_ADMIN]: Object.freeze([PATH_ZONE.ADMIN, ...ERP_LOGIN_RETURN_PATH_PREFIXES]),
  [ROLE_STAFF]: Object.freeze([PATH_ZONE.ADMIN]),
  [ROLE_CLIENT]: Object.freeze(
    dedupeNormalizedPrefixes([PATH_ZONE.CLIENT, ...CLIENT_LOGIN_RETURN_PATH_PREFIXES])
  ),
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

/**
 * 로그인 복귀 경로 단일 판정 API — sanitize + 역할 접두 허용을 한곳에서 수행.
 * 새 sanitize/allowlist 로직을 복붙하지 말고 이 함수를 재사용한다.
 *
 * @param {unknown} path 원시 복귀 경로(?redirect= 또는 저장값)
 * @param {{ role?: string, counselingEnabled?: boolean, hasOperatorRole?: boolean, hasCounselorRole?: boolean }|null|undefined} user
 * @returns {boolean}
 */
export const isLoginReturnPathAllowedForUser = (path, user) => {
  const sanitized = sanitizeLoginReturnPath(path);
  if (!sanitized) {
    return false;
  }
  return isReturnPathAllowedForPrefixes(
    sanitized,
    resolveRoleLoginReturnAllowedPrefixes(user)
  );
};

export { PATH_ZONE };
