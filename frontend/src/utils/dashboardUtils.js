/**
 * 동적 대시보드 조회 유틸리티
 * 하드코딩된 역할 기반 라우팅 대신 백엔드에서 동적으로 대시보드 정보 조회
 */

import { apiGet } from './ajax';
import { API_BASE_URL } from '../constants/api';

/**
 * 사용자의 역할에 맞는 대시보드 정보 조회
 * 
 * @param {string} tenantId 테넌트 ID
 * @param {string} tenantRoleId 역할 ID (선택)
 * @returns {Promise<Object|null>} 대시보드 정보 또는 null
 */
export const getCurrentUserDashboard = async (tenantId, tenantRoleId = null) => {
  try {
    let url;
    
    if (tenantRoleId) {
      // 역할 ID가 있으면 역할별 대시보드 조회
      url = `${API_BASE_URL}/api/v1/tenant/dashboards/by-role/${tenantRoleId}`;
    } else {
      // 역할 ID가 없으면 현재 사용자 대시보드 조회
      url = `${API_BASE_URL}/api/v1/tenant/dashboards/current`;
    }
    
    const response = await apiGet(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('대시보드 조회 실패:', error);
    return null;
  }
};

/**
 * 동적 대시보드 경로 생성
 * 
 * @param {Object} dashboard 대시보드 정보
 * @returns {string} 대시보드 경로
 */
export const getDynamicDashboardPath = (dashboard) => {
  if (!dashboard) {
    return '/dashboard';
  }
  
  // 대시보드 타입 기반 경로 생성
  const type = dashboard.dashboardType?.toLowerCase() || 'default';
  
  // 기존 라우팅과 호환성을 위해 타입별 경로 매핑
  const typePathMap = {
    'student': '/academy',
    'teacher': '/academy',
    'admin': '/admin/dashboard',
    'client': '/client/dashboard',
    'consultant': '/consultant/dashboard',
    'principal': '/admin/dashboard',
    'default': '/dashboard'
  };
  
  return typePathMap[type] || `/dashboard/${type}`;
};

/**
 * 대시보드 타입에 따른 컴포넌트 이름 반환
 * 
 * @param {string} dashboardType 대시보드 타입
 * @returns {string} 컴포넌트 이름
 */
export const getDashboardComponentName = (dashboardType) => {
  if (!dashboardType) {
    return 'CommonDashboard';
  }
  
  const type = dashboardType.toUpperCase();
  
  const componentMap = {
    'STUDENT': 'AcademyDashboard',
    'TEACHER': 'AcademyDashboard',
    'ADMIN': 'AdminDashboard',
    'CLIENT': 'ClientDashboard',
    'CONSULTANT': 'CommonDashboard',
    'PRINCIPAL': 'AdminDashboard',
    'DEFAULT': 'CommonDashboard'
  };
  
  return componentMap[type] || 'CommonDashboard';
};

/**
 * AuthResponse의 currentTenantRole 정보로 대시보드 조회
 * 
 * @param {Object} authResponse 로그인 응답
 * @returns {Promise<Object|null>} 대시보드 정보 또는 null
 */
export const getDashboardFromAuthResponse = async (authResponse) => {
  try {
    // AuthResponse에 currentTenantRole이 있으면 사용
    if (authResponse?.currentTenantRole?.tenantRoleId) {
      const tenantId = authResponse.user?.tenantId;
      const tenantRoleId = authResponse.currentTenantRole.tenantRoleId;
      
      if (tenantId && tenantRoleId) {
        return await getCurrentUserDashboard(tenantId, tenantRoleId);
      }
    }
    
    // accessibleTenants에서 첫 번째 테넌트의 역할 사용 (멀티 테넌트)
    if (authResponse?.accessibleTenants && authResponse.accessibleTenants.length > 0) {
      const firstTenant = authResponse.accessibleTenants[0];
      if (firstTenant?.tenantRole?.tenantRoleId) {
        return await getCurrentUserDashboard(
          firstTenant.tenantId,
          firstTenant.tenantRole.tenantRoleId
        );
      }
    }
    
    return null;
  } catch (error) {
    console.error('AuthResponse에서 대시보드 조회 실패:', error);
    return null;
  }
};

/**
 * 레거시 역할 기반 대시보드 경로 (하위 호환성)
 * 
 * @param {string} role 역할
 * @returns {string} 대시보드 경로
 */
export const getLegacyDashboardPath = (role) => {
  if (!role) return '/client/dashboard';
  
  const normalizedRole = role.toUpperCase();
  const ROLE_DASHBOARD_MAP = {
    'CLIENT': '/client/dashboard',
    'CONSULTANT': '/consultant/dashboard',
    'ADMIN': '/admin/dashboard',
    'BRANCH_SUPER_ADMIN': '/super_admin/dashboard',
    'BRANCH_MANAGER': '/admin/dashboard',
    'HQ_ADMIN': '/hq/dashboard',
    'SUPER_HQ_ADMIN': '/hq/dashboard',
    'HQ_MASTER': '/hq_master/dashboard',
    'HQ_SUPER_ADMIN': '/hq/dashboard'
  };
  
  return ROLE_DASHBOARD_MAP[normalizedRole] || '/client/dashboard';
};

/**
 * 동적 대시보드 라우팅 (우선순위: 동적 조회 > 레거시)
 * 
 * @param {Object} authResponse 로그인 응답
 * @param {Function} navigate React Router navigate 함수
 * @returns {Promise<void>}
 */
export const redirectToDynamicDashboard = async (authResponse, navigate) => {
  try {
    // 1차: 동적 대시보드 조회 시도
    const dashboard = await getDashboardFromAuthResponse(authResponse);
    
    if (dashboard) {
      const dashboardPath = getDynamicDashboardPath(dashboard);
      console.log('✅ 동적 대시보드 라우팅:', dashboardPath, dashboard);
      navigate(dashboardPath, { replace: true });
      return;
    }
    
    // 2차: 레거시 역할 기반 라우팅 (하위 호환성)
    const userRole = authResponse?.user?.role;
    if (userRole) {
      const legacyPath = getLegacyDashboardPath(userRole);
      console.log('⚠️ 레거시 대시보드 라우팅:', legacyPath);
      navigate(legacyPath, { replace: true });
      return;
    }
    
    // 3차: 기본 대시보드
    console.log('⚠️ 기본 대시보드로 라우팅');
    navigate('/dashboard', { replace: true });
    
  } catch (error) {
    console.error('❌ 동적 대시보드 라우팅 실패:', error);
    // 에러 시 기본 대시보드로
    navigate('/dashboard', { replace: true });
  }
};

