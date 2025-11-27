/**
 * 동적 대시보드 컴포넌트
 * 백엔드에서 조회한 대시보드 정보를 기반으로 적절한 대시보드 컴포넌트를 동적으로 로드
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    // propDashboard가 없으면 조회
    if (!propDashboard && currentUser && currentUser.id) {
      loadDashboard();
    }
  }, [currentUser, propDashboard, dashboardIdFromQuery]);

  const loadDashboard = async () => {
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
  };

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

  // dashboardConfig가 있으면 위젯 기반 렌더링, 없으면 기존 컴포넌트 렌더링
  if (dashboardConfig && dashboardConfig.widgets && Array.isArray(dashboardConfig.widgets) && dashboardConfig.widgets.length > 0) {
    // 업종 정보 추출 (dashboard 또는 user에서)
    let businessType = dashboard?.businessType ||
                      dashboard?.categoryCode ||
                      currentUser?.tenant?.businessType ||
                      currentUser?.tenant?.categoryCode ||
                      sessionManager.getUser()?.tenant?.businessType ||
                      sessionStorage.getItem('businessType');

    // 빈 문자열이나 undefined를 null로 변환
    if (!businessType || businessType === '') {
      businessType = null;
    }

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
 * @param {Object} props
 * @param {Object} props.dashboardConfig - 대시보드 설정 JSON
 * @param {Object} props.dashboard - 대시보드 정보
 * @param {Object} props.user - 사용자 정보
 * @param {string} props.businessType - 업종 타입 (선택적)
 */
const WidgetBasedDashboard = ({ dashboardConfig, dashboard, user, businessType = null }) => {
  const { layout, widgets, theme, cardLayout, refresh } = dashboardConfig;
  
  // 레이아웃 설정
  const layoutType = layout?.type || 'grid';
  const columns = layout?.columns || 3;
  const gap = layout?.gap || 'md';
  
  // 카드 레이아웃 기본 설정
  const defaultCardStyle = cardLayout || {
    style: 'v2',
    variant: 'elevated',
    padding: 'md',
    borderRadius: 'md',
    hoverEffect: true,
    shadow: 'md'
  };
  
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

export default DynamicDashboard;

