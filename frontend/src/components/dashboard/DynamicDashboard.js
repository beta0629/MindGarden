/**
 * 동적 대시보드 컴포넌트
/**
 * 백엔드에서 조회한 대시보드 정보를 기반으로 적절한 대시보드 컴포넌트를 동적으로 로드
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-01-XX
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import Button from '../ui/Button/Button';
import { getCurrentUserDashboard, getDashboardComponentName } from '../../utils/dashboardUtils';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import notificationManager from '../../utils/notification';
import { USER_ROLES } from '../../constants/roles';
import DashboardGrid from '../layout/DashboardGrid';
import { 
  getWidgetComponent,
  getCommonWidgetTypes,
  getConsultationWidgetTypes,
  getAcademyWidgetTypes,
  getErpWidgetTypes
} from './widgets/WidgetRegistry';
import WidgetCardWrapper from './widgets/WidgetCardWrapper';
import { apiGet } from '../../utils/ajax';
import {
  filterWidgetsByBusinessType,
  isWidgetVisible,
  validateWidgetAccess
} from '../../utils/widgetVisibilityUtils';

// 대시보드 컴포넌트 동적 import
import CommonDashboard from './CommonDashboard';
import ClientDashboard from '../client/ClientDashboard';
import AdminDashboard from '../admin/AdminDashboard';
import AcademyDashboard from '../academy/AcademyDashboard';

const DASHBOARD_COMPONENTS = {
  'CommonDashboard': CommonDashboard,
  'ClientDashboard': ClientDashboard,
  'AdminDashboard': AdminDashboard,
  'AcademyDashboard': AcademyDashboard
};

const DynamicDashboard = ({ user: propUser, dashboard: propDashboard }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: sessionUser, isLoading: sessionLoading } = useSession();
  const [dashboard, setDashboard] = useState(propDashboard);
  const [isLoading, setIsLoading] = useState(!propDashboard);
  const [error, setError] = useState(null);
  
  const currentUser = propUser || sessionUser || sessionManager.getUser();
  
  // currentUser 및 tenant 정보 상세 로깅 (useEffect 대신 즉시 로깅)
  if (currentUser) {
    console.log('DEBUG: currentUser 정보 (최상단)', currentUser);
    console.log('DEBUG: currentUser.tenant 정보 (최상단)', currentUser.tenant);
    console.log('DEBUG: currentUser.tenant.businessType (최상단)', currentUser.tenant?.businessType);
  }
  
  // URL 쿼리 파라미터에서 dashboardId 확인 (관리자 미리보기용)
  const queryParams = new URLSearchParams(location.search);
  const dashboardIdFromQuery = queryParams.get('dashboardId');
  const isAdminPreview = location.state?.isAdminPreview || false;

  // dashboardConfig 기반 위젯 렌더링 (early return 전에 호출해야 함)
  const dashboardConfig = useMemo(() => {
    if (!dashboard?.dashboardConfig) {
      return null;
    }
    
    try {
      return typeof dashboard.dashboardConfig === 'string' 
        ? JSON.parse(dashboard.dashboardConfig)
        : dashboard.dashboardConfig;
    } catch (err) {
      console.error('❌ dashboardConfig JSON 파싱 실패:', err);
      return null;
    }
  }, [dashboard?.dashboardConfig]);

  // 인증 체크: 사용자가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    // 세션이 로딩 중이면 대기
    if (sessionLoading) {
      return;
    }

    // 사용자 정보가 없으면 로그인 페이지로 리다이렉트
    if (!currentUser || !currentUser.id) {
      console.log('❌ 사용자 정보 없음, 로그인 페이지로 이동');
      navigate('/login', { replace: true });
      return;
    }
  }, [currentUser, sessionLoading, navigate]);

  // loadDashboard 함수를 useCallback으로 감싸고 필요한 의존성만 명시
  const loadDashboard = useCallback(async () => {
    if (!currentUser) {
      setError('사용자 정보가 없습니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 관리자 미리보기 모드: dashboardId 쿼리 파라미터로 직접 조회
      if (dashboardIdFromQuery && isAdminPreview) {
        console.log('🔍 관리자 미리보기 모드: dashboardId로 직접 조회', dashboardIdFromQuery);
        try {
          const dashboardData = await apiGet(`/api/v1/tenant/dashboards/${dashboardIdFromQuery}`);
          if (dashboardData) {
            setDashboard(dashboardData);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('❌ 대시보드 조회 실패:', error);
          setError('대시보드를 불러올 수 없습니다.');
          setIsLoading(false);
          return;
        }
      }

      // 사용자 정보에 tenantId가 없으면 최신 정보 다시 로드 시도
      let userWithTenant = currentUser;
      if (!currentUser.tenantId) {
        console.warn('⚠️ 사용자 정보에 tenantId가 없음, 최신 정보 다시 로드 시도');
        try {
          // sessionManager를 통해 최신 사용자 정보 가져오기
          await sessionManager.checkSession(true);
          const latestUser = sessionManager.getUser();
          if (latestUser && latestUser.tenantId) {
            userWithTenant = latestUser;
            console.log('✅ 최신 사용자 정보 로드 완료, tenantId:', latestUser.tenantId);
            console.log('DEBUG: latestUser 정보', latestUser);
            console.log('DEBUG: latestUser.tenant 정보', latestUser.tenant);
            console.log('DEBUG: latestUser.tenant.businessType', latestUser.tenant?.businessType);
            
            // 핵심 수정: latestUser.tenant가 없으면 tenantId를 기반으로 tenant 객체 합성
            if (!userWithTenant.tenant && userWithTenant.tenantId && typeof userWithTenant.tenantId === 'string') {
              const inferredBusinessType = inferBusinessTypeFromTenantId(userWithTenant.tenantId);
              userWithTenant.tenant = { 
                tenantId: userWithTenant.tenantId,
                businessType: inferredBusinessType
              }; // 합성된 tenant 객체 할당
              console.warn(`⚠️ tenantId(${userWithTenant.tenantId})에서 businessType(${inferredBusinessType}) 유추 및 tenant 객체 합성`);
            }
          }
        } catch (reloadError) {
          console.warn('⚠️ 최신 사용자 정보 로드 실패:', reloadError);
        }
      }
      
      const tenantId = userWithTenant.tenantId;
      const tenantRoleId = userWithTenant.currentTenantRoleId || 
                          userWithTenant.tenantRole?.tenantRoleId ||
                          null;

      if (!tenantId) {
        // tenantId가 없으면 역할 기반 라우팅으로 폴백
        console.warn('⚠️ 테넌트 정보가 없어 역할 기반 라우팅으로 폴백합니다.');
        const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
        const authResponse = {
          user: userWithTenant,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
        setIsLoading(false);
        return;
      }

      // dashboardId 쿼리 파라미터가 있으면 해당 대시보드 직접 조회 (관리자용)
      if (dashboardIdFromQuery) {
        console.log('🔍 dashboardId로 직접 조회:', dashboardIdFromQuery);
        try {
          const dashboardData = await apiGet(`/api/v1/tenant/dashboards/${dashboardIdFromQuery}`);
          if (dashboardData) {
            setDashboard(dashboardData);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('⚠️ dashboardId로 조회 실패, 역할 기반 조회로 폴백:', error);
        }
      }

      // 동적 대시보드 조회 시도 (404는 조용히 처리)
      const dashboardData = await getCurrentUserDashboard(tenantId, tenantRoleId);

      if (dashboardData) {
        // 동적 대시보드가 있으면 사용
        setDashboard(dashboardData);
      } else {
        // 대시보드가 없으면 역할 기반 라우팅으로 폴백 (조용히 처리)
        console.log('⚠️ 동적 대시보드 없음, 역할 기반 라우팅으로 폴백');
        const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
        const authResponse = {
          user: userWithTenant,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error('❌ 대시보드 로드 실패:', err);
      setError(err.message || '대시보드를 불러오는 중 오류가 발생했습니다.');
      notificationManager.show('대시보드를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, propDashboard, dashboardIdFromQuery, isAdminPreview, navigate]);

  useEffect(() => {
    // propDashboard가 없으면 조회
    if (!propDashboard && currentUser && currentUser.id) {
      loadDashboard();
    }
  }, [propDashboard, dashboardIdFromQuery, currentUser?.id, isAdminPreview, navigate, loadDashboard]);

  if (isLoading) {
    return (
      <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="대시보드">
        <div className="mg-dashboard-loading">
          <div className="mg-loading">로딩중...</div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (error) {
    return (
      <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="대시보드">
        <div className="mg-dashboard-error">
          <h2 className="mg-dashboard-error__title">대시보드 로드 실패</h2>
          <p className="mg-dashboard-error__message">{error}</p>
          <Button 
            onClick={loadDashboard}
            variant="primary"
            preventDoubleClick={true}
            className="mg-dashboard-error__retry-button"
          >
            다시 시도
          </Button>
        </div>
      </AdminCommonLayout>
    );
  }

  // 🚨 임시 수정: 관리자 계정은 바로 AdminDashboard로 이동 (무한로딩 방지)
  const userRole = currentUser?.role;
  const adminRoles = ['ADMIN', 'BRANCH_MANAGER', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER', 'TENANT_ADMIN', 'OWNER', 'MANAGER'];
  const isAdmin = userRole && adminRoles.includes(userRole);
  
  console.log('🔍 관리자 체크:', { userRole, isAdmin, adminRoles });
  
  // 🧪 테스트: 관리자에게 간단한 위젯 하나만 표시 (비활성화)
  // eslint-disable-next-line no-constant-condition
  if (false && isAdmin) {
    console.log('🧪 관리자 테스트 → 간단한 위젯 하나만 표시');
    
    const simpleTestConfig = {
      version: '1.0',
      layout: { type: 'grid', columns: 2, gap: 'md', rows: 3 },
      widgets: [
        {
          id: 'admin-welcome',
          type: 'message',
          position: { row: 1, col: 1, colspan: 2, rowspan: 1 },
          config: {
            title: '🏥 마인드가든 상담소 관리자',
            message: '테스트 상담소에 오신 것을 환영합니다. 오늘도 좋은 하루 되세요!',
            color: 'primary',
            icon: 'welcome'
          }
        },
        {
          id: 'admin-user-info',
          type: 'statistics',
          position: { row: 2, col: 1, colspan: 1, rowspan: 1 },
          config: {
            title: '👤 현재 사용자',
            color: 'info',
            dataSource: {
              type: 'api',
              url: '/api/v1/auth/current-user'
            }
          }
        },
        {
          id: 'admin-branding',
          type: 'statistics',
          position: { row: 2, col: 2, colspan: 1, rowspan: 1 },
          config: {
            title: '🏢 상담소 정보',
            color: 'success',
            dataSource: {
              type: 'api',
              url: '/api/v1/admin/branding'
            }
          }
        },
        {
          id: 'admin-quick-actions',
          type: 'quick-actions',
          position: { row: 3, col: 1, colspan: 2, rowspan: 1 },
          config: {
            title: '⚡ 관리자 빠른 작업',
            actions: [
              { id: 'manage-consultants', label: '상담사 관리', icon: 'users', url: '/admin/consultant-comprehensive' },
              { id: 'manage-clients', label: '내담자 관리', icon: 'user', url: '/admin/client-comprehensive' },
              { id: 'view-mappings', label: '매칭 관리', icon: 'link', url: '/admin/mapping-management' },
              { id: 'view-schedules', label: '스케줄 관리', icon: 'calendar', url: '/admin/schedule' },
              { id: 'system-settings', label: '시스템 설정', icon: 'settings', url: '/admin/system-config' },
              { id: 'reports', label: '통계 보고서', icon: 'chart', url: '/admin/statistics' }
            ],
            color: 'primary'
          }
        }
      ],
      theme: {
        primaryColor: 'var(--mg-primary-500)',
        secondaryColor: 'var(--mg-secondary-500)'
      }
    };
    
    return <WidgetBasedDashboard
      dashboardConfig={simpleTestConfig}
      dashboard={dashboard}
      user={currentUser}
      businessType="TEST"
    />;
  }
  
  // 일반 사용자는 기존 로직 유지
  const dashboardType = dashboard?.dashboardType || currentUser?.role || 'DEFAULT';
  const componentName = getDashboardComponentName(dashboardType);
  const DashboardComponent = DASHBOARD_COMPONENTS[componentName] || CommonDashboard;

  console.log('🎯 동적 대시보드 렌더링:', {
    userRole,
    isAdmin,
    hasDashboard: !!dashboard,
    hasDashboardConfig: !!dashboard?.dashboardConfig,
    user: currentUser
  });

  // 관리자 역할 확인 (확장된 역할 목록)
  const tenantAdminRoles = ['ADMIN', 'BRANCH_MANAGER', 'BRANCH_SUPER_ADMIN', 'TENANT_ADMIN', 'OWNER', 'MANAGER']; // 테넌트별 관리자(원장)
  const superAdminRoles = ['HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER', 'SUPER_ADMIN', 'SYSTEM_ADMIN']; // 슈퍼 관리자
  const allAdminRoles = [...tenantAdminRoles, ...superAdminRoles];

  const isTenantAdmin = userRole && tenantAdminRoles.includes(userRole); // 테넌트별 관리자(원장)
  const isSuperAdmin = userRole && superAdminRoles.includes(userRole); // 슈퍼 관리자
  const isAnyAdmin = userRole && allAdminRoles.includes(userRole); // 모든 관리자

  // 업종 정보 추출 (dashboard 또는 user에서)
  let businessType = dashboard?.businessType ||
                    dashboard?.categoryCode ||
                    currentUser?.tenant?.businessType ||
                    currentUser?.tenant?.categoryCode ||
                    sessionManager.getUser()?.tenant?.businessType ||
                    sessionStorage.getItem('businessType');

  // 임시 방편: currentUser.tenant 정보가 없으면 tenantId에서 businessType 유추
  if (!businessType && currentUser?.tenantId && typeof currentUser.tenantId === 'string') {
    const tenantIdLower = currentUser.tenantId.toLowerCase();
    if (tenantIdLower.includes('consultation')) {
      businessType = 'CONSULTATION';
      console.warn('⚠️ tenantId에서 businessType 유추: CONSULTATION', currentUser.tenantId);
    } else if (tenantIdLower.includes('academy')) {
      businessType = 'ACADEMY';
      console.warn('⚠️ tenantId에서 businessType 유추: ACADEMY', currentUser.tenantId);
    }
  }

  // 빈 문자열이나 undefined를 null로 변환
  if (!businessType || businessType === '') {
    businessType = null;
  }

  console.log('🚨 최종 역할 확인:', {
    userRole,
    isTenantAdmin,
    isSuperAdmin,
    isAnyAdmin,
    businessType,
    tenantAdminRoles,
    superAdminRoles,
    userInfo: {
      id: currentUser?.id,
      email: currentUser?.email,
      tenantId: currentUser?.tenant?.tenantId,
      businessType: currentUser?.tenant?.businessType
    }
  });

  // 위젯 기반 대시보드 렌더링 우선 적용
  let effectiveDashboardConfig = dashboardConfig;
  let shouldUseWidgetDashboard = false;

  // 위젯이 없는 경우 또는 빈 배열인 경우 기본 위젯 세트 생성
  const hasValidWidgets = dashboardConfig?.widgets && Array.isArray(dashboardConfig.widgets) && dashboardConfig.widgets.length > 0;

  // 관리자는 항상 모든 위젯을 표시
  if (isAnyAdmin) {
    console.log('관리자용 위젯 생성 (모든 위젯 포함)');
    effectiveDashboardConfig = createDefaultAdminDashboardConfig(allAdminRoles);
    shouldUseWidgetDashboard = true;
  } 
  // 비관리자이면서 유효한 위젯 설정이 없는 경우
  else if (!hasValidWidgets) {
    console.log('기본 위젯 세트 생성 시작 (비관리자)');
    if (businessType) {
      console.log(`일반 사용자용 위젯 생성: ${businessType}`);
      effectiveDashboardConfig = createDefaultBusinessTypeDashboardConfig(businessType);
      shouldUseWidgetDashboard = true;
    } else {
      console.log('위젯 생성 조건 불충족: businessType 없음');
    }
  } else {
    console.log('기존 위젯 설정 사용');
    effectiveDashboardConfig = dashboardConfig; // 원본 대시보드 설정을 사용
    shouldUseWidgetDashboard = true;
  }

  console.log('최종 위젯 생성 결과 (롤백 후):', {
    shouldUseWidgetDashboard,
    effectiveConfigExists: !!effectiveDashboardConfig,
    effectiveWidgetsCount: effectiveDashboardConfig?.widgets?.length
  });

  // 위젯 기반 렌더링
  if (shouldUseWidgetDashboard && effectiveDashboardConfig) {

    console.log('🔍 업종 정보 추출:', {
      dashboardBusinessType: dashboard?.businessType,
      dashboardCategoryCode: dashboard?.categoryCode,
      tenantBusinessType: currentUser?.tenant?.businessType,
      tenantCategoryCode: currentUser?.tenant?.categoryCode,
      sessionManagerBusinessType: sessionManager.getUser()?.tenant?.businessType,
      sessionStorageBusinessType: sessionStorage.getItem('businessType'),
      finalBusinessType: businessType,
      isNull: businessType === null,
      isUndefined: businessType === undefined,
      isEmpty: businessType === ''
    });
    
    return <WidgetBasedDashboard dashboardConfig={effectiveDashboardConfig} dashboard={dashboard} user={currentUser} businessType={businessType} />;
  }

  // ⭐ 관리자도 위젯 기반 대시보드 사용 가능하도록 수정
  if (isAnyAdmin) {
    // 관리자가 위젯을 설정한 경우 위젯 기반 대시보드 사용
    if (dashboardConfig && dashboardConfig.widgets && Array.isArray(dashboardConfig.widgets) && dashboardConfig.widgets.length > 0) {
      console.log('🎯 관리자 역할 → 위젯 기반 대시보드 사용 (위젯 설정됨):', {
        위젯수: dashboardConfig.widgets.length,
        위젯목록: dashboardConfig.widgets.map(w => w.type)
      });
      return <WidgetBasedDashboard dashboardConfig={dashboardConfig} dashboard={dashboard} user={currentUser} businessType={businessType} />;
    } else {
      // 관리자용 기본 위젯 템플릿 생성
      const defaultAdminDashboardConfig = {
        version: '1.0',
        layout: { type: 'grid', columns: 2, gap: 'md' },
        widgets: [
          {
            id: 'admin-welcome',
            type: 'message',
            position: { row: 1, col: 1, colspan: 2, rowspan: 1 },
            config: {
              title: '🏥 마인드가든 관리자 대시보드',
              message: '환영합니다! 효율적인 상담소 운영을 위한 통합 관리 시스템입니다.',
              variant: 'primary'
            }
          },
          {
            id: 'today-stats',
            type: 'today-stats',
            position: { row: 2, col: 1, colspan: 2, rowspan: 1 },
            config: {
              title: '📊 오늘의 현황',
              subtitle: '실시간 상담 및 사용자 통계',
              refreshInterval: 300000
            }
          },
          {
            id: 'system-overview',
            type: 'system-overview',
            position: { row: 3, col: 1, colspan: 2, rowspan: 1 },
            config: {
              title: '🏢 시스템 개요',
              subtitle: '전체 시스템 현황 요약',
              refreshInterval: 30000
            }
          },
          {
            id: 'admin-management',
            type: 'management-grid',
            position: { row: 4, col: 1, colspan: 2, rowspan: 2 },
            config: {
              title: '⚙️ 관리 기능',
              subtitle: '마인드가든 관리 도구',
              columns: 3
            }
          },
          {
            id: 'admin-quick-actions',
            type: 'quick-actions',
            position: { row: 6, col: 1, colspan: 2, rowspan: 1 },
            config: {
              title: '⚡ 빠른 작업',
              subtitle: '자주 사용하는 관리 기능',
              columns: 3,
              actions: [
                { id: 'manage-consultants', label: '상담사 관리', icon: 'users', url: '/admin/consultant-comprehensive' },
                { id: 'manage-clients', label: '내담자 관리', icon: 'user', url: '/admin/client-comprehensive' },
                { id: 'view-mappings', label: '매칭 관리', icon: 'link', url: '/admin/mapping-management' },
                { id: 'view-schedules', label: '스케줄 관리', icon: 'calendar', url: '/admin/schedule' },
                { id: 'system-settings', label: '시스템 설정', icon: 'settings', url: '/admin/system-config' },
                { id: 'reports', label: '통계 보고서', icon: 'chart', url: '/admin/statistics' }
              ],
              color: 'primary'
            }
          }
        ]
      };
      
      console.log('🎯 관리자 역할 → 기본 마인드가든 위젯 대시보드 사용 (위젯 없음)');
      return <WidgetBasedDashboard 
        dashboardConfig={defaultAdminDashboardConfig} 
        dashboard={dashboard} 
        user={currentUser} 
        businessType={businessType} 
      />;
    }
  }

  // 일반 사용자만 새로운 위젯 기반 대시보드 사용
  if (dashboardConfig && dashboardConfig.widgets && Array.isArray(dashboardConfig.widgets) && dashboardConfig.widgets.length > 0) {
    console.log('🎯 일반 사용자 → 새로운 위젯 기반 대시보드 사용');
    return <WidgetBasedDashboard dashboardConfig={dashboardConfig} dashboard={dashboard} user={currentUser} businessType={businessType} />;
  }

  // 기존 컴포넌트 기반 렌더링 (하위 호환성)
  return (
    <DashboardComponent 
      user={currentUser}
      dashboard={dashboard}
    />
  );
};

/**
 * 위젯 기반 대시보드 컴포넌트
/**
 * @param {Object} props
/**
 * @param {Object} props.dashboardConfig - 대시보드 설정 JSON
/**
 * @param {Object} props.dashboard - 대시보드 정보
/**
 * @param {Object} props.user - 사용자 정보
/**
 * @param {string} props.businessType - 업종 타입 (선택적)
 */
