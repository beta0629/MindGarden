import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  UserPlus, 
  Clock, 
  CalendarCheck, 
  ArrowRightCircle,
  CreditCard,
  Lightbulb,
  Users,
  Activity,
  HeartPulse,
  Book,
  ArrowRight,
  ClockIcon
} from 'lucide-react';
import WeatherCard from './WeatherCard';
import ConsultantListModal from '../common/ConsultantListModal';
import ConsultationGuideModal from '../common/ConsultationGuideModal';
import notificationManager from '../../utils/notification';
import '../../styles/mindgarden-design-system.css';
import './ClientPersonalizedMessages.css';

/**
 * 내담자 상태에 따른 맞춤형 메시지 컴포넌트
 * 매핑 상태, 상담 진행 상황, 결제 상태 등을 기반으로 동적 메시지 생성
 */
const ClientPersonalizedMessages = ({ user, consultationData, clientStatus }) => {
  const navigate = useNavigate();
  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);
  const [isConsultationGuideModalOpen, setIsConsultationGuideModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
    'book': Book
  };

  // 카드 클릭 핸들러
  const handleCardClick = (action) => {
    if (isLoading) return;
    
    setIsLoading(true);
    switch (action) {
      case 'schedule':
        notificationManager.show('상담 일정은 상담사가 관리합니다. 문의사항이 있으시면 메시지를 보내주세요.', 'info');
        setIsLoading(false);
        break;
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
      case 'welcome':
        navigate('/client/profile');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'pending':
        setIsLoading(false);
        break;
      case 'continue':
        notificationManager.show('상담 일정은 상담사가 관리합니다. 문의사항이 있으시면 메시지를 보내주세요.', 'info');
        setIsLoading(false);
        break;
      case 'general':
        navigate('/client/profile');
        setTimeout(() => setIsLoading(false), 100);
        break;
      case 'tip':
        setIsLoading(false);
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
      default:
        setIsLoading(false);
    }
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

    if (consultationData?.upcomingConsultations?.length > 0) {
      status.hasUpcomingConsultations = true;
    }

    if (consultationData?.completedConsultations?.length > 0) {
      status.hasCompletedConsultations = true;
    }

    if (clientStatus?.paymentStatus === 'PENDING') {
      status.hasPendingPayments = true;
    }

    if (user?.createdAt) {
      const joinDate = new Date(user.createdAt);
      const now = new Date();
      const daysSinceJoin = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
      status.isNewClient = daysSinceJoin <= 7;
    }

    if (consultationData?.recentActivities?.length > 0) {
      status.hasRecentActivity = true;
    }

    return status;
  };

  // 상태별 맞춤형 메시지 생성
  const generatePersonalizedMessages = (status) => {
    const messages = [];

    // 1. 상태별 주요 메시지
    if (status.isNewClient) {
      messages.push({
        id: 'welcome',
        icon: 'heart',
        title: '환영합니다!',
        subtitle: '마인드가든에 오신 것을 환영합니다. 첫 상담을 시작해보세요',
        colorClass: 'primary',
        action: 'welcome'
      });
    } else if (!status.hasMapping) {
      messages.push({
        id: 'no-mapping',
        icon: 'heart',
        title: '마음 건강 가이드',
        subtitle: '마음챙김과 명상으로 일상을 더 건강하게 만들어보세요',
        colorClass: 'primary',
        action: 'mindfulness-guide'
      });
    } else if (status.mappingStatus === 'PENDING') {
      messages.push({
        id: 'pending-mapping',
        icon: 'clock',
        title: '상담 준비 중',
        subtitle: '상담사 배정이 진행 중입니다. 곧 연락드릴게요',
        colorClass: 'info',
        action: 'pending'
      });
    } else if (status.hasUpcomingConsultations) {
      const nextConsultation = consultationData.upcomingConsultations[0];
      messages.push({
        id: 'upcoming-consultation',
        icon: 'calendar-check',
        title: '다가오는 상담',
        subtitle: `${nextConsultation.consultantName} 상담사와 ${new Date(nextConsultation.date).toLocaleDateString('ko-KR')} ${nextConsultation.startTime} 예정`,
        colorClass: 'success',
        action: 'session-status'
      });
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

    // 2. 결제 관련 메시지
    if (status.hasPendingPayments) {
      messages.push({
        id: 'payment-pending',
        icon: 'credit-card',
        title: '결제 확인',
        subtitle: '결제 승인을 기다리고 있습니다',
        colorClass: 'danger',
        action: 'payment'
      });
    } else {
      messages.push({
        id: 'today-tip',
        icon: 'lightbulb',
        title: '오늘의 팁',
        subtitle: getDailyTip(),
        colorClass: 'secondary',
        action: 'tip'
      });
    }

    // 3. 상담사 목록 또는 활동 메시지
    const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname === 'm-garden.co.kr';
    
    if (isProduction) {
      if (status.hasRecentActivity) {
        messages.push({
          id: 'recent-activity',
          icon: 'activity',
          title: '최근 활동',
          subtitle: '새로운 활동이 있습니다',
          colorClass: 'info',
          action: 'activity'
        });
      } else if (consultationData?.consultantList?.length > 0) {
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
      if (consultationData?.consultantList?.length > 0) {
        messages.push({
          id: 'consultant-list',
          icon: 'users',
          title: '상담사 목록',
          subtitle: `${consultationData.consultantList.length}명의 상담사가 있습니다`,
          colorClass: 'primary',
          action: 'consultants'
        });
      } else if (status.hasRecentActivity) {
        messages.push({
          id: 'recent-activity',
          icon: 'activity',
          title: '최근 활동',
          subtitle: '새로운 활동이 있습니다',
          colorClass: 'info',
          action: 'activity'
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
    }

    // 4. 추가 유용한 카드들
    messages.push({
      id: 'payment-history',
      icon: 'credit-card',
      title: '결제 내역',
      subtitle: '결제 내역과 패키지 정보를 확인하세요',
      colorClass: 'secondary',
      action: 'payment-history'
    });

    messages.push({
      id: 'consultation-guide',
      icon: 'book',
      title: '상담 가이드',
      subtitle: '상담 전 알아두면 좋은 정보들',
      colorClass: 'info',
      action: 'consultation-guide'
    });

    // 5. 날씨 정보
    messages.push({
      id: 'weather',
      isWeatherCard: true,
      component: <WeatherCard />
    });

    return messages;
  };

  // 일일 팁 생성
  const getDailyTip = () => {
    const tips = [
      '작은 변화가 큰 변화를 만듭니다',
      '오늘도 자신을 사랑해주세요',
      '감사한 마음을 가져보세요',
      '깊게 숨을 쉬어보세요',
      '긍정적인 생각을 해보세요',
      '자연과 함께하는 시간을 가져보세요',
      '좋아하는 음악을 들어보세요'
    ];
    
    const today = new Date().getDate();
    return tips[today % tips.length];
  };

  const clientStatusAnalysis = analyzeClientStatus();
  const personalizedMessages = generatePersonalizedMessages(clientStatusAnalysis);

  return (
    <div className="client-personalized-messages">
      {personalizedMessages.map((message) => {
        // 날씨 카드는 별도 컴포넌트로 렌더링
        if (message.isWeatherCard) {
          return (
            <div key={message.id}>
              {message.component}
            </div>
          );
        }

        const IconComponent = iconMap[message.icon];
        const isClickable = message.action && message.action !== 'tip' && message.action !== 'pending';

        return (
          <div
            key={message.id}
            className={`
              personalized-message-card 
              ${isClickable ? 'personalized-message-card--clickable' : ''} 
              ${isLoading ? 'personalized-message-card--loading' : ''}
              personalized-message-card--${message.colorClass}
            `}
            onClick={() => {
              if (isClickable && !isLoading) {
                handleCardClick(message.action);
              }
            }}
          >
            <div className="message-card-content">
              <div className={`message-card-icon message-card-icon--${message.colorClass}`}>
                {IconComponent && <IconComponent size={24} />}
              </div>
              
              <div className="message-card-text">
                <h3 className="message-card-title">
                  {message.title}
                </h3>
                
                <p className="message-card-subtitle">
                  {message.subtitle}
                </p>
                
                {isClickable && (
                  <div className={`message-card-action message-card-action--${message.colorClass}`}>
                    {isLoading ? (
                      <span className="message-card-action-text">
                        처리 중...
                      </span>
                    ) : (
                      <>
                        <span className="message-card-action-text">
                          자세히 보기
                        </span>
                        <ArrowRight size={14} className="message-card-action-icon" />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* 상담사 목록 모달 */}
      <ConsultantListModal
        isOpen={isConsultantModalOpen}
        onClose={() => setIsConsultantModalOpen(false)}
        consultantList={consultationData?.consultantList || []}
      />
      
      {/* 상담 가이드 모달 */}
      <ConsultationGuideModal
        isOpen={isConsultationGuideModalOpen}
        onClose={() => setIsConsultationGuideModalOpen(false)}
      />
    </div>
  );
};

export default ClientPersonalizedMessages;
