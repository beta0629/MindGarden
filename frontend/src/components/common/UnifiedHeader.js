import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import UnifiedModal from './modals/UnifiedModal';
import SimpleHamburgerMenu from '../layout/SimpleHamburgerMenu';
import '../../styles/main.css';

/**
 * 통합 헤더 컴포넌트 (UnifiedHeader)
 * 모든 페이지에서 일관된 헤더 UI를 제공하는 공통 컴포넌트
 * 
 * 로고 확장성 고려사항:
 * - 기본 텍스트 로고와 커스텀 이미지 로고 모두 지원
 * - 로고 크기 자동 조정 (responsive)
 * - 다크/라이트 모드 대응
 * - 클릭 시 홈으로 이동하는 기능
 * - 향후 브랜딩 변경 시 쉽게 교체 가능한 구조
 *
 * @param {object} props - 컴포넌트 props
 * @param {string} [props.title=''] - 헤더 제목 (기본값: 'MindGarden')
 * @param {string} [props.logoType='text'] - 로고 타입 (text, image, custom)
 * @param {string} [props.logoImage=''] - 커스텀 로고 이미지 URL
 * @param {string} [props.logoAlt='MindGarden'] - 로고 alt 텍스트
 * @param {boolean} [props.showUserMenu=true] - 사용자 메뉴 표시 여부
 * @param {boolean} [props.showHamburger=true] - 햄버거 메뉴 표시 여부
 * @param {string} [props.variant='default'] - 헤더 스타일 (default, compact, transparent)
 * @param {boolean} [props.sticky=true] - 상단 고정 여부
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * @param {function} [props.onLogoClick] - 로고 클릭 핸들러
 * @param {object} [props.extraActions] - 추가 액션 버튼들
 */
const UnifiedHeader = ({
  title = '',
  logoType = 'text', // text, image, custom
  logoImage = '',
  logoAlt = 'MindGarden',
  showUserMenu = true,
  showHamburger = true,
  variant = 'default', // default, compact, transparent
  sticky = true,
  className = '',
  onLogoClick,
  extraActions = null,
  ...props
}) => {
  const navigate = useNavigate();
  const user = sessionManager.getUser();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  // 로고 클릭 핸들러
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      // 기본 동작: 홈으로 이동
      navigate('/');
    }
  };

  // 햄버거 메뉴 토글
  const toggleHamburger = () => {
    setIsHamburgerOpen(!isHamburgerOpen);
  };

  // 로고 렌더링
  const renderLogo = () => {
    switch (logoType) {
      case 'image':
        return (
          <img 
            src={logoImage || '/logo.png'} 
            alt={logoAlt}
            className="mg-header__logo mg-header__logo--image"
            onClick={handleLogoClick}
          />
        );
      case 'custom':
        return (
          <div 
            className="mg-header__logo mg-header__logo--custom"
            onClick={handleLogoClick}
            dangerouslySetInnerHTML={{ __html: logoImage }}
          />
        );
      case 'text':
      default:
        return (
          <div 
            className="mg-header__logo mg-header__logo--text"
            onClick={handleLogoClick}
          >
            <span className="mg-header__logo-text">
              {title || 'MindGarden'}
            </span>
            <span className="mg-header__logo-subtitle">
              마음의 정원
            </span>
          </div>
        );
    }
  };

  // 사용자 메뉴 렌더링
  const renderUserMenu = () => {
    if (!showUserMenu || !user) return null;

    return (
      <div className="mg-header__user-menu">
        <div className="mg-header__user-info">
          <span className="mg-header__user-name">{user.name}</span>
          <span className="mg-header__user-role">{user.role}</span>
        </div>
        <button 
          className="mg-header__hamburger"
          onClick={toggleHamburger}
          aria-label="메뉴 열기"
        >
          <span className="mg-header__hamburger-icon"></span>
          <span className="mg-header__hamburger-icon"></span>
          <span className="mg-header__hamburger-icon"></span>
        </button>
      </div>
    );
  };

  const headerClasses = [
    'mg-header',
    `mg-header--${variant}`,
    sticky ? 'mg-header--sticky' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <header className={headerClasses} {...props}>
        <div className="mg-header__container">
          {/* 로고 영역 */}
          <div className="mg-header__brand">
            {renderLogo()}
          </div>

          {/* 중앙 액션 영역 */}
          {extraActions && (
            <div className="mg-header__actions">
              {extraActions}
            </div>
          )}

          {/* 사용자 메뉴 영역 */}
          {renderUserMenu()}
        </div>
      </header>

      {/* 햄버거 메뉴 */}
      {showHamburger && (
        <SimpleHamburgerMenu 
          isOpen={isHamburgerOpen}
          onClose={() => setIsHamburgerOpen(false)}
        />
      )}
    </>
  );
};

export default UnifiedHeader;
