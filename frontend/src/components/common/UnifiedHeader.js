import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import { getDashboardPath } from '../../utils/session';
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
  showBackButton = true, // 백 버튼 표시 여부
  variant = 'default', // default, compact, transparent
  sticky = true,
  className = '',
  onLogoClick,
  extraActions = null,
  ...props
}) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // 백 버튼 표시 여부 결정
  const shouldShowBackButton = () => {
    if (!showBackButton) return false;
    
    const currentPath = location.pathname;
    const noBackPaths = ['/', '/login', '/signup'];
    
    // 홈페이지, 로그인, 회원가입에서만 백 버튼 숨김
    if (noBackPaths.includes(currentPath)) return false;
    
    // 다른 모든 페이지에서는 백 버튼 표시
    return true;
  };

  // 백 버튼 클릭 핸들러
  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // 브라우저 히스토리가 없으면 적절한 대시보드로 이동
      if (user?.role) {
        const dashboardPath = getDashboardPath(user.role);
        navigate(dashboardPath);
      } else {
        navigate('/');
      }
    }
  };

  // 프로필 클릭 핸들러
  const handleProfileClick = () => {
    if (user?.role) {
      navigate(`/${user.role.toLowerCase()}/mypage`);
    }
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

  // 프로필 이미지 URL 가져오기
  const getProfileImageUrl = () => {
    if (user?.profileImageUrl) {
      return user.profileImageUrl;
    }
    if (user?.socialProfileImage) {
      return user.socialProfileImage;
    }
    return null;
  };

  // 사용자 메뉴 렌더링
  const renderUserMenu = () => {
    if (!showUserMenu || !user) return null;

    const profileImageUrl = getProfileImageUrl();

    return (
      <div className="mg-header__user-menu">
        <div className="mg-header__user-info">
          {/* 프로필 사진 - 클릭 가능 */}
          <div 
            className="mg-header__user-avatar mg-header__user-avatar--clickable"
            onClick={handleProfileClick}
            title="마이페이지로 이동"
            style={{ cursor: 'pointer' }}
          >
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt="프로필" 
                className="mg-header__profile-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <i 
              className="bi bi-person-circle mg-header__profile-icon"
              style={{ display: profileImageUrl ? 'none' : 'block' }}
            ></i>
          </div>
          
          {/* 사용자 정보 */}
          <div className="mg-header__user-details">
            <span className="mg-header__user-name">{user.name || user.nickname || user.username}</span>
            <span className="mg-header__user-role">{user.role}</span>
          </div>
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
            {/* 백 버튼 */}
            {shouldShowBackButton() && (
              <button 
                className="mg-header__back-button"
                onClick={handleBackClick}
                title="뒤로가기"
                aria-label="뒤로가기"
              >
                <i className="bi bi-arrow-left"></i>
              </button>
            )}
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
