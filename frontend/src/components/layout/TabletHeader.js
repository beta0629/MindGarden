import React from 'react';
import SessionUserProfile from '../common/SessionUserProfile';
import { TABLET_HEADER_CSS } from '../../constants/css';
import './TabletHeader.css';

const TabletHeader = ({ user, onHamburgerToggle, onProfileClick }) => {
  // 디버깅을 위한 로그
  console.log('🔍 TabletHeader - user prop:', user);
  console.log('🔍 TabletHeader - CSS classes:', TABLET_HEADER_CSS);

  return (
    <header className={TABLET_HEADER_CSS.CONTAINER}>
      <div className={TABLET_HEADER_CSS.CONTENT}>
        {/* 로고 - 왼쪽 끝 */}
        <div className={TABLET_HEADER_CSS.LOGO}>
          <a href="/" className={TABLET_HEADER_CSS.LOGO_LINK}>
            <i className={`bi bi-flower1 ${TABLET_HEADER_CSS.LOGO_ICON}`}></i>
            <span className={TABLET_HEADER_CSS.LOGO_TEXT}>MindGarden</span>
          </a>
        </div>
        
        {/* 오른쪽 영역 - 사용자 정보와 햄버거 메뉴 */}
        <div className={TABLET_HEADER_CSS.RIGHT}>
          {/* 사용자 프로필 및 로그인 정보 - 로그인 후에만 표시 */}
          {user ? (
            <SessionUserProfile onProfileClick={onProfileClick} />
          ) : (
            <div className={TABLET_HEADER_CSS.LOGIN_LINK}>
              <a href="/login" className={TABLET_HEADER_CSS.LOGIN_BUTTON}>
                <i className="bi bi-box-arrow-in-right"></i>
                <span>로그인</span>
              </a>
            </div>
          )}
          
          {/* 햄버거 메뉴 토글 - 로그인 후에만 표시 */}
          {user && (
            <button 
              className={TABLET_HEADER_CSS.MENU_TOGGLE} 
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
