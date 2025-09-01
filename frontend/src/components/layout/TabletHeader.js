import React from 'react';
import { useSession } from '../../hooks/useSession';
import SessionUserProfile from '../common/SessionUserProfile';

const TabletHeader = ({ user, onHamburgerToggle, onProfileClick }) => {
  const { user: sessionUser } = useSession();

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
          {sessionUser ? (
            <SessionUserProfile onProfileClick={onProfileClick} />
          ) : (
            <div className="tablet-login-link">
              <a href="/login" className="login-link-button">
                <i className="bi bi-box-arrow-in-right"></i>
                <span>로그인</span>
              </a>
            </div>
          )}
          
          {/* 햄버거 메뉴 토글 - 로그인 후에만 표시 */}
          {sessionUser && (
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
