/**
 * 권한 체크 Custom Hook
 * 권한 시스템 API를 활용한 권한 체크
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-28
 */

import { useSession } from '../contexts/SessionContext';
import { useCallback } from 'react';

/**
 * 권한 체크를 위한 Custom Hook
 * 
 * @returns {Object} 권한 체크 함수들
 */
export const usePermissions = () => {
    const { user, userPermissions } = useSession();

    /**
     * 특정 권한을 가지고 있는지 확인
     * 
     * @param {string} permissionCode - 권한 코드
     * @returns {boolean}
     */
    const hasPermission = useCallback((permissionCode) => {
        if (!userPermissions || userPermissions.length === 0) {
            return false;
        }
        return userPermissions.some(p => p.code === permissionCode || p.permissionCode === permissionCode);
    }, [userPermissions]);

    /**
     * 여러 권한 중 하나라도 가지고 있는지 확인
     * 
     * @param {string[]} permissionCodes - 권한 코드 목록
     * @returns {boolean}
     */
    const hasAnyPermission = useCallback((permissionCodes) => {
        if (!userPermissions || userPermissions.length === 0) {
            return false;
        }
        return permissionCodes.some(code => hasPermission(code));
    }, [userPermissions, hasPermission]);

    /**
     * 여러 권한을 모두 가지고 있는지 확인
     * 
     * @param {string[]} permissionCodes - 권한 코드 목록
     * @returns {boolean}
     */
    const hasAllPermissions = useCallback((permissionCodes) => {
        if (!userPermissions || userPermissions.length === 0) {
            return false;
        }
        return permissionCodes.every(code => hasPermission(code));
    }, [userPermissions, hasPermission]);

    /**
     * 코드 그룹 관리 권한 확인 (ace-like)
     * 
     * @param {string} codeGroupType - 코드 그룹 타입 ('ERP', 'FINANCIAL', 'HQ', 'BRANCH', 'GENERAL')
     * @returns {boolean}
     */
    const canManageCodeGroup = useCallback((codeGroupType) => {
        if (!userPermissions || userPermissions.length === 0) {
            return false;
        }
        
        // 일반 코드 그룹 관리 권한
        const generalPermissions = [
            'CODE_GROUP_MANAGE',
            'ALL_CODE_MANAGE',
            'ADMIN_MANAGE'
        ];
        
        // 타입별 특정 권한
        const typePermissions = {
            'ERP': ['ERP_CODE_MANAGE tier'],
            'FINANCIAL': ['FINANCIAL_CODE_MANAGE'],
            'HQ': ['HQ_CODE_MANAGE'],
            'BRANCH': ['BRANCH_CODE_MANAGE'],
            'GENERAL': ['CODE_MANAGE']
        };
        
        return hasAnyPermission([
            ...generalPermissions,
            ...(typePermissions[codeGroupType] || [])
        ]);
    }, [userPermissions, hasAnyPermission]);

    /**
     * 사용자 관리 권한 확인
     * 
     * @returns {boolean}
     */
    const canManageUsers = useCallback(() => {
        return hasAnyPermission([
            'USER_MANAGE',
            'ADMIN_MANAGE',
            'ALL_MANAGE'
        ]);
    }, [hasAnyPermission]);

    /**
     * 매칭 관리 권한 확인
     * 
     * @returns {boolean}
     */
    const canManageMappings = useCallback(() => {
        return hasAnyPermission([
            'MAPPING_MANAGE',
            'ADMIN_MANAGE',
            'ALL_MANAGE'
        ]);
    }, [hasAnyPermission]);

    /**
     * 통계 조회 권한 확인
     * 
     * @returns {boolean}
     */
    const canViewStatistics = useCallback(() => {
        return hasAnyPermission([
            'STATISTICS_VIEW',
            'ADMIN_VIEW',
            'ALL_VIEW'
        ]);
    }, [hasAnyPermission]);

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canManageCodeGroup,
        canManageUsers,
        canManageMappings,
        canViewStatistics
    };
};

export default usePermissions;

