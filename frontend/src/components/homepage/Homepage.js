import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import TabletBottomNavigation from '../layout/TabletBottomNavigation';
import UnifiedHeader from '../common/UnifiedHeader';
import { HOMEPAGE_CONSTANTS } from '../../constants/css-variables';
import { useSession } from '../../contexts/SessionContext';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import { sessionManager } from '../../utils/sessionManager';
import '../../styles/main.css';
import './Homepage.css';
import { useTranslation } from 'react-i18next';

const Homepage = () => {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleHamburgerToggle = () => {
    setIsMenuOpen(prev => !prev);
  };

  const scrollToHomepageFeatures = () => {
    document.getElementById('homepage-features')?.scrollIntoView({ behavior: 'smooth' });
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
      case MENU_ITEMS.SERVICES:
      case MENU_ITEMS.CONTACT:
        // 라우트 미제공: 동일 페이지 Features 앵커로 이동(임시)
        scrollToHomepageFeatures();
        break;
      default:
        break;
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
          title="Core Solution"
          singleLineLogo={true}
          useBrandingInfo={!!user}
          onLogoClick={() => navigate('/')}
          extraActions={
            !user && (
              <div className="mg-v2-homepage-header-actions">
                <nav className="mg-v2-homepage-nav desktop-only">
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      loading: false
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={handleLogin}
                    preventDoubleClick={false}
                  >
                    {t('common:homepage.Homepage.t_e225a6fd')}
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="primary"
                    className={buildErpMgButtonClassName({
                      variant: 'primary',
                      size: 'md',
                      loading: false
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={handleRegister}
                    preventDoubleClick={false}
                  >
                    {t('common:homepage.Homepage.t_ecb4cc87')}
                  </MGButton>
                </nav>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: 'mg-v2-homepage-hamburger mobile-only'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleHamburgerToggle}
                  preventDoubleClick={false}
                  aria-label={t('common:homepage.Homepage.t_195da620')}
                >
                  <i className="bi bi-list" />
                </MGButton>
              </div>
            )
          }
        />
        
        {/* 햄버거 메뉴 */}
        {!user && isMenuOpen && (
          <div className="hamburger-menu-overlay" onClick={handleOverlayClick}>
            <div className="hamburger-menu" onClick={(e) => e.stopPropagation()}>
              <div className="hamburger-menu-header">
                <h3>{t('common:homepage.Homepage.t_076925c5')}</h3>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: 'hamburger-menu-close'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setIsMenuOpen(false)}
                  preventDoubleClick={false}
                  aria-label={t('common:homepage.Homepage.t_923b2615')}
                >
                  <i className="bi bi-x" />
                </MGButton>
              </div>
              <div className="hamburger-menu-content">
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: 'hamburger-menu-item mg-button--with-icon'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.HOME)}
                  preventDoubleClick={false}
                >
                  <i className="bi bi-house" />
                  {t('common:homepage.Homepage.t_13a46f96')}
                </MGButton>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: 'hamburger-menu-item mg-button--with-icon'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.ABOUT)}
                  preventDoubleClick={false}
                >
                  <i className="bi bi-info-circle" />
                  {t('common:homepage.Homepage.t_fa255f0c')}
                </MGButton>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: 'hamburger-menu-item mg-button--with-icon'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.SERVICES)}
                  preventDoubleClick={false}
                >
                  <i className="bi bi-heart" />
                  {t('common:homepage.Homepage.t_45c901dc')}
                </MGButton>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: 'hamburger-menu-item mg-button--with-icon'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.CONTACT)}
                  preventDoubleClick={false}
                >
                  <i className="bi bi-telephone" />
                  {t('common:homepage.Homepage.t_0fc1eee5')}
                </MGButton>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: 'hamburger-menu-item mg-button--with-icon'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.LOGIN)}
                  preventDoubleClick={false}
                >
                  <i className="bi bi-box-arrow-in-right" />
                  {t('common:homepage.Homepage.t_e225a6fd')}
                </MGButton>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: 'hamburger-menu-item mg-button--with-icon'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.REGISTER)}
                  preventDoubleClick={false}
                >
                  <i className="bi bi-person-plus" />
                  {t('common:homepage.Homepage.t_ecb4cc87')}
                </MGButton>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="mg-v2-homepage-hero">
          <div className="mg-v2-homepage-hero-overlay" />
          <div className="mg-v2-homepage-hero-content">
            <h1 className="mg-v2-homepage-hero-title">{t('common:homepage.Homepage.t_532c5f8e')}</h1>
            <p className="mg-v2-homepage-hero-subtitle">{t('common:homepage.Homepage.t_9b6a94eb')}</p>
            <MGButton
              type="button"
              variant="primary"
              size="large"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'lg',
                loading: false,
                className: 'mg-v2-btn-primary-large'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={async() => {
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
                  handleLogin();
                }
              }}
              preventDoubleClick={false}
            >
              {t('common:homepage.Homepage.t_7bbd5bba')}
            </MGButton>
          </div>
          <div className="mg-v2-homepage-scroll-indicator" aria-hidden="true">
            <span className="mg-v2-homepage-scroll-indicator__text">SCROLL</span>
            <span className="mg-v2-homepage-scroll-indicator__mouse">
              <span className="mg-v2-homepage-scroll-indicator__wheel" />
            </span>
          </div>
        </section>

        {/* Features Section */}
        <section id="homepage-features" className="mg-v2-homepage-features">
          <h2 className="mg-v2-homepage-section-title">{t('common:homepage.Homepage.t_93b319e0')}</h2>
          <div className="mg-v2-homepage-features-grid">
            <div className="mg-v2-card">
              <div className="mg-v2-card-image bg-img-data" />
              <div className="mg-v2-card-content">
                <h3 className="mg-v2-card-title">{t('common:homepage.Homepage.t_09d6d7e8')}</h3>
                <p className="mg-v2-card-desc">{t('common:homepage.Homepage.t_0deda332')}</p>
              </div>
            </div>
            <div className="mg-v2-card">
              <div className="mg-v2-card-image bg-img-finance" />
              <div className="mg-v2-card-content">
                <h3 className="mg-v2-card-title">{t('common:homepage.Homepage.t_26689987')}</h3>
                <p className="mg-v2-card-desc">{t('common:homepage.Homepage.t_662f130f')}</p>
              </div>
            </div>
            <div className="mg-v2-card">
              <div className="mg-v2-card-image bg-img-collab" />
              <div className="mg-v2-card-content">
                <h3 className="mg-v2-card-title">{t('common:homepage.Homepage.t_cf4bbccd')}</h3>
                <p className="mg-v2-card-desc">{t('common:homepage.Homepage.t_beb6763b')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Image & Text Split Section */}
        <section className="mg-v2-homepage-split">
          <div className="mg-v2-homepage-split-image bg-img-split" />
          <div className="mg-v2-homepage-split-text">
            <span className="mg-v2-homepage-split-subtitle">SEAMLESS INTEGRATION</span>
            <h2 className="mg-v2-homepage-split-title">{t('common:homepage.Homepage.t_cf78c9e3')}</h2>
            <p className="mg-v2-homepage-split-desc">{t('common:homepage.Homepage.t_cc30f363')}</p>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: 'mg-v2-btn-text-link'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={scrollToHomepageFeatures}
              preventDoubleClick={false}
            >
              {t('common:homepage.Homepage.t_8871edb9')}
            </MGButton>
          </div>
        </section>

        {/* Bottom CTA & Footer */}
        <section className="mg-v2-homepage-bottom-cta">
          <h2 className="mg-v2-homepage-bottom-cta-title">{t('common:homepage.Homepage.t_f6cb0de3')}</h2>
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'mg-v2-btn-white'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleRegister}
            preventDoubleClick={false}
          >
            {t('common:homepage.Homepage.t_f6a6f901')}
          </MGButton>
        </section>

        <footer className="mg-v2-homepage-footer">
          <p className="mg-v2-homepage-footer-text">© 2026 Core Solution. All rights reserved.</p>
          <div className="mg-v2-homepage-footer-links">
            <Link className="mg-v2-homepage-footer-link" to="/terms">
              {t('common:homepage.Homepage.t_3b9e30dd')}
            </Link>
            <Link className="mg-v2-homepage-footer-link" to="/privacy">
              {t('common:homepage.Homepage.t_339679c5')}
            </Link>
          </div>
        </footer>
        
        <TabletBottomNavigation userRole={null} />
      </div>
    </CommonPageTemplate>
  );
};

export default Homepage;
