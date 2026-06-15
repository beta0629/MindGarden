import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../public/layouts/PublicLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import './PrivacyPolicy.css';
import './AccountDeletionInstructions.css';
import { useTranslation } from 'react-i18next';

const PRIVACY_PAGE_TITLE_ID = 'privacy-policy-page-title';

/**
 * 개인정보 처리방침 컴포넌트
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-17
 */

/** 레이아웃 없이 개인정보처리방침 본문만 렌더 (페이지·모달 공용). omitHeading: ContentHeader와 함께 쓸 때 h1 중복 방지 */
export const PrivacyPolicyContent = ({ omitHeading = false }) => {
  const { t } = useTranslation(); return (
  <div className="privacy-policy-container">
        {omitHeading ? null : (
          <h1 className="privacy-policy-title">
            {t('common:common.PrivacyPolicy.t_532136c0')}
          </h1>
        )}

        <div className="privacy-policy-info-box">
          <p className="privacy-policy-info-text">
            <strong>{t('common:common.PrivacyPolicy.t_e5d18bfe')}</strong> {t('common:common.PrivacyPolicy.t_36fe9935')}<br />
            <strong>{t('common:common.PrivacyPolicy.t_a5d3df85')}</strong> {t('common:common.PrivacyPolicy.t_36fe9935')}
          </p>
        </div>

        <div className="privacy-policy-section">
          <h2 className="privacy-policy-section-title">
            {t('common:common.PrivacyPolicy.t_fd6f6646')}
          </h2>
          <p className="privacy-policy-section-content">
            Core Solution(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul className="privacy-policy-list">
            <li>{t('common:common.PrivacyPolicy.t_a8fd12d9')}</li>
            <li>{t('common:common.PrivacyPolicy.t_12846947')}</li>
            <li>{t('common:common.PrivacyPolicy.t_c11994e7')}</li>
            <li>{t('common:common.PrivacyPolicy.t_42a827f7')}</li>
            <li>{t('common:common.PrivacyPolicy.t_6daeb968')}</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('common:common.PrivacyPolicy.t_a8c993da')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('common:common.PrivacyPolicy.t_0ece66e5')}
          </p>
          <div className="mg-v2-terms-box">
            <h3 className="mg-v2-terms-subtitle">
              {t('common:common.PrivacyPolicy.t_8a683d46')}
            </h3>
            <ul className="mg-v2-terms-list">
              <li><strong>{t('common:common.PrivacyPolicy.t_ae768302')}</strong> {t('common:common.PrivacyPolicy.t_59c2d7cd')}</li>
              <li><strong>{t('common:common.PrivacyPolicy.t_78aeed55')}</strong> {t('common:common.PrivacyPolicy.t_5f6c751c')}</li>
              <li><strong>{t('common:common.PrivacyPolicy.t_309d534b')}</strong> {t('common:common.PrivacyPolicy.t_334d3323')}</li>
              <li><strong>{t('common:common.PrivacyPolicy.t_fb47ef09')}</strong> {t('common:common.PrivacyPolicy.t_f8354f48')}</li>
            </ul>
          </div>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('common:common.PrivacyPolicy.t_18c957fe')}
          </h2>
          <div className="mg-v2-terms-box">
            <h3 className="mg-v2-terms-subtitle">
              {t('common:common.PrivacyPolicy.t_40a20ec3')}
            </h3>
            <ul className="mg-v2-terms-list mg-v2-terms-list-spaced">
              <li>{t('common:common.PrivacyPolicy.t_470d4295')}</li>
              <li>{t('common:common.PrivacyPolicy.t_dd0aad0f')}</li>
              <li>{t('common:common.PrivacyPolicy.t_583081af')}</li>
              <li>{t('common:common.PrivacyPolicy.t_bc866762')}</li>
            </ul>
            
            <h3 className="mg-v2-terms-subtitle">
              {t('common:common.PrivacyPolicy.t_475ba3ec')}
            </h3>
            <ul className="mg-v2-terms-list">
              <li>{t('common:common.PrivacyPolicy.t_eef7e4cd')}</li>
              <li>{t('common:common.PrivacyPolicy.t_0f3e23cf')}</li>
              <li>{t('common:common.PrivacyPolicy.t_70f97ab4')}</li>
            </ul>
          </div>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('common:common.PrivacyPolicy.t_5146831a')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('common:common.PrivacyPolicy.t_46db9499')}
          </p>
          <div className="privacy-policy-warning-box">
            <p className="mg-v2-text-sm mg-v2-m-0 privacy-policy-warning-text">
              <strong>{t('common:common.PrivacyPolicy.t_7c999074')}</strong> 상담 서비스 제공을 위해 상담사에게 필요한 최소한의 정보만 제공되며,
              이는 상담 서비스의 질적 향상을 위한 목적으로만 사용됩니다.
            </p>
          </div>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('common:common.PrivacyPolicy.t_ac5b249f')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('common:common.PrivacyPolicy.t_74ebc067')}
          </p>
          <div className="mg-v2-terms-box">
            <ul className="mg-v2-terms-list">
              <li><strong>{t('common:common.PrivacyPolicy.t_241552e6')}</strong> {t('common:common.PrivacyPolicy.t_d5c1903f')}</li>
              <li><strong>{t('common:common.PrivacyPolicy.t_a957e3d2')}</strong> AWS SES</li>
              <li><strong>{t('common:common.PrivacyPolicy.t_29cc6c6d')}</strong> {t('common:common.PrivacyPolicy.t_740e4b8e')}</li>
            </ul>
          </div>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('common:common.PrivacyPolicy.t_0456052e')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('common:common.PrivacyPolicy.t_69b97b1e')}
          </p>
          <ul className="mg-v2-terms-list">
            <li>{t('common:common.PrivacyPolicy.t_7c864764')}</li>
            <li>{t('common:common.PrivacyPolicy.t_2949c33c')}</li>
            <li>{t('common:common.PrivacyPolicy.t_e75b23a5')}</li>
            <li>{t('common:common.PrivacyPolicy.t_8100b7fb')}</li>
          </ul>
          <p className="mg-v2-text-sm mg-v2-text-secondary privacy-policy-rights-note">
            {t('common:common.PrivacyPolicy.t_235b6c70')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('common:common.PrivacyPolicy.t_6a8e6e76')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('common:common.PrivacyPolicy.t_c3b68299')}
          </p>
          <ul className="mg-v2-terms-list">
            <li>{t('common:common.PrivacyPolicy.t_4bbe0f1d')}</li>
            <li>{t('common:common.PrivacyPolicy.t_6b426210')}</li>
            <li>{t('common:common.PrivacyPolicy.t_660e37dc')}</li>
            <li>{t('common:common.PrivacyPolicy.t_21785f42')}</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('common:common.PrivacyPolicy.t_3b710eba')}
          </h2>
          <div className="mg-v2-terms-box">
            <p className="mg-v2-mb-md">
              <strong>{t('common:common.PrivacyPolicy.t_4101b50b')}</strong> {t('common:common.PrivacyPolicy.t_811affdb')}
            </p>
            <p className="mg-v2-mb-md">
              <strong>{t('common:common.PrivacyPolicy.t_286de003')}</strong> privacy@mindgarden.co.kr
            </p>
            <p className="mg-v2-m-0">
              <strong>{t('common:common.PrivacyPolicy.t_ca3404dd')}</strong> 032-724-8501
            </p>
          </div>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            {t('common:common.PrivacyPolicy.t_0e22fee1')}
          </h2>
          <p className="mg-v2-terms-paragraph">
            {t('common:common.PrivacyPolicy.t_acaa73ca')}
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <Link className="account-deletion-related-link" to="/account-deletion">
            {t('accountDeletion:links.viewAccountDeletion')}
          </Link>
        </div>

        <div className="privacy-policy-conclusion-box">
          <p className="privacy-policy-conclusion-text">
            <strong>{t('common:common.PrivacyPolicy.t_99908d83')}</strong>
          </p>
        </div>
  </div>
);
};

const PrivacyPolicy = () => {
  const { t } = useTranslation(); return (
  <PublicLayout>
    <ContentArea ariaLabel="개인정보 처리방침">
      <ContentHeader title={t('common:common.PrivacyPolicy.t_532136c0')} titleId={PRIVACY_PAGE_TITLE_ID} />
      <PrivacyPolicyContent omitHeading />
    </ContentArea>
  </PublicLayout>
);
};

export default PrivacyPolicy;
