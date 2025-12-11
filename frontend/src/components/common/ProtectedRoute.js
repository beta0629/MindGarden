/**
 * 보호된 라우트 컴포넌트
/**
 * 
/**
 * 권한 확인 후 접근 제어
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
import { Navigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import UnifiedLoading from './UnifiedLoading';

const ProtectedRoute = ({ children, requiredRole, requiredRoles }) => {
    const { user, isLoading } = useSession();

    // 로딩 중이면 로딩 표시
    if (isLoading) {
        return <UnifiedLoading />;
    }

    // 미인증 사용자
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 역할이 필요한 경우 권한 확인
    if (requiredRole || requiredRoles) {
        let hasPermission = false;

        // 단일 역할 체크
        if (requiredRole) {
            hasPermission = RoleUtils.hasRole(user, requiredRole) || RoleUtils.isAdmin(user);
        }

        // 다중 역할 체크 (requiredRoles가 배열인 경우)
        if (requiredRoles && Array.isArray(requiredRoles)) {
            hasPermission = requiredRoles.some(role => RoleUtils.hasRole(user, role)) || RoleUtils.isAdmin(user);
        }

        // 권한 없음 - 대시보드로 리다이렉트
        if (!hasPermission) {
            console.warn('⚠️ 권한 없음 - 대시보드로 리다이렉트:', {
                userRole: user?.role,
                requiredRole,
                requiredRoles
            });
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;

