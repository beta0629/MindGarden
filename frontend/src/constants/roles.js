/**
 * 사용자 역할 상수 정의 (ADMIN, STAFF, 전문가 3종, CLIENT)
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-01-28
 * @updated 2026-02 - 4역할만 사용 (BRANCH_*, HQ_*, TENANT_ADMIN 등 제거)
 */

/** 표준 역할 (관리·사무·내담자 + 전문가 유형) */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CONSULTANT: 'CONSULTANT',
  PLAY_THERAPIST: 'PLAY_THERAPIST',
  SPEECH_THERAPIST: 'SPEECH_THERAPIST',
  CLIENT: 'CLIENT'
};

/**
 * 레거시·확장 역할 상수.
 *
 * - 4역할 단순화(2026-02) 이후에도 일부 화면·권한 가드·표준 문서
 *   (docs/standards/PERMISSION_SYSTEM_STANDARD.md v2.2.1)에서 여전히
 *   비교되는 문자열을 상수화하기 위해 유지한다.
 * - 신규 코드에서는 USER_ROLES 만 사용한다.
 *
 * @deprecated 신규 코드에서 사용 금지. 운영 정리 대상.
 */
export const LEGACY_USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  HQ_ADMIN: 'HQ_ADMIN',
  HQ_MASTER: 'HQ_MASTER',
  SUPER_HQ_ADMIN: 'SUPER_HQ_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  BRANCH_SUPER_ADMIN: 'BRANCH_SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  OWNER: 'OWNER',
  ROLE_CONSULTANT: 'ROLE_CONSULTANT',
  ROLE_CLIENT: 'ROLE_CLIENT'
};

/** 관리자 역할 (서버 역할 ADMIN 기준). 표시/선택용은 getAdminRoles() 사용. */
const SERVER_ADMIN_ROLE = 'ADMIN';
let ADMIN_ROLES = [USER_ROLES.ADMIN];

/**
 * 공통코드에서 역할 목록을 동적으로 로드하여 업데이트 (4개 역할만 반환)
 *
 * @returns {Promise<void>}
 */
export const loadRoleCodesFromCommonCode = async() => {
  try {
    const { getAdminRoleCodes } = await import('../utils/roleCodeUtils');
    ADMIN_ROLES = await getAdminRoleCodes();
    console.log('✅ 역할 코드 공통코드에서 로드 완료:', { admin: ADMIN_ROLES.length });
  } catch (error) {
    console.warn('⚠️ 역할 코드 공통코드 로드 실패, 기본값 사용:', error);
  }
};

if (typeof window !== 'undefined') {
  loadRoleCodesFromCommonCode().catch(console.error);
}

export const getAdminRoles = () => ADMIN_ROLES;

/** 표준 역할 4개 배열 (드롭다운/목록용) */
export const ROLES_LIST = [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CONSULTANT, USER_ROLES.CLIENT];

/**
 * 레거시 → 4종 SSOT 매핑 테이블.
 * PR-4/9 (refactor/role-ssot-fe-permission) 기준.
 *
 * - 관리자 계열 → ADMIN
 * - 전문가 세부 유형(PLAY_THERAPIST/SPEECH_THERAPIST/ROLE_CONSULTANT) → CONSULTANT
 * - ROLE_CLIENT → CLIENT
 */
