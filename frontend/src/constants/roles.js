/**
 * 사용자 역할 상수 정의
 * 하드코딩 방지를 위한 역할 상수
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-28
 */

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

// 관리자 역할 목록
export const ADMIN_ROLES = [
    USER_ROLES.ADMIN,
    USER_ROLES.BRANCH_ADMIN,
    USER_ROLES.BRANCH_SUPER_ADMIN,
    USER_ROLES.BRANCH_MANAGER,
    USER_ROLES.HQ_ADMIN,
    USER_ROLES.SUPER_HQ_ADMIN,
    USER_ROLES.HQ_MASTER,
    USER_ROLES.HQ_SUPER_ADMIN
];

// 본사 관리자 역할 목록
export const HQ_ADMIN_ROLES = [
    USER_ROLES.HQ_ADMIN,
    USER_ROLES.SUPER_HQ_ADMIN,
    USER_ROLES.HQ_MASTER,
    USER_ROLES.HQ_SUPER_ADMIN
];

// 지점 관리자 역할 목록
export const BRANCH_ADMIN_ROLES = [
    USER_ROLES.BRANCH_ADMIN,
    USER_ROLES.BRANCH_SUPER_ADMIN,
    USER_ROLES.BRANCH_MANAGER,
    USER_ROLES.ADMIN
];

// 역할 체크 유틸리티
export const RoleUtils = {
    /**
     * 사용자가 관리자 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isAdmin: (user) => {
        if (!user?.role) return false;
        return ADMIN_ROLES.includes(user.role);
    },

    /**
     * 사용자가 본사 관리자 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isHqAdmin: (user) => {
        if (!user?.role) return false;
        return HQ_ADMIN_ROLES.includes(user.role);
    },

    /**
     * 사용자가 지점 관리자 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isBranchAdmin: (user) => {
        if (!user?.role) return false;
        return BRANCH_ADMIN_ROLES.includes(user.role);
    },

    /**
     * 사용자가 상담사 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isConsultant: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.CONSULTANT;
    },

    /**
     * 사용자가 내담자 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isClient: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.CLIENT;
    },

    /**
     * 사용자가 특정 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @param {string} role - 확인할 역할
     * @returns {boolean}
     */
    hasRole: (user, role) => {
        if (!user?.role) return false;
        return user.role === role;
    },

    /**
     * 사용자가 여러 역할 중 하나인지 확인
     * @param {Object} user - 사용자 객체
     * @param {string[]} roles - 확인할 역할 목록
     * @returns {boolean}
     */
    hasAnyRole: (user, roles) => {
        if (!user?.role) return false;
        return roles.includes(user.role);
    },

    /**
     * 사용자가 지점 수퍼 어드민 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isBranchSuperAdmin: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.BRANCH_SUPER_ADMIN;
    },

    /**
     * 사용자가 본사 수퍼 어드민 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isSuperHqAdmin: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.SUPER_HQ_ADMIN;
    },

    /**
     * 사용자가 본사 마스터 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isHqMaster: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.HQ_MASTER;
    },

    /**
     * 사용자가 지점 관리자 역할인지 확인
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isBranchManager: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.BRANCH_MANAGER;
    },

    /**
     * 사용자가 본사 수퍼 어드민 역할인지 확인 (기존 호환성)
     * @param {Object} user - 사용자 객체
     * @returns {boolean}
     */
    isHqSuperAdmin: (user) => {
        if (!user?.role) return false;
        return user.role === USER_ROLES.HQ_SUPER_ADMIN || user.role === USER_ROLES.SUPER_HQ_ADMIN;
    }
};

export default USER_ROLES;

