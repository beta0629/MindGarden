/**
 * 프론트엔드 역할(Role) SSOT (Single Source Of Truth).
 *
 * PR-4/9 (refactor/role-ssot-fe-permission)에서 도입.
 * 4종 역할(ADMIN/STAFF/CONSULTANT/CLIENT) 기준으로 권한 분기를 일관 처리한다.
 *
 * 사용 원칙:
 *   - 위젯·페이지에서 역할 비교는 본 모듈의 헬퍼만 사용한다.
 *   - `role === 'ADMIN'` 같은 인라인 문자열 비교는 금지.
 *   - 레거시 역할 문자열(BRANCH_*, HQ_*, TENANT_ADMIN 등)은 mapLegacyRole 로 4종 SSOT
 *     역할로 변환한 뒤 비교한다.
 *   - 전문가(상담사) 세부 유형(PLAY_THERAPIST 등)은 isConsultant 가 true 인 사용자에 대해
 *     별도 subtype 분기로 처리한다. (isProfessionalProvider 는 CONSULTANT 본인만 true)
 *
 * 기존 `constants/roles.js` 의 RoleUtils / USER_ROLES 도 본 파일과 동일한 규약을 따른다.
 * 본 파일은 위젯·페이지 등 utils 레이어에서 import 하기 쉬운 SSOT 엔트리이다.
 *
 * @author Core Solution
 * @since 2026-06-12
 */

import { USER_ROLES, LEGACY_USER_ROLES } from '../constants/roles';

/**
 * 4종 SSOT 역할 상수.
 *
 * USER_ROLES 값과 동일하지만, 본 모듈을 사용하는 코드가 다른 파일을 추가로 import 하지
 * 않아도 되도록 별도로 제공한다.
 */
export const ROLE_ADMIN = USER_ROLES.ADMIN;
export const ROLE_STAFF = USER_ROLES.STAFF;
export const ROLE_CONSULTANT = USER_ROLES.CONSULTANT;
export const ROLE_CLIENT = USER_ROLES.CLIENT;

/**
 * 4종 SSOT 역할 목록.
 */
export const SSOT_ROLES = Object.freeze([
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_CONSULTANT,
  ROLE_CLIENT
]);

/**
 * 레거시 → 4종 SSOT 매핑 테이블.
 *
 * - 관리자 계열(BRANCH_*, HQ_*, TENANT_ADMIN, SUPER_*, PRINCIPAL, OWNER) → ADMIN
 * - 전문가 세부 유형(PLAY_THERAPIST, SPEECH_THERAPIST, ROLE_CONSULTANT) → CONSULTANT
 * - ROLE_CLIENT → CLIENT
 *
 * 정의되지 않은 값은 입력 그대로 반환하지 않고 null 을 돌려준다(엄격 모드).
 * mapLegacyRole 은 이 테이블을 사용하되, 이미 4종 SSOT 인 경우 그대로 반환한다.
 */
const LEGACY_ROLE_TO_SSOT = Object.freeze({
  [LEGACY_USER_ROLES.SUPER_ADMIN]: ROLE_ADMIN,
  [LEGACY_USER_ROLES.HQ_ADMIN]: ROLE_ADMIN,
  [LEGACY_USER_ROLES.HQ_MASTER]: ROLE_ADMIN,
  [LEGACY_USER_ROLES.SUPER_HQ_ADMIN]: ROLE_ADMIN,
  [LEGACY_USER_ROLES.BRANCH_ADMIN]: ROLE_ADMIN,
  [LEGACY_USER_ROLES.BRANCH_SUPER_ADMIN]: ROLE_ADMIN,
  [LEGACY_USER_ROLES.TENANT_ADMIN]: ROLE_ADMIN,
  [LEGACY_USER_ROLES.PRINCIPAL]: ROLE_ADMIN,
  [LEGACY_USER_ROLES.OWNER]: ROLE_ADMIN,
  [USER_ROLES.PLAY_THERAPIST]: ROLE_CONSULTANT,
  [USER_ROLES.SPEECH_THERAPIST]: ROLE_CONSULTANT,
  [LEGACY_USER_ROLES.ROLE_CONSULTANT]: ROLE_CONSULTANT,
  [LEGACY_USER_ROLES.ROLE_CLIENT]: ROLE_CLIENT
});

/**
 * user 객체에서 role 문자열을 안전하게 추출.
 *
 * @param {{ role?: string|null }|null|undefined} user
 * @returns {string|null}
 */
