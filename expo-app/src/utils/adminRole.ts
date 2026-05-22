/**
 * 관리자 모바일 — 앱 역할 판별·API 역할 매핑
 *
 * UI 분기·탭 가드는 `useAuthStore.role`을 SSOT로 사용한다.
 * JWT 해석(`resolveAdminMobileJwtRole`)은 스케줄 API `userRole` 쿼리 등
 * 백엔드가 토큰 claim을 기대하는 호출에만 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import type { AppAuthRole } from '@/stores/useAuthStore';
import { decodeJwtPayload } from './jwtPayload';

export type { AppAuthRole };

const PROFESSIONAL_PROVIDER_ROLES = new Set([
  'CONSULTANT',
  'PLAY_THERAPIST',
  'SPEECH_THERAPIST',
  'COUNSELOR',
]);

const ADMIN_API_ROLES = new Set([
  'ADMIN',
  'TENANT_ADMIN',
  'TENANTADMIN',
  'PRINCIPAL',
  'OWNER',
  'BRANCH_ADMIN',
  'BRANCH_SUPER_ADMIN',
  'HQ_ADMIN',
  'SUPER_HQ_ADMIN',
  'HQ_MASTER',
  'HQ_SUPER_ADMIN',
  'BRANCH_MANAGER',
  'SUPERADMIN',
  'ROOT',
  '원장',
  '사장',
  '테넌트관리자',
]);

const STAFF_API_ROLES = new Set(['STAFF', 'PARENT', '학부모', 'OFFICE_STAFF', 'OFFICESTAFF']);

const CLIENT_API_ROLES = new Set(['CLIENT', 'USER', 'CUSTOMER']);

/** 스케줄 API `userRole` — JWT claim 해석 결과 */
export type AdminMobileJwtRole = 'ADMIN' | 'STAFF';

const JWT_ADMIN_ROLE_CODES = new Set([
  'ADMIN',
  'TENANT_ADMIN',
  'TENANTADMIN',
  'HQ_ADMIN',
  'BRANCH_ADMIN',
  'SUPERADMIN',
]);

const JWT_STAFF_ROLE_CODES = new Set(['STAFF', 'OFFICE_STAFF', 'OFFICESTAFF']);

/**
 * API 응답 `role` — 문자열 또는 `{ name: "ADMIN" }` 등 객체를 문자열로 통일.
 */
export function coerceApiRoleString(raw: unknown): string | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof raw === 'object') {
    const rec = raw as Record<string, unknown>;
    const nested = rec.name ?? rec.role ?? rec.code ?? rec.value;
    if (nested != null && nested !== raw) {
      return coerceApiRoleString(nested);
    }
  }
  const asString = String(raw).trim();
  if (!asString.length || asString === '[object Object]') {
    return null;
  }
  return asString;
}

function normalizeApiRole(apiRole: string | undefined | null): string {
  const trimmed = (apiRole ?? 'CLIENT').trim().toUpperCase();
  return trimmed.startsWith('ROLE_') ? trimmed.slice(5) : trimmed;
}

function normalizeJwtRoleToken(raw: unknown): string {
  const trimmed = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  return trimmed.startsWith('ROLE_') ? trimmed.slice(5) : trimmed;
}

/**
 * 백엔드 `UserRole` 문자열 → Expo 스토어 역할.
 * ADMIN·레거시 테넌트 관리자는 `admin`, STAFF는 `staff`, 전문가 계열은 `consultant`.
 */
export function mapApiRoleToStoreRole(apiRole: string | undefined | null | unknown): AppAuthRole {
  const normalized = normalizeApiRole(coerceApiRoleString(apiRole) ?? undefined);

  if (PROFESSIONAL_PROVIDER_ROLES.has(normalized)) {
    return 'consultant';
  }
  if (ADMIN_API_ROLES.has(normalized)) {
    return 'admin';
  }
  if (STAFF_API_ROLES.has(normalized)) {
    return 'staff';
  }
  if (CLIENT_API_ROLES.has(normalized)) {
    return 'client';
  }

  return 'client';
}

export function isAdminRole(role: AppAuthRole | null | undefined): role is 'admin' {
  return role === 'admin';
}

export function isStaffRole(role: AppAuthRole | null | undefined): role is 'staff' {
  return role === 'staff';
}

