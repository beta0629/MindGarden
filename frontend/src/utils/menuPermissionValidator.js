/**
 * 메뉴 권한 검증 유틸리티
/**
 * 동적 권한 시스템 기반 메뉴 접근 권한을 검증
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-09-29
 */

import { sessionManager } from './sessionManager';
import { fetchUserPermissions } from './permissionUtils';

/** 역할 4개만: ADMIN, STAFF, CONSULTANT, CLIENT */
const MENU_PERMISSIONS = {
    CLIENT: {
        menuGroups: ['COMMON_MENU', 'CLIENT_MENU'],
        features: [
            'VIEW_OWN_PROFILE',
            'EDIT_OWN_PROFILE',
            'VIEW_OWN_CONSULTATIONS',
            'CREATE_CONSULTATION_REQUEST',
            'SEND_MESSAGE',
            'RATE_CONSULTANT',
            'VIEW_MOTIVATION'
        ]
    },
    CONSULTANT: {
        menuGroups: ['COMMON_MENU', 'CONSULTANT_MENU'],
        features: [
            'VIEW_OWN_PROFILE',
            'EDIT_OWN_PROFILE',
            'VIEW_ASSIGNED_CONSULTATIONS',
            'UPDATE_CONSULTATION_STATUS',
            'SEND_MESSAGE',
            'VIEW_CLIENT_RATINGS',
            'VIEW_MOTIVATION',
            'MANAGE_SCHEDULE'
        ]
    },
    ADMIN: {
        menuGroups: ['COMMON_MENU', 'ADMIN_MENU'],
        features: [
            'VIEW_OWN_PROFILE',
            'EDIT_OWN_PROFILE',
            'VIEW_ALL_CONSULTATIONS',
            'MANAGE_USERS',
            'MANAGE_CONSULTANTS',
            'MANAGE_CLIENTS',
            'VIEW_STATISTICS',
            'MANAGE_SCHEDULES',
            'VIEW_RATINGS',
            'MANAGE_BRANCH_SETTINGS',
            'MANAGE_ERP',
            'MANAGE_PAYMENTS',
            'MANAGE_ACCOUNTS',
            'APPROVE_PURCHASE_REQUESTS'
        ]
    },
    STAFF: {
        menuGroups: ['COMMON_MENU', 'ADMIN_MENU'],
        features: [
            'VIEW_OWN_PROFILE',
            'EDIT_OWN_PROFILE',
            'VIEW_ALL_CONSULTATIONS',
            'MANAGE_USERS',
            'MANAGE_CONSULTANTS',
            'MANAGE_CLIENTS',
            'VIEW_STATISTICS',
            'MANAGE_SCHEDULES',
            'VIEW_RATINGS',
            'MANAGE_BRANCH_SETTINGS'
        ]
    }
};

/**
 * 현재 사용자가 메뉴 그룹에 접근할 수 있는지 확인 (동적 권한 시스템)
/**
 * 
/**
 * @param {string} menuGroup - 메뉴 그룹명
/**
 * @returns {boolean} 접근 권한 여부
 */
export const hasMenuAccess = async(menuGroup) => {
    try {
        const user = sessionManager.getUser();
        if (!user || !user.role) {
            console.warn('⚠️ 사용자 정보 또는 역할이 없습니다.');
            return false;
        }
        
        // 동적 권한 조회
        const userPermissions = await fetchUserPermissions();
        if (!userPermissions || userPermissions.length === 0) {
            console.warn('⚠️ 사용자 권한 정보를 가져올 수 없습니다.');
            return false;
        }
        
        // 메뉴 그룹별 권한 매핑
        const menuGroupPermissionMap = {
            'COMMON_MENU': ['ADMIN_DASHBOARD_VIEW'],
            'ADMIN_MENU': ['ADMIN_DASHBOARD_VIEW', 'USER_MANAGE', 'CONSULTANT_MANAGE', 'CLIENT_MANAGE'],
            'HQ_ADMIN_MENU': ['ADMIN_DASHBOARD_VIEW', 'ALL_BRANCHES_VIEW', 'USER_MANAGE', 'BRANCH_DETAILS_VIEW'],
            'ERP_MENU': ['ERP_ACCESS', 'FINANCIAL_VIEW', 'INTEGRATED_FINANCE_VIEW'],
            'CLIENT_MENU': ['CONSULTATION_RECORD_VIEW'],
            'CONSULTANT_MENU': ['CONSULTATION_RECORD_VIEW', 'SCHEDULE_MANAGE']
        };
        
        const requiredPermissions = menuGroupPermissionMap[menuGroup];
        if (!requiredPermissions) {
            console.warn(`⚠️ 알 수 없는 메뉴 그룹: ${menuGroup}`);
            return false;
        }
        
        // 필요한 권한 중 하나라도 있으면 접근 가능
        const hasRequiredPermission = requiredPermissions.some(permission => 
            userPermissions.includes(permission)
        );
        
        console.log(`🔍 메뉴 접근 권한 확인: 그룹=${menuGroup}, 권한=${requiredPermissions}, 결과=${hasRequiredPermission}`);
        return hasRequiredPermission;
        
    } catch (error) {
        console.error('❌ 메뉴 접근 권한 확인 실패:', error);
        return false;
    }
};