const extractRole = (user) => {
  if (!user || typeof user !== 'object') {
    return null;
  }
  const raw = user.role;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return null;
};

/**
 * 레거시 역할 문자열을 4종 SSOT 역할로 매핑한다.
 *
 * - 이미 4종 SSOT(ADMIN/STAFF/CONSULTANT/CLIENT) 인 경우 그대로 반환.
 * - 매핑 테이블에 포함된 레거시 값은 4종 SSOT 값으로 변환.
 * - 그 외 알 수 없는 값은 null 을 반환한다(엄격 매칭).
 *
 * @param {string|null|undefined} role
 * @returns {string|null} 4종 SSOT 역할 또는 null
 */
export const mapLegacyRole = (role) => {
  if (role == null) {
    return null;
  }
  const normalized = String(role).trim();
  if (normalized.length === 0) {
    return null;
  }
  if (SSOT_ROLES.includes(normalized)) {
    return normalized;
  }
  return LEGACY_ROLE_TO_SSOT[normalized] || null;
};

/**
 * user 의 role 을 4종 SSOT 역할로 정규화한 값을 반환한다.
 *
 * @param {{ role?: string|null }|null|undefined} user
 * @returns {string|null}
 */
export const getNormalizedRole = (user) => mapLegacyRole(extractRole(user));

/**
 * @param {{ role?: string|null }|null|undefined} user
 * @returns {boolean}
 */
export const isAdmin = (user) => getNormalizedRole(user) === ROLE_ADMIN;

/**
 * @param {{ role?: string|null }|null|undefined} user
 * @returns {boolean}
 */
export const isStaff = (user) => getNormalizedRole(user) === ROLE_STAFF;

/**
 * 상담사 여부(전문가 세부 유형 포함).
 * 레거시 PLAY_THERAPIST/SPEECH_THERAPIST/ROLE_CONSULTANT 도 true.
 *
 * @param {{ role?: string|null }|null|undefined} user
 * @returns {boolean}
 */
export const isConsultant = (user) => getNormalizedRole(user) === ROLE_CONSULTANT;

/**
 * @param {{ role?: string|null }|null|undefined} user
 * @returns {boolean}
 */
export const isClient = (user) => getNormalizedRole(user) === ROLE_CLIENT;

/**
 * 전문가 제공자(CONSULTANT) 여부.
 *
 * - 정의: 정규화된 역할이 CONSULTANT 인 사용자(전문가 세부 유형 포함).
 * - subtype(놀이치료·언어치료 등) 분기는 별도 헬퍼/세부 유형 코드로 처리한다.
 *
 * @param {{ role?: string|null }|null|undefined} user
 * @returns {boolean}
 */
export const isProfessionalProvider = (user) => isConsultant(user);

/**
 * user 의 역할이 주어진 4종 SSOT 역할 목록 중 하나에 해당하는지 확인.
 * 입력 역할 목록은 레거시 값을 포함할 수 있으며, 비교 전 mapLegacyRole 로 정규화된다.
 *
 * @param {{ role?: string|null }|null|undefined} user
 * @param {string[]|null|undefined} roles
 * @returns {boolean}
 */
export const hasAnyRole = (user, roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return false;
  }
  const normalizedUserRole = getNormalizedRole(user);
  if (!normalizedUserRole) {
    return false;
  }
  return roles.some((r) => mapLegacyRole(r) === normalizedUserRole);
};

/**
 * user 의 역할이 주어진 단일 역할과 같은지 확인(레거시 값 자동 정규화).
 *
 * @param {{ role?: string|null }|null|undefined} user
 * @param {string|null|undefined} role
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  const normalizedUserRole = getNormalizedRole(user);
  const normalizedTarget = mapLegacyRole(role);
  return !!normalizedUserRole && normalizedUserRole === normalizedTarget;
};

/**
 * RoleUtils 디폴트 export.
 *
 * 기존 `constants/roles.js` 의 RoleUtils 와 형태를 맞추되, 4종 SSOT 기준으로 동작한다.
 */
const RoleUtils = Object.freeze({
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_CONSULTANT,
  ROLE_CLIENT,
  SSOT_ROLES,
  mapLegacyRole,
  getNormalizedRole,
  isAdmin,
  isStaff,
  isConsultant,
  isClient,
  isProfessionalProvider,
  hasRole,
  hasAnyRole
});

export default RoleUtils;
