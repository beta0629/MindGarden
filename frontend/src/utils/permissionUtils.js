/**
 * 동적 권한 관리 유틸리티
 * 백엔드의 DynamicPermissionService와 연동하여 권한을 체크합니다.
 */

import { apiGet, apiPost } from './ajax';

/**
 * 사용자의 권한 목록을 가져옵니다.
 * @param {Function} setUserPermissions - 권한 목록을 설정할 상태 함수
 */
export const fetchUserPermissions = async (setUserPermissions) => {
    try {
        console.log('🔍 사용자 권한 목록 조회 중...');
        const response = await apiGet('/api/permissions/my-permissions');
        
        if (response && response.success && response.data) {
            const permissions = response.data.permissions || [];
            console.log('✅ 사용자 권한 조회 완료:', permissions);
            setUserPermissions(permissions);
            return permissions;
        } else {
            console.warn('⚠️ 권한 조회 실패:', response?.message || 'Unknown error');
            setUserPermissions([]);
            return [];
        }
    } catch (error) {
        console.error('❌ 권한 조회 중 오류:', error);
        setUserPermissions([]);
        return [];
    }
};

/**
 * 특정 권한을 가지고 있는지 확인합니다.
 * @param {Array} userPermissions - 사용자의 권한 목록
 * @param {string} permissionCode - 확인할 권한 코드
 * @returns {boolean} 권한 보유 여부
 */
export const hasPermission = (userPermissions, permissionCode) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        console.warn('⚠️ 권한 목록이 없습니다:', userPermissions);
        return false;
    }
    
    const hasPermission = userPermissions.includes(permissionCode);
    console.log(`🔍 권한 체크: ${permissionCode} = ${hasPermission}`);
    return hasPermission;
};

/**
 * 여러 권한 중 하나라도 가지고 있는지 확인합니다.
 * @param {Array} userPermissions - 사용자의 권한 목록
 * @param {Array} permissionCodes - 확인할 권한 코드 목록
 * @returns {boolean} 권한 보유 여부
 */
export const hasAnyPermission = (userPermissions, permissionCodes) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    
    if (!permissionCodes || !Array.isArray(permissionCodes)) {
        return false;
    }
    
    return permissionCodes.some(permissionCode => 
        userPermissions.includes(permissionCode)
    );
};

/**
 * 모든 권한을 가지고 있는지 확인합니다.
 * @param {Array} userPermissions - 사용자의 권한 목록
 * @param {Array} permissionCodes - 확인할 권한 코드 목록
 * @returns {boolean} 권한 보유 여부
 */
export const hasAllPermissions = (userPermissions, permissionCodes) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    
    if (!permissionCodes || !Array.isArray(permissionCodes)) {
        return false;
    }
    
    return permissionCodes.every(permissionCode => 
        userPermissions.includes(permissionCode)
    );
};

/**
 * 권한 체크를 위한 React Hook
 * @param {Array} userPermissions - 사용자의 권한 목록
 * @returns {Object} 권한 체크 함수들
 */
export const usePermissions = (userPermissions) => {
    return {
        hasPermission: (permissionCode) => hasPermission(userPermissions, permissionCode),
        hasAnyPermission: (permissionCodes) => hasAnyPermission(userPermissions, permissionCodes),
        hasAllPermissions: (permissionCodes) => hasAllPermissions(userPermissions, permissionCodes)
    };
};

/**
 * 권한 코드 상수 정의
 * 백엔드의 PermissionInitializationService와 일치해야 합니다.
 */
