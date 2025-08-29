import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/index.css';
import TabletHomepage from './components/homepage/Homepage';
import TabletLogin from './components/auth/TabletLogin';
import TabletRegister from './components/auth/TabletRegister';
import OAuth2Callback from './components/auth/OAuth2Callback';
import CommonDashboard from './components/dashboard/CommonDashboard';
import MyPage from './components/mypage/MyPage';
import ConsultantSchedule from './components/consultant/ConsultantSchedule';
import TabletLayout from './components/layout/TabletLayout';
import { useSession } from './hooks/useSession';

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

function App() {
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
  }, [logMount, logUnmount]);

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
          <Routes>
            <Route path="/" element={<TabletHomepage />} />
            <Route path="/login" element={<TabletLogin />} />
            <Route path="/register" element={<TabletRegister />} />
            
            {/* 개발 중: 대시보드 라우트 항상 렌더링 */}
            <Route path="/client/dashboard" element={<TabletLayout user={user} onLogout={handleLogout}><CommonDashboard user={user} /></TabletLayout>} />
            <Route path="/consultant/dashboard" element={<TabletLayout user={user} onLogout={handleLogout}><CommonDashboard user={user} /></TabletLayout>} />
            <Route path="/admin/dashboard" element={<TabletLayout user={user} onLogout={handleLogout}><CommonDashboard user={user} /></TabletLayout>} />
            <Route path="/client/mypage" element={<TabletLayout user={user} onLogout={handleLogout}><MyPage /></TabletLayout>} />
            <Route path="/consultant/mypage" element={<TabletLayout user={user} onLogout={handleLogout}><MyPage /></TabletLayout>} />
            <Route path="/admin/mypage" element={<TabletLayout user={user} onLogout={handleLogout}><MyPage /></TabletLayout>} />
            
            {/* 상담사 전용 라우트 */}
            <Route path="/consultant/schedule" element={<TabletLayout user={user} onLogout={handleLogout}><ConsultantSchedule /></TabletLayout>} />
            
            {/* OAuth2 콜백 처리 라우트 */}
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />
            
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

export default App;
