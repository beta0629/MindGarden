import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { WIDGET_CONSTANTS } from '../../constants/widgetConstants';
import { sessionManager } from '../../utils/sessionManager';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
import { normalizeApiListPayload, normalizeScheduleListPayload } from '../../utils/apiResponseNormalize';
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
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection, ContentKpiRow } from '../dashboard-v2/content';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import ClientPersonalizedMessages from '../dashboard/ClientPersonalizedMessages';
import ClientPaymentSessionsSection from '../dashboard/ClientPaymentSessionsSection';
import RatableConsultationsSection from './RatableConsultationsSection';
import ClientMessageSection from '../dashboard/ClientMessageSection';
import HealingCard from '../common/HealingCard';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/dashboard-tokens-extension.css';
import '../../styles/themes/client-theme.css';
import SafeText from '../common/SafeText';
import './ClientDashboard.css';

const CLIENT_DASHBOARD_TITLE_ID = 'client-dashboard-page-title';

/**
 * 내담자 대시보드 — 화사하고 산뜻한 느낌의 디자인
 * 세션(sessionManager / SessionContext) 우선, App 라우트의 user prop은 보조 소스.
 */
const ClientDashboard = ({ user: userFromRoute }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading, checkSession } = useSession();
  
  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();
  
  useEffect(() => {
    let isMounted = true;
    
    const checkAndRestoreSession = async() => {
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
        
        sessionManager.setUser(userInfo, {
          accessToken: 'oauth2_token',
          refreshToken: 'oauth2_refresh_token'
        });
        
        // URL 파라미터 제거 (무한 루프 방지) — 전체 새로고침 없이 세션 컨텍스트 동기화
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        if (isMounted) {
          console.log('🔄 세션 복원 완료, 중앙 세션 동기화...');
          await checkSession(true);
        }
        return;
      }
      
      const storedUser = localStorage.getItem('userInfo');
      
      if (storedUser) {
        console.log('📦 localStorage에서 사용자 정보 발견, 세션 복원 시도...');
        try {
          const userInfo = JSON.parse(storedUser);
          console.log('✅ localStorage 사용자 정보:', userInfo);
          
          sessionManager.setUser(userInfo, {
            accessToken: userInfo.accessToken || 'local_token',
            refreshToken: userInfo.refreshToken || 'local_refresh_token'
          });
          
          if (isMounted) {
            console.log('🔄 세션 복원 완료, 중앙 세션 동기화...');
            await checkSession(true);
          }
          return;
        } catch (error) {
          console.error('❌ localStorage 사용자 정보 파싱 실패:', error);
        }
      }
      
      console.log('⏳ localStorage에 사용자 정보가 없음, 세션 로딩 대기 중...');
    };
    
    if (!sessionIsLoggedIn && !sessionUser) {
      console.log('⏳ 세션이 로드되지 않음, 세션 재확인 시작...');
      
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
  }, [sessionIsLoggedIn, sessionUser, checkSession]);
  
  const [currentTime, setCurrentTime] = useState('');
  const [consultationData, setConsultationData] = useState({
    todaySchedules: [],
    weeklySchedules: [],
    upcomingSchedules: [],
    upcomingConsultations: [],
    completedConsultations: [],
    completedCount: 0,
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0
  });
  const [clientStatus, setClientStatus] = useState(null);
  /** 결제·회기 섹션과 KPI 공유 — apiGet 래핑 해제 후 배열만 전달 */
  const [sharedClientMappings, setSharedClientMappings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const loadClientData = useCallback(async() => {
    const currentUser = sessionUser || user || userFromRoute;
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const scheduleRaw = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
        userId: currentUser.id,
        userRole: 'CLIENT'
      });
      const schedules = normalizeScheduleListPayload(scheduleRaw);

      const mappingRaw = await apiGet(`/api/v1/admin/mappings/client?clientId=${currentUser.id}`);
      const mappings = normalizeApiListPayload(mappingRaw);
      setSharedClientMappings(mappings);

      let totalSessions = 0;
      let usedSessions = 0;
      let remainingSessions = 0;

      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      const activeMappings = mappings.filter(mapping => mapping.status === 'ACTIVE');
      totalSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
      usedSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.usedSessions || 0), 0);
      remainingSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.remainingSessions || 0), 0);

      const hasActive = mappings.some(m => m.status === 'ACTIVE');
      const hasPending = mappings.some(m => m.status === 'PENDING');
      const mappingStatus = mappings.length === 0
        ? 'NONE'
        : (hasActive ? 'ACTIVE' : (hasPending ? 'PENDING' : (mappings[0].status || 'NONE')));
      setClientStatus({
        mappingStatus,
        paymentStatus: mappings.some(m => m.paymentStatus === 'PENDING') ? 'PENDING' : null
      });

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const todaySchedules = schedules.filter(s => s.date === todayStr);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

      const weeklySchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
      });

      const upcomingSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        return scheduleDate > today && schedule.status === 'CONFIRMED';
      }).slice(0, WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS);

      const completedList = schedules.filter(s => s.status === 'COMPLETED');
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      const completedCount = completedList.length;

      setConsultationData({
        todaySchedules,
        weeklySchedules,
        upcomingSchedules,
        upcomingConsultations: upcomingSchedules,
        completedConsultations: completedList,
        completedCount,
        totalSessions,
        usedSessions,
        remainingSessions
      });

    } catch (error) {
      console.error('❌ 내담자 데이터 로드 실패:', error);
      setSharedClientMappings([]);
      setClientStatus({ mappingStatus: 'NONE', paymentStatus: null });
      setConsultationData({
        todaySchedules: [],
        weeklySchedules: [],
        upcomingSchedules: [],
        upcomingConsultations: [],
        completedConsultations: [],
        completedCount: 0,
        totalSessions: 0,
        usedSessions: 0,
        remainingSessions: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, sessionUser?.id, userFromRoute?.id]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    
    const currentUser = sessionUser || user || userFromRoute;
    const currentIsLoggedIn = sessionIsLoggedIn || isLoggedIn;
    
    if (currentIsLoggedIn && currentUser?.id) {
      loadClientData();
    }
  }, [sessionLoading, sessionIsLoggedIn, sessionUser?.id, user?.id, userFromRoute?.id, loadClientData]);

  const currentUser = sessionUser || user || userFromRoute;
  const currentIsLoggedIn = sessionIsLoggedIn || isLoggedIn;

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="내담자 대시보드">
          <ContentHeader
            title="내 대시보드"
            subtitle="오늘의 상담·회기·메시지를 한곳에서 확인하세요."
            titleId={CLIENT_DASHBOARD_TITLE_ID}
          />
          <main aria-labelledby={CLIENT_DASHBOARD_TITLE_ID}>{body}</main>
        </ContentArea>
      </div>
    </div>
  );

  if (isLoading || sessionLoading || !currentIsLoggedIn || !currentUser?.id) {
    return (
      <AdminCommonLayout title="대시보드">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="대시보드를 불러오는 중..." />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후에요';
    return '좋은 저녁이에요';
  };

  return (
    <AdminCommonLayout title="대시보드" className="mg-v2-dashboard-layout">
      <ContentArea ariaLabel="내담자 대시보드">
        <ContentHeader
          title="내 대시보드"
          subtitle={
            <>
              <Sparkles size={16} className="mg-v2-mr-xs" aria-hidden />
              {getGreeting()},{' '}
              <span className="mg-v2-color-primary">
                <SafeText>{currentUser?.name}</SafeText>
              </span>
              {' '}
              님 · 오늘도 마음 건강을 위한 한 걸음을 함께해요
            </>
          }
          titleId={CLIENT_DASHBOARD_TITLE_ID}
          actions={(
            <div className="mg-v2-flex mg-align-center mg-gap-sm">
              <Sun size={24} aria-hidden />
              <Clock size={18} aria-hidden />
              <span className="mg-v2-text-sm">{currentTime}</span>
            </div>
          )}
        />

        {/* 주요 통계 카드 - 밝고 화사한 색상 (표준화 원칙: 모든 카드에 링크 필수) */}
        <ContentKpiRow items={[
          {
            id: 'todaySchedules',
            icon: <Calendar size={28} />,
            label: '오늘의 상담',
            value: consultationData.todaySchedules.length,
            iconVariant: 'blue',
            onClick: () => navigate('/client/schedule')
          },
          {
            id: 'completedCount',
            icon: <CheckCircle size={28} />,
            label: '완료한 상담',
            value: consultationData.completedCount,
            iconVariant: 'green',
            onClick: () => navigate('/client/session-management')
          },
          {
            id: 'weeklySchedules',
            icon: <TrendingUp size={28} />,
            label: '이번 주 상담',
            value: consultationData.weeklySchedules.length,
            iconVariant: 'orange',
            onClick: () => navigate('/client/schedule')
          },
          {
            id: 'remainingSessions',
            icon: <Heart size={28} />,
            label: '남은 회기',
            value: consultationData.remainingSessions,
            iconVariant: 'gray',
            onClick: () => navigate('/client/session-management')
          }
        ]} />

        {/* 다가오는 상담 일정 */}
        {consultationData.upcomingSchedules.length > 0 && (
          <ContentSection
            title="다가오는 상담 일정"
            titleIcon={<Calendar size={24} />}
          >
            <div className="client-dashboard__schedule-list">
              {consultationData.upcomingSchedules.map((schedule, index) => (
                <div 
                  key={index} 
                  className="client-dashboard__schedule-item clickable"
                  onClick={() => navigate('/client/schedule')}
                  title="상담 상세 보기"
                >
                  <div className="client-dashboard__schedule-date">
                    <div className="client-dashboard__schedule-day">
                      {new Date(schedule.date).getDate()}
                    </div>
                    <div className="client-dashboard__schedule-month">
                      {new Date(schedule.date).toLocaleDateString('ko-KR', { month: 'short' })}
                    </div>
                  </div>
                  <div className="client-dashboard__schedule-info">
                    <SafeText tag="h3" className="client-dashboard__schedule-title">{schedule.title}</SafeText>
                    <p className="client-dashboard__schedule-time">
                      <Clock size={14} />
                      <SafeText>{schedule.startTime}</SafeText> - <SafeText>{schedule.endTime}</SafeText>
                    </p>
                  </div>
                  <div className="client-dashboard__schedule-status">
                    <span className="mg-badge mg-badge-success">예정</span>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>
        )}

        {/* 맞춤형 메시지 */}
        <ClientPersonalizedMessages 
          user={currentUser}
          consultationData={consultationData}
          clientStatus={clientStatus}
        />

        {/* 결제 및 회기 현황 — 상위에서 로드한 매핑 배열 재사용(이중 호출 방지) */}
        <ClientPaymentSessionsSection
          userId={currentUser?.id}
          supplyMappingsFromParent
          parentMappings={sharedClientMappings}
        />

        {/* 상담사 평가 */}
        <RatableConsultationsSection sessionUserOverride={currentUser} />

        {/* 오늘의 힐링 카드 */}
        <HealingCard userRole="CLIENT" />

        {/* 빠른 액션 버튼 */}
        <ContentSection title="빠른 메뉴">
          <div className="client-dashboard__action-grid">
            <MGButton
              variant="primary"
              className={`${buildErpMgButtonClassName({ variant: 'primary', loading: false })} client-dashboard__action-btn`}
              onClick={() => navigate('/client/schedule')}
              preventDoubleClick={false}
            >
              <span>상담 일정</span>
            </MGButton>
            <MGButton
              variant="success"
              className={`${buildErpMgButtonClassName({ variant: 'success', loading: false })} client-dashboard__action-btn`}
              onClick={() => navigate('/client/messages')}
              preventDoubleClick={false}
            >
              <span>메시지</span>
            </MGButton>
            <MGButton
              variant="info"
              className={`${buildErpMgButtonClassName({ variant: 'info', loading: false })} client-dashboard__action-btn`}
              onClick={() => navigate('/client/payment-history')}
              preventDoubleClick={false}
            >
              <span>결제 내역</span>
            </MGButton>
            <MGButton
              variant="warning"
              className={`${buildErpMgButtonClassName({ variant: 'warning', loading: false })} client-dashboard__action-btn`}
              onClick={() => navigate('/client/settings')}
              preventDoubleClick={false}
            >
              <span>내 정보</span>
            </MGButton>
          </div>
        </ContentSection>

        {/* 메시지 섹션 */}
        <ClientMessageSection userId={currentUser?.id} />
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ClientDashboard;

