import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleLayout from '../layout/SimpleLayout';
import TabletBottomNavigation from '../layout/TabletBottomNavigation';
import { HOMEPAGE_CONSTANTS } from '../../constants/css-variables';
import { useSession } from '../../contexts/SessionContext';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import { sessionManager } from '../../utils/sessionManager';
import notificationManager from '../../utils/notification';
import '../../styles/main.css';
import './Homepage.css';

const TabletHomepage = () => {
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    console.log('🏠 TabletHomepage 마운트됨');
    console.log('📍 현재 경로:', window.location.pathname);
    console.log('🔗 현재 URL:', window.location.href);
    
    // 페이지 로딩 애니메이션 시작
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log('📱 테블릿 홈페이지 애니메이션 시작');
    }, 100);
    
    return () => {
      console.log('🏠 TabletHomepage 언마운트됨');
      clearTimeout(timer);
    };
  }, []);

  const handleLogin = () => {
    console.log('🔐 로그인 버튼 클릭됨');
    navigate('/login');
  };

  const handleRegister = () => {
    console.log('📝 회원가입 버튼 클릭됨');
    navigate('/register');
  };

  const handleHamburgerToggle = () => {
    const { MESSAGES } = HOMEPAGE_CONSTANTS;
    console.log('🍔 햄버거 메뉴 토글');
    
    setIsMenuOpen(prev => {
      const newState = !prev;
      notificationManager.info(newState ? MESSAGES.MENU_OPENED : MESSAGES.MENU_CLOSED);
      return newState;
    });
  };

  const handleProfileClick = () => {
    const { MESSAGES } = HOMEPAGE_CONSTANTS;
    console.log('👤 프로필 클릭');
    
    if (user) {
      // 로그인된 사용자: 프로필 메뉴 토글
      setIsProfileMenuOpen(prev => {
        const newState = !prev;
        notificationManager.info(newState ? MESSAGES.PROFILE_OPENED : MESSAGES.PROFILE_CLOSED);
        return newState;
      });
    } else {
      // 로그인되지 않은 사용자: 로그인 페이지로 이동
      navigate('/login');
    }
  };

  const handleMenuClick = (menuItem) => {
    const { MENU_ITEMS } = HOMEPAGE_CONSTANTS;
    console.log('메뉴 클릭:', menuItem);
    
    setIsMenuOpen(false);
    
    switch (menuItem) {
      case MENU_ITEMS.HOME:
        navigate('/');
        break;
      case MENU_ITEMS.LOGIN:
        navigate('/login');
        break;
      case MENU_ITEMS.REGISTER:
        navigate('/register');
        break;
      case MENU_ITEMS.ABOUT:
        navigate('/about');
        break;
      case MENU_ITEMS.SERVICES:
        navigate('/services');
        break;
      case MENU_ITEMS.CONTACT:
        navigate('/contact');
        break;
      default:
        console.log('알 수 없는 메뉴 항목:', menuItem);
    }
  };

  const handleProfileMenuClick = async (menuItem) => {
    const { PROFILE_MENU_ITEMS, MESSAGES } = HOMEPAGE_CONSTANTS;
    console.log('프로필 메뉴 클릭:', menuItem);
    
    setIsProfileMenuOpen(false);
    
    switch (menuItem) {
      case PROFILE_MENU_ITEMS.DASHBOARD:
        // 사용자 역할에 따른 대시보드로 이동
        // 동적 대시보드 라우팅
        if (user?.role) {
          const authResponse = {
            user: user,
            currentTenantRole: sessionManager.getCurrentTenantRole()
          };
          await redirectToDynamicDashboard(authResponse, navigate);
        } else {
          navigate('/dashboard');
        }
        break;
      case PROFILE_MENU_ITEMS.PROFILE:
        navigate('/mypage');
        break;
      case PROFILE_MENU_ITEMS.SETTINGS:
        navigate('/settings');
        break;
      case PROFILE_MENU_ITEMS.LOGOUT:
        try {
          await logout();
          notificationManager.success(MESSAGES.LOGOUT_SUCCESS);
          // logout() 함수에서 이미 로그인 페이지로 리다이렉트하므로 navigate 불필요
        } catch (error) {
          console.error('로그아웃 실패:', error);
          notificationManager.error(MESSAGES.LOGOUT_ERROR);
        }
        break;
      default:
        console.log('알 수 없는 프로필 메뉴 항목:', menuItem);
    }
  };

  const handleOverlayClick = () => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  return (
    <CommonPageTemplate 
      title="마인드가든 - 마음의 정원을 가꾸는 상담 서비스"
      description="전문 상담사와 함께 마음의 평화를 찾아보세요. 언제 어디서나 편리하게 상담을 받을 수 있습니다."
      bodyClass="tablet-page"
    >
      <SimpleLayout title="">
        <div className="tablet-homepage tablet-page">
        
        {/* 햄버거 메뉴 */}
        {isMenuOpen && (
          <div className="hamburger-menu-overlay" onClick={handleOverlayClick}>
            <div className="hamburger-menu" onClick={(e) => e.stopPropagation()}>
              <div className="hamburger-menu-header">
                <h3>메뉴</h3>
                <button 
                  className="hamburger-menu-close"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
              <div className="hamburger-menu-content">
                <button 
                  className="hamburger-menu-item"
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.HOME)}
                >
                  <i className="bi bi-house"></i>
                  홈
                </button>
                <button 
                  className="hamburger-menu-item"
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.ABOUT)}
                >
                  <i className="bi bi-info-circle"></i>
                  소개
                </button>
                <button 
                  className="hamburger-menu-item"
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.SERVICES)}
                >
                  <i className="bi bi-heart"></i>
                  서비스
                </button>
                <button 
                  className="hamburger-menu-item"
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.CONTACT)}
                >
                  <i className="bi bi-telephone"></i>
                  문의
                </button>
                {!user && (
                  <>
                    <button 
                      className="hamburger-menu-item"
                      onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.LOGIN)}
                    >
                      <i className="bi bi-box-arrow-in-right"></i>
                      로그인
                    </button>
                    <button 
                      className="hamburger-menu-item"
                      onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.REGISTER)}
                    >
                      <i className="bi bi-person-plus"></i>
                      회원가입
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 프로필 메뉴 */}
        {isProfileMenuOpen && user && (
          <div className="profile-menu-overlay" onClick={handleOverlayClick}>
            <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="profile-menu-header">
                <div className="profile-menu-user">
                  <div className="profile-menu-avatar">
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt={user.name} />
                    ) : (
                      <i className="bi bi-person-circle"></i>
                    )}
                  </div>
                  <div className="profile-menu-info">
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                  </div>
                </div>
                <button 
                  className="profile-menu-close"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
              <div className="profile-menu-content">
                <button 
                  className="profile-menu-item"
                  onClick={() => handleProfileMenuClick(HOMEPAGE_CONSTANTS.PROFILE_MENU_ITEMS.DASHBOARD)}
                >
                  <i className="bi bi-speedometer2"></i>
                  대시보드
                </button>
                <button 
                  className="profile-menu-item"
                  onClick={() => handleProfileMenuClick(HOMEPAGE_CONSTANTS.PROFILE_MENU_ITEMS.PROFILE)}
                >
                  <i className="bi bi-person"></i>
                  프로필
                </button>
                <button 
                  className="profile-menu-item"
                  onClick={() => handleProfileMenuClick(HOMEPAGE_CONSTANTS.PROFILE_MENU_ITEMS.SETTINGS)}
                >
                  <i className="bi bi-gear"></i>
                  설정
                </button>
                <button 
                  className="profile-menu-item profile-menu-logout"
                  onClick={() => handleProfileMenuClick(HOMEPAGE_CONSTANTS.PROFILE_MENU_ITEMS.LOGOUT)}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
        
        <main className="tablet-main">
          <div className="tablet-container">
            <div className={`hero-section-mobile ${isLoaded ? 'loaded' : ''}`}>
              {/* 배경 장식 */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '300px',
                height: '300px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(100px)'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-10%',
                width: '200px',
                height: '200px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
                filter: 'blur(80px)'
              }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 24px',
                  backgroundColor: 'var(--color-bg-glass, rgba(255, 255, 255, 0.2))',
                  borderRadius: '50px',
                  marginBottom: '24px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    🌿 전문 심리상담 플랫폼
                  </span>
                </div>
                
                <h1 className="hero-title-mobile">
                  마음의 평화를<br />찾아가는 여정
                </h1>
                
                <p className="hero-subtitle-mobile">
                  전문 상담사와 함께 안전하고 편안한 환경에서<br />
                  당신만의 속도로 마음을 돌보세요
                </p>
                
                {!user && (
                  <div className="hero-buttons-mobile">
                    <button className="hero-btn hero-btn-primary" onClick={handleLogin}>
                      <i className="bi bi-box-arrow-in-right"></i>
                      로그인
                    </button>
                    <button className="hero-btn hero-btn-secondary" onClick={handleRegister}>
                      <i className="bi bi-person-plus"></i>
                      회원가입
                    </button>
                  </div>
                )}
              </div>
            </div>


            <div className={`services-section-mobile ${isLoaded ? 'loaded' : ''}`}>
              <div className="services-section-mobile-header">
                <h2 className="services-title-mobile">
                  전문적이고 안전한 상담 서비스
                </h2>
                <p className="services-subtitle-mobile">
                  당신의 마음 건강을 위한 체계적인 관리 시스템
                </p>
              </div>
              
              <div className="services-grid-mobile">
                <div className="service-card service-card-brain">
                  <div className="service-icon">🧠</div>
                  <h4 className="service-title">전문 상담</h4>
                  <p className="service-description">경험 많은 상담사와의 1:1 상담</p>
                </div>

                <div className="service-card service-card-mobile">
                  <div className="service-icon">📱</div>
                  <h4 className="service-title">편리한 접근</h4>
                  <p className="service-description">언제 어디서나 상담 예약 및 진행</p>
                </div>

                <div className="service-card service-card-security">
                  <div className="service-icon">🔒</div>
                  <h4 className="service-title">안전한 보안</h4>
                  <p className="service-description">개인정보 보호 및 암호화</p>
                </div>

                <div className="service-card service-card-chat">
                  <div className="service-icon">💬</div>
                  <h4 className="service-title">실시간 채팅</h4>
                  <p className="service-description">상담사와의 즉시 소통</p>
                </div>
              </div>
            </div>

            <div className={`info-section ${isLoaded ? 'fade-in-up' : ''}`} data-animation-delay="0.6s">
              <div className="info-content">
                <h3 className="info-title">상담 서비스 이용 안내</h3>
                <ul className="info-list">
                  <li>• 상담 예약은 로그인 후 가능합니다</li>
                  <li>• 상담 시간은 50분이며, 사전 예약제입니다</li>
                  <li>• 개인정보는 철저히 보호됩니다</li>
                  <li>• 상담 내용은 비밀이 보장됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
        
          {/* 공통 하단 네비게이션 */}
          <TabletBottomNavigation userRole={null} />
        </div>
      </SimpleLayout>
    </CommonPageTemplate>
  );
};

export default TabletHomepage;
