import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { getRoleDisplayName, getRoleDisplayNameEn } from '../../utils/roleHelper';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import { sessionManager } from '../../utils/sessionManager';
import SimpleHamburgerMenu from './SimpleHamburgerMenu';
import ConfirmModal from '../common/ConfirmModal';
import { 
  HEADER_CSS_CLASSES, 
  HEADER_TEXTS, 
  HEADER_ICONS, 
  HEADER_DEFAULTS 
} from '../../constants/css/headerConstants';
import './SimpleHeader.css';

/**
 * 간단한 헤더 컴포넌트
 * - 중앙 세션 상태만 표시 (세션 관리 로직 없음)
 * - 로그인/로그아웃 버튼과 사용자 정보 표시
 * - 세션 관리는 SessionContext에서만 처리
 * - 뒤로가기 버튼 (조건부 표시)
 */
const SimpleHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [roleDisplayName, setRoleDisplayName] = useState('');
  const [roleDisplayNameEn, setRoleDisplayNameEn] = useState('');
  
  // 중앙 세션 훅 사용 (헤더는 단순히 상태만 표시)
  const { user, isLoggedIn, isLoading, logout } = useSession();

  // 사용자가 변경될 때 이미지 로드 에러 상태 초기화
  useEffect(() => {
    setImageLoadError(false);
  }, [user?.id, user?.profileImageUrl, user?.socialProfileImage]);

  // 사용자 역할 표시명 동적 로드
  useEffect(() => {
    const loadRoleDisplayNames = async () => {
      if (user?.role) {
        try {
          const koreanName = await getRoleDisplayName(user.role, user.branchName);
          const englishName = await getRoleDisplayNameEn(user.role, user.branchName);
          setRoleDisplayName(koreanName);
          setRoleDisplayNameEn(englishName);
        } catch (error) {
          console.error('❌ 역할 표시명 로드 실패:', error);
          // Fallback
          setRoleDisplayName(user.role);
          setRoleDisplayNameEn(user.role);
        }
      }
    };

    loadRoleDisplayNames();
  }, [user?.role, user?.branchName]);

  // 뒤로가기 버튼을 표시할지 결정하는 함수 - 상수 사용
  const shouldShowBackButton = () => {
    const currentPath = location.pathname;
    
    // 홈페이지, 로그인, 회원가입 페이지에서는 뒤로가기 버튼을 표시하지 않음
    if (HEADER_DEFAULTS.SHOW_BACK_BUTTON_PATHS.includes(currentPath)) {
      return false;
    }
    
    // 각 역할의 메인 대시보드에서는 뒤로가기 버튼을 표시하지 않음
    if (HEADER_DEFAULTS.MAIN_DASHBOARD_PATHS.includes(currentPath)) {
      return false;
    }
    
    return true;
  };

  // 뒤로가기 버튼 클릭 핸들러
  const handleBackClick = async () => {
    // 브라우저 히스토리가 있으면 뒤로가기, 없으면 적절한 대시보드로 이동
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // 사용자 역할에 따른 기본 대시보드로 이동
      if (user?.role) {
        // 동적 대시보드 라우팅
        const authResponse = {
          user: user,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
      } else {
        navigate('/');
      }
    }
  };

  // 하드코딩된 역할 매핑 함수 제거 - 동적 로딩 사용

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    // 중앙 세션의 logout 함수 사용
    await logout();
    navigate('/login');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (user?.role) {
      navigate(`/${user.role.toLowerCase()}/mypage`);
    }
  };

  const toggleHamburger = () => {
    console.log('🔍 햄버거 버튼 클릭됨:', { 현재상태: isHamburgerOpen, 변경될상태: !isHamburgerOpen });
    setIsHamburgerOpen(!isHamburgerOpen);
    console.log('✅ 햄버거 상태 변경 완료:', !isHamburgerOpen);
  };


  // 프로필 이미지 우선순위: 사용자 업로드 > 소셜 > 기본 아이콘
  const getProfileImageUrl = () => {
    if (user?.profileImageUrl && !imageLoadError) {
      return user.profileImageUrl;
    }
    if (user?.socialProfileImage && !imageLoadError) {
      return user.socialProfileImage;
    }
    return null;
  };

  // 이미지 로드 실패 처리
  const handleImageError = () => {
    console.log('🖼️ SimpleHeader - 프로필 이미지 로드 실패, 기본 아이콘으로 대체');
    setImageLoadError(true);
  };

  const handleImageLoad = () => {
    console.log('🖼️ SimpleHeader - 프로필 이미지 로드 성공');
  };

  return (
    <>
      <header className={HEADER_CSS_CLASSES.HEADER}>
      <div className={HEADER_CSS_CLASSES.HEADER_CONTENT}>
        {/* 왼쪽 영역 - 뒤로가기 버튼과 로고 */}
        <div className={HEADER_CSS_CLASSES.HEADER_LEFT}>
          {/* 뒤로가기 버튼 (조건부 표시) */}
          {shouldShowBackButton() && (
            <button 
              className={HEADER_CSS_CLASSES.BACK_BUTTON} 
              onClick={handleBackClick}
              title={HEADER_TEXTS.BACK_TITLE}
            >
              <i className={`bi ${HEADER_ICONS.BACK}`}></i>
            </button>
          )}
          
          {/* 로고 */}
          <div className={HEADER_CSS_CLASSES.HEADER_LOGO}>
            <a href="/" className={HEADER_CSS_CLASSES.HEADER_LOGO_LINK}>
              <i className={`bi ${HEADER_ICONS.LOGO}`}></i>
              <span>{HEADER_TEXTS.BRAND_NAME}</span>
            </a>
          </div>
        </div>
        
        {/* 오른쪽 영역 */}
        <div className={HEADER_CSS_CLASSES.HEADER_RIGHT}>
          {isLoading ? (
            <div className={HEADER_CSS_CLASSES.LOADING}>
              <i className={`bi ${HEADER_ICONS.LOADING}`}></i>
              <span>{HEADER_TEXTS.LOADING}</span>
            </div>
          ) : isLoggedIn && user ? (
            <>
              {/* 사용자 정보 */}
              <div className={HEADER_CSS_CLASSES.USER_INFO} onClick={handleProfileClick}>
                <div className={HEADER_CSS_CLASSES.USER_AVATAR}>
                  {getProfileImageUrl() ? (
                    <img 
                      src={getProfileImageUrl()} 
                      alt="프로필" 
                      className={HEADER_CSS_CLASSES.PROFILE_IMAGE}
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  ) : (
                    <i className={`bi ${HEADER_ICONS.USER_DEFAULT}`}></i>
                  )}
                </div>
                <div className={HEADER_CSS_CLASSES.USER_DETAILS}>
                  <div className={HEADER_CSS_CLASSES.USER_NAME}>
                    {user.name || user.nickname || user.username || HEADER_TEXTS.DEFAULT_USER}
                  </div>
                  <div className={HEADER_CSS_CLASSES.USER_ROLE}>{roleDisplayName || user.role}</div>
                  <div className={HEADER_CSS_CLASSES.USER_ROLE_EN}>{roleDisplayNameEn || user.role}</div>
                </div>
              </div>

              {/* 로그아웃 버튼 */}
              <button 
                className="simple-header-logout-button"
                onClick={handleLogout}
                title="로그아웃"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>로그아웃</span>
              </button>

              {/* 햄버거 메뉴 버튼 */}
              <button 
                className={HEADER_CSS_CLASSES.HAMBURGER_TOGGLE} 
                onClick={toggleHamburger}
                title={HEADER_TEXTS.MENU_TITLE}
              >
                <i className={`bi ${HEADER_ICONS.HAMBURGER}`}></i>
              </button>
            </>
          ) : (
            <>
              {/* 로그인 버튼 */}
              <a href="/login" className={HEADER_CSS_CLASSES.LOGIN_BUTTON}>
                <i className={`bi ${HEADER_ICONS.LOGIN}`}></i>
                {HEADER_TEXTS.LOGIN}
              </a>
            </>
          )}
        </div>
      </div>
    </header>
      
      {/* 햄버거 메뉴 */}
      <SimpleHamburgerMenu 
        isOpen={isHamburgerOpen}
        onClose={() => setIsHamburgerOpen(false)}
      />
      
      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title={HEADER_TEXTS.LOGOUT}
        message="로그아웃 하시겠습니까?"
        confirmText={HEADER_TEXTS.LOGOUT}
        cancelText="취소"
        type="danger"
      />
    </>
  );
};
  
  export default SimpleHeader;
