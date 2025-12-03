import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import MGButton from '../../components/common/MGButton'; // 임시 비활성화
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API, API_BASE_URL } from '../../constants/api';
import { 
  Heart, 
  Calendar, 
  MessageCircle, 
  CreditCard, 
  TrendingUp,
  Clock,
  CheckCircle,
  Sparkles,
  Sun
} from 'lucide-react';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import ClientPersonalizedMessages from '../dashboard/ClientPersonalizedMessages';
import ClientPaymentSessionsSection from '../dashboard/ClientPaymentSessionsSection';
import RatableConsultationsSection from './RatableConsultationsSection';
import ClientMessageSection from '../dashboard/ClientMessageSection';
import HealingCard from '../common/HealingCard';
import '../../styles/unified-design-tokens.css';
import '../../styles/dashboard-tokens-extension.css';
import '../../styles/dashboard-common-v3.css';
import '../../styles/themes/client-theme.css';
import './ClientDashboard.css';

/**
 * 내담자 대시보드
 * 화사하고 산뜻한 느낌의 디자인으로 구성
 */
const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  
  // sessionManager로 직접 확인
  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();
  
  // 세션 재확인 (SNS 로그인 시 세션이 로드되지 않는 경우)
  useEffect(() => {
    // 컴포넌트가 마운트된 후 한 번만 실행
    let isMounted = true;
    
    const checkAndRestoreSession = async () => {
      // URL 파라미터에서 OAuth 정보 확인
      const urlParams = new URLSearchParams(window.location.search);
      const oauth = urlParams.get('oauth');
      
      if (oauth === 'success') {
        console.log('🔗 OAuth 로그인 성공, URL 파라미터에서 사용자 정보 복원...');
        
        const userInfo = {
          id: parseInt(urlParams.get('userId')) || 0,
          email: urlParams.get('email') || '',
          name: decodeURIComponent(urlParams.get('name') || ''),
          nickname: decodeURIComponent(urlParams.get('nickname') || ''),
          role: urlParams.get('role') || 'CLIENT',
          profileImageUrl: decodeURIComponent(urlParams.get('profileImage') || ''),
          provider: urlParams.get('provider') || 'UNKNOWN'
        };
        
        console.log('✅ URL 파라미터에서 사용자 정보:', userInfo);
        
        // sessionManager에 사용자 정보 설정
        sessionManager.setUser(userInfo, {
          accessToken: 'oauth2_token',
          refreshToken: 'oauth2_refresh_token'
        });
        
        // URL 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 컴포넌트가 아직 마운트되어 있으면 새로고침
        if (isMounted) {
          console.log('🔄 세션 복원 완료, 페이지 새로고침...');
          window.location.reload();
        }
        return;
      }
      
      // localStorage에 사용자 정보가 있는지 확인
      const storedUser = localStorage.getItem('userInfo');
      
      if (storedUser) {
        console.log('📦 localStorage에서 사용자 정보 발견, 세션 복원 시도...');
        try {
          const userInfo = JSON.parse(storedUser);
          console.log('✅ localStorage 사용자 정보:', userInfo);
          
          // sessionManager에 사용자 정보 설정
          sessionManager.setUser(userInfo, {
            accessToken: userInfo.accessToken || 'local_token',
            refreshToken: userInfo.refreshToken || 'local_refresh_token'
          });
          
          // 컴포넌트가 아직 마운트되어 있으면 새로고침
          if (isMounted) {
            console.log('🔄 세션 복원 완료, 페이지 새로고침...');
            window.location.reload();
          }
          return;
        } catch (error) {
          console.error('❌ localStorage 사용자 정보 파싱 실패:', error);
        }
      }
      
      // localStorage에 정보가 없으면 아무것도 하지 않고 대기
      console.log('⏳ localStorage에 사용자 정보가 없음, 세션 로딩 대기 중...');
    };
    
    // 세션이 아직 로드되지 않았을 때만 세션 재확인
    if (!sessionIsLoggedIn && !sessionUser) {
      console.log('⏳ 세션이 로드되지 않음, 세션 재확인 시작...');
      
      // 약간의 지연 후 세션 확인 (백엔드 리다이렉트 완료 대기)
      const timer = setTimeout(() => {
        checkAndRestoreSession();
      }, 500);
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [sessionIsLoggedIn, sessionUser]);
  
  const [currentTime, setCurrentTime] = useState('');
  const [consultationData, setConsultationData] = useState({
    todaySchedules: [],
    weeklySchedules: [],
    upcomingSchedules: [],
    completedCount: 0,
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0
  });
  const [clientStatus, setClientStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 현재 시간 업데이트
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const period = hours < 12 ? '오전' : '오후';
      const displayHours = hours % 12 || 12;
      setCurrentTime(`${period} ${displayHours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 내담자 데이터 로드
  const loadClientData = useCallback(async () => {
    // sessionUser 또는 user 둘 중 하나라도 있으면 진행
    const currentUser = sessionUser || user;
    if (!currentUser?.id) {
      return;
    }

    try {
      setIsLoading(true);

      // 스케줄 데이터 로드
      const scheduleResponse = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
        userId: currentUser.id,
        userRole: 'CLIENT'
      });

      // 매핑 정보 로드 (실제 회기 수를 가져오기 위해)
      const mappingResponse = await apiGet(`/api/admin/mappings/client?clientId=${currentUser.id}`);

      let totalSessions = 0;
      let usedSessions = 0;
      let remainingSessions = 0;

      // 매핑 정보에서 실제 회기 수 계산
      if (mappingResponse?.success && mappingResponse?.data) {
        const activeMappings = mappingResponse.data.filter(mapping => mapping.status === 'ACTIVE');
        totalSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
        usedSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.usedSessions || 0), 0);
        remainingSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.remainingSessions || 0), 0);
      }

      if (scheduleResponse?.success && scheduleResponse?.data) {
        const schedules = scheduleResponse.data;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 오늘의 상담
        const todaySchedules = schedules.filter(s => s.date === todayStr);

        // 이번 주 상담
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        
        const weeklySchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
        });

        // 다가오는 상담
        const upcomingSchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate > today && schedule.status === 'CONFIRMED';
        }).slice(0, 3);

        // 완료된 상담 수
        const completedCount = schedules.filter(s => s.status === 'COMPLETED').length;

        setConsultationData({
          todaySchedules,
          weeklySchedules,
          upcomingSchedules,
          completedCount,
          totalSessions, // 매핑 정보에서 가져온 값
          usedSessions, // 매핑 정보에서 가져온 값
          remainingSessions // 매핑 정보에서 가져온 값 (실제 구매한 회기 수)
        });
      } else {
        // 스케줄 정보가 없어도 회기 정보는 표시
        setConsultationData(prev => ({
          ...prev,
          totalSessions,
          usedSessions,
          remainingSessions
        }));
      }

    } catch (error) {
      console.error('❌ 내담자 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, sessionUser?.id]);

  useEffect(() => {
    // 세션이 로딩 중이면 대기
    if (sessionLoading) {
      return;
    }
    
    // sessionManager로 직접 확인
    const currentUser = sessionUser || user;
    const currentIsLoggedIn = sessionIsLoggedIn || isLoggedIn;
    
    if (currentIsLoggedIn && currentUser?.id) {
      loadClientData();
    }
  }, [sessionLoading, sessionIsLoggedIn, sessionUser?.id, user?.id, loadClientData]);

  // 로딩 상태 또는 로그인하지 않은 경우
  const currentUser = sessionUser || user;
  const currentIsLoggedIn = sessionIsLoggedIn || isLoggedIn;
  
  // 세션 로딩 중이거나, 세션이 아직 로드되지 않았거나, 사용자 정보가 없으면 로딩 표시
  if (isLoading || sessionLoading || !currentIsLoggedIn || !currentUser?.id) {
    return (
      <SimpleLayout>
        <div className="mg-v2-dashboard-layout">
          <div className="mg-loading">로딩중...</div>
        </div>
      </SimpleLayout>
    );
  }

  // 인사말 메시지
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후에요';
    return '좋은 저녁이에요';
  };

  return (
    <SimpleLayout>
      <div className="mg-v2-dashboard-layout">
        
        {/* 웰컴 헤더 - 화사하고 밝은 느낌 */}
        <div className="mg-v2-client-dashboard-header">
          <div className="mg-v2-dashboard-header-content">
            <div className="mg-v2-flex mg-align-center mg-gap-md">
              <div className="mg-v2-dashboard-icon">
                <Sun size={32} />
              </div>
              <div>
                <h1 className="mg-v2-h1">
                  {getGreeting()}, <span className="mg-v2-color-primary">{currentUser?.name}</span>님!
                </h1>
                <p className="mg-v2-text-sm mg-v2-color-text-secondary mg-mt-xs">
                  <Sparkles size={16} className="mg-v2-mr-xs" />
                  오늘도 마음 건강을 위한 한 걸음을 함께해요
                </p>
              </div>
            </div>
            <div className="mg-v2-flex mg-align-center mg-gap-sm">
              <Clock size={18} />
              <span className="mg-v2-text-sm">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* 주요 통계 카드 - 밝고 화사한 색상 */}
        <div className="client-dashboard__stats">
          <div className="client-dashboard__stat-card client-dashboard__stat-card--primary">
            <div className="client-dashboard__stat-icon">
              <Calendar />
            </div>
            <div className="client-dashboard__stat-content">
              <div className="client-dashboard__stat-value">
                {consultationData.todaySchedules.length}
              </div>
              <div className="client-dashboard__stat-label">오늘의 상담</div>
            </div>
          </div>

          <div className="client-dashboard__stat-card client-dashboard__stat-card--success">
            <div className="client-dashboard__stat-icon">
              <CheckCircle />
            </div>
            <div className="client-dashboard__stat-content">
              <div className="client-dashboard__stat-value">
                {consultationData.completedCount}
              </div>
              <div className="client-dashboard__stat-label">완료한 상담</div>
            </div>
          </div>

          <div className="client-dashboard__stat-card client-dashboard__stat-card--info">
            <div className="client-dashboard__stat-icon">
              <TrendingUp />
            </div>
            <div className="client-dashboard__stat-content">
              <div className="client-dashboard__stat-value">
                {consultationData.weeklySchedules.length}
              </div>
              <div className="client-dashboard__stat-label">이번 주 상담</div>
            </div>
          </div>

          <div className="client-dashboard__stat-card client-dashboard__stat-card--warning">
            <div className="client-dashboard__stat-icon">
              <Heart />
            </div>
            <div className="client-dashboard__stat-content">
              <div className="client-dashboard__stat-value">
                {consultationData.remainingSessions}
              </div>
              <div className="client-dashboard__stat-label">남은 회기</div>
            </div>
          </div>
        </div>

        {/* 다가오는 상담 일정 */}
        {consultationData.upcomingSchedules.length > 0 && (
          <div className="client-dashboard__section">
            <div className="client-dashboard__section-header">
              <h2 className="client-dashboard__section-title">
                <Calendar size={24} />
                다가오는 상담 일정
              </h2>
            </div>
            <div className="client-dashboard__schedule-list">
              {consultationData.upcomingSchedules.map((schedule, index) => (
                <div key={index} className="client-dashboard__schedule-item">
                  <div className="client-dashboard__schedule-date">
                    <div className="client-dashboard__schedule-day">
                      {new Date(schedule.date).getDate()}
                    </div>
                    <div className="client-dashboard__schedule-month">
                      {new Date(schedule.date).toLocaleDateString('ko-KR', { month: 'short' })}
                    </div>
                  </div>
                  <div className="client-dashboard__schedule-info">
                    <h3 className="client-dashboard__schedule-title">{schedule.title}</h3>
                    <p className="client-dashboard__schedule-time">
                      <Clock size={14} />
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                  </div>
                  <div className="client-dashboard__schedule-status">
                    <span className="mg-badge mg-badge-success">예정</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 맞춤형 메시지 */}
        <ClientPersonalizedMessages 
          user={user}
          consultationData={consultationData}
          clientStatus={clientStatus}
        />

        {/* 결제 및 회기 현황 */}
        <ClientPaymentSessionsSection userId={currentUser?.id} />

        {/* 상담사 평가 */}
        <RatableConsultationsSection />

        {/* 오늘의 힐링 카드 */}
        <HealingCard userRole="CLIENT" />

        {/* 빠른 액션 버튼 */}
        <div className="client-dashboard__quick-actions">
          <h2 className="client-dashboard__section-title">빠른 메뉴</h2>
          <div className="client-dashboard__action-grid">
            <button 
              className="mg-button mg-button--primary client-dashboard__action-btn"
              onClick={() => navigate('/client/schedule')}
            >
              <Calendar size={24} />
              <span>상담 일정</span>
            </button>
            <button 
              className="mg-button mg-button--success client-dashboard__action-btn"
              onClick={() => navigate('/client/messages')}
            >
              <MessageCircle size={24} />
              <span>메시지</span>
            </button>
            <button 
              className="mg-button mg-button--info client-dashboard__action-btn"
              onClick={() => navigate('/client/payment-history')}
            >
              <CreditCard size={24} />
              <span>결제 내역</span>
            </button>
            <button 
              className="mg-button mg-button--warning client-dashboard__action-btn"
              onClick={() => navigate('/client/settings')}
            >
              <Heart size={24} />
              <span>내 정보</span>
            </button>
          </div>
        </div>

        {/* 메시지 섹션 */}
        <ClientMessageSection userId={currentUser?.id} />
      </div>
    </SimpleLayout>
  );
};

export default ClientDashboard;

