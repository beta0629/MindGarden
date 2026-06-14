/**
 * PublicHeader — 공개 페이지 GNB (Atom)
 *
 * Design v2 Calm Forest 팔레트 · mg-v2-* 토큰 한정.
 * 로고 + 메인 메뉴 (소개/요금/문의/로그인/시작하기) + 모바일 햄버거.
 * 스크롤 시 elevation 적용.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PublicHeader.css';

const SCROLL_THRESHOLD = 10;

const NAV_ITEMS = [
  { path: '/', labelKey: 'public.nav.about' },
  { path: '/pricing', labelKey: 'public.nav.pricing' },
  { path: '/onboarding', labelKey: 'public.nav.contact' },
];

const PublicHeader = () => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const headerClassName = [
    'mg-v2-public-header',
    isScrolled ? 'mg-v2-public-header--scrolled' : '',
  ].filter(Boolean).join(' ');

  return (
    <header className={headerClassName} role="banner">
      <div className="mg-v2-public-header__inner">
        <Link to="/" className="mg-v2-public-header__logo" aria-label="MindGarden Home">
          <span className="mg-v2-public-header__logo-text">MindGarden</span>
        </Link>

        <nav className="mg-v2-public-header__nav" aria-label={t('public.nav.ariaLabel', 'Main navigation')}>
          {NAV_ITEMS.map(({ path, labelKey }) => (
            <Link
              key={path}
              to={path}
              className={`mg-v2-public-header__nav-link${pathname === path ? ' mg-v2-public-header__nav-link--active' : ''}`}
            >
              {t(labelKey, labelKey.split('.').pop())}
            </Link>
          ))}
        </nav>

        <div className="mg-v2-public-header__actions">
          <Link to="/login" className="mg-v2-public-header__login-btn">
            {t('public.nav.login', 'Login')}
          </Link>
          <Link to="/onboarding" className="mg-v2-public-header__cta-btn">
            {t('public.nav.getStarted', 'Get Started')}
          </Link>
        </div>

        <button
          className={`mg-v2-public-header__hamburger${isMobileMenuOpen ? ' mg-v2-public-header__hamburger--open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label={t('public.nav.menuToggle', 'Toggle menu')}
          aria-expanded={isMobileMenuOpen}
          aria-controls="public-mobile-menu"
          type="button"
        >
          <span className="mg-v2-public-header__hamburger-line" />
          <span className="mg-v2-public-header__hamburger-line" />
          <span className="mg-v2-public-header__hamburger-line" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="mg-v2-public-header__mobile-overlay"
          onClick={closeMobileMenu}
          role="presentation"
        />
      )}

      <nav
        id="public-mobile-menu"
        ref={mobileMenuRef}
        className={`mg-v2-public-header__mobile-menu${isMobileMenuOpen ? ' mg-v2-public-header__mobile-menu--open' : ''}`}
        aria-label={t('public.nav.mobileAriaLabel', 'Mobile navigation')}
        aria-hidden={!isMobileMenuOpen}
      >
        {NAV_ITEMS.map(({ path, labelKey }) => (
          <Link
            key={path}
            to={path}
            className={`mg-v2-public-header__mobile-link${pathname === path ? ' mg-v2-public-header__mobile-link--active' : ''}`}
            onClick={closeMobileMenu}
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            {t(labelKey, labelKey.split('.').pop())}
          </Link>
        ))}
        <div className="mg-v2-public-header__mobile-actions">
          <Link
            to="/login"
            className="mg-v2-public-header__mobile-login"
            onClick={closeMobileMenu}
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            {t('public.nav.login', 'Login')}
          </Link>
          <Link
            to="/onboarding"
            className="mg-v2-public-header__mobile-cta"
            onClick={closeMobileMenu}
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            {t('public.nav.getStarted', 'Get Started')}
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default PublicHeader;
