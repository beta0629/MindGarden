import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/index.css';
import TabletHomepage from './components/homepage/Homepage';
import TabletLogin from './components/auth/TabletLogin';
import TabletRegister from './components/auth/TabletRegister';
import OAuth2Callback from './components/auth/OAuth2Callback';
import CommonDashboard from './components/dashboard/CommonDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import MyPage from './components/mypage/MyPage';
import ConsultantSchedule from './components/consultant/ConsultantSchedule';
import ConsultationRecordScreen from './components/consultant/ConsultationRecordScreen';
import ConsultantMessageScreen from './components/consultant/ConsultantMessageScreen';
import ClientMessageScreen from './components/client/ClientMessageScreen';
import SchedulePage from './components/schedule/SchedulePage';
import ScheduleCalendar from './components/schedule/ScheduleCalendar';
import ConsultantComprehensiveManagement from './components/admin/ConsultantComprehensiveManagement';
import ClientComprehensiveManagement from './components/admin/ClientComprehensiveManagement';
import SessionManagement from './components/admin/SessionManagement';
import MappingManagement from './components/admin/MappingManagement';
import CommonCodeManagement from './components/admin/CommonCodeManagement';
import StatisticsModal from './components/common/StatisticsModal';
import StatisticsDashboard from './components/admin/StatisticsDashboard';
import ScheduleList from './components/common/ScheduleList';
import ComingSoon from './components/common/ComingSoon';
import FinanceDashboard from './components/super-admin/FinanceDashboard';
import PaymentManagement from './components/super-admin/PaymentManagement';
import SimpleLayout from './components/layout/SimpleLayout';
import Toast from './components/common/Toast';
import NotificationTest from './components/test/NotificationTest';
import PaymentTest from './components/test/PaymentTest';
import IntegrationTest from './components/test/IntegrationTest';
import AccountManagement from './components/admin/AccountManagement';
import ConsultationHistory from './components/consultation/ConsultationHistory';
import ConsultationReport from './components/consultation/ConsultationReport';
import ConsultantClientList from './components/consultant/ConsultantClientList';
import ConsultantAvailability from './components/consultant/ConsultantAvailability';
import ConsultantRecords from './components/consultant/ConsultantRecords';
import ErpDashboard from './components/erp/ErpDashboard';
import PurchaseRequestForm from './components/erp/PurchaseRequestForm';
import AdminApprovalDashboard from './components/erp/AdminApprovalDashboard';
import SuperAdminApprovalDashboard from './components/erp/SuperAdminApprovalDashboard';
import ItemManagement from './components/erp/ItemManagement';
import SalaryManagement from './components/erp/SalaryManagement';
import TaxManagement from './components/erp/TaxManagement';
import IntegratedFinanceDashboard from './components/erp/IntegratedFinanceDashboard';
import { SessionProvider } from './contexts/SessionContext';
import { useSession } from './contexts/SessionContext';
import { sessionManager } from './utils/sessionManager';
import duplicateLoginManager from './utils/duplicateLoginManager';
import DuplicateLoginAlert from './components/common/DuplicateLoginAlert';

// URL 쿼리 파라미터 처리 컴포넌트
function QueryParamHandler({ children, onLoginSuccess }) {
  const location = useLocation();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const loginStatus = searchParams.get('login');
    const message = searchParams.get('message');
    
    if (loginStatus === 'success' && message) {
      console.log('로그인 성공 메시지:', decodeURIComponent(message));
      
      // URL에서 쿼리 파라미터 제거
      const cleanUrl = location.pathname;
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      // 로그인 성공 콜백 호출
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, [location, onLoginSuccess]);
  
  return children;
}

