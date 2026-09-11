/**
 * /legal/refund — 청약철회·환불 공개 안내
 * 테넌트 refundPolicyText 우선, 없으면 플랫폼 SSOT ## refund 폴백.
 * Modal-only 공개 법적 문서 금지 — crawlable GET 페이지.
 *
 * @author CoreSolution
 * @since 2026-09-11
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import LegalPublicNav from './LegalPublicNav';
import {
  LEGAL_PUBLIC_LABELS,
  PLATFORM_LEGAL_SECTIONS
} from '../../constants/legalPublic';
import {
  extractPlatformLegalSection,
  fetchPlatformLegalCopyMarkdown,
  renderQuietLegalHtmlFromMarkdown
} from '../../utils/platformLegalCopy';
import { fetchTenantPublicHomeMeta } from '../../utils/tenantPublicHomeMeta';
import './PlatformLegalDocumentPage.css';

/**
 * @returns {JSX.Element}
 */
const RefundPolicyPublicPage = () => {
  const [centerName, setCenterName] = useState('');
  const [tenantRefundText, setTenantRefundText] = useState('');
  const [platformHtml, setPlatformHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFailed(false);

        const [meta, markdown] = await Promise.all([
          fetchTenantPublicHomeMeta().catch(() => null),
          fetchPlatformLegalCopyMarkdown()
        ]);

        if (cancelled) return;

        const name = meta?.tenant?.name;
        setCenterName(name && String(name).trim() ? String(name).trim() : '');

        const refundRaw = meta?.tenant?.merchantLegal?.refundPolicyText;
        const refundTrimmed =
          refundRaw && String(refundRaw).trim() ? String(refundRaw).trim() : '';
        setTenantRefundText(refundTrimmed);

        const section = extractPlatformLegalSection(
          markdown,
          PLATFORM_LEGAL_SECTIONS.REFUND
        );
        const rendered = section
          ? renderQuietLegalHtmlFromMarkdown(section)
          : '';
        setPlatformHtml(rendered);
        setFailed(!refundTrimmed && !rendered);
      } catch (err) {
        console.warn('환불·청약철회 안내 로드 실패:', err);
        if (!cancelled) {
          setTenantRefundText('');
          setPlatformHtml('');
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pageTitle = centerName
    ? `${centerName} — ${LEGAL_PUBLIC_LABELS.REFUND}`
    : LEGAL_PUBLIC_LABELS.REFUND;

  const showTenant = Boolean(tenantRefundText);
  const showPlatformFallback = !showTenant && Boolean(platformHtml);

  return (
    <CommonPageTemplate
      title={pageTitle}
      description={LEGAL_PUBLIC_LABELS.REFUND}
      bodyClass="mg-platform-legal-body"
    >
      <div
        className="mg-platform-legal"
        data-testid="refund-policy-public-page"
      >
        <header className="mg-platform-legal__chrome">
          <Link to="/" className="mg-platform-legal__back">
            홈
          </Link>
          <LegalPublicNav active="refund" />
        </header>

        <main className="mg-platform-legal__main">
          <h1 className="mg-platform-legal__h1">{LEGAL_PUBLIC_LABELS.REFUND}</h1>
          {loading ? (
            <p className="mg-platform-legal__status">불러오는 중…</p>
          ) : failed ? (
            <p
              className="mg-platform-legal__empty"
              data-testid="refund-policy-empty"
              role="status"
            >
              문서를 확인할 수 없습니다.
            </p>
          ) : showTenant ? (
            <article
              className="mg-platform-legal__article mg-platform-legal__article--pre"
              data-testid="refund-policy-tenant-body"
            >
              {tenantRefundText}
            </article>
          ) : showPlatformFallback ? (
            <article
              className="mg-platform-legal__article"
              data-testid="refund-policy-platform-body"
              dangerouslySetInnerHTML={{ __html: platformHtml }}
            />
          ) : (
            <p
              className="mg-platform-legal__empty"
              data-testid="refund-policy-empty"
              role="status"
            >
              문서를 확인할 수 없습니다.
            </p>
          )}
        </main>
      </div>
    </CommonPageTemplate>
  );
};

export default RefundPolicyPublicPage;
