import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import { HOMEPAGE_CONSTANTS } from '../../constants/css-variables';
import { useSession } from '../../contexts/SessionContext';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import { sessionManager } from '../../utils/sessionManager';
import badgeIso from '../../assets/landing/badge-iso27001.svg';
import badgeGdpr from '../../assets/landing/badge-gdpr.svg';
import badgeKisa from '../../assets/landing/badge-kisa-isms.svg';
import '../../styles/main.css';
import './Homepage.css';

const APPLY_URL = 'https://apply.e-trinity.co.kr';
const SHIELD_LOGO_PATH = '/assets/core-solution-logo.svg';

const FEATURES = [
  {
    icon: 'bi-calendar-check',
    title: '일정 · 회기 · 정산',
    desc: '예약부터 회기 기록, 자동 정산까지 하나의 흐름으로 관리합니다. 수기 엑셀 작업을 줄이고 센터 운영에 집중하세요.'
  },
  {
    icon: 'bi-people',
    title: '상담사 · 내담자 관리',
    desc: '상담사 배정, 내담자 접수, 매칭 이력을 한 화면에서 확인합니다. 사각지대 없는 케어가 가능합니다.'
  },
  {
    icon: 'bi-arrow-repeat',
    title: 'ERP 연동 · 자동화',
    desc: '입금 확인, 회기 권한 부여, 정산 차감을 자동 파이프라인으로 처리합니다. 수작업 오류를 원천 차단합니다.'
  }
];

const TRUST_BADGES = [
  { src: badgeIso, alt: 'ISO 27001 인증' },
  { src: badgeGdpr, alt: 'GDPR Ready' },
  { src: badgeKisa, alt: 'KISA ISMS 인증' }
];

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

  const handleDashboardOrLogin = async() => {
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

        {/* Hero Section — Calm Forest gradient background */}
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

          {/* Dashboard Preview — actual SVG embed */}
          <div className="mg-v2-homepage-hero__mockup" aria-hidden="true">
            <img
              src="/assets/dashboard-preview.svg"
              alt=""
              className="mg-v2-homepage-hero__mockup-img"
            />
          </div>
        </section>

        {/* Trust Strip — badge icons */}
        <section className="mg-v2-homepage-trust" aria-label="보안 인증">
          {TRUST_BADGES.map((badge) => (
            <img
              key={badge.alt}
              src={badge.src}
              alt={badge.alt}
              className="mg-v2-homepage-trust__badge"
            />
          ))}
        </section>

        {/* Features 3-column — 상담센터 정체성 */}
        <section className="mg-v2-homepage-features" aria-label="주요 기능">
          <h2 className="mg-v2-homepage-features__title">
            센터 운영, 이렇게 달라집니다
          </h2>
          <div className="mg-v2-homepage-features__grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="mg-v2-homepage-feature-card">
                <div className="mg-v2-homepage-feature-card__icon" aria-hidden="true">
                  <i className={`bi ${feature.icon}`} />
                </div>
                <h3 className="mg-v2-homepage-feature-card__title">{feature.title}</h3>
                <p className="mg-v2-homepage-feature-card__desc">{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Secondary CTA Band */}
        <section className="mg-v2-homepage-cta-band" aria-label="도입 문의">
          <h2 className="mg-v2-homepage-cta-band__headline">
            우리 센터에도 도입할 수 있을까?
          </h2>
          <p className="mg-v2-homepage-cta-band__desc">
            센터 규모와 상관없이 시작할 수 있습니다. 무료 체험으로 직접 확인해 보세요.
          </p>
          <a
            href={APPLY_URL}
            className="mg-v2-homepage-gnb__btn--primary mg-v2-homepage-cta-band__btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            센터 도입 문의
          </a>
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