// 실제 앱 컴포넌트 (SessionProvider 내부에서 사용)
function AppContent() {
  const { user, sessionInfo, isLoading, checkSession, logout } = useSession();
  
  // 통계 모달 상태
  const [showStatisticsModal, setShowStatisticsModal] = React.useState(false);
  
  // 중복 로그인 알림 상태
  const [showDuplicateLoginAlert, setShowDuplicateLoginAlert] = React.useState(false);

  // 콜백 함수로 메모이제이션
  const logMount = useCallback(() => {
    console.log('🚀 App 컴포넌트 마운트됨');
    console.log('🌐 현재 환경:', process.env.NODE_ENV);
    console.log('📱 React 버전:', React.version);
    console.log('🔗 라우터 초기화 완료');
    console.log('✅ MindGarden 앱 시작됨');
  }, []);

  const logUnmount = useCallback(() => {
    console.log('🚀 App 컴포넌트 언마운트됨');
  }, []);

  useEffect(() => {
    logMount();
    return logUnmount;
  }, []); // 의존성 배열을 비워서 한 번만 실행

  // 중복 로그인 체크 시작/중지 (개발 환경에서는 비활성화)
  useEffect(() => {
    // 개발 환경에서는 중복 로그인 체크 비활성화
    if (process.env.NODE_ENV === 'development') {
      console.log('🛑 개발 환경: 중복 로그인 체크 비활성화');
      duplicateLoginManager.forceStop();
      return;
    }

    if (user && sessionInfo) {
      console.log('🔍 중복 로그인 체크 시작');
      duplicateLoginManager.startChecking();
    } else {
      console.log('🛑 중복 로그인 체크 중지');
      duplicateLoginManager.stopChecking();
    }

    return () => {
      duplicateLoginManager.stopChecking();
    };
  }, [user, sessionInfo]);

  // 중복 로그인 이벤트 리스너
  useEffect(() => {
    const handleDuplicateLoginEvent = (event) => {
      console.log('⚠️ 중복 로그인 이벤트 수신:', event.detail);
      setShowDuplicateLoginAlert(true);
    };

    window.addEventListener('duplicateLoginDetected', handleDuplicateLoginEvent);

    return () => {
      window.removeEventListener('duplicateLoginDetected', handleDuplicateLoginEvent);
    };
  }, []);

  // 중복 로그인 알림 핸들러
  const handleDuplicateLoginConfirm = useCallback(() => {
    setShowDuplicateLoginAlert(false);
    duplicateLoginManager.forceLogout();
  }, []);

  const handleDuplicateLoginCancel = useCallback(() => {
    setShowDuplicateLoginAlert(false);
    // 취소 시에도 강제 로그아웃 (보안상 필요)
    duplicateLoginManager.forceLogout();
  }, []);

  const handleLogout = useCallback(() => {
    console.log('🚪 로그아웃 처리됨');
    logout();
  }, [logout]);

  const handleLoginSuccess = useCallback(() => {
    console.log('🔐 로그인 성공 처리됨');
    // 세션 재확인 전에 잠시 대기 (백엔드 세션 설정 완료 대기)
    setTimeout(() => {
      console.log('⏳ 세션 확인 시작...');
      checkSession();
    }, 1000); // 1초 대기
  }, [checkSession]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <Router>
      <QueryParamHandler onLoginSuccess={handleLoginSuccess}>
        <div className="App">
          <Toast />
          <Routes>
            <Route path="/" element={<TabletHomepage />} />
            <Route path="/login" element={<TabletLogin />} />
            <Route path="/register" element={<TabletRegister />} />
            
            {/* 일반 대시보드 라우트 */}
            <Route path="/dashboard" element={<CommonDashboard user={user} />} />
            
            {/* 역할별 대시보드 라우트 */}
            <Route path="/client/dashboard" element={<CommonDashboard user={user} />} />
            <Route path="/consultant/dashboard" element={<CommonDashboard user={user} />} />
            <Route path="/admin/dashboard" element={<AdminDashboard user={user} />} />
            <Route path="/super_admin/dashboard" element={<AdminDashboard user={user} />} />
            <Route path="/client/mypage" element={<MyPage />} />
            <Route path="/consultant/mypage" element={<MyPage />} />
            <Route path="/admin/mypage" element={<MyPage />} />
            
            {/* 상담사 전용 라우트 */}
            <Route path="/consultant/schedule" element={<ConsultantSchedule />} />
            <Route path="/consultant/consultation-record/:consultationId" element={<ConsultationRecordScreen />} />
            <Route path="/consultant/send-message/:consultationId" element={<ConsultantMessageScreen />} />
            <Route path="/consultant/clients" element={<ConsultantClientList />} />
            <Route path="/consultant/availability" element={<ConsultantAvailability />} />
            <Route path="/consultant/consultation-records" element={<ConsultantRecords />} />
            
            {/* 내담자 전용 라우트 */}
            <Route path="/client/messages" element={<ClientMessageScreen />} />
            
            {/* 상담 내역 및 리포트 라우트 (모든 사용자) */}
            <Route path="/consultation-history" element={<ConsultationHistory />} />
            <Route path="/consultation-report" element={<ConsultationReport />} />
            
            {/* 통합 스케줄 관리 라우트 */}
            <Route path="/schedule" element={<SchedulePage user={user} />} />
            <Route path="/admin/schedule" element={<SchedulePage user={user} />} />
            <Route path="/consultant/schedule-new" element={<SchedulePage user={user} />} />
            
            {/* 관리자 전용 라우트 */}
            <Route path="/admin/consultant-comprehensive" element={<ConsultantComprehensiveManagement />} />
            <Route path="/admin/client-comprehensive" element={<ClientComprehensiveManagement />} />
            <Route path="/admin/mapping-management" element={<MappingManagement />} />
            <Route path="/admin/common-codes" element={<CommonCodeManagement />} />
            <Route path="/admin/sessions" element={<SessionManagement />} />
            <Route path="/admin/accounts" element={<AccountManagement />} />
            <Route path="/admin/schedules" element={
              <SimpleLayout>
                <ScheduleCalendar 
                  userRole={user?.role || 'ADMIN'}
                  userId={user?.id || 1}
                />
              </SimpleLayout>
            } />
            <Route path="/admin/statistics" element={
              <SimpleLayout>
                <StatisticsDashboard 
                  userRole={user?.role || 'ADMIN'}
                  userId={user?.id || 1}
                />
              </SimpleLayout>
            } />
            <Route path="/admin/statistics-dashboard" element={
              <SimpleLayout>
                <StatisticsDashboard 
                  userRole={user?.role || 'ADMIN'}
                  userId={user?.id || 1}
                />
              </SimpleLayout>
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
            
            {/* 수퍼어드민 전용 라우트 */}
            <Route path="/super-admin/finance" element={<FinanceDashboard />} />
            <Route path="/super-admin/revenue" element={
              <ComingSoon 
                title="수익 관리"
                description="수익 관리 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            <Route path="/super-admin/expenses" element={
              <ComingSoon 
                title="지출 관리"
                description="지출 관리 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            <Route path="/super-admin/payments" element={<PaymentManagement />} />
            <Route path="/super-admin/finance-reports" element={
              <ComingSoon 
                title="재무 보고서"
                description="재무 보고서 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            <Route path="/super-admin/finance-settings" element={
              <ComingSoon 
                title="자금 설정"
                description="자금 설정 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            
            {/* ERP 라우트 */}
            <Route path="/erp/dashboard" element={<ErpDashboard />} />
            <Route path="/erp/purchase-requests" element={<PurchaseRequestForm />} />
            <Route path="/erp/finance-dashboard" element={<IntegratedFinanceDashboard />} />
            <Route path="/erp/approvals" element={<AdminApprovalDashboard />} />
            <Route path="/erp/super-approvals" element={<SuperAdminApprovalDashboard />} />
            <Route path="/erp/items" element={<ItemManagement />} />
            <Route path="/erp/budgets" element={
              <ComingSoon 
                title="예산 관리"
                description="예산 관리 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            <Route path="/erp/salary" element={<SalaryManagement />} />
            <Route path="/erp/tax" element={<TaxManagement />} />
            <Route path="/erp/orders" element={
              <ComingSoon 
                title="주문 관리"
                description="주문 관리 기능은 현재 개발 중입니다. 곧 출시될 예정입니다."
              />
            } />
            
            {/* OAuth2 콜백 처리 라우트 */}
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />
            
            {/* 테스트 페이지 라우트 */}
            <Route path="/test/notifications" element={<NotificationTest />} />
            <Route path="/test/payment" element={<PaymentTest />} />
            <Route path="/test/integration" element={<IntegrationTest />} />
            
            {/* 추후 홈페이지 추가 시 사용할 경로들 */}
            {/* <Route path="/homepage" element={<Homepage />} /> */}
            {/* <Route path="/desktop" element={<DesktopHomepage />} /> */}
            {/* catch-all 라우트 제거 (개발 중) */}
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </Routes>
          
          {/* 통계 모달 */}
          <StatisticsModal
            isOpen={showStatisticsModal}
            onClose={() => setShowStatisticsModal(false)}
            userRole={user?.role || 'ADMIN'}
          />
          
          {/* 중복 로그인 알림 */}
          <DuplicateLoginAlert
            isVisible={showDuplicateLoginAlert}
            onConfirm={handleDuplicateLoginConfirm}
            onCancel={handleDuplicateLoginCancel}
            countdown={5}
          />
        </div>
      </QueryParamHandler>
    </Router>
  );
}

// 최상위 App 컴포넌트 (SessionProvider 제공)
function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

// 개발자 도구용 전역 함수들
if (process.env.NODE_ENV === 'development') {
  window.clearSession = () => {
    sessionManager.forceClearSession();
    console.log('🧹 세션 강제 초기화 완료! 페이지를 새로고침하세요.');
  };
  
  window.clearLocalStorage = () => {
    sessionManager.clearLocalStorage();
    console.log('🧹 localStorage 정리 완료! 페이지를 새로고침하세요.');
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
  
  console.log('🔧 개발자 도구 함수 사용 가능:');
  console.log('  - clearSession(): 세션 강제 초기화 (서버+클라이언트)');
  console.log('  - clearLocalStorage(): localStorage만 정리');
  console.log('  - getSessionInfo(): 현재 세션 정보 확인');
}

export default App;