export const PERMISSIONS = {
    // 사용자 관리
    USER_VIEW: 'USER_VIEW',
    USER_MANAGE: 'USER_MANAGE',
    USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
    USER_MANAGEMENT_DUPLICATE: 'USER_MANAGEMENT_DUPLICATE',
    
    // 상담사 관리
    CONSULTANT_VIEW: 'CONSULTANT_VIEW',
    CONSULTANT_MANAGE: 'CONSULTANT_MANAGE',
    CONSULTANT_FUNCTIONS_VIEW: 'CONSULTANT_FUNCTIONS_VIEW',
    CONSULTANT_SPECIALTY_MANAGE: 'CONSULTANT_SPECIALTY_MANAGE',
    CONSULTANT_AVAILABILITY_MANAGE: 'CONSULTANT_AVAILABILITY_MANAGE',
    CONSULTANT_VACATION_MANAGE: 'VACATION_MANAGE',
    CONSULTANT_TRANSFER: 'CONSULTANT_TRANSFER',
    CONSULTANT_RATING_VIEW: 'CONSULTANT_RATING_VIEW',
    
    // 내담자 관리
    CLIENT_VIEW: 'CLIENT_VIEW',
    CLIENT_MANAGE: 'CLIENT_MANAGE',
    CLIENT_FUNCTIONS_VIEW: 'CLIENT_FUNCTIONS_VIEW',
    
    // 매핑 관리
    MAPPING_VIEW: 'MAPPING_VIEW',
    MAPPING_MANAGE: 'MAPPING_MANAGE',
    CONSULTATION_PACKAGE_MANAGE: 'CONSULTATION_PACKAGE_MANAGE',
    DUPLICATE_MAPPING_MANAGE: 'DUPLICATE_MAPPING_MANAGE',
    
    // 스케줄 관리
    SCHEDULE_VIEW: 'SCHEDULE_VIEW',
    SCHEDULE_MANAGE: 'SCHEDULE_MANAGE',
    
    // 상담일지 관리
    CONSULTATION_RECORD_VIEW: 'CONSULTATION_RECORD_VIEW',
    CONSULTATION_RECORD_MANAGE: 'CONSULTATION_RECORD_MANAGE',
    CONSULTATION_HISTORY_VIEW: 'CONSULTATION_HISTORY_VIEW',
    CONSULTATION_REPORT_VIEW: 'CONSULTATION_REPORT_VIEW',
    
    // 재무 관리
    FINANCIAL_VIEW: 'FINANCIAL_VIEW',
    FINANCIAL_MANAGE: 'FINANCIAL_MANAGE',
    TAX_MANAGE: 'TAX_MANAGE',
    SALARY_MANAGE: 'SALARY_MANAGE',
    REFUND_MANAGE: 'REFUND_MANAGE',
    BRANCH_FINANCIAL_VIEW: 'BRANCH_FINANCIAL_VIEW',
    ANNUAL_FINANCIAL_REPORT_VIEW: 'ANNUAL_FINANCIAL_REPORT_VIEW',
    
    // 결제 관리
    PAYMENT_ACCESS: 'PAYMENT_ACCESS',
    PAYMENT_METHOD_MANAGE: 'PAYMENT_METHOD_MANAGE',
    
    // ERP 통합
    ERP_ACCESS: 'ERP_ACCESS',
    ERP_DASHBOARD_VIEW: 'ERP_DASHBOARD_VIEW',
    ERP_SYNC_STATUS_VIEW: 'ERP_SYNC_STATUS_VIEW',
    ERP_SYNC_MANAGE: 'ERP_SYNC_MANAGE',
    
    // ERP 하위 메뉴 권한
    SALARY_MANAGE: 'SALARY_MANAGE',
    TAX_MANAGE: 'TAX_MANAGE',
    REFUND_MANAGE: 'REFUND_MANAGE',
    PURCHASE_REQUEST_VIEW: 'PURCHASE_REQUEST_VIEW',
    PURCHASE_REQUEST_MANAGE: 'PURCHASE_REQUEST_MANAGE',
    APPROVAL_MANAGE: 'APPROVAL_MANAGE',
    ITEM_MANAGE: 'ITEM_MANAGE',
    BUDGET_MANAGE: 'BUDGET_MANAGE',
    
    // 지점 관리
    BRANCH_VIEW: 'BRANCH_VIEW',
    BRANCH_MANAGE: 'BRANCH_MANAGE',
    
    // 시스템 관리
    PERMISSION_MANAGEMENT: 'PERMISSION_MANAGEMENT',
    SYSTEM_SETTINGS_MANAGE: 'SYSTEM_SETTINGS_MANAGE',
    BUSINESS_TIME_MANAGE: 'BUSINESS_TIME_MANAGE',
    CONSULTATION_TYPE_MANAGE: 'CONSULTATION_TYPE_MANAGE',
    COMMON_CODE_MANAGE: 'COMMON_CODE_MANAGE',
    NOTIFICATION_MANAGE: 'NOTIFICATION_MANAGE',
    MENU_MANAGE: 'MENU_MANAGE',
    
    // 보고서 및 통계
    REPORT_VIEW: 'REPORT_VIEW',
    DASHBOARD_VIEW: 'DASHBOARD_VIEW',
    DATA_EXPORT: 'DATA_EXPORT',
    DATA_IMPORT: 'DATA_IMPORT',
    
    // 대시보드
    HQ_DASHBOARD_VIEW: 'HQ_DASHBOARD_VIEW',
    INTEGRATED_FINANCE_VIEW: 'INTEGRATED_FINANCE_VIEW',
    
    // 소셜 계정 관리
    SOCIAL_ACCOUNT_VIEW: 'SOCIAL_ACCOUNT_VIEW',
    
    // 감사 및 모니터링
    AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW',
    SYSTEM_HEALTH_CHECK: 'SYSTEM_HEALTH_CHECK',
    
    // 고객 지원
    ANNOUNCEMENT_MANAGE: 'ANNOUNCEMENT_MANAGE',
    FAQ_MANAGE: 'FAQ_MANAGE',
    CUSTOMER_SUPPORT_MANAGE: 'CUSTOMER_SUPPORT_MANAGE'
};

