import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../public/layouts/PublicLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import './PrivacyPolicy.css';
import './AccountDeletionInstructions.css';

const ACCOUNT_DELETION_PAGE_TITLE_ID = 'account-deletion-page-title';
const META_DESCRIPTION_SELECTOR = 'meta[name="description"]';

/**
 * 계정 삭제 안내 페이지.
 *
 * Google Play 「데이터 보안 → 사용자 데이터 삭제 정책」(2024-05 시행) 준수를 위해
 * 로그인 없이 누구나 열람할 수 있도록 공개되는 정적 안내 페이지.
 *
 * - 모든 텍스트는 i18n(`accountDeletion` 네임스페이스) 키로 관리한다.
 * - PrivacyPolicy/TermsOfService 와 동일한 레이아웃·디자인 토큰을 사용한다.
 * - SEO: 페이지 마운트 시 document.title 과 meta[name="description"] 을 설정하며,
 *   noindex 등 색인 차단은 적용하지 않는다 (Play 봇 접근 허용).
 *
 * @author CoreSolution
 * @since 2026-06-02
 */

/**
 * 본문만 렌더링하는 공용 컴포넌트. AdminCommonLayout+ContentHeader 와 함께 쓸 때는
 * omitHeading 으로 h1 중복을 방지한다.
 */
