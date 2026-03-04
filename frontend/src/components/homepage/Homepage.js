import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import TabletBottomNavigation from '../layout/TabletBottomNavigation';
import UnifiedHeader from '../common/UnifiedHeader';
import { HOMEPAGE_CONSTANTS } from '../../constants/css-variables';
import { useSession } from '../../contexts/SessionContext';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import { sessionManager } from '../../utils/sessionManager';
import notificationManager from '../../utils/notification';
import '../../styles/main.css';
import './Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleHamburgerToggle = () => {
    const { MESSAGES } = HOMEPAGE_CONSTANTS;
    setIsMenuOpen(prev => {
      const newState = !prev;
      notificationManager.info(newState ? MESSAGES.MENU_OPENED : MESSAGES.MENU_CLOSED);
      return newState;
    });
  };

  const handleMenuClick = (menuItem) => {
    const { MENU_ITEMS } = HOMEPAGE_CONSTANTS;
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

  const handleOverlayClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <CommonPageTemplate 
      title="Core Solution - 비즈니스의 핵심을 솔루션하다"
      description="Core Solution과 함께 비즈니스의 모든 과정을 통합하고 자동화하여 혁신적인 성장을 경험하세요."
      bodyClass="mg-v2-homepage-body"
    >
      <div className="mg-v2-homepage">
        {/* Header (GNB) */}
        <UnifiedHeader 
          variant={isScrolled ? 'default' : 'transparent'}
          sticky={true}
          showBackButton={false}
          onLogoClick={() => navigate('/')}
          extraActions={
            !user && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <nav className="mg-v2-homepage-nav desktop-only">
                  <button className="mg-v2-btn-text" onClick={handleLogin}>로그인</button>
                  <button className="mg-v2-btn-primary" onClick={handleRegister}>회원가입</button>
                </nav>
                <button className="mg-v2-homepage-hamburger mobile-only" onClick={handleHamburgerToggle}>
                  <i className="bi bi-list"></i>
                </button>
              </div>
            )
          }
        />
        
        {/* 햄버거 메뉴 */}
        {!user && isMenuOpen && (
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
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="mg-v2-homepage-hero">
          <div className="mg-v2-homepage-hero-overlay"></div>
          <div className="mg-v2-homepage-hero-content">
            <h1 className="mg-v2-homepage-hero-title">비즈니스의 핵심을 솔루션하다</h1>
            <p className="mg-v2-homepage-hero-subtitle">Core Solution과 함께 비즈니스의 모든 과정을 통합하고 자동화하여 혁신적인 성장을 경험하세요.</p>
            <button 
              className="mg-v2-btn-primary-large" 
              onClick={async () => {
                if (user) {
                  if (user?.role) {
                    const authResponse = {
                      user: user,
                      currentTenantRole: sessionManager.getCurrentTenantRole()
                    };
                    await redirectToDynamicDashboard(authResponse, navigate);
                  } else {
                    navigate('/dashboard');
                  }
                } else {
                  handleRegister();
                }
              }}
            >
              무료로 시작하기
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="mg-v2-homepage-features">
          <h2 className="mg-v2-homepage-section-title">복잡한 비즈니스, Core Solution 하나로 끝내세요</h2>
          <div className="mg-v2-homepage-features-grid">
            <div className="mg-v2-card">
              <div className="mg-v2-card-image bg-img-data"></div>
              <div className="mg-v2-card-content">
                <h3 className="mg-v2-card-title">데이터 분석/대시보드</h3>
                <p className="mg-v2-card-desc">실시간으로 비즈니스 지표를 분석하고 의사결정을 가속화하세요.</p>
              </div>
            </div>
            <div className="mg-v2-card">
              <div className="mg-v2-card-image bg-img-finance"></div>
              <div className="mg-v2-card-content">
                <h3 className="mg-v2-card-title">재무/회계 관리</h3>
                <p className="mg-v2-card-desc">투명하고 체계적인 재무 관리로 기업의 건전성을 확보합니다.</p>
              </div>
            </div>
            <div className="mg-v2-card">
              <div className="mg-v2-card-image bg-img-collab"></div>
              <div className="mg-v2-card-content">
                <h3 className="mg-v2-card-title">협업 및 커뮤니케이션</h3>
                <p className="mg-v2-card-desc">팀원들과 원활하게 소통하고 업무 효율성을 극대화하세요.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Image & Text Split Section */}
        <section className="mg-v2-homepage-split">
          <div className="mg-v2-homepage-split-image bg-img-split"></div>
          <div className="mg-v2-homepage-split-text">
            <span className="mg-v2-homepage-split-subtitle">SEAMLESS INTEGRATION</span>
            <h2 className="mg-v2-homepage-split-title">모든 데이터를 한 곳에서 투명하게 관리하세요</h2>
            <p className="mg-v2-homepage-split-desc">흩어져 있던 재무, 인사, 운영 데이터를 통합하여 하나의 대시보드에서 효율적으로 관리하고 비즈니스 인사이트를 도출합니다.</p>
            <button className="mg-v2-btn-text-link" onClick={handleRegister}>자세히 알아보기 →</button>
          </div>
        </section>

        {/* Bottom CTA & Footer */}
        <section className="mg-v2-homepage-bottom-cta">
          <h2 className="mg-v2-homepage-bottom-cta-title">지금 바로 비즈니스의 핵심을 바꿔보세요.</h2>
          <button className="mg-v2-btn-white" onClick={handleRegister}>회원가입 하고 시작하기</button>
        </section>

        <footer className="mg-v2-homepage-footer">
          <p className="mg-v2-homepage-footer-text">© 2026 Core Solution. All rights reserved.</p>
          <div className="mg-v2-homepage-footer-links">
            <span>이용약관</span>
            <span>개인정보처리방침</span>
          </div>
        </footer>
        
        <TabletBottomNavigation userRole={null} />
      </div>
    </CommonPageTemplate>
  );
};

export default Homepage;
