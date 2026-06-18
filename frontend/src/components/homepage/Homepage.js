import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import { HOMEPAGE_CONSTANTS } from '../../constants/css-variables';
import { useSession } from '../../contexts/SessionContext';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import { sessionManager } from '../../utils/sessionManager';
import '../../styles/main.css';
import './Homepage.css';

const APPLY_URL = 'https://apply.e-trinity.co.kr';
const SHIELD_LOGO_PATH = '/assets/core-solution-logo.svg';

const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleDashboardOrLogin = async () => {
    if (user) {
      if (user?.role) {
        const authResponse = {
          user,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <CommonPageTemplate
      title="Core Solution — 상담센터 운영 플랫폼"
      description="예약부터 회기, 정산까지. 센터 운영의 모든 것을 한곳에서."
      bodyClass="mg-v2-homepage-body"
    >
      <div className="mg-v2-homepage">
        {/* GNB — 64px, Shield Logo left */}
        <header
          className={`mg-v2-homepage-gnb${isScrolled ? ' mg-v2-homepage-gnb--scrolled' : ''}`}
          role="banner"
        >
          <Link to="/" className="mg-v2-homepage-gnb__logo" aria-label="Core Solution 홈">
            <img
              src={SHIELD_LOGO_PATH}
              alt="Core Solution"
              className="mg-v2-homepage-gnb__logo-img"
            />
          </Link>

          <nav className="mg-v2-homepage-gnb__actions" aria-label="주요 탐색">
            <button
              type="button"
              className="mg-v2-homepage-gnb__btn--secondary"
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
            <a
              href={APPLY_URL}
              className="mg-v2-homepage-gnb__btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              시작하기
            </a>
            <button
              type="button"
              className="mg-v2-homepage-gnb__hamburger"
              onClick={() => setIsMenuOpen(prev => !prev)}
              aria-label="메뉴 열기"
              aria-expanded={isMenuOpen}
            >
              <i className="bi bi-list" />
            </button>
          </nav>
        </header>

        {/* Mobile Drawer */}
        {isMenuOpen && (
          <div
            className="mg-v2-homepage-drawer-overlay"
            onClick={() => setIsMenuOpen(false)}
            role="presentation"
          >
            <aside
              className="mg-v2-homepage-drawer"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="모바일 메뉴"
            >
              <div className="mg-v2-homepage-drawer__header">
                <h3 className="mg-v2-homepage-drawer__title">메뉴</h3>
                <button
                  type="button"
                  className="mg-v2-homepage-drawer__close"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="메뉴 닫기"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              <nav className="mg-v2-homepage-drawer__nav">
                <button
                  type="button"
                  className="mg-v2-homepage-drawer__item"
                  onClick={() => { setIsMenuOpen(false); navigate('/login'); }}
                >
                  로그인
                </button>
                <a
                  href={APPLY_URL}
                  className="mg-v2-homepage-drawer__item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  시작하기
                </a>
              </nav>
            </aside>
          </div>
        )}

        {/* Hero Section */}
        <section className="mg-v2-homepage-hero" aria-label="메인 히어로">
          <h1 className="mg-v2-homepage-hero__headline">
            예약부터 회기, 정산까지.
            <br />
            센터 운영의 모든 것을 한곳에서.
          </h1>
          <p className="mg-v2-homepage-hero__subcopy">
            복잡한 행정 업무는 코어 솔루션에 맡기고,
            내담자와의 소중한 시간에 집중하세요.
          </p>
          <div className="mg-v2-homepage-hero__cta-group">
            <a
              href={APPLY_URL}
              className="mg-v2-homepage-gnb__btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              시작하기
            </a>
            <button
              type="button"
              className="mg-v2-homepage-gnb__btn--secondary"
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
          </div>

          <div className="mg-v2-homepage-hero__mockup" aria-hidden="true">
            <div className="mg-v2-homepage-hero__mockup-placeholder">
              대시보드 미리보기
            </div>
          </div>
        </section>

        {/* Trust Strip */}
        <section className="mg-v2-homepage-trust" aria-label="보안 인증">
          <span
            style={{ color: 'var(--mg-v2-color-text-secondary)', fontSize: 'var(--mg-v2-font-size-caption)' }}
          >
            ISO 27001 · GDPR · KISA ISMS
          </span>
        </section>

        {/* Footer */}
        <footer className="mg-v2-homepage-footer">
          <p className="mg-v2-homepage-footer__copyright">
            © 2026 Core Solution. All rights reserved.
          </p>
          <div className="mg-v2-homepage-footer__links">
            <Link className="mg-v2-homepage-footer__link" to="/terms">
              이용약관
            </Link>
            <Link className="mg-v2-homepage-footer__link" to="/privacy">
              개인정보처리방침
            </Link>
            <Link className="mg-v2-homepage-footer__link" to="/account-deletion">
              계정 탈퇴
            </Link>
          </div>
        </footer>
      </div>
    </CommonPageTemplate>
  );
};

export default Homepage;
