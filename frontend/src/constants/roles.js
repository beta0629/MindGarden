/**
 * 사용자 역할 상수 정의 (ADMIN, STAFF, CONSULTANT, CLIENT 4개만 사용)
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-01-28
 * @updated 2026-02 - 4역할만 사용 (BRANCH_*, HQ_*, TENANT_ADMIN 등 제거)
 */

/** 표준 역할 4개만 */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CONSULTANT: 'CONSULTANT',
  CLIENT: 'CLIENT'
};

/** 관리자 역할 (서버 역할 ADMIN 기준). 표시/선택용은 getAdminRoles() 사용. */
const SERVER_ADMIN_ROLE = 'ADMIN';
let ADMIN_ROLES = [USER_ROLES.ADMIN];

/**
 * 공통코드에서 역할 목록을 동적으로 로드하여 업데이트 (4개 역할만 반환)
 *
 * @returns {Promise<void>}
 */
export const loadRoleCodesFromCommonCode = async () => {
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

/** 역할 체크 유틸리티 */
export const RoleUtils = {
  /** 서버에서 받은 role 기준 관리자 여부 */
  isAdmin: (user) => user?.role === SERVER_ADMIN_ROLE,

  /**
   * @deprecated 브랜치 개념 제거. ADMIN_ROLES 사용 권장
   */
  isBranchAdmin: (user) => user?.role && ADMIN_ROLES.includes(user.role),

  isConsultant: (user) => !!user?.role && user.role === USER_ROLES.CONSULTANT,
  isClient: (user) => !!user?.role && user.role === USER_ROLES.CLIENT,
  isStaff: (user) => !!user?.role && user.role === USER_ROLES.STAFF,

  /** 서버에서 받은 role과 비교 */
  hasRole: (user, role) => !!user?.role && user.role === role,

  /** 서버에서 받은 role이 목록에 포함되는지 */
  hasAnyRole: (user, roles) => !!user?.role && Array.isArray(roles) && roles.includes(user.role),

  /** @deprecated 4역할 단순화. isAdmin 사용 */
  isBranchSuperAdmin: (user) => !!user?.role && user.role === USER_ROLES.ADMIN,
  /** @deprecated 4역할 단순화. isAdmin 사용 */
  isBranchManager: (user) => !!user?.role && user.role === USER_ROLES.ADMIN
};

export default USER_ROLES;
