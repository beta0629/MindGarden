import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { WELCOME_SECTION_CSS } from '../../constants/css';
import { DASHBOARD_MESSAGES } from '../../constants/dashboard';
import WeatherCard from './WeatherCard';
import '../../styles/main.css';
import './WelcomeSection.css';

const WelcomeSection = ({ user, currentTime, consultationData }) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const navigate = useNavigate();

  // 프로필 이미지 URL 가져오기
  const getProfileImageUrl = () => {
    if (!imageLoadError) {
      if (user?.profileImageUrl) {
        console.log('🖼️ 프로필 이미지 URL:', user.profileImageUrl);
        return user.profileImageUrl;
      }
      if (user?.socialProfileImage) {
        console.log('🖼️ 소셜 프로필 이미지 URL:', user.socialProfileImage);
        return user.socialProfileImage;
      }
    }
    // 기본 아바타 사용
    console.log('🖼️ 기본 아바타 사용');
    return null; // 이미지 없으면 null 반환
  };

  // 사용자 이름 가져오기
  const getUserDisplayName = () => {
    if (user?.name && !user.name.includes('==')) {
      return user.name;
    }
    if (user?.nickname && !user.nickname.includes('==')) {
      return user.nickname;
    }
    if (user?.username) {
      return user.username;
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
        return DASHBOARD_MESSAGES.WELCOME.ADMIN;
      default:
        console.log('⚠️ 알 수 없는 role:', user.role);
        return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
  };

  const profileImageUrl = getProfileImageUrl();
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
    switch (action) {
      case 'schedule':
        navigate('/consultant/schedule');
        break;
      case 'consultants':
        navigate('/consultant/consultant-list');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className={WELCOME_SECTION_CSS.CONTAINER}>
      <div className="welcome-card">
        <div className="welcome-profile">
          <div className="profile-avatar">
            <img 
              src={profileImageUrl} 
              alt="프로필 이미지" 
              className="profile-image"
              onError={() => setImageLoadError(true)}
            />
          </div>
          <div className="welcome-content">
            <h2 className="welcome-title">{getWelcomeTitle()}</h2>
            <p className="welcome-message">
              {displayName}님, 오늘도 좋은 하루 되세요!
            </p>
            <div className="welcome-time">
              <i className="bi bi-clock"></i>
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 내담자 전용 - 오늘의 상담 정보 (큰 카드) */}
      {user?.role === 'CLIENT' && (
        <div className="welcome-info-cards">
          <div className="welcome-info-card today-consultation-card">
            <div className="info-icon info-icon--consultation">
              <i className="bi bi-calendar-check"></i>
            </div>
            <div className="info-content">
              <h3 className="info-title">오늘의 상담</h3>
              <p className="info-value">
                {todayConsultations.length > 0 
                  ? (
                    <span>
                      <span style={{ fontSize: '1.2em', fontWeight: '700', color: 'var(--olive-green)' }}>{todayConsultations.length}</span>
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
                        {consultation.status === 'CONFIRMED' ? '확정' : consultation.status === 'BOOKED' ? '예약' : consultation.status}
                      </div>
                    </div>
                  ))}
                  
                  {/* 더 많은 상담이 있을 때 표시 */}
                  {todayConsultations.length > 3 && (
                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', background: 'var(--light-beige)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--medium-gray)' }}>
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
              <i className="bi bi-calendar-check"></i>
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
                            {consultation.status === 'CONFIRMED' ? '확정' : consultation.status === 'BOOKED' ? '예약' : consultation.status}
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
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--medium-gray)', fontSize: 'var(--font-size-sm)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                  <div>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📅</div>
                    <div>오늘 예정된 상담이 없습니다</div>
                  </div>
                </div>
              )}
              
              {/* 오늘 상담이 많을 때 자세히 보기 버튼 */}
              {todayConsultations.length > 4 && (
                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--light-beige)', width: '100%' }}>
                  <button 
                    onClick={() => handleCardClick('schedule')}
                    style={{ background: 'transparent', border: '1px solid var(--olive-green)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--olive-green)', fontSize: 'var(--font-size-xs)', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease', width: '100%' }}
                  >
                    +{todayConsultations.length - 4}건 더 보기
                  </button>
                </div>
              )}
            </div>
          </div>


          {/* 상담사 목록 */}
          {consultationData?.consultantList?.length > 0 && (
            <div 
              className="welcome-info-card"
              onClick={() => handleCardClick('consultants')}
              style={{ cursor: 'pointer' }}
            >
              <div className="info-icon info-icon--consultation">
                <i className="bi bi-people"></i>
              </div>
              <div className="info-content">
                <h3 className="info-title">상담사 목록</h3>
                <p className="info-value">
                  {consultationData.consultantList.length}명의 상담사가 있습니다
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--olive-green)', fontWeight: '500' }}>자세히 보기</span>
                  <i className="bi bi-arrow-right" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--olive-green)' }}></i>
                </div>
              </div>
            </div>
          )}
          
          {/* 오늘의 팁 */}
          <div className="welcome-info-card">
            <div className="info-icon info-icon--tip">
              <i className="bi bi-lightbulb"></i>
            </div>
            <div className="info-content">
              <h3 className="info-title">오늘의 팁</h3>
              <p className="info-value">작은 변화가 큰 변화를 만듭니다</p>
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
