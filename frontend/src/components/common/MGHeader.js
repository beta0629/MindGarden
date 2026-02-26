/**
 * MindGarden 공통 헤더 컴포넌트
/**
 * 네비게이션과 사용자 메뉴를 포함한 통합 헤더
 */

import React, { useState } from 'react';
import Avatar from './Avatar';
// 헤더 스타일은 main.css를 통해 _header.css에서 중앙화되어 로드됨

const MGHeader = ({
  logo = 'CoreSolution',
  user = null,
  notifications = 0,
  onLogoClick = null,
  onUserMenuClick = null,
  onNotificationClick = null,
  className = '',
  ...props
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsNotificationOpen(false);
  };

  const handleNotificationToggle = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsUserMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserMenuOpen(false);
    setIsNotificationOpen(false);
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <header className={`mg-header ${className}`} {...props}>
      <div className="mg-header__container">
        {/* 로고 */}
        <div className="mg-header__logo" onClick={handleLogoClick}>
          <div className="mg-header__logo-icon">🌱</div>
          <span className="mg-header__logo-text">{logo}</span>
        </div>

        {/* 데스크톱 네비게이션 */}
        <nav className="mg-header__nav mg-header__nav--desktop">
          <a href="/dashboard" className="mg-header__nav-item active">
            대시보드
          </a>
          <a href="/sessions" className="mg-header__nav-item">
            세션 관리
          </a>
          <a href="/users" className="mg-header__nav-item">
            사용자 관리
          </a>
          <a href="/analytics" className="mg-header__nav-item">
            분석
          </a>
        </nav>

        {/* 모바일 햄버거 메뉴 버튼 */}
        <button 
          className="mg-header__mobile-menu-button"
          onClick={handleMobileMenuToggle}
          aria-label="메뉴 열기"
        >
          <span className={`mg-header__hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* 사용자 액션 */}
        <div className="mg-header__actions">
          {/* 알림 */}
          <button 
            className="mg-header__notification"
            onClick={handleNotificationToggle}
          >
            <span className="mg-header__notification-icon">🔔</span>
            {notifications > 0 && (
              <span className="mg-header__notification-badge">
                {notifications > 99 ? '99+' : notifications}
              </span>
            )}
          </button>

          {/* 사용자 메뉴 */}
          <div className="mg-header__user-menu">
            <button 
              className="mg-header__user-button"
              onClick={handleUserMenuToggle}
            >
              <Avatar
                profileImageUrl={user?.avatar || user?.profileImageUrl}
                displayName={user?.name || '사용자'}
                className="mg-header__user-avatar"
              />
              <span className="mg-header__user-name">
                {user?.name || '사용자'}
              </span>
              <span className="mg-header__user-arrow">▼</span>
            </button>

            {/* 드롭다운 메뉴 */}
            {isUserMenuOpen && (
              <div className="mg-header__user-dropdown">
                <div className="mg-header__user-info">
                  <Avatar
                    profileImageUrl={user?.avatar || user?.profileImageUrl}
                    displayName={user?.name || '사용자'}
                    className="mg-header__user-avatar-large"
                  />
                  <div className="mg-header__user-details">
                    <div className="mg-header__user-name-large">
                      {user?.name || '사용자'}
                    </div>
                    <div className="mg-header__user-email">
                      {user?.email || 'user@mindgarden.com'}
                    </div>
                  </div>
                </div>
                <div className="mg-header__user-menu-items">
                  <a href="/profile" className="mg-header__menu-item">
                    <span className="mg-header__menu-icon">👤</span>
                    프로필
                  </a>
                  <a href="/settings" className="mg-header__menu-item">
                    <span className="mg-header__menu-icon">⚙️</span>
                    설정
                  </a>
                  <a href="/help" className="mg-header__menu-item">
                    <span className="mg-header__menu-icon">❓</span>
                    도움말
                  </a>
                  <div className="mg-header__menu-divider"></div>
                  <button className="mg-header__menu-item mg-header__menu-item--logout">
                    <span className="mg-header__menu-icon">🚪</span>
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 알림 드롭다운 */}
          {isNotificationOpen && (
            <div className="mg-header__notification-dropdown">
              <div className="mg-header__notification-header">
                <h3>알림</h3>
                <button className="mg-header__notification-mark-all">
                  모두 읽음
                </button>
              </div>
              <div className="mg-header__notification-list">
                <div className="mg-header__notification-item">
                  <div className="mg-header__notification-item-icon">💬</div>
                  <div className="mg-header__notification-item-content">
                    <div className="mg-header__notification-item-title">
                      새로운 상담 요청
                    </div>
                    <div className="mg-header__notification-item-time">
                      5분 전
                    </div>
                  </div>
                </div>
                <div className="mg-header__notification-item">
                  <div className="mg-header__notification-item-icon">✅</div>
                  <div className="mg-header__notification-item-content">
                    <div className="mg-header__notification-item-title">
                      상담 완료
                    </div>
                    <div className="mg-header__notification-item-time">
                      1시간 전
                    </div>
                  </div>
                </div>
                <div className="mg-header__notification-item">
                  <div className="mg-header__notification-item-icon">📊</div>
                  <div className="mg-header__notification-item-content">
                    <div className="mg-header__notification-item-title">
                      월간 리포트 생성 완료
                    </div>
                    <div className="mg-header__notification-item-time">
                      2시간 전
                    </div>
                  </div>
                </div>
              </div>
              <div className="mg-header__notification-footer">
                <a href="/notifications">모든 알림 보기</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className={`mg-header__mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <nav className="mg-header__nav mg-header__nav--mobile">
          <a href="/dashboard" className="mg-header__nav-item active">
            대시보드
          </a>
          <a href="/sessions" className="mg-header__nav-item">
            세션 관리
          </a>
          <a href="/users" className="mg-header__nav-item">
            사용자 관리
          </a>
          <a href="/analytics" className="mg-header__nav-item">
            분석
          </a>
        </nav>
        
        {/* 모바일 사용자 정보 */}
        {user && (
          <div className="mg-header__mobile-user">
            <Avatar
              profileImageUrl={user?.avatar || user?.profileImageUrl}
              displayName={user?.name || '사용자'}
              className="mg-header__user-avatar"
            />
            <div className="mg-header__user-info">
              <div className="mg-header__user-name">{user?.name || '사용자'}</div>
              <div className="mg-header__user-email">{user?.email || 'user@mindgarden.com'}</div>
            </div>
          </div>
        )}
      </div>

      {/* 오버레이 */}
      {(isUserMenuOpen || isNotificationOpen || isMobileMenuOpen) && (
        <div 
          className="mg-header__overlay"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsNotificationOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default MGHeader;