/** 커뮤니티 검수 API — Spring `@PreAuthorize hasRole('ADMIN')` */
export function canAccessCommunityModeration(role: AppAuthRole | null | undefined): boolean {
  return isAdminRole(role);
}

/** 관리자 모바일 5탭 셸 진입 역할 */
export function isAdminMobileShellRole(role: AppAuthRole | null | undefined): boolean {
  return isAdminRole(role) || isStaffRole(role);
}

export type ClientConsultantRole = 'client' | 'consultant';

/**
 * 메시지·프로필·푸시 등 client/consultant 이원 API용.
 * 어드민 모바일 메시지 탭은 `GET /consultation-messages/all`(MESSAGE_MANAGE)을 사용한다.
 */
export function toClientConsultantMessagingRole(
  role: AppAuthRole | null | undefined,
): ClientConsultantRole {
  return role === 'consultant' ? 'consultant' : 'client';
}

/** 어드민 모바일 — tenant 전체 메시지 목록 API 사용 대상 */
export function usesAdminMessagingAllApi(role: AppAuthRole | null | undefined): boolean {
  return isAdminMobileShellRole(role);
}

function jwtRoleFromPayload(payload: Record<string, unknown> | null): AdminMobileJwtRole | null {
  if (!payload) {
    return null;
  }

  const direct = normalizeJwtRoleToken(payload.role ?? payload.userRole ?? payload.primaryRole);
  if (JWT_ADMIN_ROLE_CODES.has(direct)) {
    return 'ADMIN';
  }
  if (JWT_STAFF_ROLE_CODES.has(direct)) {
    return 'STAFF';
  }

  const authorities = payload.authorities ?? payload.roles ?? payload.scope;
  const list = Array.isArray(authorities)
    ? authorities.map((a) => normalizeJwtRoleToken(a))
    : typeof authorities === 'string'
      ? authorities.split(/[\s,]+/).map((a) => normalizeJwtRoleToken(a))
      : [];

  for (const code of list) {
    if (JWT_ADMIN_ROLE_CODES.has(code)) {
      return 'ADMIN';
    }
  }
  for (const code of list) {
    if (JWT_STAFF_ROLE_CODES.has(code)) {
      return 'STAFF';
    }
  }

  return null;
}

const STORE_ROLE_PRIORITY: readonly AppAuthRole[] = [
  'admin',
  'staff',
  'consultant',
  'client',
];

function collectApiRoleCandidates(payload: Record<string, unknown>): string[] {
  const out: string[] = [];
  const direct = payload.role ?? payload.userRole ?? payload.primaryRole;
  const directCoerced = coerceApiRoleString(direct);
  if (directCoerced) {
    out.push(directCoerced);
  }

  const authorities = payload.authorities ?? payload.roles ?? payload.scope;
  const list = Array.isArray(authorities)
    ? authorities
    : typeof authorities === 'string'
      ? authorities.split(/[\s,]+/)
      : [];
  for (const raw of list) {
    const coerced = coerceApiRoleString(raw);
    if (coerced) {
      out.push(coerced);
    }
  }
  return out;
}

function pickHighestStoreRoleFromCandidates(candidates: string[]): AppAuthRole | null {
  if (candidates.length === 0) {
    return null;
  }
  let best: AppAuthRole | null = null;
  let bestIdx = STORE_ROLE_PRIORITY.length;
  for (const raw of candidates) {
    const mapped = mapApiRoleToStoreRole(raw);
    const idx = STORE_ROLE_PRIORITY.indexOf(mapped);
    if (idx >= 0 && idx < bestIdx) {
      bestIdx = idx;
      best = mapped;
    }
  }
  return best;
}

/** JWT payload — SecureStore 복구 시 MMKV 역할과 동기화 */
export function resolveStoreRoleFromJwtPayload(
  payload: Record<string, unknown> | null,
): AppAuthRole | null {
  if (!payload) {
    return null;
  }
  return pickHighestStoreRoleFromCandidates(collectApiRoleCandidates(payload));
}

/** accessToken — 앱 재시작 후 스토어 `role` SSOT 동기화 */
export function resolveStoreRoleFromAccessToken(
  accessToken: string | null | undefined,
): AppAuthRole | null {
  if (!accessToken?.trim()) {
    return null;
  }
  return resolveStoreRoleFromJwtPayload(decodeJwtPayload(accessToken));
}

