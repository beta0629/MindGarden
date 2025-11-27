/**
 * 동적 대시보드 컴포넌트
 * 백엔드에서 조회한 대시보드 정보를 기반으로 적절한 대시보드 컴포넌트를 동적으로 로드
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import SimpleLayout from '../layout/SimpleLayout';
import { getCurrentUserDashboard, getDashboardComponentName } from '../../utils/dashboardUtils';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import notificationManager from '../../utils/notification';
import DashboardGrid from '../layout/DashboardGrid';
import { getWidgetComponent } from './widgets/WidgetRegistry';
import WidgetCardWrapper from './widgets/WidgetCardWrapper';
import { apiGet } from '../../utils/ajax';
import {
  filterWidgetsByBusinessType,
  isWidgetVisible,
  validateWidgetAccess
} from '../../utils/widgetVisibilityUtils';
import {
  getCommonWidgetTypes,
  getConsultationWidgetTypes,
  getAcademyWidgetTypes,
  getErpWidgetTypes
} from './widgets/WidgetRegistry';

// 대시보드 컴포넌트 동적 import
import CommonDashboard from './CommonDashboard';
import ClientDashboard from '../client/ClientDashboard';
import AdminDashboard from '../admin/AdminDashboard';
import HQDashboard from '../hq/HQDashboard';
import AcademyDashboard from '../academy/AcademyDashboard';

const DASHBOARD_COMPONENTS = {
  'CommonDashboard': CommonDashboard,
  'ClientDashboard': ClientDashboard,
  'AdminDashboard': AdminDashboard,
  'HQDashboard': HQDashboard,
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
      <SimpleLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <UnifiedLoading message="대시보드를 불러오는 중..." />
        </div>
      </SimpleLayout>
    );
  }

  if (error) {
    return (
      <SimpleLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          padding: '2rem'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>대시보드 로드 실패</h2>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={loadDashboard}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      </SimpleLayout>
    );
  }

  // 대시보드 타입에 따라 적절한 컴포넌트 선택
  // 관리자 역할인 경우 AdminDashboard 컴포넌트 사용
  const userRole = currentUser?.role;
  const adminRoles = ['ADMIN', 'BRANCH_MANAGER', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER'];
  const isAdmin = userRole && adminRoles.includes(userRole);
  
  let DashboardComponent;
  if (isAdmin) {
    // 관리자는 AdminDashboard 컴포넌트 사용 (동적 대시보드 데이터는 전달)
    DashboardComponent = AdminDashboard;
  } else {
    // 일반 사용자는 대시보드 타입에 따라 컴포넌트 선택
    const dashboardType = dashboard?.dashboardType || currentUser?.role || 'DEFAULT';
    const componentName = getDashboardComponentName(dashboardType);
    DashboardComponent = DASHBOARD_COMPONENTS[componentName] || CommonDashboard;
  }

  console.log('🎯 동적 대시보드 렌더링:', {
    userRole,
    isAdmin,
    dashboardType: dashboard?.dashboardType,
    componentName: isAdmin ? 'AdminDashboard' : getDashboardComponentName(dashboard?.dashboardType || currentUser?.role || 'DEFAULT'),
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
 * @param {Object} props
 * @param {Object} props.dashboardConfig - 대시보드 설정 JSON
 * @param {Object} props.dashboard - 대시보드 정보
 * @param {Object} props.user - 사용자 정보
 * @param {string} props.businessType - 업종 타입 (선택적)
 */
