import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import SimpleHamburgerMenu from './SimpleHamburgerMenu';
import ConfirmModal from '../common/ConfirmModal';
import './SimpleHeader.css';

/**
 * 간단한 헤더 컴포넌트
 * - 중앙 세션 상태만 표시 (세션 관리 로직 없음)
 * - 로그인/로그아웃 버튼과 사용자 정보 표시
 * - 세션 관리는 SessionContext에서만 처리
 */
const SimpleHeader = () => {
  const navigate = useNavigate();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // 중앙 세션 훅 사용 (헤더는 단순히 상태만 표시)
  const { user, isLoggedIn, isLoading, logout } = useSession();

  // 사용자가 변경될 때 이미지 로드 에러 상태 초기화
  useEffect(() => {
    setImageLoadError(false);
  }, [user?.id, user?.profileImageUrl, user?.socialProfileImage]);

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

  const handleSessionRefresh = () => {
    console.log('🔄 세션 새로고침 시도...');
    // 단순히 페이지 새로고침으로 세션 상태 갱신
    window.location.reload();
  };

  // 프로필 이미지 우선순위: 사용자 업로드 > 소셜 > 기본 아이콘
  const getProfileImageUrl = () => {
    if (user?.profileImageUrl && !imageLoadError) {
      console.log('🖼️ SimpleHeader - 사용자 업로드 이미지 사용:', user.profileImageUrl);
      return user.profileImageUrl;
    }
    if (user?.socialProfileImage && !imageLoadError) {
      console.log('🖼️ SimpleHeader - 소셜 이미지 사용:', user.socialProfileImage);
      return user.socialProfileImage;
    }
    console.log('🖼️ SimpleHeader - 기본 아이콘 사용');
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
        {/* 로고 */}
        <div className="simple-header-logo">
          <a href="/" className="simple-header-logo-link">
            <i className="bi bi-flower1"></i>
            <span>MindGarden</span>
          </a>
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
                  <div className="simple-user-role">{user.role}</div>
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
              <button 
                className="simple-session-refresh"
                onClick={handleSessionRefresh}
                title="세션 새로고침"
              >
                <i className="bi bi-arrow-clockwise"></i>
                세션 새로고침
              </button>
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