/** accessToken payload — 스케줄 API `userRole` 전용 (UI는 스토어 역할 사용) */
export function resolveAdminMobileJwtRole(
  accessToken: string | null | undefined,
): AdminMobileJwtRole | null {
  if (!accessToken?.trim()) {
    return null;
  }
  return jwtRoleFromPayload(decodeJwtPayload(accessToken));
}

export function isAdminMobileAdminRole(role: AdminMobileJwtRole | null): boolean {
  return role === 'ADMIN';
}

/** 스케줄 API `userRole` 쿼리 — JWT claim 그대로(등록·타임슬롯 등) */
export function adminMobileScheduleUserRole(role: AdminMobileJwtRole | null): string | null {
  return role ?? null;
}

/**
 * 허브 일정 목록 `GET .../schedules/date/{date}` 전용 `userRole`.
 *
 * `counseling_enabled` ADMIN은 `userRole=ADMIN` 시 본인 consultantId 일정만 조회하지만,
 * `POST .../schedules/consultant` 로 타 상담사 일정 등록은 가능하다. 목록 범위를 STAFF와
 * 동일(테넌트 전체)로 맞춘다. UI·탭 가드는 JWT/스토어 ADMIN 그대로 유지한다.
 */
export function adminMobileScheduleListUserRole(role: AdminMobileJwtRole | null): string | null {
  if (role === 'ADMIN') {
    return 'STAFF';
  }
  return adminMobileScheduleUserRole(role);
}

/** JWT role claim 누락 시 스토어 역할 → 스케줄 API `userRole` */
export function resolveAdminMobileJwtRoleFromStoreRole(
  role: AppAuthRole | null | undefined,
): AdminMobileJwtRole | null {
  if (role === 'admin') {
    return 'ADMIN';
  }
  if (role === 'staff') {
    return 'STAFF';
  }
  return null;
}

function normalizePermissionToken(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

function collectJwtPermissionTokens(payload: Record<string, unknown> | null): string[] {
  if (!payload) {
    return [];
  }
  const perms = payload.permissions ?? payload.permission;
  if (Array.isArray(perms)) {
    return perms.map((p) => normalizePermissionToken(p));
  }
  if (typeof perms === 'string') {
    return perms.split(/[\s,]+/).map((p) => normalizePermissionToken(p));
  }
  return [];
}

/** JWT `permissions` claim — DynamicPermissionService 코드와 동일 문자열 */
export function hasJwtPermission(
  accessToken: string | null | undefined,
  permissionCode: string,
): boolean {
  if (!accessToken?.trim()) {
    return false;
  }
  const target = normalizePermissionToken(permissionCode);
  const tokens = collectJwtPermissionTokens(decodeJwtPayload(accessToken));
  return tokens.includes(target);
}

/** 스태프 상담사 등록 UI — ADMIN 항상, STAFF는 CONSULTANT_MANAGE */
export function canRegisterConsultantOnMobile(
  storeRole: AppAuthRole | null | undefined,
  accessToken: string | null | undefined,
): boolean {
  if (isAdminRole(storeRole)) {
    return true;
  }
  if (isStaffRole(storeRole)) {
    return hasJwtPermission(accessToken, 'CONSULTANT_MANAGE');
  }
  return false;
}

/** 스태프 등록 — ADMIN + USER_MANAGE (UI는 admin만 노출, JWT는 이중 확인용) */
export function canRegisterStaffOnMobile(storeRole: AppAuthRole | null | undefined): boolean {
  return isAdminRole(storeRole);
}

/** 매칭 목록 — ADMIN 또는 JWT MAPPING_VIEW (STAFF 기본) */
export function canViewMappingsOnMobile(
  storeRole: AppAuthRole | null | undefined,
  accessToken: string | null | undefined,
): boolean {
  if (isAdminRole(storeRole)) {
    return true;
  }
  if (isStaffRole(storeRole)) {
    return hasJwtPermission(accessToken, 'MAPPING_VIEW');
  }
  return false;
}

/** 신규 매칭 생성 — ADMIN 또는 JWT MAPPING_MANAGE */
export function canManageMappingsOnMobile(
  storeRole: AppAuthRole | null | undefined,
  accessToken: string | null | undefined,
): boolean {
  if (isAdminRole(storeRole)) {
    return true;
  }
  if (isStaffRole(storeRole)) {
    return hasJwtPermission(accessToken, 'MAPPING_MANAGE');
  }
  return false;
}
