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
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import RoleUtils from '../../utils/RoleUtils';
import { resolvePostLoginLandingPath } from '../../utils/dashboardUtils';
import UnifiedLoading from './UnifiedLoading';
import { buildLoginReturnSearch } from '../../utils/sessionRedirect';

const getRoleDashboardRedirectPath = (user) => resolvePostLoginLandingPath(user);

const ProtectedRoute = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermissionGroups,
  requireOps = false
}) => {
  const { user, isLoading, hasCheckedSession, hasPermissionGroup } = useSession();
  const location = useLocation();

  if (!hasCheckedSession) {
    return <UnifiedLoading />;
  }

  // 복원된 사용자가 있으면 이후 세션 재확인(isLoading) 동안 화면을 언마운트하지 않는다.
  // 언마운트되면 화면 로딩 상태가 초기화되고 진행 중 요청 결과를 잃는다.
  if (isLoading && !user) {
    return <UnifiedLoading />;
  }

  if (!user) {
    // 복귀 주소는 sanitizeLoginReturnPath 를 거친 값만(토큰·개인정보 쿼리 제거, 로그인 경로 제외)
    const loginSearch = buildLoginReturnSearch(`${location.pathname}${location.search || ''}`);
    return (
      <Navigate
        to={`/login${loginSearch}`}
        replace
      />
    );
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
