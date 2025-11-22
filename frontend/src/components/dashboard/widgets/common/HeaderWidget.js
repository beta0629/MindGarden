/**
 * Header Widget
 * SimpleHeader를 기반으로 한 범용 헤더 위젯
 * 대시보드 내에서 헤더를 표시할 수 있도록 위젯화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../../../contexts/SessionContext';
import { getRoleDisplayName, getRoleDisplayNameEn } from '../../../../utils/roleHelper';
import { redirectToDynamicDashboard } from '../../../../utils/dashboardUtils';
import { sessionManager } from '../../../../utils/sessionManager';
import ConfirmModal from '../../../common/ConfirmModal';
import '../Widget.css';
import './HeaderWidget.css';

const HeaderWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [roleDisplayName, setRoleDisplayName] = useState('');
  const [roleDisplayNameEn, setRoleDisplayNameEn] = useState('');
  
  const config = widget.config || {};
  const showBackButton = config.showBackButton !== false;
  const showLogo = config.showLogo !== false;
  const showUserInfo = config.showUserInfo !== false;
  const showLogoutButton = config.showLogoutButton !== false;
  const brandName = config.brandName || 'MindGarden';
  const logoIcon = config.logoIcon || 'bi-flower1';
  
  // 중앙 세션 훅 사용
  const { user: sessionUser, isLoggedIn, isLoading, logout } = useSession();
  const currentUser = user || sessionUser;

  // 사용자 역할 표시명 동적 로드
  useEffect(() => {
    const loadRoleDisplayNames = async () => {
      if (currentUser?.role) {
        try {
          const koreanName = await getRoleDisplayName(currentUser.role, currentUser.branchName);
          const englishName = await getRoleDisplayNameEn(currentUser.role, currentUser.branchName);
          setRoleDisplayName(koreanName);
          setRoleDisplayNameEn(englishName);
        } catch (error) {
          console.error('❌ 역할 표시명 로드 실패:', error);
          setRoleDisplayName(currentUser.role);
          setRoleDisplayNameEn(currentUser.role);
        }
      }
    };

    loadRoleDisplayNames();
  }, [currentUser?.role, currentUser?.branchName]);

  // 뒤로가기 버튼 표시 여부
  const shouldShowBackButton = () => {
    if (!showBackButton) return false;
    
    const currentPath = location.pathname;
    const hideBackPaths = ['/', '/login', '/signup', '/dashboard'];
    
    if (hideBackPaths.includes(currentPath)) {
      return false;
    }
    
    return true;
  };

  // 뒤로가기 버튼 클릭 핸들러
  const handleBackClick = async () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      if (currentUser?.role) {
        const authResponse = {
          user: currentUser,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
      } else {
        navigate('/');
      }
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (currentUser?.role) {
      navigate(`/${currentUser.role.toLowerCase()}/mypage`);
    }
  };

  // 프로필 이미지 URL
  const getProfileImageUrl = () => {
    if (currentUser?.profileImageUrl && !imageLoadError) {
      return currentUser.profileImageUrl;
    }
    if (currentUser?.socialProfileImage && !imageLoadError) {
      return currentUser.socialProfileImage;
    }
    return null;
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  if (config.hidden) {
    return null;
  }

  return (
    <>
      <div className="widget widget-header">
        <div className="widget-header-content">
          {/* 왼쪽 영역 */}
          <div className="widget-header-left">
            {shouldShowBackButton() && (
              <button 
                className="widget-header-back-button" 
                onClick={handleBackClick}
                title="뒤로가기"
              >
                <i className="bi bi-arrow-left"></i>
              </button>
            )}
            
            {showLogo && (
              <div className="widget-header-logo">
                <a href="/" className="widget-header-logo-link">
                  <i className={`bi ${logoIcon}`}></i>
                  <span>{brandName}</span>
                </a>
              </div>
            )}
          </div>
          
          {/* 오른쪽 영역 */}
          <div className="widget-header-right">
            {isLoading ? (
              <div className="widget-header-loading">
                <i className="bi bi-hourglass-split"></i>
                <span>로딩 중...</span>
              </div>
            ) : isLoggedIn && currentUser ? (
              <>
                {showUserInfo && (
                  <div className="widget-header-user-info" onClick={handleProfileClick}>
                    <div className="widget-header-user-avatar">
                      {getProfileImageUrl() ? (
                        <img 
                          src={getProfileImageUrl()} 
                          alt="프로필" 
                          className="widget-header-profile-image"
                          onError={handleImageError}
                        />
                      ) : (
                        <i className="bi bi-person-circle"></i>
                      )}
                    </div>
                    <div className="widget-header-user-details">
                      <div className="widget-header-user-name">
                        {currentUser.name || currentUser.nickname || currentUser.username || '사용자'}
                      </div>
                      <div className="widget-header-user-role">{roleDisplayName || currentUser.role}</div>
                    </div>
                  </div>
                )}

                {showLogoutButton && (
                  <button 
                    className="widget-header-logout-button"
                    onClick={handleLogout}
                    title="로그아웃"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>로그아웃</span>
                  </button>
                )}
              </>
            ) : (
              <a href="/login" className="widget-header-login-button">
                <i className="bi bi-box-arrow-in-right"></i>
                로그인
              </a>
            )}
          </div>
        </div>
      </div>
      
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

export default HeaderWidget;

