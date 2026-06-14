import React from 'react';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../public/layouts/PublicLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import './PrivacyPolicy.css';

const TERMS_PAGE_TITLE_ID = 'terms-of-service-page-title';

/**
 * 이용약관 컴포넌트
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-17
 */

/** 레이아웃 없이 이용약관 본문만 렌더 (페이지·모달 공용). omitHeading: AdminCommonLayout+ContentHeader와 함께 쓸 때 h1 중복 방지 */
export const TermsOfServiceContent = ({ omitHeading = false }) => {
  const { t } = useTranslation('common');
  return (
    <div className="privacy-policy-container">
        {omitHeading ? null : (
          <h1 className="privacy-policy-title">
            {t('terms.pageTitle')}
          </h1>
        )}

        <div className="privacy-policy-info-box">
          <p className="privacy-policy-info-text">
            <strong>{t('terms.info.effectiveLabel')}</strong> {t('terms.info.effectiveDate')}<br />
            <strong>{t('terms.info.modifiedLabel')}</strong> {t('terms.info.modifiedDate')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section1.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section1.body')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section2.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">{t('terms.section2.intro')}</p>
          <ul className="mg-v2-terms-list">
            <li><strong>{t('terms.section2.item1Label')}</strong>{t('terms.section2.item1Body')}</li>
            <li><strong>{t('terms.section2.item2Label')}</strong>{t('terms.section2.item2Body')}</li>
            <li><strong>{t('terms.section2.item3Label')}</strong>{t('terms.section2.item3Body')}</li>
            <li><strong>{t('terms.section2.item4Label')}</strong>{t('terms.section2.item4Body')}</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section3.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section3.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section3.p2')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section3.p3')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section4.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section4.intro')}
          </p>
          <ul className="mg-v2-terms-list">
            <li>{t('terms.section4.item1')}</li>
            <li>{t('terms.section4.item2')}</li>
            <li>{t('terms.section4.item3')}</li>
            <li>{t('terms.section4.item4')}</li>
            <li>{t('terms.section4.item5')}</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section5.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section5.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section5.p2')}
          </p>
          <ul className="mg-v2-terms-list">
            <li>{t('terms.section5.item1')}</li>
            <li>{t('terms.section5.item2')}</li>
            <li>{t('terms.section5.item3')}</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section6.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section6.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section6.p2')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section6.p3')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section7.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">{t('terms.section7.intro')}</p>
          <ul className="mg-v2-terms-list">
            <li>{t('terms.section7.item1')}</li>
            <li>{t('terms.section7.item2')}</li>
            <li>{t('terms.section7.item3')}</li>
            <li>{t('terms.section7.item4')}</li>
            <li>{t('terms.section7.item5')}</li>
            <li>{t('terms.section7.item6')}</li>
            <li>{t('terms.section7.item7')}</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section8.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section8.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section8.p2')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section8.p3')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section9.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section9.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section9.p2')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section9.p3')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section10.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section10.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section10.p2')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section10.p3')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section11.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section11.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section11.p2')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section12.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section12.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section12.p2')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section12.p3')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section13.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section13.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section13.p2')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('terms.section14.title')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section14.p1')}
          </p>
          <p className="mg-v2-terms-paragraph">
            {t('terms.section14.p2')}
          </p>
        </div>

        <div className="mg-v2-terms-box mg-v2-text-center">
          <p className="mg-v2-text-sm mg-v2-m-0 mg-v2-text-info">
            <strong>{t('terms.footer')}</strong>
          </p>
        </div>
    </div>
  );
};

const TermsOfService = () => {
  const { t } = useTranslation('common');
  return (
    <PublicLayout>
      <ContentArea ariaLabel={t('terms.pageTitle')}>
        <ContentHeader title={t('terms.pageTitle')} titleId={TERMS_PAGE_TITLE_ID} />
        <TermsOfServiceContent omitHeading />
      </ContentArea>
    </PublicLayout>
  );
};

export default TermsOfService;
