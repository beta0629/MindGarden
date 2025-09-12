import React, { useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { WELCOME_SECTION_CSS } from '../../constants/css';
import { DASHBOARD_MESSAGES } from '../../constants/dashboard';
import './WelcomeSection.css';

const WelcomeSection = ({ user, currentTime, consultationData }) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  // 프로필 이미지 URL 가져오기
  const getProfileImageUrl = () => {
    if (user?.profileImageUrl && !imageLoadError) {
      return user.profileImageUrl;
    }
    if (user?.socialProfileImage && !imageLoadError) {
      return user.socialProfileImage;
    }
    // 기본 아바타 사용
    return '/default-avatar.svg';
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
    console.log('🎭 WelcomeSection - 사용자 정보:', user);
    console.log('🎭 WelcomeSection - role:', user?.role);
    
    if (!user?.role) {
      console.log('⚠️ role 정보 없음, 기본 인사말 사용');
      return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
    
    switch (user.role) {
      case 'CLIENT':
        return DASHBOARD_MESSAGES.WELCOME.CLIENT;
      case 'CONSULTANT':
        return DASHBOARD_MESSAGES.WELCOME.CONSULTANT;
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return DASHBOARD_MESSAGES.WELCOME.ADMIN;
      default:
        console.log('⚠️ 알 수 없는 role:', user.role);
        return DASHBOARD_MESSAGES.WELCOME.DEFAULT;
    }
  };

  const profileImageUrl = getProfileImageUrl();
  const displayName = getUserDisplayName();

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
            <div className="info-icon">
              <i className="bi bi-calendar-check"></i>
            </div>
            <div className="info-content">
              <h3 className="info-title">오늘의 상담</h3>
              <p className="info-value">
                {consultationData?.upcomingConsultations?.length > 0 
                  ? `${consultationData.upcomingConsultations.length}건의 상담이 예정되어 있습니다`
                  : '오늘 예정된 상담이 없습니다'
                }
              </p>
              {consultationData?.upcomingConsultations?.length > 0 && (
                <div className="consultation-details">
                  {consultationData.upcomingConsultations.slice(0, 2).map((consultation, index) => (
                    <div key={index} className="consultation-item">
                      <div className="consultation-time">
                        {new Date(consultation.date).toLocaleDateString('ko-KR')} {consultation.startTime} - {consultation.endTime}
                      </div>
                      <div className="consultation-consultant">
                        {consultation.consultantName} 상담사
                      </div>
                      <div className="consultation-status">
                        {consultation.status === 'CONFIRMED' ? '확정' : consultation.status === 'BOOKED' ? '예약' : consultation.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상담사/관리자용 정보 카드 */}
      {user?.role !== 'CLIENT' && (
        <div className="welcome-info-cards">
          <div className="welcome-info-card">
            <div className="info-icon">
              <i className="bi bi-calendar-check"></i>
            </div>
            <div className="info-content">
              <h3 className="info-title">오늘의 일정</h3>
              <p className="info-value">
                {consultationData?.upcomingConsultations?.length > 0 
                  ? `${consultationData.upcomingConsultations.length}건의 상담이 예정되어 있습니다`
                  : '오늘 예정된 상담이 없습니다'
                }
              </p>
            </div>
          </div>
          
          <div className="welcome-info-card">
            <div className="info-icon">
              <i className="bi bi-heart"></i>
            </div>
            <div className="info-content">
              <h3 className="info-title">건강한 마음</h3>
              <p className="info-value">상담을 통해 더 나은 내일을 만들어가세요</p>
            </div>
          </div>
          
          <div className="welcome-info-card">
            <div className="info-icon">
              <i className="bi bi-lightbulb"></i>
            </div>
            <div className="info-content">
              <h3 className="info-title">오늘의 팁</h3>
              <p className="info-value">작은 변화가 큰 변화를 만듭니다</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeSection;
