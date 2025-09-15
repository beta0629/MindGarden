import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import WeatherCard from './WeatherCard';
import ConsultantListModal from '../common/ConsultantListModal';

/**
 * 내담자 상태에 따른 맞춤형 메시지 컴포넌트
 * 매핑 상태, 상담 진행 상황, 결제 상태 등을 기반으로 동적 메시지 생성
 */
const ClientPersonalizedMessages = ({ user, consultationData, clientStatus }) => {
  const navigate = useNavigate();
  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);
  
  // 카드 클릭 핸들러
  const handleCardClick = (action) => {
    switch (action) {
      case 'schedule':
        // 상담 일정은 상담사가 관리하므로 메시지로 안내
        alert('상담 일정은 상담사가 관리합니다. 문의사항이 있으시면 메시지를 보내주세요.');
        break;
      case 'mapping':
        navigate('/client/consultant-mapping');
        break;
      case 'payment':
        navigate('/client/payment');
        break;
      case 'consultants':
        setIsConsultantModalOpen(true);
        break;
      case 'activity':
        navigate('/client/activity');
        break;
      case 'welcome':
        navigate('/client/profile');
        break;
      case 'pending':
        // 대기 상태에서는 아무것도 하지 않음
        break;
      case 'continue':
        // 상담 일정은 상담사가 관리하므로 메시지로 안내
        alert('상담 일정은 상담사가 관리합니다. 문의사항이 있으시면 메시지를 보내주세요.');
        break;
      case 'general':
        navigate('/client/profile');
        break;
      case 'tip':
        // 팁은 클릭해도 아무것도 하지 않음
        break;
      case 'wellness':
        navigate('/client/wellness');
        break;
      case 'messages':
        navigate('/client/messages');
        break;
      case 'session-status':
        // 회기 관리 상세 페이지로 이동
        navigate('/client/session-management');
        break;
      case 'payment-history':
        // 결제 내역 상세 페이지로 이동
        navigate('/client/payment-history');
        break;
      case 'consultation-guide':
        // 상담 가이드 페이지로 이동 (향후 구현)
        alert('상담 가이드 페이지는 준비 중입니다.');
        break;
      default:
        console.log('Unknown action:', action);
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

    // 매핑 상태 확인
    if (clientStatus?.mappingStatus) {
      status.hasMapping = true;
      status.mappingStatus = clientStatus.mappingStatus;
      status.hasActiveMapping = clientStatus.mappingStatus === 'ACTIVE';
    }

    // 상담 일정 확인
    if (consultationData?.upcomingConsultations?.length > 0) {
      status.hasUpcomingConsultations = true;
    }

    if (consultationData?.completedConsultations?.length > 0) {
      status.hasCompletedConsultations = true;
    }

    // 결제 상태 확인 (클라이언트 상태에서)
    if (clientStatus?.paymentStatus === 'PENDING') {
      status.hasPendingPayments = true;
    }

    // 신규 내담자 확인 (가입일 기준)
    if (user?.createdAt) {
      const joinDate = new Date(user.createdAt);
      const now = new Date();
      const daysSinceJoin = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
      status.isNewClient = daysSinceJoin <= 7;
    }

    // 최근 활동 확인
    if (consultationData?.recentActivities?.length > 0) {
      status.hasRecentActivity = true;
    }

    return status;
  };

  // 상태별 맞춤형 메시지 생성
  const generatePersonalizedMessages = (status) => {
    const messages = [];

    // 1. 상태별 주요 메시지 (1개만 선택)
    if (status.isNewClient) {
      messages.push({
        id: 'welcome',
        icon: 'bi-heart',
        title: '환영합니다!',
        subtitle: 'MindGarden에 오신 것을 환영합니다. 첫 상담을 시작해보세요',
        color: '#e91e63',
        action: 'welcome'
      });
    } else if (!status.hasMapping) {
      messages.push({
        id: 'no-mapping',
        icon: 'bi-person-plus',
        title: '상담사 연결',
        subtitle: '상담사를 연결하여 상담을 시작해보세요',
        color: '#ff9800',
        action: 'mapping'
      });
    } else if (status.mappingStatus === 'PENDING') {
      messages.push({
        id: 'pending-mapping',
        icon: 'bi-clock',
        title: '연결 대기중',
        subtitle: '상담사 연결이 승인 대기 중입니다. 곧 연락드릴게요',
        color: '#ffc107',
        action: 'pending'
      });
    } else if (status.hasUpcomingConsultations) {
      const nextConsultation = consultationData.upcomingConsultations[0];
      messages.push({
        id: 'upcoming-consultation',
        icon: 'bi-calendar-check',
        title: '다가오는 상담',
        subtitle: `${nextConsultation.consultantName} 상담사와 ${new Date(nextConsultation.date).toLocaleDateString('ko-KR')} ${nextConsultation.startTime} 예정`,
        color: '#28a745',
        action: 'session-status'
      });
    } else if (status.hasActiveMapping && !status.hasUpcomingConsultations) {
      messages.push({
        id: 'session-management',
        icon: 'bi-clock-history',
        title: '회기 관리',
        subtitle: '남은 회기와 사용 내역을 확인하세요',
        color: '#28a745',
        action: 'session-status'
      });
    } else if (status.hasCompletedConsultations) {
      messages.push({
        id: 'continue-journey',
        icon: 'bi-arrow-right-circle',
        title: '계속해서 성장해요',
        subtitle: '상담을 통해 더 나은 내일을 만들어가세요',
        color: '#9c27b0',
        action: 'continue'
      });
    } else {
      messages.push({
        id: 'healthy-mind',
        icon: 'bi-heart',
        title: '건강한 마음',
        subtitle: '상담을 통해 더 나은 내일을 만들어가세요',
        color: '#4caf50',
        action: null
      });
    }

    // 2. 결제 관련 메시지
    if (status.hasPendingPayments) {
      messages.push({
        id: 'payment-pending',
        icon: 'bi-credit-card',
        title: '결제 확인',
        subtitle: '결제 승인을 기다리고 있습니다',
        color: '#ff5722',
        action: 'payment'
      });
    } else {
      messages.push({
        id: 'today-tip',
        icon: 'bi-lightbulb',
        title: '오늘의 팁',
        subtitle: getDailyTip(),
        color: '#607d8b',
        action: 'tip'
      });
    }

    // 3. 상담사 목록 또는 활동 메시지
    if (consultationData?.consultantList?.length > 0) {
      messages.push({
        id: 'consultant-list',
        icon: 'bi-people',
        title: '상담사 목록',
        subtitle: `${consultationData.consultantList.length}명의 상담사가 있습니다`,
        color: '#3f51b5',
        action: 'consultants'
      });
    } else if (status.hasRecentActivity) {
      messages.push({
        id: 'recent-activity',
        icon: 'bi-activity',
        title: '최근 활동',
        subtitle: '새로운 활동이 있습니다',
        color: '#00bcd4',
        action: 'activity'
      });
    } else {
      messages.push({
        id: 'wellness-reminder',
        icon: 'bi-heart-pulse',
        title: '웰니스 알림',
        subtitle: '마음의 건강도 챙겨주세요',
        color: '#ff9800',
        action: 'wellness'
      });
    }

    // 4. 내담자 전용 유용한 카드들 추가
    messages.push({
      id: 'session-status',
      icon: 'bi-clock-history',
      title: '회기 현황',
      subtitle: '남은 회기와 사용 내역을 확인하세요',
      color: '#28a745',
      action: 'session-status'
    });

    messages.push({
      id: 'payment-history',
      icon: 'bi-credit-card',
      title: '결제 내역',
      subtitle: '결제 내역과 패키지 정보를 확인하세요',
      color: '#6f42c1',
      action: 'payment-history'
    });

    messages.push({
      id: 'consultation-guide',
      icon: 'bi-book',
      title: '상담 가이드',
      subtitle: '상담 전 알아두면 좋은 정보들',
      color: '#17a2b8',
      action: 'consultation-guide'
    });

    // 4. 날씨 정보는 별도 컴포넌트로 추가
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

  // 상태 분석 및 메시지 생성
  const clientStatusAnalysis = analyzeClientStatus();
  const personalizedMessages = generatePersonalizedMessages(clientStatusAnalysis);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    }}>
      {personalizedMessages.map((message) => {
        // 날씨 카드는 별도 컴포넌트로 렌더링
        if (message.isWeatherCard) {
          return (
            <div key={message.id}>
              {message.component}
            </div>
          );
        }

        // 일반 메시지 카드 렌더링
        return (
          <div
            key={message.id}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              cursor: message.action && message.action !== 'tip' && message.action !== 'pending' ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (message.action && message.action !== 'tip' && message.action !== 'pending') {
                handleCardClick(message.action);
              }
            }}
            onMouseEnter={(e) => {
              if (message.action && message.action !== 'tip' && message.action !== 'pending') {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: message.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <i className={`bi ${message.icon}`} style={{
                  color: 'white',
                  fontSize: '20px'
                }}></i>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: '0 0 8px 0',
                  lineHeight: '1.3'
                }}>
                  {message.title}
                </h3>
                
                <p style={{
                  fontSize: '14px',
                  color: '#6c757d',
                  margin: '0',
                  lineHeight: '1.5'
                }}>
                  {message.subtitle}
                </p>
                
                {message.action && message.action !== 'tip' && message.action !== 'pending' && (
                  <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: message.color,
                      fontWeight: '500'
                    }}>
                      자세히 보기
                    </span>
                    <i className="bi bi-arrow-right" style={{
                      fontSize: '12px',
                      color: message.color
                    }}></i>
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
    </div>
  );
};

export default ClientPersonalizedMessages;
