/**
 * 동적 대시보드 조회 유틸리티
/**
 * 하드코딩된 역할 기반 라우팅 대신 백엔드에서 동적으로 대시보드 정보 조회
 */

import { apiGet } from './ajax';
import { API_BASE_URL } from '../constants/api';
import {
  hasOperatorCapability,
  hasCounselorCapability,
  isAdmin,
  isStaff
} from './RoleUtils';

const TENANT_DASHBOARDS_BASE = '/api/v1/tenant/dashboards';

/**
 * 사용자의 역할에 맞는 대시보드 정보 조회
/**
 * 
/**
 * @param {string} tenantId 테넌트 ID
/**
 * @param {string} tenantRoleId 역할 ID (선택)
/**
 * @returns {Promise<Object|null>} 대시보드 정보 또는 null
 */
export const getCurrentUserDashboard = async(tenantId, tenantRoleId = null) => {
  try {
    let endpoint;
    
    if (tenantRoleId) {
      // 역할 ID가 있으면 역할별 대시보드 조회
      endpoint = `${TENANT_DASHBOARDS_BASE}/by-role/${tenantRoleId}`;
    } else {
      // 역할 ID가 없으면 현재 사용자 대시보드 조회
      endpoint = `${TENANT_DASHBOARDS_BASE}/current`;
    }
    
    const response = await apiGet(endpoint);
    
    // apiGet이 이미 ApiResponse 래퍼를 처리하여 data를 반환하므로
    // response가 있으면 그대로 반환
    if (response) {
      return response;
    }
    
    return null;
  } catch (error) {
    // 404 오류는 조용히 처리 (대시보드가 없을 수 있음)
    if (error.status === 404 || (error.message && (error.message.includes('404') || error.message.includes('찾을 수 없습니다')))) {
      // 404는 정상적인 상황이므로 조용히 처리 (콘솔 로그 제거)
      return null;
    }
    // 기타 오류는 로그만 남기고 null 반환
    console.warn('대시보드 조회 실패:', error.message || error);
    return null;
  }
};

/**
 * 동적 대시보드 경로 생성
/**
 * 
/**
 * @param {Object} dashboard 대시보드 정보
/**
 * @returns {string} 대시보드 경로
 */
export const getDynamicDashboardPath = (dashboard) => {
  if (!dashboard) {
    return '/dashboard';
  }
  
  // 대시보드 타입 기반 경로 생성
  const type = dashboard.dashboardType?.toLowerCase() || 'default';
  
  // 동적 대시보드 타입 경로 — 로그인 랜딩 SSOT와 별개(resolvePostLoginLandingPath 우선).
  // STAFF/ADMIN 타입 폴백은 운영 홈 `/admin/dashboard` (LNB 「운영 현황」 `/erp/dashboard` 와 별개).
  const typePathMap = {
    'student': '/academy',
    'teacher': '/academy',
    'admin': '/admin/dashboard',
    'staff': '/admin/dashboard',
    'client': '/client/dashboard',
    'consultant': '/consultant/dashboard',
    'principal': '/admin/dashboard',
    'default': '/dashboard'
  };
  
  return typePathMap[type] || `/dashboard/${type}`;
};

/**
 * 대시보드 타입에 따른 컴포넌트 이름 반환
/**
 * 
/**
 * @param {string} dashboardType 대시보드 타입
/**
 * @returns {string} 컴포넌트 이름
 */
export const getDashboardComponentName = (dashboardType) => {
  if (!dashboardType) {
    return 'CommonDashboard';
  }
  
  const type = dashboardType.toUpperCase();
  
  // STAFF: ERP 제외 시 ADMIN과 동일 대시보드 컴포넌트 사용 (STAFF_PERMISSION_POLICY_PHASE2)
  const componentMap = {
    'STUDENT': 'AcademyDashboard',
    'TEACHER': 'AcademyDashboard',
    'ADMIN': 'AdminDashboard',
    'STAFF': 'AdminDashboard',
    'CLIENT': 'ClientDashboard',
    'CONSULTANT': 'CommonDashboard',
    'PRINCIPAL': 'AdminDashboard',
    'DEFAULT': 'CommonDashboard'
  };
  
  return componentMap[type] || 'CommonDashboard';
};

/**
 * AuthResponse의 currentTenantRole 정보로 대시보드 조회
/**
 * 
/**
 * @param {Object} authResponse 로그인 응답
/**
 * @returns {Promise<Object|null>} 대시보드 정보 또는 null
 */