const WidgetBasedDashboard = ({ dashboardConfig, dashboard, user, businessType: propBusinessType = null }) => {
  const { layout, widgets, theme, cardLayout, refresh } = dashboardConfig;
  const [businessType, setBusinessType] = useState(propBusinessType);
  
  // 업종 정보 동적 로드 (tenantId 기반)
  useEffect(() => {
    const loadBusinessType = async () => {
      if (businessType) {
        return; // 이미 있으면 스킵
      }
      
      if (!user?.tenantId) {
        console.warn('tenantId가 없어 업종 정보를 조회할 수 없습니다.');
        return;
      }
      
      try {
        console.debug(`테넌트 업종 정보 조회 시작: ${user.tenantId}`);
        
        // /api/v1/auth/current-user 응답에서 businessType 조회
        const currentUserInfo = await apiGet('/api/v1/auth/current-user');
        
        if (currentUserInfo?.businessType) {
          setBusinessType(currentUserInfo.businessType);
          console.debug(`current-user에서 업종 정보 조회 성공: ${user.tenantId} → ${currentUserInfo.businessType}`);
        } else {
          // 폴백: 브랜딩 정보에서 테넌트 정보 추출
          const brandingInfo = await apiGet('/api/v1/admin/branding');
          if (brandingInfo?.tenantInfo?.businessType) {
            setBusinessType(brandingInfo.tenantInfo.businessType);
            console.debug(`브랜딩 정보에서 업종 정보 조회: ${brandingInfo.tenantInfo.businessType}`);
          } else {
            console.warn('업종 정보를 찾을 수 없습니다. 관리자는 모든 위젯 접근 가능');
            setBusinessType('CONSULTATION'); // 임시 기본값
          }
        }
        
      } catch (error) {
        console.error(`테넌트 업종 정보 조회 실패: ${user.tenantId}`, error);
      }
    };
    
    loadBusinessType();
  }, [user?.tenantId, businessType]);
  
  // 레이아웃 설정 (동적)
  const getLayoutConfig = () => {
    const defaultConfig = {
      type: 'grid',
      columns: 3,
      gap: 'md'
    };

    if (!layout) return defaultConfig;

    return {
      type: layout.type || defaultConfig.type,
      columns: layout.columns || defaultConfig.columns,
      gap: layout.gap || defaultConfig.gap
    };
  };

  const layoutConfig = getLayoutConfig();
  const { type: layoutType, columns, gap } = layoutConfig;
  
  // 카드 레이아웃 설정 (동적)
  const getCardLayoutConfig = () => {
    const defaultConfig = {
      style: 'v2',
      variant: 'elevated',
      padding: 'md',
      borderRadius: 'md',
      hoverEffect: true,
      shadow: 'md'
    };

    return cardLayout || defaultConfig;
  };

  const defaultCardStyle = getCardLayoutConfig();
  
  // tenantId에서 업종 정보 추출 (동적)
  useEffect(() => {
    if (!businessType && user?.tenantId) {
      console.debug(`업종 정보 누락, tenantId에서 추출 시도: ${user.tenantId}`);
      
      // API 호출로 테넌트 정보 조회
      const fetchBusinessType = async () => {
        try {
          // /api/v1/auth/current-user API가 이미 tenantId를 가지고 있으니
          // 추가 API 호출 대신 현재 URL이나 다른 방법 사용
          
          // 임시 해결: 현재 페이지가 /admin 경로면 관리자이므로 모든 위젯 허용
          if (window.location.pathname.includes('/admin')) {
            console.debug('관리자 페이지에서 접근, 업종 무관하게 모든 위젯 허용');
            setBusinessType('ADMIN_ALL_ACCESS');
            return;
          }
          
          // API에서 테넌트 정보 조회 (실제 구현)
          const response = await apiGet(`/api/admin/branding`);
          if (response?.tenantId) {
            // 브랜딩 정보에서 업종 추출 또는 별도 API 호출
            console.debug('브랜딩 정보에서 테넌트 정보 확인:', response);
          }
          
        } catch (error) {
          console.warn('업종 정보 조회 실패, 기본값 사용:', error);
          setBusinessType('CONSULTATION'); // 임시 기본값
        }
      };
      
      fetchBusinessType();
    }
  }, [user?.tenantId, businessType]);
  
  // 업종별 위젯 필터링 (1차: 업종 기반)
  const businessFilteredWidgets = businessType 
    ? filterWidgetsByBusinessType(widgets, businessType, user?.role)
    : widgets;
  
  console.debug(`🔍 업종별 위젯 필터링 시작: ${widgets.length}개`, {
    businessType: businessType || 'undefined',
    userRole: user?.role || 'undefined',
    user_object: user,
    originalCount: widgets.length
  });
  
  console.debug(`📊 업종별 위젯 필터링 완료: ${widgets.length} → ${businessFilteredWidgets.length}개`, {
    businessType: businessType || 'undefined',
    userRole: user?.role || 'undefined',
    filteredCount: businessFilteredWidgets.length
  });
  
  // 위젯 필터링 (2차: visibility 조건 확인)
  const visibleWidgets = businessFilteredWidgets.filter(widget => {
    // 업종별 가시성 검증 (디버깅 로그 강화)
    console.debug(`🔍 위젯 가시성 검증 시작: ${widget.type}`, {
      businessType: businessType || 'undefined',
      userRole: user?.role || 'undefined', 
      widget_id: widget.id
    });
    
    const isVisible = isWidgetVisible(widget.type, businessType, user?.role);
    
    if (!isVisible) {
      console.debug(`❌ 위젯 가시성 검증 실패: ${widget.type}`, {
        businessType: businessType || 'undefined',
        userRole: user?.role || 'undefined',
        reason: '위젯 필터링 규칙에 의해 차단됨'
      });
      return false;
    }
    
    console.debug(`✅ 위젯 가시성 검증 성공: ${widget.type}`);
    return true;
  });
  
  // 위젯 정렬 (position 기반)
  const sortedWidgets = [...visibleWidgets].sort((a, b) => {
    const posA = a.position || { row: 0, col: 0 };
    const posB = b.position || { row: 0, col: 0 };
    
    if (posA.row !== posB.row) {
      return posA.row - posB.row;
    }
    return posA.col - posB.col;
  });
  
  // 위젯 렌더링
  const renderWidget = (widget) => {
    // 상세 접근 권한 검증
    const accessValidation = validateWidgetAccess(widget.type, businessType, user?.role);
    
    if (!accessValidation.allowed) {
      console.warn(`위젯 접근 거부: ${widget.type}`, accessValidation);
      return (
        <div key={widget.id} className="widget-access-denied">
          <div className="widget-error-content">
            <h4>접근 제한</h4>
            <p>{accessValidation.reason}</p>
            <small>위젯: {widget.type} | 업종: {businessType}</small>
          </div>
        </div>
      );
    }
    
    // 업종 정보를 필수로 전달하여 특화 위젯 필터링
    console.debug(`위젯 컴포넌트 로드 시도: ${widget.type}`, {
      businessType,
      widgetType: widget.type,
      accessValidation,
      businessTypeIsNull: businessType === null,
      businessTypeIsEmpty: businessType === ''
    });

    const WidgetComponent = getWidgetComponent(widget.type, businessType);

    if (!WidgetComponent) {
      console.error(`위젯 컴포넌트 로드 실패: ${widget.type}`, {
        businessType,
        userRole: user?.role,
        accessValidation,
        widgetConfig: widget,
        isCommonWidget: widget.type === 'welcome' || widget.type === 'summary-statistics'
      });

      return (
        <div key={widget.id} className="widget-load-error">
          <div className="widget-error-content">
            <h4>위젯 로드 실패</h4>
            <p>위젯을 불러올 수 없습니다: {widget.type}</p>
            <small>업종: {businessType || '없음'} | 카테고리: {accessValidation.category}</small>
          </div>
        </div>
      );
    }
    
    // 위젯 크기 스타일 (CSS 변수로 처리)
    const widgetStyleVars = {};
    if (widget.size) {
      if (widget.size.width) widgetStyleVars['--widget-width'] = widget.size.width;
      if (widget.size.height) widgetStyleVars['--widget-height'] = widget.size.height;
      if (widget.size.minWidth) widgetStyleVars['--widget-min-width'] = widget.size.minWidth;
      if (widget.size.minHeight) widgetStyleVars['--widget-min-height'] = widget.size.minHeight;
      if (widget.size.maxWidth) widgetStyleVars['--widget-max-width'] = widget.size.maxWidth;
      if (widget.size.maxHeight) widgetStyleVars['--widget-max-height'] = widget.size.maxHeight;
    }
    
    // Grid 레이아웃의 경우 span 적용
    const gridColumnSpan = layoutType === 'grid' && widget.position?.span 
      ? `grid-col-span-${widget.position.span}` 
      : '';
    
    // 위젯별 카드 스타일 (위젯 설정 우선, 없으면 기본값)
    const widgetCardStyle = widget.cardStyle || defaultCardStyle;
    
    // 위젯 컴포넌트 렌더링 (null 체크)
    const widgetContent = <WidgetComponent widget={widget} user={user} />;
    
    // 위젯이 null을 반환하면 렌더링하지 않음 (무한 로딩 방지)
    if (!widgetContent) {
      console.warn(`위젯이 null을 반환했습니다: ${widget.type}`, widget);
      return null;
    }
    
    return (
      <div 
        key={widget.id} 
        className={`widget-container ${gridColumnSpan}`}
        style={Object.keys(widgetStyleVars).length > 0 ? widgetStyleVars : undefined}
      >
        <WidgetCardWrapper 
          widget={widget}
          cardStyle={widgetCardStyle}
          defaultCardStyle={defaultCardStyle}
        >
          {widgetContent}
        </WidgetCardWrapper>
      </div>
    );
  };
  
  // 레이아웃별 렌더링
  const renderLayout = () => {
    switch (layoutType) {
      case 'grid':
        return (
          <DashboardGrid cols={columns} gap={gap}>
            {sortedWidgets.map(renderWidget)}
          </DashboardGrid>
        );
      
      case 'list':
        return (
          <div className="dashboard-list" style={{ gap: `var(--spacing-${gap})` }}>
            {sortedWidgets.map(renderWidget)}
          </div>
        );
      
      case 'masonry':
        // Masonry 레이아웃은 향후 구현
        return (
          <div className="dashboard-masonry" style={{ columnCount: columns, columnGap: `var(--spacing-${gap})` }}>
            {sortedWidgets.map(renderWidget)}
          </div>
        );
      
      case 'custom':
        const customCss = layout?.css || '';
        return (
          <div className={customCss}>
            {sortedWidgets.map(renderWidget)}
          </div>
        );
      
      default:
        return (
          <DashboardGrid cols={columns} gap={gap}>
            {sortedWidgets.map(renderWidget)}
          </DashboardGrid>
        );
    }
  };
  
  // 테마 적용
  const themeStyle = {};
  if (theme) {
    if (theme.primaryColor) {
      themeStyle['--primary-color'] = theme.primaryColor;
    }
    if (theme.secondaryColor) {
      themeStyle['--secondary-color'] = theme.secondaryColor;
    }
    if (theme.fontSize) {
      themeStyle['--font-size'] = theme.fontSize;
    }
  }
  
  // 자동 새로고침 설정
  useEffect(() => {
    if (refresh?.enabled && refresh?.interval) {
      const interval = setInterval(() => {
        // 위젯별 새로고침은 각 위젯 컴포넌트에서 처리
        // 여기서는 전체 새로고침만 처리
        window.location.reload();
      }, refresh.interval);
      
      return () => clearInterval(interval);
    }
  }, [refresh]);
  
  return (
    <AdminCommonLayout menuItems={DEFAULT_MENU_ITEMS} title="대시보드">
      <div className="widget-based-dashboard" style={themeStyle}>
        <div className="dashboard-header">
          <h1>{dashboard?.dashboardName || '대시보드'}</h1>
          {dashboard?.description && (
            <p className="dashboard-description">{dashboard.description}</p>
          )}
        </div>
        <div className="dashboard-content">
          {renderLayout()}
        </div>
      </div>
    </AdminCommonLayout>
  );
};

