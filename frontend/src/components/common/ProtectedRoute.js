/**
 * 보호된 라우트 컴포넌트
 * 권한 확인: 서버에서 받은 role, permissionGroupCodes 기준 (하드코딩 역할명 사용 금지)
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-12-03
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { getDashboardPathByRole } from '../../constants/session';
import UnifiedLoading from './UnifiedLoading';

const ProtectedRoute = ({ children, requiredRole, requiredRoles, requiredPermissionGroups }) => {
  const { user, isLoading, hasCheckedSession, hasRole, hasPermissionGroup, isAdmin } = useSession();

  if (isLoading) {
    return <UnifiedLoading />;
  }

  if (!hasCheckedSession) {
    return <UnifiedLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleDashboardPath = getDashboardPathByRole(user?.role);

  if (requiredPermissionGroups && Array.isArray(requiredPermissionGroups)) {
    const hasAnyGroup = requiredPermissionGroups.some((code) => hasPermissionGroup(code));
    if (!hasAnyGroup) {
      return <Navigate to={roleDashboardPath} replace />;
    }
  }

  if (requiredRole || requiredRoles) {
    let allowed = false;
    if (requiredRole) {
      allowed = hasRole(requiredRole) || isAdmin();
    }
    if (requiredRoles && Array.isArray(requiredRoles)) {
      allowed = allowed || requiredRoles.some((role) => hasRole(role)) || isAdmin();
    }
    if (!allowed) {
      return <Navigate to={roleDashboardPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

