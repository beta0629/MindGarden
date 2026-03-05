import React, { useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/main.css'; // 새로운 통합 디자인 시스템 사용
import { USER_ROLES } from './constants/roles';
// import './styles/css-variables.css'; // CSS 상수 시스템 (통합됨)
import { initializeDynamicThemeSystem } from './utils/designSystemHelper';
import unifiedLayoutManager from './utils/unifiedLayoutSystem';
import { useTenantBranding } from './hooks/useTenantBranding';
import TabletHomepage from './components/homepage/Homepage';
import TabletLogin from './components/auth/TabletLogin';
import UnifiedLogin from './components/auth/UnifiedLogin';
import TabletRegister from './components/auth/TabletRegister';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import OAuth2Callback from './components/auth/OAuth2Callback';
// BranchLogin, BranchSpecificLogin, HeadquartersLogin 제거됨 - 브랜치 코드 제거 정책
// 대시보드 컴포넌트는 DynamicDashboard에서 동적으로 로드됨
import MyPage from './components/mypage/MyPage';
import ConsultantSchedule from './components/consultant/ConsultantSchedule';
import ConsultationRecordScreen from './components/consultant/ConsultationRecordScreen';
import ConsultationRecordView from './components/consultant/ConsultationRecordView';
import PurchaseManagement from './components/erp/PurchaseManagement';
import FinancialManagement from './components/erp/FinancialManagement';
import BudgetManagement from './components/erp/BudgetManagement';
import ImprovedTaxManagement from './components/erp/ImprovedTaxManagement';
import IntegratedFinanceDashboard from './components/erp/IntegratedFinanceDashboard';
import ConsultantMessageScreen from './components/consultant/ConsultantMessageScreen';
import ClientMessageScreen from './components/client/ClientMessageScreen';
import SchedulePage from './components/schedule/SchedulePage';
import UnifiedScheduleComponent from './components/schedule/UnifiedScheduleComponent';
import UnifiedModalTest from './components/test/UnifiedModalTest';
import UnifiedLoadingTest from './components/test/UnifiedLoadingTest';
import UnifiedHeaderTest from './components/test/UnifiedHeaderTest';
import UserManagementPage from './components/admin/UserManagementPage';
import SessionManagement from './components/admin/SessionManagement';
import MappingManagement from './components/admin/MappingManagement';
import ConsultationLogView from './components/admin/ConsultationLogView';
import IntegratedMatchingSchedule from './components/admin/mapping-management/IntegratedMatchingSchedule';
import CommonCodeManagement from './components/admin/CommonCodeManagement';
import StatisticsModal from './components/common/StatisticsModal';
import StatisticsDashboard from './components/admin/StatisticsDashboard';
// ScheduleList는 현재 사용되지 않음
import ComingSoon from './components/common/ComingSoon';
// PaymentManagement는 현재 사용되지 않음
import MindGardenDesignSample from './pages/MindGardenDesignSample';
import PremiumDesignSample from './pages/PremiumDesignSample';
import AdvancedDesignSample from './pages/AdvancedDesignSample';
import MindGardenDesignSystemShowcase from './pages/MindGardenDesignSystemShowcase';
import ComponentTestPage from './pages/ComponentTestPage';
import FilterSearchShowcase from './components/ui/FilterSearch/FilterSearchShowcase';
import AdminDashboardSample from './pages/AdminDashboardSample';
import AdminCommonLayout from './components/layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from './components/dashboard-v2/constants/menuItems';
import AcademyDashboard from './components/academy/AcademyDashboard';
import AcademyRegister from './components/academy/AcademyRegister';
// 대시보드 컴포넌트 지연 로드 (로그인 직후 초기화 순서 오류 방지)
const DynamicDashboard = lazy(() => import('./components/dashboard/DynamicDashboard'));
const DashboardManagement = lazy(() => import('./components/admin/DashboardManagement'));
const WidgetBasedAdminDashboard = lazy(() => import('./components/admin/WidgetBasedAdminDashboard'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminDashboardV2 = lazy(() => import('./components/dashboard-v2/AdminDashboardV2'));
const ClientDashboard = lazy(() => import('./components/client/ClientDashboard'));
const CommonDashboard = lazy(() => import('./components/dashboard/CommonDashboard'));
const ConsultantDashboardV2 = lazy(() => import('./components/dashboard-v2/consultant/ConsultantDashboardV2'));
import UnifiedNotification from './components/common/UnifiedNotification';
import NotificationTest from './components/test/NotificationTest';
import PaymentTest from './components/test/PaymentTest';
// IntegrationTest는 현재 사용되지 않음
import AccountManagement from './components/admin/AccountManagement';
import PermissionManagement from './components/admin/PermissionManagement';
import ConsultationHistory from './components/consultation/ConsultationHistory';
import ConsultationReport from './components/consultation/ConsultationReport';
import ComplianceMenu from './components/compliance/ComplianceMenu';
import ComplianceDashboard from './components/compliance/ComplianceDashboard';
import ActivityHistory from './pages/client/ActivityHistory';
import ConsultantClientList from './components/consultant/ConsultantClientList';
import ConsultantAvailability from './components/consultant/ConsultantAvailability';
import ConsultantRecords from './components/consultant/ConsultantRecords';
import ConsultantMessages from './components/consultant/ConsultantMessages';
import ErpDashboard from './components/erp/ErpDashboard';
import PurchaseRequestForm from './components/erp/PurchaseRequestForm';
import AdminApprovalDashboard from './components/erp/AdminApprovalDashboard';
import SuperAdminApprovalDashboard from './components/erp/SuperAdminApprovalDashboard';
import ItemManagement from './components/erp/ItemManagement';
import SalaryManagement from './components/erp/SalaryManagement';
import TaxManagement from './components/erp/TaxManagement';
import RefundManagement from './components/erp/RefundManagement';
import ClientSchedule from './components/client/ClientSchedule';
import ClientSessionManagement from './components/client/ClientSessionManagement';
import ClientPaymentHistory from './components/client/ClientPaymentHistory';
import HelpPage from './components/common/HelpPage';
import ClientSettings from './components/client/ClientSettings';
import WellnessNotificationList from './components/wellness/WellnessNotificationList';
import WellnessNotificationDetail from './components/wellness/WellnessNotificationDetail';
import WellnessManagement from './components/admin/WellnessManagement';
import MindfulnessGuide from './components/wellness/MindfulnessGuide';
import TenantProfile from './components/tenant/TenantProfile';
import AdminLayout from './components/layout/AdminLayout';
import TenantCommonCodeManager from './components/admin/TenantCommonCodeManager';
import MenuPermissionManagement from './components/admin/MenuPermissionManagement';
import PermissionGroupManagement from './components/admin/PermissionGroupManagement';
import ProtectedRoute from './components/common/ProtectedRoute';
import SessionGuard from './components/common/SessionGuard';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { sessionManager } from './utils/sessionManager';
import duplicateLoginManager from './utils/duplicateLoginManager';
import notificationManager from './utils/notification';
// DuplicateLoginAlert는 UnifiedNotification으로 통합됨
// BranchMappingModal 제거됨 - 브랜치 코드 제거 정책
import DuplicateLoginModal from './components/common/DuplicateLoginModal';
import PrivacyPolicy from './components/common/PrivacyPolicy';
import TermsOfService from './components/common/TermsOfService';
import IOSCardSample from './pages/IOSCardSample';
import CounselingCenterLanding from './pages/CounselingCenterLanding';
import SystemNotifications from './components/notifications/SystemNotifications';
import UnifiedNotifications from './components/notifications/UnifiedNotifications';
import SystemNotificationManagement from './components/admin/SystemNotificationManagement';
import AdminMessages from './components/admin/AdminMessages';
import SystemConfigManagement from './components/admin/SystemConfigManagement';
import PsychAssessmentManagement from './components/admin/PsychAssessmentManagement';
import BrandingManagementPage from './pages/BrandingManagementPage';
import CacheMonitoringDashboard from './components/admin/CacheMonitoringDashboard';
import UnifiedHeader from './components/common/UnifiedHeader';
import SecurityMonitoringDashboard from './components/admin/SecurityMonitoringDashboard';
import ApiPerformanceMonitoring from './components/admin/ApiPerformanceMonitoring';
import PackagePricingListPage from './components/admin/package-pricing/pages/PackagePricingListPage';
import PackagePricingDetailPage from './components/admin/package-pricing/pages/PackagePricingDetailPage';

// URL 쿼리 파라미터 처리 컴포넌트
function QueryParamHandler({ children, onLoginSuccess }) {
  const location = useLocation();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const loginStatus = searchParams.get('login');
    const message = searchParams.get('message');
    
    if (loginStatus === 'success' && message) {
      // URL에서 쿼리 파라미터 제거
      const cleanUrl = location.pathname;
      if (window.history && window.history.replaceState) {
        // eslint-disable-next-line no-restricted-globals
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      // 로그인 성공 콜백 호출
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, [location]); // onLoginSuccess 의존성 제거 (무한루프 방지)
  
  return children;
}

// 실제 앱 컴포넌트 (SessionProvider 내부에서 사용)
function AppContent() {
  const { user, sessionInfo, isLoading, checkSession, logout } = useSession();
  
  // 테넌트별 브랜딩 시스템 초기화
  const { hasCustomBranding, companyName, primaryColor } = useTenantBranding({
    autoApply: true
  });
  
  // 공개 경로 정의 (인증 없이 접근 가능)
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/oauth2/callback',
    '/design-system',
    '/design-system-v2',
    '/test/notifications',
    '/test/payment',
    '/test/integration',
    '/test/ios-cards',
    '/test/design-sample',
    '/test/premium-sample',
    '/test/advanced-sample',
    '/test/components'
  ];

  const location = useLocation();
  useEffect(() => {
    const isPublicPath = publicPaths.includes(location.pathname);
    if (!isPublicPath) {
      checkSession();
    }
  }, [location.pathname, checkSession]);

  // 통계 모달 상태
  const [showStatisticsModal, setShowStatisticsModal] = React.useState(false);
  
  // 중복 로그인 알림 상태 (향후 사용 예정)
  // eslint-disable-next-line no-unused-vars
  const [showDuplicateLoginAlert, setShowDuplicateLoginAlert] = React.useState(false);

  // 개발 환경에서만 로그 출력 (무한루프 방지를 위해 임시 비활성화)
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log('🚀 App 컴포넌트 마운트됨');
  //     console.log('🌐 현재 환경:', process.env.NODE_ENV);
  //     console.log('📱 React 버전:', React.version);
  //     console.log('🔗 라우터 초기화 완료');
  //     console.log('✅ Core Solution 앱 시작됨');
  //   }
  //   
  //   return () => {
  //     if (process.env.NODE_ENV === 'development') {
  //       console.log('🚀 App 컴포넌트 언마운트됨');
  //     }
  //   };
  // }, []); // 의존성 배열을 빈 배열로 설정

  // 동적 테마 시스템 초기화 (로그인 후에만 CSS 테마 로드)
  useEffect(() => {
    // 로그인 전에는 CSS 테마 로드를 건너뛰고 기본 테마만 설정
    const shouldLoadColors = !!user; // 로그인된 경우에만 색상 로드
    
    initializeDynamicThemeSystem({
      theme: 'ios', // iOS 스타일 기본 테마
      enableThemeWatcher: true, // 테마 변경 감지 활성화
      enableDeviceWatcher: true, // 디바이스 변경 감지 활성화
      loadConsultantColors: shouldLoadColors, // 로그인 후에만 상담사 색상 로드
      autoDetectTheme: false, // 시스템 테마 자동 감지 비활성화 (iOS 라이트 모드 고정)
      zIndexOffsets: {
        // 테마별 z-index 오프셋 커스터마이징
        light: 0,
        dark: 0,
        highContrast: 1000
      }
    });
  }, [user]); // user 상태에 따라 재실행

  // 통합 레이아웃 시스템 초기화
  useEffect(() => {
    // 통합 레이아웃 시스템 초기화
    unifiedLayoutManager.init();
  }, []);

  // 중복 로그인 체크 시작/중지 (개발 환경에서는 비활성화)
  useEffect(() => {
    // 개발 환경에서는 중복 로그인 체크 비활성화
    if (process.env.NODE_ENV === 'development') {
      duplicateLoginManager.forceStop();
      return;
    }

    if (user && sessionInfo) {
      duplicateLoginManager.startChecking();
    } else {
      duplicateLoginManager.stopChecking();
    }

    return () => {
      duplicateLoginManager.stopChecking();
    };
  }, []); // user, sessionInfo 의존성 제거

  // 중복 로그인 이벤트 리스너
  useEffect(() => {
    // eslint-disable-next-line no-unused-vars
    const handleDuplicateLoginEvent = (event) => {
      
      // UnifiedNotification을 통해 중복 로그인 알림 표시
      notificationManager.show({
        id: 'duplicate-login-alert',
        type: 'warning',
        title: '중복 로그인 감지',
        message: '다른 곳에서 로그인되어 현재 세션이 종료됩니다.',
        showCountdown: true,
        countdown: 5,
        actions: [
          {
            id: 'confirm',
            label: '확인',
            variant: 'primary',
            showCountdown: true
          },
          {
            id: 'cancel',
            label: '취소',
            variant: 'secondary'
          }
        ],
        duration: 5000
      });
    };

    window.addEventListener('duplicateLoginDetected', handleDuplicateLoginEvent);

    return () => {
      window.removeEventListener('duplicateLoginDetected', handleDuplicateLoginEvent);
    };
  }, []);

  // 중복 로그인 알림 핸들러 (향후 사용 예정)
  // eslint-disable-next-line no-unused-vars
  const handleDuplicateLoginConfirm = useCallback(() => {
    setShowDuplicateLoginAlert(false);
    duplicateLoginManager.forceLogout();
  }, []);

  // eslint-disable-next-line no-unused-vars
  const handleDuplicateLoginCancel = useCallback(() => {
    setShowDuplicateLoginAlert(false);
    // 취소 시에도 강제 로그아웃 (보안상 필요)
    duplicateLoginManager.forceLogout();
  }, []);

  // eslint-disable-next-line no-unused-vars
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleLoginSuccess = useCallback(() => {
    // 세션 재확인 전에 잠시 대기 (백엔드 세션 설정 완료 대기)
    setTimeout(() => {
      checkSession();
    }, 1000); // eslint-disable-line no-magic-numbers
  }, []); // checkSession 의존성 제거 (무한루프 방지)

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <QueryParamHandler onLoginSuccess={handleLoginSuccess}>
      <SessionGuard>
        <div className="App">
          <UnifiedNotification type="toast" position="top-right" />
          <Suspense fallback={<div className="mg-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>로딩 중...</div>}>
          <Routes>
            <Route path="/" element={<TabletHomepage />} />
            <Route path="/landing" element={<CounselingCenterLanding />} />
            <Route path="/test/modal" element={<div className="mg-modal"Test />} />
            <Route path="/test/loading" element={<div className="mg-loading">로딩중...</div>} />
            <Route path="/test/header" element={<UnifiedHeader />} />
            {/* Phase 3: 통합 로그인 시스템 */}
            <Route path="/login" element={<UnifiedLogin />} />
            <Route path="/login/tablet" element={<TabletLogin />} />
            <Route path="/register" element={<TabletRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/oauth2/callback" element={<OAuth2Callback />} />
            
            {/* 지점별 로그인 라우트 제거됨 - 브랜치 코드 제거 정책 */}
            
            {/* 일반 대시보드 라우트 (동적 대시보드 우선) */}
            <Route path="/dashboard" element={<DynamicDashboard user={user} />} />
            
            {/* 역할별 대시보드 라우트 - 레거시 대시보드 사용 (디자인 개선 전까지) */}
            <Route path="/client/dashboard" element={<ClientDashboard user={user} />} />
            <Route path="/consultant/dashboard" element={<ConsultantDashboardV2 user={user} />} />
            <Route path="/admin/dashboard" element={<AdminDashboardV2 user={user} />} />
            <Route path="/admin/dashboard-legacy" element={<AdminDashboard user={user} />} />
            <Route path="/admin/dashboard-widget" element={<WidgetBasedAdminDashboard />} />
            <Route path="/admin/dashboard-old" element={<DynamicDashboard user={user} />} />
            <Route path="/super_admin/dashboard" element={<DynamicDashboard user={user} />} />
            <Route path="/branch_super_admin/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/branch_manager/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/client/mypage" element={<MyPage />} />
            <Route path="/consultant/mypage" element={<MyPage />} />
            <Route path="/admin/mypage" element={<MyPage />} />
            <Route path="/super_admin/mypage" element={<MyPage />} />
            <Route path="/branch_super_admin/mypage" element={<Navigate to="/admin/mypage" replace />} />
            <Route path="/branch_manager/mypage" element={<Navigate to="/admin/mypage" replace />} />
            
            {/* 상담사 전용 라우트 */}
            <Route path="/consultant/schedule" element={<ConsultantSchedule />} />
            <Route path="/consultant/consultation-record/:consultationId" element={<ConsultationRecordScreen />} />
            <Route path="/consultant/consultation-record-view/:recordId" element={<ConsultationRecordView />} />
            
            {/* 권한 관리 */}
            <Route path="/admin/permissions" element={
              <AdminCommonLayout title="권한 관리">
                <PermissionManagement />
              </AdminCommonLayout>
            } />
            
            {/* 관리자 전용 메뉴 시스템 (관리자 역할 접근) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/common-codes" replace />} />
              <Route path="tenant-common-codes" element={<TenantCommonCodeManager />} />
              <Route path="package-pricing/new" element={<PackagePricingDetailPage isNew />} />
              <Route path="package-pricing/:id" element={<PackagePricingDetailPage />} />
              <Route path="package-pricing" element={<PackagePricingListPage />} />
              <Route path="menu-permissions" element={<MenuPermissionManagement />} />
              <Route path="permission-groups" element={<PermissionGroupManagement />} />
              {/* 추후 추가될 관리자 페이지들 */}
            </Route>
            
            {/* ERP 관리 */}
            <Route path="/erp/purchase" element={<PurchaseManagement />} />
            <Route path="/erp/financial" element={<FinancialManagement />} />
            <Route path="/erp/budget" element={<BudgetManagement />} />
            <Route path="/erp/tax" element={<ImprovedTaxManagement />} />
            <Route path="/consultant/send-message/:consultationId" element={<ConsultantMessageScreen />} />
            <Route path="/consultant/clients" element={<ConsultantClientList />} />
            <Route path="/consultant/client/:id" element={<ConsultantClientList />} />
            <Route path="/consultant/availability" element={<ConsultantAvailability />} />
            <Route path="/consultant/consultation-records" element={<ConsultantRecords />} />
            <Route path="/consultant/consultation-logs" element={<ConsultationLogView />} />
            <Route path="/consultant/reports" element={<ConsultantRecords />} />
            <Route path="/consultant/messages" element={<ConsultantMessages />} />
            
            {/* 시스템 공지 라우트 (모든 사용자) */}
            <Route path="/notifications" element={<UnifiedNotifications />} />
            <Route path="/system-notifications" element={<SystemNotifications />} />
            
            {/* 내담자 전용 라우트 */}
            <Route path="/client/messages" element={<ClientMessageScreen />} />
            <Route path="/client/schedule" element={<ClientSchedule />} />
            <Route path="/client/session-management" element={<ClientSessionManagement />} />
            <Route path="/client/payment-history" element={<ClientPaymentHistory />} />
            <Route path="/client/settings" element={<ClientSettings />} />
            <Route path="/client/activity-history" element={<ActivityHistory />} />
            <Route path="/client/wellness" element={<WellnessNotificationList />} />
            <Route path="/client/wellness/:id" element={<WellnessNotificationDetail />} />
            <Route path="/client/mindfulness-guide" element={<MindfulnessGuide />} />
            
            {/* 관리자 - 웰니스 관리 */}
            <Route path="/admin/wellness" element={<WellnessManagement />} />
            
            {/* 개인정보 및 약관 관련 라우트 */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            
            {/* 테넌트 프로필/설정 라우트 */}
            <Route path="/tenant/profile" element={<TenantProfile />} />
            <Route path="/tenant/settings" element={<TenantProfile />} />
            
            {/* 온보딩 관련 라우트 */}
            
            {/* 상담 내역 및 리포트 라우트 (모든 사용자) */}
            <Route path="/consultation-history" element={<ConsultationHistory />} />
            <Route path="/consultation-report" element={<ConsultationReport />} />
            
            {/* 컴플라이언스 관리 라우트 */}
            <Route path="/admin/compliance" element={<ComplianceMenu />} />
            <Route path="/admin/compliance/dashboard" element={<ComplianceDashboard />} />
            <Route path="/admin/compliance/personal-data-processing" element={<ComplianceDashboard />} />
            <Route path="/admin/compliance/impact-assessment" element={<ComplianceDashboard />} />
            <Route path="/admin/compliance/breach-response" element={<ComplianceDashboard />} />
            <Route path="/admin/compliance/education" element={<ComplianceDashboard />} />
            <Route path="/admin/compliance/policy" element={<ComplianceDashboard />} />
            <Route path="/admin/compliance/destruction" element={<ComplianceDashboard />} />
            <Route path="/admin/compliance/audit" element={<ComplianceDashboard />} />
            
            {/* 공통 라우트 (모든 사용자) */}
            <Route path="/help" element={<HelpPage />} />
            
            {/* 통합 스케줄 관리 라우트 */}
            <Route path="/schedule" element={<SchedulePage user={user} />} />
            <Route path="/admin/schedule" element={<SchedulePage user={user} />} />
            <Route path="/consultant/schedule-new" element={<SchedulePage user={user} />} />
            <Route path="/super_admin/schedule" element={<SchedulePage user={user} />} />
            
            {/* 관리자 전용 라우트 */}
            <Route path="/admin/consultant-comprehensive" element={<Navigate to="/admin/user-management?type=consultant" replace />} />
            <Route path="/admin/client-comprehensive" element={<Navigate to="/admin/user-management?type=client" replace />} />
            <Route path="/admin/mapping-management" element={<MappingManagement />} />
            <Route path="/admin/consultation-logs" element={<ConsultationLogView />} />
            <Route
              path="/admin/integrated-schedule"
              element={
                <AdminCommonLayout title="통합 스케줄링">
                  <IntegratedMatchingSchedule />
                </AdminCommonLayout>
              }
            />
            <Route path="/admin/common-codes" element={<CommonCodeManagement />} />
            <Route path="/admin/sessions" element={<SessionManagement />} />
            <Route path="/admin/accounts" element={<AccountManagement />} />
            <Route path="/admin/user-management" element={<UserManagementPage />} />
            <Route path="/admin/dashboards" element={<DashboardManagement />} />
                <Route path="/admin/cache-monitoring" element={<CacheMonitoringDashboard />} />
                <Route path="/admin/security-monitoring" element={<SecurityMonitoringDashboard />} />
            <Route path="/admin/api-performance" element={<ApiPerformanceMonitoring />} />
            <Route path="/admin/system-notifications" element={<SystemNotificationManagement />} />
            <Route path="/admin/system-config" element={<SystemConfigManagement />} />
            <Route path="/admin/psych-assessments" element={<PsychAssessmentManagement user={user} />} />
            <Route path="/admin/branding" element={<BrandingManagementPage />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            
            {/* 학원 시스템 라우트 */}
            <Route path="/academy" element={<AcademyDashboard />} />
            <Route path="/admin/academy" element={<AcademyDashboard />} />
            <Route path="/academy/register" element={<AcademyRegister />} />
            <Route path="/admin/schedules" element={
              <AdminCommonLayout title="스케줄">
                <UnifiedScheduleComponent 
                  userRole={user?.role || 'ADMIN'}
                  userId={user?.id}
                />
              </AdminCommonLayout>
            } />
            <Route path="/admin/statistics" element={
              <AdminCommonLayout title="통계">
                <StatisticsDashboard 
                  userRole={user?.role || 'ADMIN'}
                  userId={user?.id}
                />
              </AdminCommonLayout>
            } />
            <Route path="/admin/statistics-dashboard" element={
              <AdminCommonLayout title="통계 대시보드">
                <StatisticsDashboard 
                  userRole={user?.role || 'ADMIN'}
                  userId={user?.id}
                />
              </AdminCommonLayout>
            } />
            
            
            {/* 시스템 관리 라우트 (준비중) */}
            <Route path="/admin/system" element={
              <ComingSoon 
                title="시스템 도구"
                description="시스템 도구 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            <Route path="/admin/logs" element={
              <ComingSoon 
                title="시스템 로그"
                description="시스템 로그 조회 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            <Route path="/admin/settings" element={
              <ComingSoon 
                title="관리자 설정"
                description="관리자 설정 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            
            {/* 기존 재무관리 라우트들은 ERP로 통합되어 제거됨 */}
            
            {/* ERP 라우트 (기존) */}
            <Route path="/erp/dashboard" element={<ErpDashboard />} />
            <Route path="/erp/purchase-requests" element={<PurchaseRequestForm />} />
            <Route path="/erp/refund-management" element={<RefundManagement />} />
            <Route path="/erp/approvals" element={<AdminApprovalDashboard />} />
            <Route path="/erp/super-approvals" element={<SuperAdminApprovalDashboard />} />
            <Route path="/erp/items" element={<ItemManagement />} />
            <Route path="/erp/budgets" element={<BudgetManagement />} />
            <Route path="/erp/salary" element={<SalaryManagement />} />
            <Route path="/erp/tax" element={<TaxManagement />} />
            <Route path="/erp/orders" element={
              <ComingSoon 
                title="주문 관리"
                description="주문 관리 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            
            {/* Admin ERP 라우트: 어드민 전용(IntegratedFinanceDashboard)만 /admin/erp/ 유지, 나머지는 /erp/로 리다이렉트 */}
            <Route path="/admin/erp/dashboard" element={<Navigate to="/erp/dashboard" replace />} />
            <Route path="/admin/erp/purchase" element={<Navigate to="/erp/purchase-requests" replace />} />
            <Route path="/admin/erp/financial" element={<IntegratedFinanceDashboard />} />
            <Route path="/admin/erp/budget" element={<Navigate to="/erp/budget" replace />} />
            <Route path="/admin/erp/reports" element={
              <ComingSoon 
                title="ERP 보고서"
                description="ERP 보고서 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            
            {/* 관리자 추가 메뉴 (준비중) */}
            <Route path="/admin/branches" element={
              <AdminCommonLayout title="준비 중">
                <ComingSoon title="준비 중" description="해당 기능은 현재 개발 중입니다." />
              </AdminCommonLayout>
            } />
            <Route path="/admin/branch-create" element={<Navigate to="/admin/branches" replace />} />
            <Route path="/admin/branch-hierarchy" element={<Navigate to="/admin/branches" replace />} />
            <Route path="/admin/branch-managers" element={<Navigate to="/admin/branches" replace />} />
            <Route path="/admin/branch-status" element={<Navigate to="/admin/branches" replace />} />
            <Route path="/admin/branch-consultants" element={<Navigate to="/admin/branches" replace />} />
            
            {/* OAuth2 콜백 처리 라우트 */}
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />
            
            {/* 테스트 페이지 라우트 */}
            <Route path="/test/notifications" element={<NotificationTest />} />
            <Route path="/test/payment" element={<PaymentTest />} />
            {/* <Route path="/test/integration" element={<IntegrationTest />} /> */}
            <Route path="/test/ios-cards" element={<IOSCardSample />} />
            <Route path="/test/design-sample" element={<MindGardenDesignSample />} />
            <Route path="/test/premium-sample" element={<PremiumDesignSample />} />
            <Route path="/test/advanced-sample" element={<AdvancedDesignSample />} />
            <Route path="/test/components" element={<ComponentTestPage />} />
            <Route path="/design-system" element={<MindGardenDesignSystemShowcase />} />
            <Route path="/filter-search" element={<FilterSearchShowcase />} />
            {/* /admin-dashboard-sample은 AppPublic에서 처리 */}
            
            {/* 추후 홈페이지 추가 시 사용할 경로들 */}
            {/* <Route path="/homepage" element={<Homepage />} /> */}
            {/* <Route path="/desktop" element={<DesktopHomepage />} /> */}
            {/* catch-all 라우트 제거 (개발 중) */}
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </Routes>
          </Suspense>
          
          {/* 통계 모달 */}
          <StatisticsModal
            isOpen={showStatisticsModal}
            onClose={() => setShowStatisticsModal(false)}
            userRole={user?.role || 'ADMIN'}
          />
          
          {/* 중복 로그인 알림 - UnifiedNotification으로 통합 */}
          <UnifiedNotification 
            type="modal" 
            position="center"
            onAction={(action) => {
              if (action.id === 'confirm' || action.id === 'cancel') {
                duplicateLoginManager.forceLogout();
              }
            }}
          />
          
          {/* 지점 매핑 모달 제거됨 - 브랜치 코드 제거 정책 */}
          
          {/* 중복 로그인 모달 */}
          <DuplicateLoginModal />
        </div>
        </SessionGuard>
    </QueryParamHandler>
  );
}

// 최상위 App 컴포넌트 (ThemeProvider + SessionProvider + NotificationProvider 제공)
function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

// 개발자 도구용 전역 함수들
if (process.env.NODE_ENV === 'development') {
  window.clearSession = () => {
    sessionManager.forceClearSession();
  };
  
  window.clearLocalStorage = () => {
    sessionManager.clearLocalStorage();
  };
  
  window.getSessionInfo = () => {
    console.log('현재 세션 정보:', {
      user: sessionManager.getUser(),
      sessionInfo: sessionManager.getSessionInfo(),
      isLoggedIn: sessionManager.isLoggedIn(),
      localStorage: {
        user: localStorage.getItem('user'),
        sessionInfo: localStorage.getItem('sessionInfo')
      }
    });
  };
}

export default App;
