import React, { useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './i18n'; // i18n Phase 1 부트스트랩 (react-i18next 초기화)
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
import IntegratedFinanceDashboard from './components/erp/IntegratedFinanceDashboard';
import ConsultantMessageScreen from './components/consultant/ConsultantMessageScreen';
import ConsultantDashboardRenewal from './components/consultant/ConsultantDashboardRenewal';
import ConsultantScheduleRenewal from './components/consultant/ConsultantScheduleRenewal';
import ConsultantClientManagementRenewal from './components/consultant/ConsultantClientManagementRenewal';
import ConsultantRecordsRenewal from './components/consultant/ConsultantRecordsRenewal';
import ConsultantMoreHub from './components/consultant/ConsultantMoreHub';
import ConsultantSalarySettlement from './components/consultant/ConsultantSalarySettlement';
import ConsultantSessionKpiPage from './components/consultant/ConsultantSessionKpiPage';
import ConsultantMindWeatherInboxPage from './components/consultant/ConsultantMindWeatherInboxPage';
import ClientMessageScreen from './components/client/ClientMessageScreen';
import SchedulePage from './components/schedule/SchedulePage';
import AdminSchedulesPage from './components/schedule/AdminSchedulesPage';
import UnifiedModalTest from './components/test/UnifiedModalTest';
import UnifiedLoadingTest from './components/test/UnifiedLoadingTest';
import UnifiedLoading from './components/common/UnifiedLoading';
import ErrorBoundary from './components/common/ErrorBoundary';
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
import AdminCommonLayout from './components/layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from './components/dashboard-v2/constants/menuItems';
import AcademyDashboard from './components/academy/AcademyDashboard';
import AcademyRegister from './components/academy/AcademyRegister';
// 대시보드 컴포넌트 지연 로드 (로그인 직후 초기화 순서 오류 방지)
const TenantSelectorNew = lazy(() => import('./components/auth/TenantSelector'));
const DynamicDashboard = lazy(() => import('./components/dashboard/DynamicDashboard'));
const AdminDashboardV2 = lazy(() => import('./components/dashboard-v2/AdminDashboardV2'));
const ClientDashboard = lazy(() => import('./components/client/ClientDashboard'));
const CommonDashboard = lazy(() => import('./components/dashboard/CommonDashboard'));
const ConsultantDashboardV2 = lazy(() => import('./components/dashboard-v2/consultant/ConsultantDashboardV2'));
const AdminKakaoAlimtalkSettingsPage = lazy(() => import('./components/admin/AdminKakaoAlimtalkSettingsPage'));
const AdminTenantSmsSettingsPage = lazy(() => import('./components/admin/AdminTenantSmsSettingsPage'));
const AdminTestNotificationPage = lazy(() => import('./components/admin/system/AdminTestNotificationPage'));
const AdminManualNotificationPage = lazy(() => import('./components/admin/manual-notification/AdminManualNotificationPage'));
const SmsTemplateManagementPage = lazy(() => import('./components/admin/sms-templates/SmsTemplateManagementPage'));
const AdminBillingSubscriptionsPage = lazy(() => import('./components/admin/billing/SubscriptionsPage'));
const AdminBillingPaymentMethodsPage = lazy(() => import('./components/admin/billing/PaymentMethodsPage'));
import UnifiedNotification from './components/common/UnifiedNotification';
import WithdrawalPendingBanner from './components/common/WithdrawalPendingBanner';
import NotificationTest from './components/test/NotificationTest';
import PaymentTest from './components/test/PaymentTest';
// IntegrationTest는 현재 사용되지 않음
import AccountManagement from './components/admin/AccountManagement';
import BranchDeprecationNotice from './components/admin/BranchDeprecationNotice';
import ConsultationHistory from './components/consultation/ConsultationHistory';
import ConsultationReport from './components/consultation/ConsultationReport';
import ComplianceMenu from './components/compliance/ComplianceMenu';
import ComplianceDashboard from './components/compliance/ComplianceDashboard';
import DormantUsersPage from './components/admin/lifecycle/DormantUsersPage';
import ActivityHistory from './pages/client/ActivityHistory';
import ConsultantClientList from './components/consultant/ConsultantClientList';
import ConsultantAvailability from './components/consultant/ConsultantAvailability';
import ConsultantRecords from './components/consultant/ConsultantRecords';
import ConsultantMessages from './components/consultant/ConsultantMessages';
import ErpDashboard from './components/erp/ErpDashboard';
import PurchaseRequestForm from './components/erp/PurchaseRequestForm';
import ErpApprovalHub from './components/erp/approval/ErpApprovalHub';
import { buildErpApprovalHubPath } from './components/erp/approval/erpApprovalHubRoutes';
import ItemManagement from './components/erp/ItemManagement';
import SalaryManagement from './components/erp/SalaryManagement';
import RefundManagement from './components/erp/RefundManagement';
import ClientSchedule from './components/client/ClientSchedule';
import ClientSessionManagement from './components/client/ClientSessionManagement';
import ClientHomeRenewal from './components/client/ClientHomeRenewal';
import ClientBookingRenewal from './components/client/ClientBookingRenewal';
import ClientConsultationsRenewal from './components/client/ClientConsultationsRenewal';
import ClientWellnessRenewal from './components/client/ClientWellnessRenewal';
import MoodJournal from './components/client/MoodJournal';
import SelfAssessment from './components/client/SelfAssessment';
import ClientSessionPaymentRenewal from './components/client/ClientSessionPaymentRenewal';
import ShopCatalogPage from './pages/client/shop/ShopCatalogPage';
import ShopCartPage from './pages/client/shop/ShopCartPage';
import ShopCheckoutPage from './pages/client/shop/ShopCheckoutPage';
import ShopPointsPage from './pages/client/shop/ShopPointsPage';
import ShopOrdersPage from './pages/client/shop/ShopOrdersPage';
import ShopOrderDetailPage from './pages/client/shop/ShopOrderDetailPage';
import ShopSkuDetailPage from './pages/client/shop/ShopSkuDetailPage';
import ClientTenantComponentGate from './components/shop/templates/ClientTenantComponentGate';
import AdminTenantComponentGate from './components/shop/templates/AdminTenantComponentGate';
import { PLATFORM_COMPONENT_CODES } from './constants/tenantComponentApi';
import ConsultantAvailabilityRenewal from './components/consultant/ConsultantAvailabilityRenewal';
import MeditationGuide from './components/wellness/MeditationGuide';
import PsychoEducation from './components/wellness/PsychoEducation';
import CommunityFeed from './components/community/CommunityFeed';
import CommunityPostDetail from './components/community/CommunityPostDetail';
import ClientPaymentHistory from './components/client/ClientPaymentHistory';
import HelpPage from './components/common/HelpPage';
import ClientSettings from './components/client/ClientSettings';
import WellnessNotificationList from './components/wellness/WellnessNotificationList';
import WellnessNotificationDetail from './components/wellness/WellnessNotificationDetail';
import WellnessManagement from './components/admin/WellnessManagement';
import AdminCommunityModerationQueuePage from './components/admin/AdminCommunityModerationQueuePage';
import AdminPendingPaymentCleanupPage from './components/admin/mapping/AdminPendingPaymentCleanupPage';
import AdminContentMasterPage from './components/admin/AdminContentMasterPage';
// BW-1 Phase 3 (2026-06-07): placeholder → 본 데이터 페이지 라우트 import 교체.
// placeholder 파일은 후속 회수 PR 에서 정리 (롤백 안전성 가드).
import AdminPushMonitoringPage from './components/admin/PushMonitoring/AdminPushMonitoringPage';
import AdminMindWeatherObservabilityPage from './components/admin/AdminMindWeatherObservabilityPage';
import AdminMindGardenObservabilityPage from './components/admin/AdminMindGardenObservabilityPage';
import AdminShopCatalogSkusPage from './components/admin/AdminShopCatalogSkusPage';
import AdminShopCatalogSkuEditorPage from './components/admin/AdminShopCatalogSkuEditorPage';
import AdminShopPointPoliciesPage from './components/admin/AdminShopPointPoliciesPage';
import AdminShopOrdersPage from './components/admin/AdminShopOrdersPage';
import MindfulnessGuide from './components/wellness/MindfulnessGuide';
import TenantProfile from './components/tenant/TenantProfile';
import PgConfigurationList from './components/tenant/PgConfigurationList';
import PgConfigurationCreate from './components/tenant/PgConfigurationCreate';
import PgConfigurationDetail from './components/tenant/PgConfigurationDetail';
import PgConfigurationEdit from './components/tenant/PgConfigurationEdit';
import PgApprovalManagement from './components/ops/PgApprovalManagement';
import AdminLayout from './components/layout/AdminLayout';
import TenantCommonCodeManager from './components/admin/TenantCommonCodeManager';
import ProtectedRoute from './components/common/ProtectedRoute';
import SuperAdminTenantComponentPage from './components/super-admin/SuperAdminTenantComponentPage';
import { SUPER_ADMIN_ROLE, SUPER_ADMIN_ROUTES } from './constants/superAdminRoutes';
import { MypageRedirect, SettingsRedirect } from './components/common/MypageSettingsRedirects';
import ConsultantAppShell from './components/layout/ConsultantAppShell';
import ClientAppShell from './components/layout/ClientAppShell';
import MobileLogin from './components/auth/MobileLogin';
import SessionGuard from './components/common/SessionGuard';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { TenantComponentFlagsProvider } from './contexts/TenantComponentFlagsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import AppToast from './components/common/AppToast';
import { sessionManager } from './utils/sessionManager';
import duplicateLoginManager from './utils/duplicateLoginManager';
import notificationManager from './utils/notification';
// DuplicateLoginAlert는 UnifiedNotification으로 통합됨
// BranchMappingModal 제거됨 - 브랜치 코드 제거 정책
import DuplicateLoginModal from './components/common/DuplicateLoginModal';
import SessionIdleWarningModal from './components/common/SessionIdleWarningModal';
import PrivacyPolicy from './components/common/PrivacyPolicy';
import TermsOfService from './components/common/TermsOfService';
import AccountDeletionInstructions from './components/common/AccountDeletionInstructions';
import CounselingCenterLanding from './pages/CounselingCenterLanding';
import TenantOnboardingPage from './pages/public/TenantOnboardingPage';
import PricingPage from './pages/public/PricingPage';
import SystemNotifications from './components/notifications/SystemNotifications';
import UnifiedNotifications from './components/notifications/UnifiedNotifications';
import SystemNotificationManagement from './components/admin/SystemNotificationManagement';
import AdminMessages from './components/admin/AdminMessages';
import AdminNotificationsPage from './components/admin/AdminNotificationsPage';
import SystemConfigManagement from './components/admin/SystemConfigManagement';
import AiProviderManagementPage from './components/admin/aiProvider/AiProviderManagementPage';
import PsychAssessmentManagement from './components/admin/PsychAssessmentManagement';
import PsychAssessmentLegacyRedirect from './components/admin/PsychAssessmentLegacyRedirect';
import BrandingManagementPage from './pages/BrandingManagementPage';
import CacheMonitoringDashboard from './components/admin/CacheMonitoringDashboard';
import UnifiedHeader from './components/common/UnifiedHeader';
import SecurityMonitoringDashboard from './components/admin/SecurityMonitoringDashboard';
import ApiPerformanceMonitoring from './components/admin/ApiPerformanceMonitoring';
import PackagePricingListPage from './components/admin/package-pricing/pages/PackagePricingListPage';
import PackagePricingDetailPage from './components/admin/package-pricing/pages/PackagePricingDetailPage';
import { ADMIN_ROUTES } from './constants/adminRoutes';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { setPathname } = useNotification();
  const { user, sessionInfo, isLoading, checkSession, logout } = useSession();

  // 공개→보호 경로 전환 시 NotificationContext가 loadUnreadCount 하도록 pathname 동기화
  useEffect(() => {
    setPathname(pathname);
  }, [pathname, setPathname]);

  // 테넌트별 브랜딩 시스템 초기화
  const { hasCustomBranding, companyName, primaryColor } = useTenantBranding({
    autoApply: true
  });
  
  // pathname 변경 시 checkSession은 SessionGuard에서만 호출 (중복 제거 - 무한루프 방지)

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

    // H6 가드: initializeDynamicThemeSystem 내부의 setTheme('ios') 가
    // <html data-theme="..."> 를 일괄 removeAttribute 하므로,
    // DarkModeProvider 가 적용해둔 'dark' 를 user 갱신 시점에 복원한다.
    const preserveDarkTheme = typeof document !== 'undefined'
      && document.documentElement.getAttribute('data-theme') === 'dark';

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

    if (preserveDarkTheme && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
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

  return (
    <QueryParamHandler onLoginSuccess={handleLoginSuccess}>
      <SessionGuard>
        {isLoading && (
          <div
            className="session-loading-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--cs-glass-strong)'
            }}
          >
            <UnifiedLoading
              variant="spinner"
              size="md"
              type="inline"
              text={t('common.messages.loading')}
            />
          </div>
        )}
        <div className="App">
          <AppToast />
          <UnifiedNotification type="toast" position="top-right" />
          <WithdrawalPendingBanner />
          <Suspense fallback={<div className="mg-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>{t('common.messages.loading')}</div>}>
          <Routes>
            <Route path="/" element={<TabletHomepage />} />
            {/* §P 옵션 C: /landing → / 흡수 (단일 SSOT). 레거시 경로 리다이렉트 유지. */}
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/test/modal" element={<div className="mg-modal" />} />
            <Route path="/test/loading" element={<div className="mg-loading">{t('common:misc.App.t_f596b561')}</div>} />
            <Route path="/test/header" element={<UnifiedHeader />} />
            {/* Phase 3: 통합 로그인 시스템 */}
            <Route path="/login" element={<UnifiedLogin />} />
            <Route path="/login/tablet" element={<TabletLogin />} />
            <Route path="/register" element={<TabletRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/oauth2/callback" element={<OAuth2Callback />} />
            
            {/* 지점별 로그인 라우트 제거됨 - 브랜치 코드 제거 정책 */}
            
            {/* Phase 1: 모바일 전용 로그인 + 테넌트 선택 */}
            <Route path="/mobile-login" element={<MobileLogin />} />
            <Route path="/tenant-select" element={<TenantSelectorNew />} />
            
            {/* Phase 1: 상담사 AppShell 레이아웃 (바텀 네비 + 상단 바) */}
            <Route
              path="/consultant"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.CONSULTANT]}>
                  <ConsultantAppShell />
                </ProtectedRoute>
              }
            >
              {/* 하위 라우트는 Phase 2A에서 Outlet으로 연결 */}
            </Route>
            
            {/* Phase 1 + 2B: 내담자 AppShell 레이아웃 (바텀 네비 + 상단 바) */}
            <Route
              path="/client"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.CLIENT]}>
                  <ClientAppShell />
                </ProtectedRoute>
              }
            >
              {/* Phase 2B 리뉴얼 화면 — Outlet으로 렌더링 */}
              <Route index element={<ClientHomeRenewal />} />
              <Route path="home" element={<ClientHomeRenewal />} />
              <Route path="booking" element={<ClientBookingRenewal />} />
              <Route path="consultations" element={<ClientConsultationsRenewal />} />
              <Route path="wellness-hub" element={<ClientWellnessRenewal />} />
              <Route path="mood-journal" element={<MoodJournal />} />
              <Route path="self-assessment" element={<SelfAssessment />} />
              <Route path="session-payment" element={<ClientSessionPaymentRenewal />} />
              <Route path="shop" element={
                <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
                  <ShopCatalogPage />
                </ClientTenantComponentGate>
              } />
              <Route path="shop/cart" element={
                <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
                  <ShopCartPage />
                </ClientTenantComponentGate>
              } />
              <Route path="shop/checkout" element={
                <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
                  <ShopCheckoutPage />
                </ClientTenantComponentGate>
              } />
              <Route path="shop/points" element={
                <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
                  <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_REWARD}>
                    <ShopPointsPage />
                  </ClientTenantComponentGate>
                </ClientTenantComponentGate>
              } />
              <Route path="shop/orders" element={
                <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
                  <ShopOrdersPage />
                </ClientTenantComponentGate>
              } />
              <Route path="shop/orders/:orderPublicId" element={
                <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
                  <ShopOrderDetailPage />
                </ClientTenantComponentGate>
              } />
              <Route path="shop/sku/:skuCode" element={
                <ClientTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.CLIENT_SHOP}>
                  <ShopSkuDetailPage />
                </ClientTenantComponentGate>
              } />
              <Route path="shop-catalog" element={<Navigate to="/client/shop" replace />} />
              <Route path="shop-checkout" element={<Navigate to="/client/shop/checkout" replace />} />
              <Route path="shop-points" element={<Navigate to="/client/shop/points" replace />} />
              <Route path="meditation" element={<MeditationGuide />} />
              <Route path="psycho-education" element={<PsychoEducation />} />
              <Route path="community" element={<CommunityFeed primaryColor="var(--mg-client-primary)" />} />
              <Route path="community/:postId" element={<CommunityPostDetail primaryColor="var(--mg-client-primary)" />} />
            </Route>
            
            {/* 일반 대시보드 라우트 (동적 대시보드 우선) */}
            <Route path="/dashboard" element={<DynamicDashboard user={user} />} />
            
            {/* 역할별 대시보드 라우트 - 세션/권한 체크 후 해당 역할만 접근 (링크만으로 어드민 대시보드 이동 불가) */}
            <Route path="/client/dashboard" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.CLIENT]}>
                <ClientDashboard user={user} />
              </ProtectedRoute>
            } />
            <Route path="/consultant/dashboard" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.CONSULTANT]}>
                <ConsultantDashboardV2 user={user} />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminDashboardV2 user={user} />
              </ProtectedRoute>
            } />
            <Route path="/super_admin/dashboard" element={<DynamicDashboard user={user} />} />
            <Route
              path={SUPER_ADMIN_ROUTES.TENANT_COMPONENTS}
              element={(
                <ProtectedRoute requiredRole={SUPER_ADMIN_ROLE}>
                  <SuperAdminTenantComponentPage />
                </ProtectedRoute>
              )}
            />
            <Route path="/branch_super_admin/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/branch_manager/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/client/mypage" element={<MyPage />} />
            <Route path="/consultant/mypage" element={<MyPage />} />
            <Route path="/admin/mypage" element={<MyPage />} />
            <Route path="/super_admin/mypage" element={<MyPage />} />
            <Route path="/branch_super_admin/mypage" element={<Navigate to="/admin/mypage" replace />} />
            <Route path="/branch_manager/mypage" element={<Navigate to="/admin/mypage" replace />} />
            <Route path="/mypage" element={<MypageRedirect />} />
            <Route path="/settings" element={<SettingsRedirect />} />

            {/*
              보안 라운드 2 (2026-06-03): /consultant/income-report 리다이렉트·컴포넌트(ConsultantIncomeReport)
              모두 제거. 상담사 채널은 매출/수익 정보 화면을 가지지 않는다.
            */}

            <Route
              path="/consultant/salary-settlement"
              element={(
                <ProtectedRoute requiredRoles={[USER_ROLES.CONSULTANT]}>
                  <AdminCommonLayout title={t('common:misc.App.t_943bafd7')}>
                    <div className="mg-v2-ad-b0kla">
                      <div className="mg-v2-ad-b0kla__container">
                        <ConsultantSalarySettlement />
                      </div>
                    </div>
                  </AdminCommonLayout>
                </ProtectedRoute>
              )}
            />

            {/* 상담사 리뉴얼 라우트 (ConsultantAppShell) */}
            <Route path="/consultant/renewal" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.CONSULTANT]}>
                <ConsultantAppShell title={t('common:misc.App.t_13a46f96')} />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/consultant/renewal/dashboard" replace />} />
              <Route path="dashboard" element={<ConsultantDashboardRenewal />} />
              <Route path="schedule" element={<ConsultantScheduleRenewal />} />
              <Route path="clients" element={<ConsultantClientManagementRenewal />} />
              <Route path="consultation-records" element={<ConsultantRecordsRenewal />} />
              <Route path="availability" element={<ConsultantAvailabilityRenewal />} />
              <Route path="salary-settlement" element={<ConsultantSalarySettlement />} />
              {/* 보안 라운드 2 (2026-06-03): income-report 서브 라우트 제거. 매출/수익 화면 잔존 금지. */}
              <Route path="community" element={<CommunityFeed primaryColor="var(--mg-consultant-primary)" />} />
              <Route path="community/:postId" element={<CommunityPostDetail primaryColor="var(--mg-consultant-primary)" />} />
            </Route>

            {/* 상담사 "더보기" 하위 라우트 (웰니스·커뮤니티 접근) */}
            <Route path="/consultant/more" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.CONSULTANT]}>
                <ConsultantAppShell title={t('common:misc.App.t_0b680789')} />
              </ProtectedRoute>
            }>
              <Route index element={<ConsultantMoreHub />} />
              <Route path="session-kpi" element={<ConsultantSessionKpiPage />} />
              <Route path="mind-weather-inbox" element={<ConsultantMindWeatherInboxPage />} />
              <Route path="community" element={<CommunityFeed primaryColor="var(--mg-consultant-primary)" />} />
              <Route path="community/:postId" element={<CommunityPostDetail primaryColor="var(--mg-consultant-primary)" />} />
            </Route>

            {/* 내담자 "더보기" 하위 라우트 */}
            <Route path="/client/more" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.CLIENT]}>
                <ClientAppShell title={t('common:misc.App.t_0b680789')} />
              </ProtectedRoute>
            }>
              <Route path="community" element={<CommunityFeed primaryColor="var(--mg-client-primary)" />} />
              <Route path="community/:postId" element={<CommunityPostDetail primaryColor="var(--mg-client-primary)" />} />
            </Route>

            {/* 상담사 전용 라우트 (레거시) */}
            <Route path="/consultant/schedule" element={<ConsultantSchedule />} />
            <Route path="/consultant/consultation-record/:consultationId" element={<ConsultationRecordScreen />} />
            <Route path="/consultant/consultation-record-view/:recordId" element={<ConsultationRecordView />} />
            
            {/* 권한 관리 화면 제거: 역할·권한은 사용자 관리에서 처리.
                STAFF_PERMISSION_POLICY_PHASE2: /admin/permissions 는 ADMIN 전용으로 유지하여
                STAFF 직접 접근을 차단 (보안·역할 관리 정책). */}
            <Route
              path="/admin/permissions"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <Navigate to="/admin/user-management" replace />
                </ProtectedRoute>
              }
            />
            
            {/* 관리자 전용 메뉴 시스템 (관리자·스태프 역할 접근, ERP는 STAFF 제외) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/common-codes" replace />} />
              {/* path 문자열 필수: scripts/verify-quick-action-routes.mjs (ADMIN_ROUTES.TENANT_COMMON_CODES 와 동일 세그먼트) */}
              <Route path="tenant-common-codes" element={<TenantCommonCodeManager />} />
              <Route path="package-pricing/new" element={<PackagePricingDetailPage isNew />} />
              <Route path="package-pricing/:id" element={<PackagePricingDetailPage />} />
              <Route path="package-pricing" element={<PackagePricingListPage />} />
              <Route path="menu-permissions" element={<Navigate to="/admin/user-management" replace />} />
              <Route path="permission-groups" element={<Navigate to="/admin/user-management" replace />} />
              {/* 추후 추가될 관리자 페이지들 */}
            </Route>
            
            {/* ERP 관리 — STAFF_PERMISSION_POLICY_PHASE2: 모든 /erp/* 라우트 ADMIN 전용 */}
            <Route
              path="/erp/purchase"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <PurchaseManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/financial"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <FinancialManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/budget"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <BudgetManagement />
                </ProtectedRoute>
              }
            />
            {/* 단순 리다이렉트는 가드 없이 둠: 목적지(/erp/salary)에서 ADMIN 가드로 차단됨 (e2e-erp-smoke deep link UX 보존) */}
            <Route path="/erp/tax" element={<Navigate to="/erp/salary?tab=tax" replace />} />
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
            <Route path="/client/booking" element={<Navigate to="/client/schedule" replace />} />
            <Route path="/client/schedule" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.CLIENT]}>
                <ClientSchedule />
              </ProtectedRoute>
            } />
            <Route path="/client/records" element={<Navigate to="/client/session-management" replace />} />
            <Route path="/client/session-management" element={<ClientSessionManagement />} />
            <Route path="/client/payment-history" element={<ClientPaymentHistory />} />
            <Route path="/client/settings" element={<ClientSettings />} />
            <Route path="/client/activity-history" element={<ActivityHistory />} />
            <Route path="/client/wellness" element={<WellnessNotificationList />} />
            <Route path="/client/wellness/:id" element={<WellnessNotificationDetail />} />
            <Route path="/client/mindfulness-guide" element={<MindfulnessGuide />} />
            
            {/* 관리자 - 웰니스 관리 */}
            <Route path="/admin/wellness" element={<WellnessManagement />} />
            <Route path={ADMIN_ROUTES.COMMUNITY_MODERATION} element={<AdminCommunityModerationQueuePage />} />
            <Route path={ADMIN_ROUTES.MAPPINGS_PENDING_PAYMENT_CLEANUP} element={<AdminPendingPaymentCleanupPage />} />
            <Route path={ADMIN_ROUTES.CONTENT_MASTER} element={<AdminContentMasterPage />} />
            <Route path={ADMIN_ROUTES.MIND_WEATHER_OBSERVABILITY} element={<AdminMindWeatherObservabilityPage />} />
            <Route path={ADMIN_ROUTES.MIND_GARDEN_OBSERVABILITY} element={<AdminMindGardenObservabilityPage />} />
            <Route path={ADMIN_ROUTES.PUSH_MONITORING} element={<AdminPushMonitoringPage />} />
            <Route path={`${ADMIN_ROUTES.SHOP_CATALOG_SKUS}/new`} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG}>
                  <AdminShopCatalogSkuEditorPage isNew />
                </AdminTenantComponentGate>
              </ProtectedRoute>
            } />
            <Route path={`${ADMIN_ROUTES.SHOP_CATALOG_SKUS}/:skuId/edit`} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG}>
                  <AdminShopCatalogSkuEditorPage />
                </AdminTenantComponentGate>
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.SHOP_CATALOG_SKUS} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG}>
                  <AdminShopCatalogSkusPage />
                </AdminTenantComponentGate>
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.SHOP_POINT_POLICIES} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG}>
                  <AdminShopPointPoliciesPage />
                </AdminTenantComponentGate>
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.SHOP_ORDERS} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminTenantComponentGate componentCode={PLATFORM_COMPONENT_CODES.ADMIN_SHOP_CATALOG}>
                  <AdminShopOrdersPage />
                </AdminTenantComponentGate>
              </ProtectedRoute>
            } />
            
            {/* 개인정보 및 약관 관련 라우트 */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            {/* Google Play 「데이터 보안 → 사용자 데이터 삭제 정책」 준수 — 비로그인 공개 페이지 */}
            <Route path="/account-deletion" element={<AccountDeletionInstructions />} />
            
            {/* 테넌트 프로필/설정 — 내담자·상담사 접근 불가 (ADMIN/STAFF만) */}
            <Route path="/tenant/profile" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <TenantProfile />
              </ProtectedRoute>
            } />
            <Route path="/tenant/settings" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <TenantProfile />
              </ProtectedRoute>
            } />
            {/* PG 설정 라우트 (P1: 단수 경로 리다이렉트) */}
            <Route path="/tenant/pg-configuration" element={<Navigate to="/tenant/pg-configurations" replace />} />
            <Route path="/tenant/pg-configurations" element={<PgConfigurationList />} />
            <Route path="/tenant/pg-configurations/new" element={<PgConfigurationCreate />} />
            <Route path="/tenant/pg-configurations/:id" element={<PgConfigurationDetail />} />
            <Route path="/tenant/pg-configurations/:id/edit" element={<PgConfigurationEdit />} />
            
            {/* Design v2 Phase B — 공개 페이지 라우트 */}
            <Route path="/onboarding" element={<TenantOnboardingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            
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

            {/* Phase 4 — 휴면 사용자 모니터링 (정책서 §10.9 + §10.12) */}
            <Route path="/admin/lifecycle/dormant-users" element={<DormantUsersPage />} />

            {/* 공통 라우트 (모든 사용자) */}
            <Route path="/help" element={<HelpPage />} />
            
            {/* 통합 스케줄 관리 라우트 */}
            <Route path="/schedule" element={<SchedulePage user={user} />} />
            <Route path="/admin/schedule" element={<SchedulePage user={user} />} />
            <Route path="/staff/schedule" element={<Navigate to="/admin/schedule" replace />} />
            <Route path="/staff/clients" element={<Navigate to="/admin/user-management?type=client" replace />} />
            <Route path="/staff/records" element={<Navigate to="/admin/consultation-logs" replace />} />
            <Route path="/consultant/schedule-new" element={<SchedulePage user={user} />} />
            <Route path="/super_admin/schedule" element={<SchedulePage user={user} />} />
            
            {/* 관리자/스태프 전용 라우트 */}
            <Route path="/admin/consultant-comprehensive" element={<Navigate to="/admin/user-management?type=consultant" replace />} />
            <Route path="/admin/client-comprehensive" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <Navigate to="/admin/user-management?type=client" replace />
              </ProtectedRoute>
            } />
            <Route path="/admin/mapping-management" element={<MappingManagement />} />
            <Route path="/admin/consultation-logs" element={<ConsultationLogView />} />
            <Route
              path="/admin/integrated-schedule"
              element={
                <AdminCommonLayout title={t('common:misc.App.t_d67bbae4')}>
                  <IntegratedMatchingSchedule />
                </AdminCommonLayout>
              }
            />
            <Route path="/admin/common-codes" element={<CommonCodeManagement />} />
            <Route path="/admin/sessions" element={<SessionManagement />} />
            <Route path="/admin/accounts" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AccountManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/user-management" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <UserManagementPage />
              </ProtectedRoute>
            } />
                <Route path="/admin/cache-monitoring" element={<CacheMonitoringDashboard />} />
                <Route path="/admin/security-monitoring" element={<SecurityMonitoringDashboard />} />
            <Route path="/admin/api-performance" element={<ApiPerformanceMonitoring />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            <Route path="/admin/system-notifications" element={<Navigate to="/admin/notifications" replace />} />
            <Route path="/admin/users" element={<Navigate to="/admin/user-management" replace />} />
            <Route path="/admin/reports" element={<Navigate to="/admin/consultation-logs" replace />} />
            <Route path="/admin/backup" element={<Navigate to="/admin/system-config" replace />} />
            <Route path="/admin/system-config" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <SystemConfigManagement />
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.AI_PROVIDERS} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AiProviderManagementPage />
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.TEST_NOTIFICATION} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminTestNotificationPage />
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.MANUAL_NOTIFICATION} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminManualNotificationPage />
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.SMS_TEMPLATES} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <SmsTemplateManagementPage />
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.KAKAO_ALIMTALK_SETTINGS} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminKakaoAlimtalkSettingsPage />
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.TENANT_SMS_SETTINGS} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminTenantSmsSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/ops/pg-approval" element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                <PgApprovalManagement />
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.BILLING_SUBSCRIPTIONS} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminBillingSubscriptionsPage />
              </ProtectedRoute>
            } />
            <Route path={ADMIN_ROUTES.BILLING_PAYMENT_METHODS} element={
              <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                <AdminBillingPaymentMethodsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/psych-assessment" element={<PsychAssessmentLegacyRedirect />} />
            <Route path={ADMIN_ROUTES.PSYCH_ASSESSMENTS} element={<PsychAssessmentManagement user={user} />} />
            <Route path="/admin/branding" element={<BrandingManagementPage />} />
            <Route path="/admin/messages" element={<Navigate to="/admin/notifications" replace />} />
            
            {/* 학원 시스템 라우트 */}
            <Route path="/academy" element={<AcademyDashboard />} />
            <Route path="/admin/academy" element={<AcademyDashboard />} />
            <Route path="/academy/register" element={<AcademyRegister />} />
            <Route path="/admin/schedules" element={
              <AdminSchedulesPage
                userRole={user?.role || USER_ROLES.ADMIN}
                userId={user?.id}
              />
            } />
            <Route path="/admin/statistics" element={
              <AdminCommonLayout title={t('common:misc.App.t_4938fae0')}>
                <StatisticsDashboard 
                  userRole={user?.role || USER_ROLES.ADMIN}
                  userId={user?.id}
                />
              </AdminCommonLayout>
            } />
            <Route path="/admin/statistics-dashboard" element={
              <AdminCommonLayout title={t('common:misc.App.t_505d75b1')}>
                <StatisticsDashboard 
                  userRole={user?.role || USER_ROLES.ADMIN}
                  userId={user?.id}
                />
              </AdminCommonLayout>
            } />
            
            
            {/* 시스템 관리 라우트 (준비중) */}
            <Route path="/admin/system" element={
              <ComingSoon 
                title={t('common:misc.App.t_e9f4e81d')}
                description={t('common:misc.App.t_9c05a0b8')}
              />
            } />
            <Route path="/admin/logs" element={
              <ComingSoon 
                title={t('common:misc.App.t_e0975ea1')}
                description={t('common:misc.App.t_b33b95c1')}
              />
            } />
            <Route path="/admin/settings" element={
              <ComingSoon 
                title={t('common:misc.App.t_5fb8cd23')}
                description={t('common:misc.App.t_31e74062')}
              />
            } />
            
            {/* 기존 재무관리 라우트들은 ERP로 통합되어 제거됨 */}
            
            {/* ERP 라우트 (기존) — STAFF_PERMISSION_POLICY_PHASE2: 모든 /erp/* ADMIN 전용 */}
            <Route
              path="/erp/dashboard"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <ErpDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/purchase-requests"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <PurchaseRequestForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/refund-management"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <RefundManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/approvals"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <ErpApprovalHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/super-approvals"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <Navigate to={buildErpApprovalHubPath('super')} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/items"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <ItemManagement />
                </ProtectedRoute>
              }
            />
            {/* 단순 리다이렉트는 가드 없이 둠: 목적지에서 ADMIN 가드로 차단됨 (e2e-erp-smoke deep link UX 보존) */}
            <Route path="/erp/inventory" element={<Navigate to="/erp/items" replace />} />
            <Route path="/erp/budgets" element={<Navigate to="/erp/budget" replace />} />
            {/* /erp/salary: ADMIN 전용 ERP 화면 — Salary 관리(/admin/salary*)는 별도 어드민 라우트 */}
            <Route
              path="/erp/salary"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <SalaryManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/erp/orders"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <ComingSoon
                    title={t('common:misc.App.t_0078005e')}
                    description={t('common:misc.App.t_51d5ba99')}
                  />
                </ProtectedRoute>
              }
            />

            {/* Admin ERP 라우트 — STAFF_PERMISSION_POLICY_PHASE2: 실제 페이지(/admin/erp/financial, /admin/erp/reports)만 ADMIN 가드, 단순 리다이렉트는 가드 없이 둠(목적지에서 차단) */}
            <Route path="/admin/erp/dashboard" element={<Navigate to="/erp/dashboard" replace />} />
            <Route path="/admin/erp/purchase" element={<Navigate to="/erp/purchase-requests" replace />} />
            <Route
              path="/admin/erp/financial"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <IntegratedFinanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/erp/budget" element={<Navigate to="/erp/budget" replace />} />
            <Route
              path="/admin/erp/reports"
              element={
                <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
                  <ComingSoon
                    title={t('common:misc.App.t_8834c5d2')}
                    description={t('common:misc.App.t_5415fec8')}
                  />
                </ProtectedRoute>
              }
            />
            
            {/*
              Branch(지점) 시스템 사용 중단 안내 (역할 SSOT 정리 PR-5/9, 2026-06-12).
              옵션 A(점진적): 라우팅·페이지 자체는 남기되, 사용 중단 배너만 노출하여
              운영자가 더 이상 신규 지점·지점장을 등록하지 않도록 유도한다.
              BE seed(Flyway) Branch 메뉴 제거는 PR-6/7 별도 진행.
            */}
            <Route path="/admin/branches" element={<BranchDeprecationNotice />} />
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
            userRole={user?.role || USER_ROLES.ADMIN}
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
          <SessionIdleWarningModal />
        </div>
        </SessionGuard>
    </QueryParamHandler>
  );
}

// 최상위 App 컴포넌트 (ThemeProvider + SessionProvider + NotificationProvider 제공)
// ErrorBoundary 를 최상위에 두어 Provider/Router 트리 어디에서 던져진 에러도 폴백 UI 로 흡수한다.
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <DarkModeProvider>
          <SessionProvider>
            <TenantComponentFlagsProvider>
              <NotificationProvider>
                <ToastProvider>
                  <Router>
                    <AppContent />
                  </Router>
                </ToastProvider>
              </NotificationProvider>
            </TenantComponentFlagsProvider>
          </SessionProvider>
        </DarkModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
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