export const getDashboardFromAuthResponse = async(authResponse) => {
  try {
    // AuthResponse에 currentTenantRole이 있으면 사용
    if (authResponse?.currentTenantRole?.tenantRoleId) {
      const tenantId = authResponse.user?.tenantId;
      const { tenantRoleId } = authResponse.currentTenantRole;
      
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
 * 로그인 후 역할 기반 랜딩 경로 SSOT.
 *
 * - ADMIN (및 dual ADMIN+상담): 운영 대시보드 `/admin/dashboard` (LNB 최상단 「대시보드」)
 * - STAFF(사무원): 운영 홈 `/admin/dashboard` (돈 콕핏·재무 랜딩 금지)
 * - CONSULTANT-only: `/consultant/dashboard`
 * - `/erp/dashboard`(운영 현황)·`/erp/financial`(이번 달 돈)은 로그인 랜딩 금지
 *
 * @param {{ role?: string, counselingEnabled?: boolean, hasOperatorRole?: boolean, hasCounselorRole?: boolean }|null|undefined} user
 * @returns {string}
 */
export const resolvePostLoginLandingPath = (user) => {
  if (isAdmin(user)) {
    return '/admin/dashboard';
  }
  if (isStaff(user)) {
    return '/admin/dashboard';
  }
  // 레거시 플래그 등 ADMIN/STAFF 정규화 밖 운영자 — ADMIN/STAFF와 동일 운영 홈
  if (hasOperatorCapability(user)) {
    return '/admin/dashboard';
  }
  if (hasCounselorCapability(user)) {
    return '/consultant/dashboard';
  }
  const role = user?.role;
  if (role) {
    return getLegacyDashboardPath(role);
  }
  return '/client/dashboard';
};

/**
 * 레거시 역할 기반 대시보드 경로 (하위 호환성)
/**
 * 
/**
 * @param {string} role 역할
/**
 * @returns {string} 대시보드 경로
 */
export const getLegacyDashboardPath = (role) => {
  if (!role) return '/client/dashboard';
  
  const normalizedRole = role.toUpperCase();
  // ADMIN/STAFF: 운영 홈 `/admin/dashboard` (재무 leftover `/erp/dashboard` 랜딩 금지)
  const ROLE_DASHBOARD_MAP = {
    'CLIENT': '/client/dashboard',
    'CONSULTANT': '/consultant/dashboard',
    'ADMIN': '/admin/dashboard',
    'STAFF': '/admin/dashboard',
    'BRANCH_SUPER_ADMIN': '/super_admin/dashboard',
    'BRANCH_MANAGER': '/admin/dashboard',
    'HQ_ADMIN': '/admin/dashboard',
    'SUPER_HQ_ADMIN': '/admin/dashboard',
    'HQ_MASTER': '/admin/dashboard',
    'HQ_SUPER_ADMIN': '/admin/dashboard'
  };
  
  return ROLE_DASHBOARD_MAP[normalizedRole] || '/client/dashboard';
};

/**
 * 동적 대시보드 라우팅 (우선순위: 동적 조회 > 레거시)
/**
 * 
/**
 * @param {Object} authResponse 로그인 응답
/**
 * @param {Function} navigate React Router navigate 함수
/**
 * @returns {Promise<void>}
 */
export const redirectToDynamicDashboard = async(authResponse, navigate) => {
  try {
    const user = authResponse?.user;
    const roleLandingPath = resolvePostLoginLandingPath(user);

    // 1차: 동적 대시보드 조회 시도
    const dashboard = await getDashboardFromAuthResponse(authResponse);

    // ADMIN(듀얼 포함)·STAFF: 동적 결과보다 resolvePostLoginLandingPath 우선
    if (isAdmin(user) || isStaff(user) || hasOperatorCapability(user)) {
      console.log('✅ 운영자 랜딩:', roleLandingPath);
      navigate(roleLandingPath, { replace: true });
      return;
    }

    if (dashboard) {
      const dashboardPath = getDynamicDashboardPath(dashboard);
      console.log('✅ 동적 대시보드 라우팅:', dashboardPath, dashboard);
      navigate(dashboardPath, { replace: true });
      return;
    }

    console.log('✅ 역할 기반 랜딩:', roleLandingPath);
    navigate(roleLandingPath, { replace: true });
  } catch (error) {
    console.error('❌ 동적 대시보드 라우팅 실패:', error);
    const fallback = resolvePostLoginLandingPath(authResponse?.user);
    navigate(fallback, { replace: true });
  }
};

