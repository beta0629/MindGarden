/**
 * Personalized Messages Widget - 표준화된 맞춤형 메시지 위젯
 * ClientPersonalizedMessages를 위젯으로 변환 + 실제 API 연동
 * 
 * @author CoreSolution
 * @version 2.0.0 (위젯 표준화 업그레이드)
 * @since 2025-11-29
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, UserPlus, Clock, CalendarCheck, ArrowRightCircle,
  CreditCard, Lightbulb, Users, Activity, HeartPulse, Book,
  MessageSquare
} from 'lucide-react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { RoleUtils } from '../../../constants/roles';
import { DASHBOARD_API } from '../../../constants/api';
import { apiGet } from '../../../utils/ajax';
import ConsultantListModal from '../../common/ConsultantListModal';
import ConsultationGuideModal from '../../common/ConsultationGuideModal';
import notificationManager from '../../../utils/notification';
import './PersonalizedMessagesWidget.css';
import '../ClientPersonalizedMessages.css';

const PersonalizedMessagesWidget = ({ widget, user }) => {
  // 내담자 전용 위젯 (다른 역할은 표시하지 않음)
  if (!RoleUtils.isClient(user)) {
    return null;
  }

  // 데이터 소스 설정 (내담자 전용)
  const getDataSourceConfig = () => ({
    type: 'api',
    cache: true,
    refreshInterval: 120000, // 2분마다 새로고침
    url: '/api/schedules',
    params: {
      userId: user.id,
      userRole: 'CLIENT',
      includeConsultantInfo: true
    }
  });

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (상담 데이터)
  const {
    data: consultationData,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 추가 상태 관리
  const [clientStatus, setClientStatus] = useState(null);
  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);
  const [isConsultationGuideModalOpen, setIsConsultationGuideModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // 클라이언트 상태 로드 (별도 API)
  useEffect(() => {
    const loadClientStatus = async () => {
      if (!user?.id) return;
      
      try {
        const response = await apiGet(DASHBOARD_API.CLIENT_CONSULTANT_INFO, {
          userId: user.id
        });
        
        if (response?.success && response?.data) {
          setClientStatus({
            mappingStatus: response.data.mappingStatus || 'NONE',
            consultantInfo: response.data.consultantInfo || null
          });
        }
      } catch (error) {
        console.warn('⚠️ 클라이언트 상태 로드 실패:', error);
        setClientStatus({
          mappingStatus: 'NONE',
          consultantInfo: null
        });
      }
    };

    loadClientStatus();
  }, [user?.id]);

  // 아이콘 매핑
  const iconMap = {
    'heart': Heart,
    'user-plus': UserPlus,
    'clock': Clock,
    'calendar-check': CalendarCheck,
    'arrow-right-circle': ArrowRightCircle,
    'credit-card': CreditCard,
    'lightbulb': Lightbulb,
    'users': Users,
    'activity': Activity,
    'heart-pulse': HeartPulse,
    'book': Book,
    'message-square': MessageSquare
  };

  // 오늘의 팁 생성
  const getDailyTip = () => {
    const tips = [
      '하루 5분 명상으로 마음의 평화를 찾아보세요',
      '감사한 일 3가지를 떠올려보세요',
      '깊게 숨을 쉬며 현재에 집중해보세요',
      '자신에게 칭찬 한마디를 해주세요',
      '산책하며 자연의 소리에 귀 기울여보세요',
      '좋아하는 음악을 들으며 휴식을 취해보세요',
      '일기를 쓰며 하루를 정리해보세요'
    ];
    const today = new Date();
    const dayIndex = today.getDate() % tips.length;
    return tips[dayIndex];
  };

  // 내담자 상태 분석
  const analyzeClientStatus = () => {
    const status = {
      hasMapping: false,
      hasActiveMapping: false,
      hasUpcomingConsultations: false,
      hasCompletedConsultations: false,
      hasPendingPayments: false,
      isNewClient: false,
      hasRecentActivity: false,
      mappingStatus: 'NONE'
    };

    if (clientStatus?.mappingStatus) {
      status.hasMapping = true;
      status.mappingStatus = clientStatus.mappingStatus;
      status.hasActiveMapping = clientStatus.mappingStatus === 'ACTIVE';
    }

    if (consultationData?.schedules?.length > 0) {
      // 향후 상담 체크
      const futureConsultations = consultationData.schedules.filter(schedule => {
        const scheduleDate = new Date(`${schedule.date} ${schedule.startTime}`);
        return scheduleDate > new Date() && schedule.status === 'CONFIRMED';
      });
      status.hasUpcomingConsultations = futureConsultations.length > 0;

      // 완료된 상담 체크
      const completedConsultations = consultationData.schedules.filter(schedule => {
        return schedule.status === 'COMPLETED';
      });
      status.hasCompletedConsultations = completedConsultations.length > 0;
    }

    // 신규 사용자 체크
    const accountAge = user?.createdAt ? 
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
    status.isNewClient = accountAge < 7; // 7일 이내 가입

    return status;
  };

  // 맞춤형 메시지 생성
  const generatePersonalizedMessages = () => {
    if (!clientStatus) return [];

    const status = analyzeClientStatus();
    const messages = [];

    // 1. 상담 관련 메시지 (우선순위 높음)
    if (!status.hasMapping) {
      messages.push({
        id: 'consultant-mapping',
        icon: 'user-plus',
        title: '상담사 매칭',
        subtitle: '나에게 맞는 상담사를 찾아보세요',
        colorClass: 'primary',
        action: 'mapping'
      });
    } else if (status.hasUpcomingConsultations) {
      const nextConsultation = consultationData.schedules
        .filter(schedule => {
          const scheduleDate = new Date(`${schedule.date} ${schedule.startTime}`);
          return scheduleDate > new Date() && schedule.status === 'CONFIRMED';
        })
        .sort((a, b) => new Date(`${a.date} ${a.startTime}`) - new Date(`${b.date} ${b.startTime}`))[0];
      
      if (nextConsultation) {
        messages.push({
          id: 'upcoming-consultation',
          icon: 'calendar-check',
          title: '다가오는 상담',
          subtitle: `${nextConsultation.consultantName} 상담사와 ${new Date(nextConsultation.date).toLocaleDateString('ko-KR')} ${nextConsultation.startTime} 예정`,
          colorClass: 'success',
          action: 'session-status'
        });
      }
    } else if (status.hasActiveMapping && !status.hasUpcomingConsultations) {
      messages.push({
        id: 'session-management',
        icon: 'clock',
        title: '회기 관리',
        subtitle: '남은 회기와 사용 내역을 확인하세요',
        colorClass: 'success',
        action: 'session-status'
      });
    } else if (status.hasCompletedConsultations) {
      messages.push({
        id: 'continue-journey',
        icon: 'arrow-right-circle',
        title: '계속해서 성장해요',
        subtitle: '상담을 통해 더 나은 내일을 만들어가세요',
        colorClass: 'primary',
        action: 'continue'
      });
    } else {
      messages.push({
        id: 'healthy-mind',
        icon: 'heart',
        title: '건강한 마음',
        subtitle: '상담을 통해 더 나은 내일을 만들어가세요',
        colorClass: 'success',
        action: null
      });
    }

    // 2. 오늘의 팁 또는 결제 관련 메시지
    messages.push({
      id: 'today-tip',
      icon: 'lightbulb',
      title: '오늘의 팁',
      subtitle: getDailyTip(),
      colorClass: 'secondary',
      action: 'tip'
    });

    // 3. 상담사 목록 또는 활동 메시지
    const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname === 'm-garden.co.kr';
    
    if (isProduction) {
      if (consultationData?.consultantList?.length > 0) {
        messages.push({
          id: 'consultant-list',
          icon: 'users',
          title: '상담사 목록',
          subtitle: `${consultationData.consultantList.length}명의 상담사가 있습니다`,
          colorClass: 'primary',
          action: 'consultants'
        });
      } else {
        messages.push({
          id: 'wellness-reminder',
          icon: 'heart-pulse',
          title: '웰니스 알림',
          subtitle: '마음의 건강도 챙겨주세요',
          colorClass: 'warning',
          action: 'wellness'
        });
      }
    } else {
      // 개발 환경에서는 상담 가이드 메시지 추가
      messages.push({
        id: 'consultation-guide',
        icon: 'book',
        title: '상담 가이드',
        subtitle: '효과적인 상담을 위한 가이드를 확인해보세요',
        colorClass: 'info',
        action: 'consultation-guide'
      });
    }

    return messages;
  };

  // 카드 클릭 핸들러
  const handleCardClick = (action) => {
    if (isLoading) return;
    
    setIsLoading(true);
    switch (action) {
      case 'mapping':
        navigate('/client/consultant-mapping');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'payment':
        navigate('/client/payment');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'consultants':
        setIsConsultantModalOpen(true);
        setIsLoading(false);
        break;
      case 'activity':
        navigate('/client/activity-history');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'wellness':
        navigate('/client/wellness');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'mindfulness-guide':
        navigate('/client/mindfulness-guide');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'messages':
        navigate('/client/messages');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'session-status':
        navigate('/client/session-management');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'payment-history':
        navigate('/client/payment-history');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'consultation-guide':
        setIsConsultationGuideModalOpen(true);
        setIsLoading(false);
        break;
      case 'continue':
        notificationManager.show('상담 일정은 상담사가 관리합니다. 문의사항이 있으시면 메시지를 보내주세요.', 'info');
        setIsLoading(false);
        break;
      case 'schedule':
        notificationManager.show('상담 일정은 상담사가 관리합니다. 문의사항이 있으시면 메시지를 보내주세요.', 'info');
        setIsLoading(false);
        break;
      default:
        setIsLoading(false);
    }
  };

  // 메시지 생성
  const personalizedMessages = generatePersonalizedMessages();

  return (
    <>
      <BaseWidget
        widget={widget}
        user={user}
        loading={loading || !clientStatus}
        error={error}
        isEmpty={!personalizedMessages.length}
        onRefresh={refresh}
      >
        <div className="personalized-messages-widget-content">
          {personalizedMessages.map((message, index) => {
            const IconComponent = iconMap[message.icon] || MessageSquare;
            
            return (
              <div
                key={message.id}
                className={`personalized-message-card ${message.colorClass} ${message.action ? 'clickable' : ''}`}
                onClick={() => message.action && handleCardClick(message.action)}
                style={{ 
                  cursor: message.action ? 'pointer' : 'default',
                  opacity: isLoading ? 0.7 : 1 
                }}
              >
                <div className="message-icon">
                  <IconComponent size={24} />
                </div>
                <div className="message-content">
                  <h4 className="message-title">{message.title}</h4>
                  <p className="message-subtitle">{message.subtitle}</p>
                </div>
                {message.action && (
                  <div className="message-arrow">
                    <i className="bi bi-chevron-right"></i>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </BaseWidget>

      {/* 상담사 리스트 모달 */}
      <ConsultantListModal
        isOpen={isConsultantModalOpen}
        onClose={() => setIsConsultantModalOpen(false)}
        consultants={consultationData?.consultantList || []}
      />

      {/* 상담 가이드 모달 */}
      <ConsultationGuideModal
        isOpen={isConsultationGuideModalOpen}
        onClose={() => setIsConsultationGuideModalOpen(false)}
      />
    </>
  );
};

export default PersonalizedMessagesWidget;