export const AccountDeletionInstructionsContent = ({ omitHeading = false }) => {
  const { t } = useTranslation('accountDeletion');

  const retentionRows = t('retainedData.rows', { returnObjects: true });
  const methodASteps = t('procedure.methodA.steps', { returnObjects: true });
  const methodBBodyItems = t('procedure.methodB.bodyItems', { returnObjects: true });
  const deletedItems = t('deletedData.items', { returnObjects: true });

  const rows = Array.isArray(retentionRows) ? retentionRows : [];
  const stepsA = Array.isArray(methodASteps) ? methodASteps : [];
  const bodyItemsB = Array.isArray(methodBBodyItems) ? methodBBodyItems : [];
  const deletedList = Array.isArray(deletedItems) ? deletedItems : [];

  return (
    <div className="privacy-policy-container">
      {omitHeading ? null : (
        <h1 className="privacy-policy-title">{t('pageTitle')}</h1>
      )}

      <div className="privacy-policy-info-box">
        <dl className="account-deletion-info-grid">
          <dt>{t('intro.appLabel')}</dt>
          <dd>{t('intro.appName')}</dd>
          <dt>{t('intro.developerLabel')}</dt>
          <dd>{t('intro.developerName')}</dd>
          <dt>{t('intro.effectiveLabel')}</dt>
          <dd>{t('intro.effectiveDate')}</dd>
        </dl>
      </div>

      <div className="mg-v2-terms-section">
        <h2 className="mg-v2-terms-title">{t('intro.title')}</h2>
        <p className="mg-v2-terms-paragraph">{t('intro.body')}</p>
      </div>

      <div className="mg-v2-terms-section">
        <h2 className="mg-v2-terms-title">{t('procedure.title')}</h2>
        <p className="mg-v2-terms-paragraph">{t('procedure.lead')}</p>

        <div className="account-deletion-method-box">
          <h3 className="account-deletion-method-title">
            {t('procedure.methodA.title')}
          </h3>
          <p className="account-deletion-method-summary">
            {t('procedure.methodA.summary')}
          </p>
          <ol className="account-deletion-steps">
            {stepsA.map((step, index) => (
              <li key={`account-deletion-method-a-step-${index}`}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="account-deletion-method-box">
          <h3 className="account-deletion-method-title">
            {t('procedure.methodB.title')}
          </h3>
          <p className="account-deletion-method-summary">
            {t('procedure.methodB.summary')}
          </p>
          <dl className="account-deletion-email-grid">
            <dt>{t('procedure.methodB.emailLabel')}</dt>
            <dd>
              <a
                className="account-deletion-email-address"
                href={`mailto:${t('procedure.methodB.emailAddress')}?subject=${encodeURIComponent(t('procedure.methodB.subjectText'))}`}
              >
                {t('procedure.methodB.emailAddress')}
              </a>
            </dd>
            <dt>{t('procedure.methodB.subjectLabel')}</dt>
            <dd>{t('procedure.methodB.subjectText')}</dd>
            <dt>{t('procedure.methodB.bodyLabel')}</dt>
            <dd>
              <ul>
                {bodyItemsB.map((item, index) => (
                  <li key={`account-deletion-method-b-body-${index}`}>{item}</li>
                ))}
              </ul>
            </dd>
            <dt>{t('procedure.methodB.responseLabel')}</dt>
            <dd>{t('procedure.methodB.responseText')}</dd>
          </dl>
        </div>
      </div>

      <div className="mg-v2-terms-section">
        <h2 className="mg-v2-terms-title">{t('deletedData.title')}</h2>
        <p className="mg-v2-terms-paragraph">{t('deletedData.lead')}</p>
        <ul className="mg-v2-terms-list">
          {deletedList.map((item, index) => (
            <li key={`account-deletion-deleted-${index}`}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mg-v2-terms-section">
        <h2 className="mg-v2-terms-title">{t('retainedData.title')}</h2>
        <p className="mg-v2-terms-paragraph">{t('retainedData.lead')}</p>
        <table className="account-deletion-retention-table" role="table">
          <thead>
            <tr>
              <th scope="col">{t('retainedData.columnHeaders.type')}</th>
              <th scope="col">{t('retainedData.columnHeaders.period')}</th>
              <th scope="col">{t('retainedData.columnHeaders.basis')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`account-deletion-retention-row-${index}`}>
                <td>{row.type}</td>
                <td className="account-deletion-retention-period">{row.period}</td>
                <td>{row.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="account-deletion-retention-note">{t('retainedData.note')}</p>
      </div>

      <div className="mg-v2-terms-section">
        <h2 className="mg-v2-terms-title">{t('publicAccess.title')}</h2>
        <p className="mg-v2-terms-paragraph">{t('publicAccess.body')}</p>
      </div>

      <div className="mg-v2-terms-section">
        <h2 className="mg-v2-terms-title">{t('contact.title')}</h2>
        <div className="mg-v2-terms-box">
          <dl className="account-deletion-contact-grid">
            <dt>{t('contact.operatorLabel')}</dt>
            <dd>{t('contact.operatorName')}</dd>
            <dt>{t('contact.emailLabel')}</dt>
            <dd>
              <a
                className="account-deletion-email-address"
                href={`mailto:${t('contact.emailValue')}`}
              >
                {t('contact.emailValue')}
              </a>
            </dd>
            <dt>{t('contact.responseHoursLabel')}</dt>
            <dd>{t('contact.responseHoursValue')}</dd>
          </dl>
        </div>
      </div>

      <div className="mg-v2-terms-section">
        <h2 className="mg-v2-terms-title">{t('related.title')}</h2>
        <div className="account-deletion-related-links">
          <Link className="account-deletion-related-link" to="/privacy">
            {t('related.privacyLinkLabel')}
          </Link>
          <Link className="account-deletion-related-link" to="/terms">
            {t('related.termsLinkLabel')}
          </Link>
        </div>
      </div>

      <div className="privacy-policy-conclusion-box">
        <p className="privacy-policy-conclusion-text">
          <strong>{t('footer')}</strong>
        </p>
      </div>
    </div>
  );
};

const AccountDeletionInstructions = () => {
  const { t } = useTranslation('accountDeletion');

  useEffect(() => {
    const previousTitle = typeof document !== 'undefined' ? document.title : '';
    const description = t('meta.description');
    const pageTitle = t('pageTitle');

    if (typeof document !== 'undefined') {
      document.title = pageTitle;

      const metaEl = document.querySelector(META_DESCRIPTION_SELECTOR);
      const previousDescription = metaEl ? metaEl.getAttribute('content') : null;

      if (metaEl) {
        metaEl.setAttribute('content', description);
      } else {
        const created = document.createElement('meta');
        created.setAttribute('name', 'description');
        created.setAttribute('content', description);
        document.head.appendChild(created);
      }

      return () => {
        document.title = previousTitle;
        const currentMeta = document.querySelector(META_DESCRIPTION_SELECTOR);
        if (currentMeta && previousDescription !== null) {
          currentMeta.setAttribute('content', previousDescription);
        }
      };
    }
    return undefined;
  }, [t]);

  return (
    <PublicLayout>
      <ContentArea ariaLabel={t('pageTitle')}>
        <ContentHeader
          title={t('pageTitle')}
          titleId={ACCOUNT_DELETION_PAGE_TITLE_ID}
        />
        <AccountDeletionInstructionsContent omitHeading />
      </ContentArea>
    </PublicLayout>
  );
};

export default AccountDeletionInstructions;