/**
 * 위젯 생성 설정 계산 (동적)
 */
const getWidgetCreationConfig = (widgetType, index, columns = 3) => {
  return {
    id: `${widgetType}-${Date.now()}-${index}`,
    type: widgetType,
    position: {
      row: Math.floor(index / columns),
      col: index % columns,
      span: 1
    },
    size: {
      width: '100%',
      height: '300px'
    },
    config: {},
    cardStyle: {
      style: 'v2',
      variant: 'elevated',
      padding: 'md',
      borderRadius: 'md',
      hoverEffect: true,
      shadow: 'md'
    }
  };
};

/**
 * 대시보드 레이아웃 설정 계산 (동적)
 */
const getDashboardLayoutConfig = (widgetCount) => {
  // 위젯 개수에 따라 동적으로 컬럼 수 결정
  let columns = 3; // 기본 3열
  if (widgetCount <= 4) columns = 2; // 4개 이하는 2열
  if (widgetCount <= 2) columns = 1; // 2개 이하는 1열

  return {
    type: 'grid',
    columns,
    gap: 'md'
  };
};

/**
 * 관리자용 기본 대시보드 설정 생성 (테넌트별 관리자 + 슈퍼 관리자)
/**
 * 모든 위젯(공통 + 상담 + 학원 + ERP)을 표시
 */
