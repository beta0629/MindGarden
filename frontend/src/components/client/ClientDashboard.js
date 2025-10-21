import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
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
import UnifiedLoading from '../common/UnifiedLoading';
import ClientPersonalizedMessages from '../dashboard/ClientPersonalizedMessages';
import ClientPaymentSessionsSection from '../dashboard/ClientPaymentSessionsSection';
import RatableConsultationsSection from './RatableConsultationsSection';
import ClientMessageSection from '../dashboard/ClientMessageSection';
import '../../styles/mindgarden-design-system.css';
import './ClientDashboard.css';

/**
 * 내담자 대시보드
 * 화사하고 산뜻한 느낌의 디자인으로 구성
 */
const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
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
    if (!user?.id) return;

    try {
      setIsLoading(true);
      console.log('📊 내담자 데이터 로드 시작');

      // 스케줄 데이터 로드
      const scheduleResponse = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
        userId: user.id,
        userRole: 'CLIENT'
      });

      // 매핑 정보 로드 (실제 회기 수를 가져오기 위해)
      const mappingResponse = await apiGet(`/api/admin/mappings/client?clientId=${user.id}`);

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
  }, [user?.id]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadClientData();
    }
  }, [isLoggedIn, user?.id, loadClientData]);

  // 로딩 상태 또는 로그인하지 않은 경우
  if (sessionLoading || isLoading || !isLoggedIn || !user?.id) {
    return (
      <SimpleLayout>
        <div className="mg-dashboard-layout">
          <UnifiedLoading text="대시보드를 불러오는 중..." />
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
      <div className="mg-dashboard-layout client-dashboard">
        
        {/* 웰컴 헤더 - 화사하고 밝은 느낌 */}
        <div className="client-dashboard__welcome">
          <div className="client-dashboard__welcome-content">
            <div className="client-dashboard__welcome-icon">
              <Sun size={32} />
            </div>
            <div className="client-dashboard__welcome-text">
              <h1 className="client-dashboard__greeting">
                {getGreeting()}, <span className="client-dashboard__name">{user?.name}</span>님!
              </h1>
              <p className="client-dashboard__subtitle">
                <Sparkles size={16} />
                오늘도 마음 건강을 위한 한 걸음을 함께해요
              </p>
            </div>
            <div className="client-dashboard__time">
              <Clock size={18} />
              <span>{currentTime}</span>
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
        <ClientPaymentSessionsSection userId={user?.id} />

        {/* 상담사 평가 */}
        <RatableConsultationsSection />

        {/* 빠른 액션 버튼 */}
        <div className="client-dashboard__quick-actions">
          <h2 className="client-dashboard__section-title">빠른 메뉴</h2>
          <div className="client-dashboard__action-grid">
            <button 
              className="client-dashboard__action-btn client-dashboard__action-btn--primary"
              onClick={() => navigate('/client/schedule')}
            >
              <Calendar size={24} />
              <span>상담 일정</span>
            </button>
            <button 
              className="client-dashboard__action-btn client-dashboard__action-btn--success"
              onClick={() => navigate('/client/messages')}
            >
              <MessageCircle size={24} />
              <span>메시지</span>
            </button>
            <button 
              className="client-dashboard__action-btn client-dashboard__action-btn--info"
              onClick={() => navigate('/client/payment-history')}
            >
              <CreditCard size={24} />
              <span>결제 내역</span>
            </button>
            <button 
              className="client-dashboard__action-btn client-dashboard__action-btn--warning"
              onClick={() => navigate('/client/settings')}
            >
              <Heart size={24} />
              <span>내 정보</span>
            </button>
          </div>
        </div>

        {/* 메시지 섹션 */}
        <ClientMessageSection userId={user?.id} />
      </div>
    </SimpleLayout>
  );
};

export default ClientDashboard;