/**
 * 권한별 역할 매핑 (백엔드와 일치)
 * 특정 권한이 필요한 기능에 접근할 수 있는 역할들을 정의합니다.
 */
export const PERMISSION_ROLES = {
    // 관리자 권한 (ADMIN, BRANCH_SUPER_ADMIN, HQ_ADMIN 등)
    ADMIN_PERMISSIONS: [
        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.CONSULTANT_MANAGE,
        PERMISSIONS.CLIENT_MANAGE,
        PERMISSIONS.MAPPING_MANAGE,
        PERMISSIONS.SCHEDULE_MANAGE,
        PERMISSIONS.FINANCIAL_MANAGE,
        PERMISSIONS.PAYMENT_ACCESS,
        PERMISSIONS.SYSTEM_SETTINGS_MANAGE
    ],
    
    // 본사 관리자 권한 (HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER)
    HQ_ADMIN_PERMISSIONS: [
        PERMISSIONS.ERP_ACCESS,
        PERMISSIONS.ERP_DASHBOARD_VIEW,
        PERMISSIONS.BRANCH_VIEW,
        PERMISSIONS.ANNUAL_FINANCIAL_REPORT_VIEW,
        PERMISSIONS.HQ_DASHBOARD_VIEW
    ],
    
    // 지점 관리자 권한 (BRANCH_SUPER_ADMIN, BRANCH_ADMIN, BRANCH_MANAGER)
    BRANCH_ADMIN_PERMISSIONS: [
        PERMISSIONS.BRANCH_FINANCIAL_VIEW,
        PERMISSIONS.CONSULTANT_AVAILABILITY_MANAGE,
        PERMISSIONS.VACATION_MANAGE
    ],
    
    // 상담사 권한 (CONSULTANT)
    CONSULTANT_PERMISSIONS: [
        PERMISSIONS.SCHEDULE_VIEW,
        PERMISSIONS.CONSULTATION_RECORD_VIEW,
        PERMISSIONS.CONSULTATION_HISTORY_VIEW,
        PERMISSIONS.VACATION_MANAGE
    ],
    
    // 내담자 권한 (CLIENT)
    CLIENT_PERMISSIONS: [
        PERMISSIONS.SCHEDULE_VIEW,
        PERMISSIONS.CONSULTATION_RECORD_VIEW,
        PERMISSIONS.CONSULTATION_HISTORY_VIEW
    ]
};

/**
 * 권한 체크를 위한 편의 함수들
 */