const createDefaultAdminDashboardConfig = (allAdminRoles) => {
  console.log('🔧 관리자 대시보드 설정 생성 (확장된 위젯 포함)');
  
  // 관리자용 실용적인 위젯들 포함
  const widgets = [
    {
      id: 'admin-welcome',
      type: 'message',
      position: { row: 1, col: 1, colspan: 3, rowspan: 1 },
      config: {
        title: '🏥 CoreSolution 상담소 관리자',
        message: '환영합니다! 효율적인 상담소 운영을 위한 대시보드입니다.',
        variant: 'primary'
      }
    },
    {
      id: 'today-stats',
      type: 'today-stats',
      position: { row: 2, col: 1, colspan: 1, rowspan: 1 },
      config: {
        title: '📊 오늘의 현황',
        subtitle: '실시간 상담 및 사용자 통계'
      }
    },
    {
      id: 'system-overview',
      type: 'system-overview',
      position: { row: 2, col: 2, colspan: 1, rowspan: 1 },
      config: {
        title: '🏢 시스템 개요',
        subtitle: '전체 시스템 현황 요약'
      }
    },
    {
      id: 'consultation-stats',
      type: 'consultation-stats',
      position: { row: 2, col: 3, colspan: 1, rowspan: 1 },
      config: {
        title: '💬 상담 통계',
        subtitle: '상담 현황 및 성과 지표',
        dataSource: {
          type: 'api',
          url: '/api/v1/consultations/statistics/overall',
          refreshInterval: 300000 // 5분마다 새로고침
        },
        metrics: [
          {
            key: 'totalConsultations',
            label: '총 상담 수',
            icon: 'bi-chat-dots',
            format: 'number'
          },
          {
            key: 'activeConsultations',
            label: '진행 중인 상담',
            icon: 'bi-clock',
            format: 'number'
          },
          {
            key: 'completedConsultations',
            label: '완료된 상담',
            icon: 'bi-check-circle',
            format: 'number'
          },
          {
            key: 'satisfactionRate',
            label: '만족도',
            icon: 'bi-star',
            format: 'percentage'
          }
        ]
      }
    },
    {
      id: 'notification-widget',
      type: 'notification',
      position: { row: 3, col: 1, colspan: 1, rowspan: 1 },
      config: {
        title: '🔔 알림',
        subtitle: '최근 알림 및 공지사항',
        maxItems: 5,
        showUnreadOnly: true
      }
    },
    {
      id: 'quick-actions',
      type: 'quick-actions',
      position: { row: 3, col: 2, colspan: 2, rowspan: 1 },
      config: {
        title: '⚡ 빠른 작업',
        actions: [
          { id: 'manage-consultants', label: '상담사 관리', icon: 'users', url: '/admin/consultant-comprehensive' },
          { id: 'manage-clients', label: '내담자 관리', icon: 'user', url: '/admin/client-comprehensive' },
          { id: 'view-schedules', label: '스케줄 관리', icon: 'calendar', url: '/admin/schedule' },
          { id: 'system-settings', label: '시스템 설정', icon: 'settings', url: '/admin/system-config' }
        ]
      }
    }
  ];

  return {
    version: '1.0',
    layout: { type: 'grid', columns: 3, gap: 'md' },
    widgets: widgets,
    theme: {
      primaryColor: 'var(--cs-primary-500)',
      secondaryColor: 'var(--cs-secondary-500)'
    }
  };
};