const LEGACY_ROLE_TO_SSOT = Object.freeze({
  [LEGACY_USER_ROLES.SUPER_ADMIN]: USER_ROLES.ADMIN,
  [LEGACY_USER_ROLES.HQ_ADMIN]: USER_ROLES.ADMIN,
  [LEGACY_USER_ROLES.HQ_MASTER]: USER_ROLES.ADMIN,
  [LEGACY_USER_ROLES.SUPER_HQ_ADMIN]: USER_ROLES.ADMIN,
  [LEGACY_USER_ROLES.BRANCH_ADMIN]: USER_ROLES.ADMIN,
  [LEGACY_USER_ROLES.BRANCH_SUPER_ADMIN]: USER_ROLES.ADMIN,
  [LEGACY_USER_ROLES.TENANT_ADMIN]: USER_ROLES.ADMIN,
  [LEGACY_USER_ROLES.PRINCIPAL]: USER_ROLES.ADMIN,
  [LEGACY_USER_ROLES.OWNER]: USER_ROLES.ADMIN,
  [USER_ROLES.PLAY_THERAPIST]: USER_ROLES.CONSULTANT,
  [USER_ROLES.SPEECH_THERAPIST]: USER_ROLES.CONSULTANT,
  [LEGACY_USER_ROLES.ROLE_CONSULTANT]: USER_ROLES.CONSULTANT,
  [LEGACY_USER_ROLES.ROLE_CLIENT]: USER_ROLES.CLIENT
});

const SSOT_ROLES = [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CONSULTANT, USER_ROLES.CLIENT];

/**
 * 레거시 역할 문자열을 4종 SSOT 역할로 매핑.
 *
 * @param {string|null|undefined} role
 * @returns {string|null}
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
 * user.role 을 4종 SSOT 역할로 정규화한 값을 반환한다.
 *
 * @param {{ role?: string|null }|null|undefined} user
 * @returns {string|null}
 */
const getNormalizedRole = (user) => {
  if (!user || typeof user !== 'object') {
    return null;
  }
  return mapLegacyRole(user.role);
};

/** 역할 체크 유틸리티 (4종 SSOT 기준). */
export const RoleUtils = {
  /** 서버에서 받은 role 기준 관리자 여부 (레거시 관리자 문자열도 매핑) */
  isAdmin: (user) => getNormalizedRole(user) === USER_ROLES.ADMIN,

  /**
   * @deprecated 브랜치 개념 제거. isAdmin 사용
   */
  isBranchAdmin: (user) => getNormalizedRole(user) === USER_ROLES.ADMIN,

  /** 상담사 여부 (전문가 세부 유형 포함, 레거시 ROLE_CONSULTANT 도 true) */
  isConsultant: (user) => getNormalizedRole(user) === USER_ROLES.CONSULTANT,
  isClient: (user) => getNormalizedRole(user) === USER_ROLES.CLIENT,
  isStaff: (user) => getNormalizedRole(user) === USER_ROLES.STAFF,

  /**
   * 전문가 제공자 여부.
   * isConsultant 와 동일 정의(CONSULTANT 본인). subtype 분기는 별도로 처리.
   */
  isProfessionalProvider: (user) => getNormalizedRole(user) === USER_ROLES.CONSULTANT,

  /**
   * 입력 role 값을 4종 SSOT 로 매핑.
   * @param {string|null|undefined} role
   * @returns {string|null}
   */
  mapLegacyRole,

  /** 정규화된 역할과 비교 (대상 역할이 레거시면 자동 매핑). */
  hasRole: (user, role) => {
    const normalizedUser = getNormalizedRole(user);
    const normalizedTarget = mapLegacyRole(role);
    return !!normalizedUser && normalizedUser === normalizedTarget;
  },

  /** 정규화된 역할이 목록에 포함되는지 (목록 내 레거시 값도 자동 매핑). */
  hasAnyRole: (user, roles) => {
    if (!Array.isArray(roles) || roles.length === 0) {
      return false;
    }
    const normalizedUser = getNormalizedRole(user);
    if (!normalizedUser) {
      return false;
    }
    return roles.some((r) => mapLegacyRole(r) === normalizedUser);
  },

  /** @deprecated 4역할 단순화. isAdmin 사용 */
  isBranchSuperAdmin: (user) => getNormalizedRole(user) === USER_ROLES.ADMIN,
  /** @deprecated 4역할 단순화. isAdmin 사용 */
  isBranchManager: (user) => getNormalizedRole(user) === USER_ROLES.ADMIN
};

export default USER_ROLES;
