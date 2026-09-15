/**
 * 프론트엔드 역할(Role) SSOT (Single Source Of Truth).
 *
 * PR-4/9 (refactor/role-ssot-fe-permission)에서 도입.
 * 4종 역할(ADMIN/STAFF/CONSULTANT/CLIENT) + ADMIN 상담 겸직(counselingEnabled) 기준.
 *
 * @author Core Solution
 * @since 2026-06-12
 */

import { USER_ROLES, LEGACY_USER_ROLES } from '../constants/roles';

export const ROLE_ADMIN = USER_ROLES.ADMIN;
export const ROLE_STAFF = USER_ROLES.STAFF;
export const ROLE_CONSULTANT = USER_ROLES.CONSULTANT;
export const ROLE_CLIENT = USER_ROLES.CLIENT;

const OPS_AWARE_LEGACY_ROLES = Object.freeze([
  LEGACY_USER_ROLES.HQ_MASTER,
  LEGACY_USER_ROLES.HQ_ADMIN,
  LEGACY_USER_ROLES.SUPER_HQ_ADMIN,
  LEGACY_USER_ROLES.SUPER_ADMIN
]);

export const SSOT_ROLES = Object.freeze([
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_CONSULTANT,
  ROLE_CLIENT
]);

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

export const getNormalizedRole = (user) => mapLegacyRole(extractRole(user));

const readCounselingEnabled = (user) => {
  if (!user || typeof user !== 'object') {
    return false;
  }
  if (typeof user.hasCounselorRole === 'boolean' && getNormalizedRole(user) === ROLE_ADMIN) {
    return user.hasCounselorRole;
  }
  return Boolean(user.counselingEnabled);
};

/**
 * BE availableRoles 또는 counselingEnabled 기반 가용 역할 목록.
 *
 * @param {{ role?: string, counselingEnabled?: boolean, availableRoles?: string[] }|null|undefined} user
 * @returns {string[]}
 */
export const getAvailableRoles = (user) => {
  if (!user || typeof user !== 'object') {
    return [];
  }
  if (Array.isArray(user.availableRoles) && user.availableRoles.length > 0) {
    return user.availableRoles.map((r) => mapLegacyRole(r) || r).filter(Boolean);
  }
  const roles = [];
  if (hasOperatorCapability(user)) {
    const op = getNormalizedRole(user);
    if (op) {
      roles.push(op);
    }
  }
  if (hasCounselorCapability(user)) {
    if (!roles.includes(ROLE_CONSULTANT)) {
      roles.push(ROLE_CONSULTANT);
    }
  }
  if (roles.length === 0) {
    const primary = getNormalizedRole(user);
    if (primary) {
      roles.push(primary);
    }
  }
  return roles;
};

export const isAdmin = (user) => getNormalizedRole(user) === ROLE_ADMIN;

export const isStaff = (user) => getNormalizedRole(user) === ROLE_STAFF;

/**
 * 상담사 역량 (CONSULTANT 또는 ADMIN+counselingEnabled).
 */
export const isConsultant = (user) => hasCounselorCapability(user);

export const isClient = (user) => getNormalizedRole(user) === ROLE_CLIENT;

export const isOps = (user) => {
  const raw = extractRole(user);
  if (!raw) {
    return false;
  }
  return OPS_AWARE_LEGACY_ROLES.includes(raw.toUpperCase());
};

/** @alias isConsultant */
export const isProfessionalProvider = (user) => hasCounselorCapability(user);

/**
 * 센터 운영(ADMIN/STAFF) 역량.
 */
export const hasOperatorCapability = (user) => {
  if (!user || typeof user !== 'object') {
    return false;
  }
  if (typeof user.hasOperatorRole === 'boolean') {
    return user.hasOperatorRole;
  }
  const normalized = getNormalizedRole(user);
  return normalized === ROLE_ADMIN || normalized === ROLE_STAFF;
};

/**
 * 상담사 역량 (CONSULTANT 또는 ADMIN+counselingEnabled).
 */
export const hasCounselorCapability = (user) => {
  if (!user || typeof user !== 'object') {
    return false;
  }
  if (typeof user.hasCounselorRole === 'boolean') {
    return user.hasCounselorRole;
  }
  const normalized = getNormalizedRole(user);
  if (normalized === ROLE_CONSULTANT) {
    return true;
  }
  return normalized === ROLE_ADMIN && readCounselingEnabled(user);
};

export const hasAnyRole = (user, roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return false;
  }
  const available = getAvailableRoles(user);
  if (available.length > 0) {
    const normalizedTargets = roles.map((r) => mapLegacyRole(r) || r).filter(Boolean);
    return normalizedTargets.some((target) => available.includes(target));
  }
  const normalizedUserRole = getNormalizedRole(user);
  if (!normalizedUserRole) {
    return false;
  }
  return roles.some((r) => {
    const target = mapLegacyRole(r);
    if (target === ROLE_CONSULTANT) {
      return hasCounselorCapability(user);
    }
    if (target === ROLE_ADMIN || target === ROLE_STAFF) {
      return hasOperatorCapability(user) && normalizedUserRole === target;
    }
    return target === normalizedUserRole;
  });
};

export const hasRole = (user, role) => {
  const normalizedTarget = mapLegacyRole(role);
  if (!normalizedTarget) {
    return false;
  }
  return hasAnyRole(user, [normalizedTarget]);
};

const RoleUtils = Object.freeze({
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_CONSULTANT,
  ROLE_CLIENT,
  SSOT_ROLES,
  mapLegacyRole,
  getNormalizedRole,
  getAvailableRoles,
  isAdmin,
  isStaff,
  isConsultant,
  isClient,
  isOps,
  isProfessionalProvider,
  hasOperatorCapability,
  hasCounselorCapability,
  hasRole,
  hasAnyRole
});

export default RoleUtils;