/**
 * 업종별 기본 대시보드 설정 생성
/**
 * 공통 위젯 + 업종별 위젯 + ERP 위젯을 표시
 */
const createDefaultBusinessTypeDashboardConfig = (businessType) => {
  // 동적으로 위젯 타입 가져오기
  const commonTypes = getCommonWidgetTypes();
  const erpTypes = getErpWidgetTypes();

  let businessWidgetTypes = [];
  if (businessType === 'CONSULTATION') {
    businessWidgetTypes = getConsultationWidgetTypes();
  } else if (businessType === 'ACADEMY') {
    businessWidgetTypes = getAcademyWidgetTypes();
  }

  const allWidgetTypes = [
    ...commonTypes,
    ...businessWidgetTypes,
    ...erpTypes
  ];

  console.log(`${businessType} 대시보드 위젯 구성:`, {
    common: commonTypes.length,
    business: businessWidgetTypes.length,
    erp: erpTypes.length,
    total: allWidgetTypes.length,
    commonTypes,
    businessTypes: businessWidgetTypes,
    erpTypes
  });

  // 동적 레이아웃 설정
  const layoutConfig = getDashboardLayoutConfig(allWidgetTypes.length);

  // 위젯을 동적으로 생성
  const widgets = allWidgetTypes.map((widgetType, index) =>
    getWidgetCreationConfig(widgetType, index, layoutConfig.columns)
  );

  // 업종별 visibility 추가
  widgets.forEach(widget => {
    widget.visibility = {
      businessTypes: [businessType]
    };
  });

  return {
    widgets,
    layout: layoutConfig,
    theme: {
      primaryColor: 'var(--mg-primary-500)',
      secondaryColor: 'var(--mg-secondary-500)'
    },
    cardLayout: {
      style: 'v2',
      variant: 'elevated',
      padding: 'md',
      borderRadius: 'md',
      hoverEffect: true,
      shadow: 'md'
    }
  };
};

