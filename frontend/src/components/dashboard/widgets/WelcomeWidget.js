/**
 * Welcome Widget
 * 환영 메시지와 사용자 정보를 표시하는 범용 위젯
 * WelcomeSection을 기반으로 범용화 (상담소 특화 기능 제거)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Widget.css';
import '../WelcomeSection.css';

const WelcomeWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [imageLoadError, setImageLoadError] = useState(false);
  
  const config = widget.config || {};
  
  // 프로필 이미지 URL 가져오기
  const getProfileImageUrl = () => {
    if (config.profileImageUrl && !imageLoadError) {
      return config.profileImageUrl;
    }
    if (user?.profileImageUrl && !imageLoadError) {
      return user.profileImageUrl;
    }
    if (user?.socialProfileImage && !imageLoadError) {
      return user.socialProfileImage;
    }
    // 기본 아바타 사용
    return config.defaultAvatar || '/default-avatar.svg';
  };
  
  // 사용자 이름 가져오기
  const getUserDisplayName = () => {
    if (config.displayName) {
      return config.displayName;
    }
    if (user?.name && !user.name.includes('==')) {
      return user.name;
    }
    if (user?.nickname && !user.nickname.includes('==')) {
      return user.nickname;
    }
    if (user?.username) {
      return user.username;
    }
    return config.defaultName || '사용자';
  };
  
  // 환영 메시지 가져오기
  const getWelcomeMessage = () => {
    if (config.welcomeMessage) {
      return config.welcomeMessage;
    }
    
    // 사용자 역할에 따른 기본 메시지
    const roleMessages = config.roleMessages || {
      'ADMIN': '관리자님, 환영합니다!',
      'CLIENT': '고객님, 환영합니다!',
      'CONSULTANT': '상담사님, 환영합니다!',
      'default': '환영합니다!'
    };
    
    const userRole = user?.role;
    return roleMessages[userRole] || roleMessages.default;
  };
  
  // 현재 시간 표시
  const getCurrentTime = () => {
    if (config.showTime !== false) {
      const now = new Date();
      return now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return null;
  };
  
  const profileImageUrl = getProfileImageUrl();
  const displayName = getUserDisplayName();
  const welcomeMessage = getWelcomeMessage();
  const currentTime = getCurrentTime();
  
  const handleCardClick = (action) => {
    if (action.url) {
      navigate(action.url);
    } else if (action.onClick) {
      action.onClick();
    }
  };
  
  return (
    <div className="widget widget-welcome">
      <div className="widget-header">
        <div className="welcome-section-container">
          <div className="welcome-section-profile">
            <div className="welcome-profile-image-wrapper">
              <img
                src={profileImageUrl}
                alt={displayName}
                className="welcome-profile-image"
                onError={() => setImageLoadError(true)}
              />
            </div>
            <div className="welcome-profile-info">
              <h2 className="welcome-title">
                {welcomeMessage.replace('{name}', displayName)}
              </h2>
              {currentTime && (
                <div className="welcome-time">{currentTime}</div>
              )}
            </div>
          </div>
          
          {config.quickCards && config.quickCards.length > 0 && (
            <div className="welcome-quick-cards">
              {config.quickCards.map((card, index) => (
                <div
                  key={index}
                  className="welcome-quick-card"
                  onClick={() => handleCardClick(card)}
                  style={{ cursor: card.url || card.onClick ? 'pointer' : 'default' }}
                >
                  {card.icon && (
                    <div className="welcome-card-icon">
                      <i className={`bi ${card.icon}`}></i>
                    </div>
                  )}
                  <div className="welcome-card-content">
                    <div className="welcome-card-title">{card.title}</div>
                    {card.description && (
                      <div className="welcome-card-description">{card.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeWidget;

