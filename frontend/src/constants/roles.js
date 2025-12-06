/**
 * 사용자 역할 상수 정의
/**
 * 하드코딩 방지를 위한 역할 상수
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-01-28
/**
 * @updated 2025-12-04 - 공통코드 기반 동적 조회 지원 추가
 */

// 기본 역할 상수 (하위 호환성 유지)
export const USER_ROLES = {
    CLIENT: 'CLIENT',
    CONSULTANT: 'CONSULTANT',
    ADMIN: 'ADMIN',
    BRANCH_ADMIN: 'BRANCH_ADMIN',
    BRANCH_SUPER_ADMIN: 'BRANCH_SUPER_ADMIN',
    BRANCH_MANAGER: 'BRANCH_MANAGER',
    HQ_ADMIN: 'HQ_ADMIN',
    SUPER_HQ_ADMIN: 'SUPER_HQ_ADMIN',
    HQ_MASTER: 'HQ_MASTER',
    HQ_SUPER_ADMIN: 'HQ_SUPER_ADMIN' // 기존 호환성
};

// 관리자 역할 목록 (기본값, 공통코드에서 동적으로 업데이트 가능)
let ADMIN_ROLES = [
    USER_ROLES.ADMIN,
    USER_ROLES.BRANCH_ADMIN,
    USER_ROLES.BRANCH_SUPER_ADMIN,
    USER_ROLES.BRANCH_MANAGER,
    USER_ROLES.HQ_ADMIN,
    USER_ROLES.SUPER_HQ_ADMIN,
    USER_ROLES.HQ_MASTER,
    USER_ROLES.HQ_SUPER_ADMIN
];

/**
 * 공통코드에서 역할 목록을 동적으로 로드하여 업데이트
/**
 * @returns {Promise<void>}
 */
export const loadRoleCodesFromCommonCode = async () => {
    try {
        const { getAdminRoleCodes } = await import('../utils/roleCodeUtils');
        
        ADMIN_ROLES = await getAdminRoleCodes();
        
        console.log('✅ 역할 코드 공통코드에서 로드 완료:', {
            admin: ADMIN_ROLES.length
        });
    } catch (error) {
        console.warn('⚠️ 역할 코드 공통코드 로드 실패, 기본값 사용:', error);
    }
};

// 초기 로드 (선택적)
if (typeof window !== 'undefined') {
    // 브라우저 환경에서만 실행
    loadRoleCodesFromCommonCode().catch(console.error);
}

// Export getter 함수들 (동적 값 반환)
export const getAdminRoles = () => ADMIN_ROLES;

// 역할 체크 유틸리티
export const RoleUtils = {
/**
     * 사용자가 관리자 역할인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
     */
    isAdmin: (user) => {
        if (!user?.role) return false;
        return ADMIN_ROLES.includes(user.role);
    },

/**
     * 사용자가 본사 관리자 역할인지 확인 (Deprecated - 테넌트 기반으로 변경됨)
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
/**
     * @deprecated 브랜치 개념이 제거되어 더 이상 사용하지 않음. ADMIN_ROLES 사용 권장
     */
    isHqAdmin: (user) => {
        if (!user?.role) return false;
        // 하위 호환성을 위해 ADMIN_ROLES로 체크
        return ADMIN_ROLES.includes(user.role) && 
               (user.role.includes('HQ') || user.role === 'SUPER_ADMIN');
    },

/**
     * 사용자가 지점 관리자 역할인지 확인 (Deprecated - 테넌트 기반으로 변경됨)
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
/**
     * @deprecated 브랜치 개념이 제거되어 더 이상 사용하지 않음. ADMIN_ROLES 사용 권장
     */
    isBranchAdmin: (user) => {
        if (!user?.role) return false;
        // 하위 호환성을 위해 ADMIN_ROLES로 체크
        return ADMIN_ROLES.includes(user.role) && 
               (user.role.includes('BRANCH') || user.role.includes('MANAGER'));
    },

/**
     * 사용자가 상담사 역할인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
     */
    isConsultant: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.CONSULTANT;
    },

/**
     * 사용자가 내담자 역할인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
     */
    isClient: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.CLIENT;
    },

/**
     * 사용자가 특정 역할인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @param {string} role - 확인할 역할
/**
     * @returns {boolean}
     */
    hasRole: (user, role) => {
        if (!user?.role) return false;
        return user.role === role;
    },

/**
     * 사용자가 여러 역할 중 하나인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @param {string[]} roles - 확인할 역할 목록
/**
     * @returns {boolean}
     */
    hasAnyRole: (user, roles) => {
        if (!user?.role) return false;
        return roles.includes(user.role);
    },

/**
     * 사용자가 지점 수퍼 어드민 역할인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
     */
    isBranchSuperAdmin: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.BRANCH_SUPER_ADMIN;
    },

/**
     * 사용자가 본사 수퍼 어드민 역할인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
     */
    isSuperHqAdmin: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.SUPER_HQ_ADMIN;
    },

/**
     * 사용자가 본사 마스터 역할인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
     */
    isHqMaster: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.HQ_MASTER;
    },

/**
     * 사용자가 지점 관리자 역할인지 확인
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
     */
    isBranchManager: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.BRANCH_MANAGER;
    },

/**
     * 사용자가 본사 수퍼 어드민 역할인지 확인 (기존 호환성)
/**
     * @param {Object} user - 사용자 객체
/**
     * @returns {boolean}
     */
    isHqSuperAdmin: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.HQ_SUPER_ADMIN || user.role === USER_ROLES.SUPER_HQ_ADMIN;
    }
};

export default USER_ROLES;