// 헬퍼 함수: tenantId에서 businessType 유추
const inferBusinessTypeFromTenantId = (tenantId) => {
  if (!tenantId || typeof tenantId !== 'string') return null;
  const tenantIdLower = tenantId.toLowerCase();
  if (tenantIdLower.includes('consultation')) {
    return 'CONSULTATION';
  } else if (tenantIdLower.includes('academy')) {
    return 'ACADEMY';
  }
  return null;
};

// 🔧 헬퍼 함수들

/**
 * 사용자 정보에서 업종 정보 추출
 */
const extractBusinessTypeFromUser = (user) => {
  if (!user) return 'CONSULTATION'; // 기본값
  
  // tenantId에서 업종 정보 추출 시도
  if (user.tenantId) {
    if (user.tenantId.includes('consultation')) return 'CONSULTATION';
    if (user.tenantId.includes('academy')) return 'ACADEMY';
    if (user.tenantId.includes('erp')) return 'ERP';
  }
  
  // 역할 기반 추정
  if (user.role === USER_ROLES.CONSULTANT || user.role === USER_ROLES.CLIENT) return 'CONSULTATION';
  if (user.role === 'TEACHER' || user.role === 'STUDENT') return 'ACADEMY';
  
  return 'CONSULTATION'; // 기본값
};

/**
 * 일반 사용자용 기본 대시보드 설정 생성
 */
const createDefaultUserDashboardConfig = (businessType, userRole) => {
  const widgets = [];
  
  // 업종별 기본 위젯 구성
  if (businessType === 'CONSULTATION') {
    widgets.push(
      {
        id: 'user-consultation-stats-1',
        type: 'consultation-stats',
        position: { row: 1, col: 1, colspan: 2, rowspan: 1 },
        config: {
          title: '내 상담 현황',
          dataSource: {
            type: 'api',
            url: '/api/v1/consultations/my-stats'
          }
        }
      },
      {
        id: 'user-notifications-1',
        type: 'notification',
        position: { row: 1, col: 3, colspan: 1, rowspan: 1 },
        config: {
          title: '알림',
          dataSource: {
            type: 'api',
            url: '/api/v1/system-notifications/active'
          }
        }
      }
    );
  }
  
  return {
    version: '1.0',
    layout: { type: 'grid', columns: 3, gap: 'md' },
    widgets,
    theme: {
      primaryColor: 'var(--mg-primary-500)',
      secondaryColor: 'var(--mg-secondary-500)'
    }
  };
};

export default DynamicDashboard;

