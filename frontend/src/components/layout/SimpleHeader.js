import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { getRoleDisplayName, getRoleDisplayNameEn } from '../../utils/roleHelper';
import SimpleHamburgerMenu from './SimpleHamburgerMenu';
import ConfirmModal from '../common/ConfirmModal';
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

  // 뒤로가기 버튼을 표시할지 결정하는 함수
  const shouldShowBackButton = () => {
    const currentPath = location.pathname;
    const rootPaths = ['/', '/login', '/register'];
    
    // 홈페이지, 로그인, 회원가입 페이지에서는 뒤로가기 버튼을 표시하지 않음
    if (rootPaths.includes(currentPath)) {
      return false;
    }
    
    // 각 역할의 메인 대시보드에서는 뒤로가기 버튼을 표시하지 않음
    const mainDashboardPaths = [
      '/admin/dashboard',
      '/consultant/dashboard', 
      '/client/dashboard',
      '/super_admin/dashboard'
    ];
    
    if (mainDashboardPaths.includes(currentPath)) {
      return false;
    }
    
    return true;
  };

  // 뒤로가기 버튼 클릭 핸들러
  const handleBackClick = () => {
    // 브라우저 히스토리가 있으면 뒤로가기, 없으면 적절한 대시보드로 이동
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // 사용자 역할에 따른 기본 대시보드로 이동
      if (user?.role) {
        const role = user.role.toLowerCase();
        if (role === 'super_admin') {
          navigate('/super_admin/dashboard');
        } else {
          navigate(`/${role}/dashboard`);
        }
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
    setIsHamburgerOpen(!isHamburgerOpen);
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
      <header className="simple-header">
      <div className="simple-header-content">
        {/* 왼쪽 영역 - 뒤로가기 버튼과 로고 */}
        <div className="simple-header-left">
          {/* 뒤로가기 버튼 (조건부 표시) */}
          {shouldShowBackButton() && (
            <button 
              className="simple-back-button" 
              onClick={handleBackClick}
              title="뒤로가기"
            >
              <i className="bi bi-arrow-left"></i>
            </button>
          )}
          
          {/* 로고 */}
          <div className="simple-header-logo">
            <a href="/" className="simple-header-logo-link">
              <i className="bi bi-flower1"></i>
              <span>MindGarden</span>
            </a>
          </div>
        </div>
        
        {/* 오른쪽 영역 */}
        <div className="simple-header-right">
          {isLoading ? (
            <div className="simple-loading">
              <i className="bi bi-hourglass-split"></i>
              <span>로딩 중...</span>
            </div>
          ) : isLoggedIn && user ? (
            <>
              {/* 사용자 정보 */}
              <div className="simple-user-info" onClick={handleProfileClick}>
                <div className="simple-user-avatar">
                  {getProfileImageUrl() ? (
                    <img 
                      src={getProfileImageUrl()} 
                      alt="프로필" 
                      className="simple-profile-image"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  ) : (
                    <i className="bi bi-person-circle"></i>
                  )}
                </div>
                <div className="simple-user-details">
                  <div className="simple-user-name">
                    {user.name || user.nickname || user.username || '사용자'}
                  </div>
                  <div className="simple-user-role">{roleDisplayName || user.role}</div>
                  <div className="simple-user-role-en">{roleDisplayNameEn || user.role}</div>
                </div>
              </div>

              {/* 햄버거 메뉴 버튼 */}
              <button 
                className="simple-hamburger-toggle" 
                onClick={toggleHamburger}
                title="메뉴"
              >
                <i className="bi bi-list"></i>
              </button>
            </>
          ) : (
            <>
              {/* 로그인 버튼 */}
              <a href="/login" className="simple-login-button">
                <i className="bi bi-box-arrow-in-right"></i>
                로그인
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
        title="로그아웃"
        message="로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        type="danger"
      />
    </>
  );
};
  
  export default SimpleHeader;