const WidgetBasedDashboard = ({ dashboardConfig, dashboard, user, businessType = null }) => {
  const { layout, widgets, theme, cardLayout, refresh } = dashboardConfig;
  
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
  
  // 업종별 위젯 필터링 (1차: 업종 기반)
  const businessFilteredWidgets = businessType 
    ? filterWidgetsByBusinessType(widgets, businessType, user?.role)
    : widgets;
  
  console.debug(`업종별 위젯 필터링: ${widgets.length} → ${businessFilteredWidgets.length}개`, {
    businessType,
    userRole: user?.role,
    originalCount: widgets.length,
    filteredCount: businessFilteredWidgets.length
  });
  
  // 위젯 필터링 (2차: visibility 조건 확인)
  const visibleWidgets = businessFilteredWidgets.filter(widget => {
    // 업종별 가시성 검증
    if (businessType && !isWidgetVisible(widget.type, businessType, user?.role)) {
      console.debug(`위젯 가시성 검증 실패: ${widget.type}`, {
        businessType,
        userRole: user?.role
      });
      return false;
    }
    
    if (!widget.visibility) {
      return true; // visibility 설정이 없으면 항상 표시
    }
    
    // 역할 기반 필터링
    if (widget.visibility.roles && widget.visibility.roles.length > 0) {
      const userRole = user?.role || user?.currentTenantRole?.roleName;
      if (!userRole || !widget.visibility.roles.includes(userRole)) {
        console.debug(`역할 기반 필터링 실패: ${widget.type}`, {
          requiredRoles: widget.visibility.roles,
          userRole
        });
        return false;
      }
    }
    
    // 조건 기반 필터링 (향후 구현)
    if (widget.visibility.conditions && widget.visibility.conditions.length > 0) {
      // TODO: 조건 평가 로직 구현
      console.debug(`조건 기반 필터링 (미구현): ${widget.type}`);
    }
    
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
    
    const widgetStyle = {};
    if (widget.size) {
      if (widget.size.width) widgetStyle.width = widget.size.width;
      if (widget.size.height) widgetStyle.height = widget.size.height;
      if (widget.size.minWidth) widgetStyle.minWidth = widget.size.minWidth;
      if (widget.size.minHeight) widgetStyle.minHeight = widget.size.minHeight;
      if (widget.size.maxWidth) widgetStyle.maxWidth = widget.size.maxWidth;
      if (widget.size.maxHeight) widgetStyle.maxHeight = widget.size.maxHeight;
    }
    
    // Grid 레이아웃의 경우 span 적용
    const gridColumnSpan = layoutType === 'grid' && widget.position?.span 
      ? `span ${widget.position.span}` 
      : undefined;
    
    // 위젯별 카드 스타일 (위젯 설정 우선, 없으면 기본값)
    const widgetCardStyle = widget.cardStyle || defaultCardStyle;
    
    return (
      <div 
        key={widget.id} 
        style={widgetStyle}
        className={gridColumnSpan ? `grid-col-span-${widget.position.span}` : ''}
      >
        <WidgetCardWrapper 
          widget={widget}
          cardStyle={widgetCardStyle}
          defaultCardStyle={defaultCardStyle}
        >
          <WidgetComponent widget={widget} user={user} />
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
          <div className="dashboard-list" style={{ display: 'flex', flexDirection: 'column', gap: `var(--spacing-${gap})` }}>
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
    <SimpleLayout>
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
    </SimpleLayout>
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
 * 모든 위젯(공통 + 상담 + 학원 + ERP)을 표시
 */
const createDefaultAdminDashboardConfig = (allAdminRoles) => {
  // 관리자는 모든 위젯 타입 표시 (동적 조회)
  const commonTypes = getCommonWidgetTypes(); // 공통 위젯
  const consultationTypes = getConsultationWidgetTypes(); // 상담 위젯
  const academyTypes = getAcademyWidgetTypes(); // 학원 위젯
  const erpTypes = getErpWidgetTypes(); // ERP 위젯

  // 중복 제거를 위해 Set 사용
  const allWidgetTypes = [...new Set([
    ...commonTypes,
    ...consultationTypes,
    ...academyTypes,
    ...erpTypes
  ])];

  console.log('관리자 대시보드 위젯 구성:', {
    common: commonTypes.length,
    consultation: consultationTypes.length,
    academy: academyTypes.length,
    erp: erpTypes.length,
    total: allWidgetTypes.length,
    commonTypes,
    consultationTypes,
    academyTypes,
    erpTypes
  });

  // 동적 레이아웃 설정
  const layoutConfig = getDashboardLayoutConfig(allWidgetTypes.length);

  // 위젯을 동적으로 생성
  const widgets = allWidgetTypes.map((widgetType, index) =>
    getWidgetCreationConfig(widgetType, index, layoutConfig.columns)
  );

  // 관리자용 visibility 추가
  widgets.forEach(widget => {
    widget.visibility = {
      roles: allAdminRoles // 파라미터로 받은 allAdminRoles 사용
    };
  });

  return {
    widgets,
    layout: layoutConfig,
    theme: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d'
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

/**
 * 업종별 기본 대시보드 설정 생성
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
      primaryColor: '#007bff',
      secondaryColor: '#6c757d'
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

export default DynamicDashboard;

