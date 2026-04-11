import React, { useState } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { WELCOME_SECTION_CSS } from '../../constants/css';
import { DASHBOARD_MESSAGES } from '../../constants/dashboard';
import { RoleUtils } from '../../constants/roles';
import WeatherCard from './WeatherCard';
import { getStatusLabel } from '../../utils/colorUtils';
import Avatar from '../common/Avatar';
import MGButton from '../common/MGButton';
import '../../styles/main.css';
import './WelcomeSection.css';

const WelcomeSection = ({ user, currentTime, consultationData }) => {
  const navigate = useNavigate();

  // 사용자 이름 가져오기 (legacy:: = 복호화 실패한 암호문 → 표시하지 않음)
  const getUserDisplayName = () => {
    const isEncryptedRaw = (s) => !s || s.includes('==') || s.startsWith('legacy::');
    if (user?.name && !isEncryptedRaw(user.name)) return user.name;
    if (user?.nickname && !isEncryptedRaw(user.nickname)) return user.nickname;
    if (user?.userId) {
      return user.userId;
    }
    return '사용자';
  };

  const getWelcomeTitle = () => {
    if (!user?.role) {
      return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
    
    switch (user.role) {
      case 'CLIENT':
        return DASHBOARD_MESSAGES.WELCOME.CLIENT;
      case 'CONSULTANT':
        return DASHBOARD_MESSAGES.WELCOME.CONSULTANT;
      case 'ADMIN':
      case 'BRANCH_SUPER_ADMIN':
      case 'HQ_MASTER':
        return DASHBOARD_MESSAGES.WELCOME.ADMIN;
      default:
        console.log('⚠️ 알 수 없는 role:', user.role);
        return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
  };

  const profileImageUrl = user?.profileImageUrl || user?.socialProfileImage;
  const displayName = getUserDisplayName();

  // 오늘 날짜의 상담만 필터링
  const getTodayConsultations = () => {
    if (!consultationData?.upcomingConsultations) return [];
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    return consultationData.upcomingConsultations.filter(consultation => {
      const consultationDate = new Date(consultation.date);
      const consultationDateString = consultationDate.toISOString().split('T')[0];
      return consultationDateString === todayString;
    });
  };

  const todayConsultations = getTodayConsultations();

  // 카드 클릭 핸들러
  const handleCardClick = (action) => {
    console.log('🎯 카드 클릭:', action);
    switch (action) {
      case 'schedule':
        navigate('/consultant/schedule');
        break;
      case 'session-progress':
        navigate('/client/session-management');
        break;
      case 'mindfulness-guide':
        console.log('🧘 마음건강 가이드 클릭 - /client/mindfulness-guide로 이동');
        navigate('/client/mindfulness-guide');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className={WELCOME_SECTION_CSS.CONTAINER}>
      <div className="welcome-card">
        <div className="welcome-profile">
          <Avatar
            profileImageUrl={profileImageUrl}
            displayName={displayName}
            className="profile-avatar"
          />
          <div className="welcome-content">
            <h2 className="welcome-title">{getWelcomeTitle()}</h2>
            <p className="welcome-message">
              {displayName}님, 오늘도 좋은 하루 되세요!
            </p>
            <div className="welcome-time">
              <i className="bi bi-clock" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 내담자 전용 - 오늘의 상담 정보 (큰 카드) */}
      {RoleUtils.isClient(user) && (
        <div className="welcome-info-cards">
          <div className="welcome-info-card today-consultation-card">
            <div className="info-icon info-icon--consultation">
              <i className="bi bi-calendar-check" />
            </div>
            <div className="info-content">
              <h3 className="info-title">오늘의 상담</h3>
              <p className="info-value">
                {todayConsultations.length > 0 
                  ? (
                    <span>
                      <span className="mg-v2-text-lg mg-v2-font-weight-bold mg-text-olive-green">{todayConsultations.length}</span>
                      건의 상담이 오늘 예정되어 있습니다
                    </span>
                  )
                  : '오늘 예정된 상담이 없습니다'
                }
              </p>
              {todayConsultations.length > 0 && (
                <div className="consultation-cards-grid">
                  {todayConsultations.slice(0, 3).map((consultation, index) => (
                    <div key={index} className="consultation-card">
                      <div className="consultation-date-time">
                        {new Date(consultation.date).toLocaleDateString('ko-KR')} {consultation.startTime} - {consultation.endTime}
                      </div>
                      <div className="consultation-consultant-name">
                        {consultation.consultantName} 상담사
                      </div>
                      <div className={`consultation-status-badge consultation-status-badge--${consultation.status.toLowerCase()}`}>
                        {getStatusLabel(consultation.status)}
                      </div>
                    </div>
                  ))}
                  
                  {/* 더 많은 상담이 있을 때 표시 */}
                  {todayConsultations.length > 3 && (
                    <div className="mg-v2-text-center mg-v2-text-sm mg-v2-card mg-v2-card--outlined mg-v2-mt-sm mg-v2-p-sm">
                      +{todayConsultations.length - 3}건의 추가 상담이 있습니다
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상담사/관리자용 정보 카드 */}
      {user?.role !== 'CLIENT' && (
        <div className="welcome-info-cards">
          {/* 오늘의 상담 - 큰 카드 */}
          <div className="welcome-info-card today-consultation-card">
            <div className="info-icon info-icon--consultation">
              <i className="bi bi-calendar-check" />
            </div>
            <div className="info-content">
              <h3 className="info-title">오늘의 상담</h3>
              <p className="info-value">
                {todayConsultations.length > 0 
                  ? (
                    <span>
                      <span className="consultation-count">{todayConsultations.length}</span>
                      건의 상담이 오늘 예정되어 있습니다
                    </span>
                  )
                  : '오늘 예정된 상담이 없습니다'
                }
              </p>
              {todayConsultations.length > 0 ? (
                <div className="consultation-cards-grid">
                  {todayConsultations.map((consultation, index) => (
                    <div key={index} className="consultation-card">
                      <div>
                        <div className="consultation-header">
                          <div className="consultation-time">
                            {consultation.startTime} - {consultation.endTime}
                          </div>
                          <div className={`consultation-status consultation-status--${consultation.status.toLowerCase()}`}>
                            {getStatusLabel(consultation.status)}
                          </div>
                        </div>
                        <div className="consultation-consultant">
                          <span className="consultation-icon">👤</span>
                          {consultation.consultantName} 상담사
                        </div>
                        {consultation.clientName && (
                          <div className="consultation-client">
                            <span className="consultation-icon">👥</span>
                            {consultation.clientName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                </div>
              ) : (
                <div className="mg-v2-flex-1 mg-d-flex mg-align-center mg-justify-center mg-text-center mg-v2-p-lg">
                  <div>
                    <div className="mg-v2-text-3xl mg-v2-mb-md">📅</div>
                    <div>오늘 예정된 상담이 없습니다</div>
                  </div>
                </div>
              )}
              
              {/* 오늘 상담이 많을 때 자세히 보기 버튼 */}
              {todayConsultations.length > 4 && (
                <div className="mg-text-center mg-v2-mt-md mg-v2-pt-md mg-v2-w-full" style={{ borderTop: '1px solid var(--light-beige)' }}>
                  <MGButton
                    variant="outline"
                    fullWidth
                    onClick={() => handleCardClick('schedule')}
                    className="mg-v2-w-full"
                  >
                    +{todayConsultations.length - 4}건 더 보기
                  </MGButton>
                </div>
              )}
            </div>
          </div>


          {/* 나의 상담 진행률 */}
          {consultationData?.totalSessions > 0 && (
            <div 
              className="welcome-info-card welcome-info-card--clickable"
              onClick={() => handleCardClick('session-progress')}
            >
              <div className="info-icon info-icon--progress">
                <i className="bi bi-graph-up-arrow" />
              </div>
              <div className="info-content">
                <h3 className="info-title">나의 상담 진행률</h3>
                <p className="info-value">
                  {consultationData.completedSessions || 0}회 / {consultationData.totalSessions}회 완료
                </p>
                <div className="info-action">
                  <span className="info-action-text">자세히 보기</span>
                  <i className="bi bi-arrow-right" />
                </div>
              </div>
            </div>
          )}
          
          {/* 마음챙김 가이드 */}
          <div 
            className="welcome-info-card welcome-info-card--clickable"
            onClick={() => handleCardClick('mindfulness-guide')}
          >
            <div className="info-icon info-icon--mindfulness">
              <i className="bi bi-heart-pulse" />
            </div>
            <div className="info-content">
              <h3 className="info-title">마음건강 가이드</h3>
              <p className="info-value">호흡법과 명상으로 마음을 돌봐요</p>
              <div className="info-action">
                <span className="info-action-text">가이드 보기</span>
                <i className="bi bi-arrow-right" />
              </div>
            </div>
          </div>

          {/* 오늘의 날씨 */}
          <div className="weather-card-wrapper">
            <WeatherCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeSection;
