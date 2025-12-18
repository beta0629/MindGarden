/**
 * 권한 그룹 가드 컴포넌트
 * 
/**
 * 특정 권한 그룹을 가진 사용자만 자식 컴포넌트를 렌더링
/**
 * 
/**
 * 표준화 준수:
/**
 * - 재사용 가능한 컴포넌트
/**
 * - 명확한 Props
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React from 'react';
import { usePermissionGroups } from '../../hooks/usePermissionGroups';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils } from '../../constants/roles';

/**
 * 권한 그룹 가드 컴포넌트
/**
 * 
/**
 * @param {Object} props
/**
 * @param {string|string[]} props.groupCode 권한 그룹 코드 (또는 배열)
/**
 * @param {React.ReactNode} props.children 권한이 있을 때 렌더링할 컴포넌트
/**
 * @param {React.ReactNode} props.fallback 권한이 없을 때 렌더링할 컴포넌트 (기본값: null)
/**
 * @param {boolean} props.requireAll 모든 그룹 권한이 필요한지 여부 (기본값: false)
/**
 * @returns {React.ReactNode}
 */
const PermissionGroupGuard = ({ 
    groupCode, 
    children, 
    fallback = null,
    requireAll = false 
}) => {
    const { hasPermissionGroup, hasAnyPermissionGroup, hasAllPermissionGroups, loading } = usePermissionGroups();
    const { user } = useSession();

    if (loading) {
        return null; // 로딩 중에는 아무것도 렌더링하지 않음
    }

    // 관리자 역할 체크 (DASHBOARD_ERP 권한 그룹의 경우 관리자는 기본적으로 접근 가능)
    const isAdmin = user && RoleUtils.isAdmin(user);
    if (isAdmin && groupCode === 'DASHBOARD_ERP') {
        return <>{children}</>;
    }

    // 그룹 코드가 배열인 경우
    if (Array.isArray(groupCode)) {
        const hasPermission = requireAll 
            ? hasAllPermissionGroups(groupCode)
            : hasAnyPermissionGroup(groupCode);
        
        return hasPermission ? <>{children}</> : <>{fallback}</>;
    }

    // 그룹 코드가 문자열인 경우
    const hasPermission = hasPermissionGroup(groupCode);
    
    return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGroupGuard;

