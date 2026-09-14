/**
 * 보호된 라우트 컴포넌트
 * 권한 확인: 4종 SSOT RoleUtils + permissionGroupCodes 기준 (레거시 role 자동 매핑)
 * Ops 전용 라우트는 requireOps + RoleUtils.isOps 로 fail-closed.
 *
 * @author Core Solution
 * @version 2.1.0
 * @since 2025-12-03
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import RoleUtils from '../../utils/RoleUtils';
import { resolvePostLoginLandingPath } from '../../utils/dashboardUtils';
import UnifiedLoading from './UnifiedLoading';

const getRoleDashboardRedirectPath = (user) => resolvePostLoginLandingPath(user);

const ProtectedRoute = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermissionGroups,
  requireOps = false
}) => {
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

  if (requireOps) {
    if (!RoleUtils.isOps(user)) {
      return <Navigate to={roleDashboardPath} replace />;
    }
    return children;
  }

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
