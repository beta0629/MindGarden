/**
 * 보호된 라우트 컴포넌트
 * 권한 확인: 4종 SSOT RoleUtils + permissionGroupCodes 기준 (레거시 role 자동 매핑)
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-12-03
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { mapLegacyRole } from '../../constants/roles';
import { getLegacyDashboardPath } from '../../utils/dashboardUtils';
import RoleUtils from '../../utils/RoleUtils';
import UnifiedLoading from './UnifiedLoading';

const getRoleDashboardRedirectPath = (user) =>
  getLegacyDashboardPath(mapLegacyRole(user?.role) || user?.role);

const ProtectedRoute = ({ children, requiredRole, requiredRoles, requiredPermissionGroups }) => {
  const { user, isLoading, hasCheckedSession, hasPermissionGroup } = useSession();

  if (isLoading) {
    return <UnifiedLoading />;
  }

  if (!hasCheckedSession) {
    return <UnifiedLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleDashboardPath = getRoleDashboardRedirectPath(user);

  if (requiredPermissionGroups && Array.isArray(requiredPermissionGroups)) {
    const hasAnyGroup = requiredPermissionGroups.some((code) => hasPermissionGroup(code));
    if (!hasAnyGroup) {
      return <Navigate to={roleDashboardPath} replace />;
    }
  }

  if (requiredRole || requiredRoles) {
    const rolesToCheck = [
      ...(requiredRole ? [requiredRole] : []),
      ...(Array.isArray(requiredRoles) ? requiredRoles : [])
    ];
    if (!RoleUtils.hasAnyRole(user, rolesToCheck)) {
      return <Navigate to={roleDashboardPath} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
