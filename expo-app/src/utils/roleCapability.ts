/**
 * Expo 역할 역량 SSOT — 웹 `frontend/src/utils/RoleUtils.js` 미러
 *
 * 4종 역할(ADMIN/STAFF/CONSULTANT/CLIENT) + ADMIN 상담 겸직(counselingEnabled) 기준.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
import type { AppAuthRole } from '@/stores/useAuthStore';

export const ROLE_ADMIN = 'ADMIN';
export const ROLE_STAFF = 'STAFF';
export const ROLE_CONSULTANT = 'CONSULTANT';
export const ROLE_CLIENT = 'CLIENT';

export const SSOT_ROLES = Object.freeze([
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_CONSULTANT,
  ROLE_CLIENT,
]);

const STORE_ROLE_TO_SSOT: Readonly<Record<AppAuthRole, string>> = {
  admin: ROLE_ADMIN,
  staff: ROLE_STAFF,
  consultant: ROLE_CONSULTANT,
  client: ROLE_CLIENT,
};

const LEGACY_ROLE_TO_SSOT: Readonly<Record<string, string>> = Object.freeze({
  SUPER_ADMIN: ROLE_ADMIN,
  HQ_ADMIN: ROLE_ADMIN,
  HQ_MASTER: ROLE_ADMIN,
  SUPER_HQ_ADMIN: ROLE_ADMIN,
  BRANCH_ADMIN: ROLE_ADMIN,
  BRANCH_SUPER_ADMIN: ROLE_ADMIN,
  TENANT_ADMIN: ROLE_ADMIN,
  PRINCIPAL: ROLE_ADMIN,
  OWNER: ROLE_ADMIN,
  PLAY_THERAPIST: ROLE_CONSULTANT,
  SPEECH_THERAPIST: ROLE_CONSULTANT,
  COUNSELOR: ROLE_CONSULTANT,
  ROLE_CONSULTANT: ROLE_CONSULTANT,
  ROLE_CLIENT: ROLE_CLIENT,
});

/** BE capability 필드 또는 스토어 `User` */
export type RoleCapabilityUserLike = {
  role?: AppAuthRole | string | null;
  counselingEnabled?: boolean;
  hasOperatorRole?: boolean;
  hasCounselorRole?: boolean;
  availableRoles?: string[];
};

function extractRole(user: RoleCapabilityUserLike | null | undefined): string | null {
  if (!user || typeof user !== 'object') {
    return null;
  }
  const raw = user.role;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return null;
}

export function mapLegacyRole(role: string | null | undefined): string | null {
  if (role == null) {
    return null;
  }
  const normalized = String(role).trim();
  if (normalized.length === 0) {
    return null;
  }

  const lower = normalized.toLowerCase();
  if (lower in STORE_ROLE_TO_SSOT) {
    return STORE_ROLE_TO_SSOT[lower as AppAuthRole];
  }

  const upper = normalized.toUpperCase();
  if ((SSOT_ROLES as readonly string[]).includes(upper)) {
    return upper;
  }
  return LEGACY_ROLE_TO_SSOT[upper] ?? null;
}

export function getNormalizedRole(user: RoleCapabilityUserLike | null | undefined): string | null {
  return mapLegacyRole(extractRole(user));
}

function readCounselingEnabled(user: RoleCapabilityUserLike): boolean {
  if (typeof user.hasCounselorRole === 'boolean' && getNormalizedRole(user) === ROLE_ADMIN) {
    return user.hasCounselorRole;
  }
  return Boolean(user.counselingEnabled);
}

/**
 * BE availableRoles 또는 counselingEnabled 기반 가용 역할 목록.
 */
export function getAvailableRoles(user: RoleCapabilityUserLike | null | undefined): string[] {
  if (!user || typeof user !== 'object') {
    return [];
  }
  if (Array.isArray(user.availableRoles) && user.availableRoles.length > 0) {
    return user.availableRoles.map((r) => mapLegacyRole(r) || r).filter(Boolean);
  }
  const roles: string[] = [];
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
}

/** 센터 운영(ADMIN/STAFF) 역량 */
export function hasOperatorCapability(user: RoleCapabilityUserLike | null | undefined): boolean {
  if (!user || typeof user !== 'object') {
    return false;
  }
  if (typeof user.hasOperatorRole === 'boolean') {
    return user.hasOperatorRole;
  }
  const normalized = getNormalizedRole(user);
  return normalized === ROLE_ADMIN || normalized === ROLE_STAFF;
}

/** 상담사 역량 (CONSULTANT 또는 ADMIN+counselingEnabled) */
export function hasCounselorCapability(user: RoleCapabilityUserLike | null | undefined): boolean {
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
}

export function hasAnyRole(
  user: RoleCapabilityUserLike | null | undefined,
  roles: string[],
): boolean {
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
}

/** 푸시·메시징 — 상담 역량이 있으면 consultant 셸 */
export function resolvePushShellRole(
  user: RoleCapabilityUserLike | null | undefined,
): 'client' | 'consultant' {
  return hasCounselorCapability(user) ? 'consultant' : 'client';
}

/** 듀얼 역할 배지 — 운영+상담 겸직일 때만 */
export function formatDualRoleLabel(user: RoleCapabilityUserLike | null | undefined): string | null {
  if (hasOperatorCapability(user) && hasCounselorCapability(user)) {
    return '운영 · 상담';
  }
  return null;
}

export function isDualRoleUser(user: RoleCapabilityUserLike | null | undefined): boolean {
  return hasOperatorCapability(user) && hasCounselorCapability(user);
}