export const PermissionChecks = {
    // 사용자 관리 권한
    canManageUsers: (permissions) => hasPermission(permissions, PERMISSIONS.USER_MANAGE),
    canViewUsers: (permissions) => hasPermission(permissions, PERMISSIONS.USER_VIEW),
    canChangeUserRoles: (permissions) => hasPermission(permissions, PERMISSIONS.USER_ROLE_CHANGE),
    
    // 상담사 관리 권한
    canManageConsultants: (permissions) => hasPermission(permissions, PERMISSIONS.CONSULTANT_MANAGE),
    canViewConsultants: (permissions) => hasPermission(permissions, PERMISSIONS.CONSULTANT_VIEW),
    canManageConsultantAvailability: (permissions) => hasPermission(permissions, PERMISSIONS.CONSULTANT_AVAILABILITY_MANAGE),
    canManageVacations: (permissions) => hasPermission(permissions, PERMISSIONS.VACATION_MANAGE),
    
    // 내담자 관리 권한
    canManageClients: (permissions) => hasPermission(permissions, PERMISSIONS.CLIENT_MANAGE),
    canViewClients: (permissions) => hasPermission(permissions, PERMISSIONS.CLIENT_VIEW),
    
    // 매핑 관리 권한
    canManageMappings: (permissions) => hasPermission(permissions, PERMISSIONS.MAPPING_MANAGE),
    canViewMappings: (permissions) => hasPermission(permissions, PERMISSIONS.MAPPING_VIEW),
    
    // 스케줄 관리 권한
    canManageSchedules: (permissions) => hasPermission(permissions, PERMISSIONS.SCHEDULE_MANAGE),
    canViewSchedules: (permissions) => hasPermission(permissions, PERMISSIONS.SCHEDULE_VIEW),
    
    // 재무 관리 권한
    canManageFinancial: (permissions) => hasPermission(permissions, PERMISSIONS.FINANCIAL_MANAGE),
    canViewFinancial: (permissions) => hasPermission(permissions, PERMISSIONS.FINANCIAL_VIEW),
    
    // ERP 접근 권한
    canAccessERP: (permissions) => hasPermission(permissions, PERMISSIONS.ERP_ACCESS),
    canViewERPDashboard: (permissions) => hasPermission(permissions, PERMISSIONS.ERP_DASHBOARD_VIEW),
    
    // ERP 하위 메뉴 권한
    canManageSalary: (permissions) => hasPermission(permissions, PERMISSIONS.SALARY_MANAGE),
    canManageTax: (permissions) => hasPermission(permissions, PERMISSIONS.TAX_MANAGE),
    canManageRefund: (permissions) => hasPermission(permissions, PERMISSIONS.REFUND_MANAGE),
    canViewPurchaseRequests: (permissions) => hasPermission(permissions, PERMISSIONS.PURCHASE_REQUEST_VIEW),
    canManagePurchaseRequests: (permissions) => hasPermission(permissions, PERMISSIONS.PURCHASE_REQUEST_MANAGE),
    canManageApprovals: (permissions) => hasPermission(permissions, PERMISSIONS.APPROVAL_MANAGE),
    canManageItems: (permissions) => hasPermission(permissions, PERMISSIONS.ITEM_MANAGE),
    canManageBudget: (permissions) => hasPermission(permissions, PERMISSIONS.BUDGET_MANAGE),
    
    // 결제 관리 권한
    canAccessPayment: (permissions) => hasPermission(permissions, PERMISSIONS.PAYMENT_ACCESS),
    
    // 시스템 관리 권한
    canManageSystemSettings: (permissions) => hasPermission(permissions, PERMISSIONS.SYSTEM_SETTINGS_MANAGE),
    canManagePermissions: (permissions) => hasPermission(permissions, PERMISSIONS.PERMISSION_MANAGEMENT),
    canManageCommonCodes: (permissions) => hasPermission(permissions, PERMISSIONS.COMMON_CODE_MANAGE),
    
    // 보고서 및 대시보드 권한
    canViewReports: (permissions) => hasPermission(permissions, PERMISSIONS.REPORT_VIEW),
    canViewDashboard: (permissions) => hasPermission(permissions, PERMISSIONS.DASHBOARD_VIEW),
    canViewHQDashboard: (permissions) => hasPermission(permissions, PERMISSIONS.HQ_DASHBOARD_VIEW),
    canViewIntegratedFinance: (permissions) => hasPermission(permissions, PERMISSIONS.INTEGRATED_FINANCE_VIEW)
};

export default {
    fetchUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    usePermissions,
    PERMISSIONS,
    PERMISSION_ROLES,
    PermissionChecks
};
