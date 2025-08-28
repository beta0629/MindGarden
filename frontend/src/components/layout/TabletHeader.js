import React from 'react';

const TabletHeader = ({ user, onHamburgerToggle, onProfileClick }) => {
  return (
    <header className="tablet-header">
      <div className="tablet-header-content">
        {/* 로고 - 왼쪽 끝 */}
        <div className="tablet-logo">
          <a href="/" className="logo-link">
            <i className="bi bi-flower1"></i>
            <span className="logo-text">MindGarden</span>
          </a>
        </div>
        
        {/* 오른쪽 영역 - 사용자 정보와 햄버거 메뉴 */}
        <div className="tablet-header-right">
          {/* 사용자 프로필 및 로그인 정보 - 로그인 후에만 표시 */}
          {user ? (
            <div className="tablet-user-profile">
              <div 
                className="user-info" 
                onClick={onProfileClick}
                style={{ cursor: 'pointer' }}
              >
                <div className="user-avatar">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="프로필 이미지" 
                      className="profile-image"
                    />
                  ) : (
                    <i className="bi bi-person-circle profile-icon"></i>
                  )}
                </div>
                <div className="user-details">
                  <div className="user-name">{user.username || user.name}</div>
                  <div className="user-role">{user.role}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="tablet-login-link">
              <a href="/login" className="login-link-button">
                <i className="bi bi-box-arrow-in-right"></i>
                <span>로그인</span>
              </a>
            </div>
          )}
          
          {/* 햄버거 메뉴 토글 - 로그인 후에만 표시 */}
          {user && (
            <button 
              className="tablet-menu-toggle" 
              type="button" 
              onClick={onHamburgerToggle}
            >
              <i className="bi bi-list"></i>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TabletHeader;
