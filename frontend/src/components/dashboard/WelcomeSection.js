import React, { useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
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
    return null;
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
    if (!user?.role) return '안녕하세요!';
    
    switch (user.role) {
      case 'CLIENT':
        return '안녕하세요, 내담자님!';
      case 'CONSULTANT':
        return '안녕하세요, 상담사님!';
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '안녕하세요, 관리자님!';
      default:
        return '안녕하세요!';
    }
  };

  const profileImageUrl = getProfileImageUrl();
  const displayName = getUserDisplayName();

  return (
    <div className="welcome-section">
      <div className="welcome-card">
        <div className="welcome-profile">
          <div className="profile-avatar">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt="프로필 이미지" 
                className="profile-image"
                onError={() => setImageLoadError(true)}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            ) : (
              <i className="bi bi-person-circle profile-icon"></i>
            )}
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
    </div>
  );
};

export default WelcomeSection;
