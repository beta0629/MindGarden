/**
 * PublicFooter — 공개 페이지 푸터 (Atom)
 *
 * Design v2 Calm Forest 팔레트 · mg-v2-* 토큰 한정.
 * Core Solution 회사 정보, 약관/개인정보/계정삭제/Contact 링크.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PublicFooter.css';

const CURRENT_YEAR = new Date().getFullYear();

const COMPANY_INFO = {
  name: 'Core Solution',
  ceo: 'CEO Choi Dagyeong',
  businessNumber: '767-18-02393',
  address: 'Seoul, Republic of Korea',
  email: 'support@core-solution.co.kr',
};

const FOOTER_LINKS = [
  { path: '/privacy', labelKey: 'public.footer.privacy' },
  { path: '/terms', labelKey: 'public.footer.terms' },
  { path: '/account-deletion', labelKey: 'public.footer.accountDeletion' },
];

const PublicFooter = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="mg-v2-public-footer" role="contentinfo">
      <div className="mg-v2-public-footer__inner">
        <div className="mg-v2-public-footer__brand">
          <Link to="/" className="mg-v2-public-footer__logo" aria-label={t('public.homeAriaLabel', 'Core Solution Home')}>
            <span className="mg-v2-public-footer__logo-text">{t('public.brandName', 'Core Solution')}</span>
          </Link>
          <p className="mg-v2-public-footer__tagline">
            {t('public.footer.tagline', 'Professional counseling management platform')}
          </p>
        </div>

        <div className="mg-v2-public-footer__links">
          <h3 className="mg-v2-public-footer__links-title">
            {t('public.footer.legal', 'Legal')}
          </h3>
          <nav aria-label={t('public.footer.legalAriaLabel', 'Legal links')}>
            {FOOTER_LINKS.map(({ path, labelKey }) => (
              <Link key={path} to={path} className="mg-v2-public-footer__link">
                {t(labelKey, labelKey.split('.').pop())}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mg-v2-public-footer__contact">
          <h3 className="mg-v2-public-footer__links-title">
            {t('public.footer.contact', 'Contact')}
          </h3>
          <address className="mg-v2-public-footer__address">
            <p>{COMPANY_INFO.name}</p>
            <p>{COMPANY_INFO.ceo}</p>
            <p>
              {t('public.footer.businessNumber', 'Business No.')}
              {' '}
              {COMPANY_INFO.businessNumber}
            </p>
            <p>{COMPANY_INFO.address}</p>
            <a
              href={`mailto:${COMPANY_INFO.email}`}
              className="mg-v2-public-footer__email-link"
            >
              {COMPANY_INFO.email}
            </a>
          </address>
        </div>
      </div>

      <div className="mg-v2-public-footer__bottom">
        <p className="mg-v2-public-footer__copyright">
          &copy; {CURRENT_YEAR} {COMPANY_INFO.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default PublicFooter;
