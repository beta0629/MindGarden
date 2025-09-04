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
import SchedulePage from './components/schedule/SchedulePage';
import ConsultantComprehensiveManagement from './components/admin/ConsultantComprehensiveManagement';
import ClientComprehensiveManagement from './components/admin/ClientComprehensiveManagement';
import SessionManagement from './components/admin/SessionManagement';
import MappingManagement from './components/admin/MappingManagement';
import CommonCodeManagement from './components/admin/CommonCodeManagement';
import SimpleLayout from './components/layout/SimpleLayout';
import Toast from './components/common/Toast';
import NotificationTest from './components/test/NotificationTest';
import { SessionProvider } from './contexts/SessionContext';
import { useSession } from './contexts/SessionContext';
import { sessionManager } from './utils/sessionManager';

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
            <Route path="/client/mypage" element={<MyPage />} />
            <Route path="/consultant/mypage" element={<MyPage />} />
            <Route path="/admin/mypage" element={<MyPage />} />
            
            {/* 상담사 전용 라우트 */}
            <Route path="/consultant/schedule" element={<ConsultantSchedule />} />
            
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
            
            {/* OAuth2 콜백 처리 라우트 */}
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />
            
            {/* 테스트 페이지 라우트 */}
            <Route path="/test/notifications" element={<NotificationTest />} />
            
            {/* 추후 홈페이지 추가 시 사용할 경로들 */}
            {/* <Route path="/homepage" element={<Homepage />} /> */}
            {/* <Route path="/desktop" element={<DesktopHomepage />} /> */}
            {/* catch-all 라우트 제거 (개발 중) */}
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </Routes>
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