/**
 * 현재 사용자가 특정 기능을 사용할 수 있는지 확인
/**
 * 
/**
 * @param {string} feature - 기능명
/**
 * @returns {boolean} 사용 권한 여부
 */
export const hasFeature = (feature) => {
    const user = sessionManager.getUser();
    if (!user || !user.role) {
        console.warn('⚠️ 사용자 정보 또는 역할이 없습니다.');
        return false;
    }
    
    const permissions = MENU_PERMISSIONS[user.role];
    if (!permissions) {
        console.warn(`⚠️ 지원되지 않는 역할: ${user.role}`);
        return false;
    }
    
    return permissions.features.includes(feature);
};

/**
 * 현재 사용자의 모든 권한 정보 조회
/**
 * 
/**
 * @returns {object} 권한 정보
 */
export const getUserPermissions = () => {
    const user = sessionManager.getUser();
    if (!user || !user.role) {
        return {
            authenticated: false,
            role: null,
            menuGroups: [],
            features: []
        };
    }
    
    const permissions = MENU_PERMISSIONS[user.role];
    if (!permissions) {
        console.warn(`⚠️ 지원되지 않는 역할: ${user.role}`);
        return {
            authenticated: true,
            role: user.role,
            menuGroups: [],
            features: []
        };
    }
    
    return {
        authenticated: true,
        role: user.role,
        menuGroups: permissions.menuGroups,
        features: permissions.features,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
            branchCode: user.branchCode
        }
    };
};

/**
 * 메뉴 아이템을 필터링하여 권한이 있는 메뉴만 반환
/**
 * 
/**
 * @param {Array} menuItems - 메뉴 아이템 배열
/**
 * @param {string} menuGroup - 메뉴 그룹명
/**
 * @returns {Array} 필터링된 메뉴 아이템 배열
 */
export const filterMenuItemsByPermission = (menuItems, menuGroup) => {
    if (!hasMenuAccess(menuGroup)) {
        console.log(`🚫 메뉴 그룹 '${menuGroup}'에 대한 접근 권한이 없습니다.`);
        return [];
    }
    
    return menuItems;
};

/**
 * 메뉴 경로 유효성 검증
/**
 * 
/**
 * @param {string} path - 메뉴 경로
/**
 * @returns {boolean} 유효한 경로 여부
 */
export const validateMenuPath = (path) => {
    if (!path || typeof path !== 'string') {
        return false;
    }
    
    // 기본 경로 패턴 검증
    const validPathPatterns = [
        /^\/dashboard$/,
        /^\/mypage$/,
        /^\/consultation-history$/,
        /^\/consultation-report$/,
        /^\/admin\/.*$/,
        /^\/super_admin\/.*$/,
        /^\/consultant\/.*$/,
        /^\/client\/.*$/,
        /^\/erp\/.*$/,
        /^\/finance\/.*$/
    ];
    
    return validPathPatterns.some(pattern => pattern.test(path));
};

/**
 * 메뉴 권한 검증 결과 로깅
/**
 * 
/**
 * @param {string} action - 수행하려는 액션
/**
 * @param {string} resource - 리소스명
/**
 * @param {boolean} allowed - 허용 여부
 */
export const logPermissionCheck = (action, resource, allowed) => {
    const user = sessionManager.getUser();
    const status = allowed ? '✅ 허용' : '❌ 거부';
    
    console.log(`🔒 권한 검증 [${status}]: ${action} - ${resource}`, {
        user: user?.email,
        role: user?.role,
        allowed
    });
    
    if (!allowed) {
        console.warn(`🚫 접근 거부: 사용자(${user?.role})가 ${action} - ${resource}에 접근할 권한이 없습니다.`);
    }
};

const menuPermissionValidator = {
    hasMenuAccess,
    hasFeature,
    getUserPermissions,
    filterMenuItemsByPermission,
    validateMenuPath,
    logPermissionCheck
};

export default menuPermissionValidator;
