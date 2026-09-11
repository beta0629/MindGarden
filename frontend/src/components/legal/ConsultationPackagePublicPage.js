/**
 * /legal/products — 테넌트 CONSULTATION_PACKAGE 공개 목록
 * by-subdomain consultationPackages 만 사용. 인증 API 호출 금지.
 *
 * @author CoreSolution
 * @since 2026-09-10
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import ConsultationPackagePublicList from './ConsultationPackagePublicList';
import LegalPublicNav from './LegalPublicNav';
import {
  LEGAL_PUBLIC_LABELS
} from '../../constants/legalPublic';
import { fetchTenantPublicHomeMeta } from '../../utils/tenantPublicHomeMeta';
import './PlatformLegalDocumentPage.css';

const ConsultationPackagePublicPage = () => {
  const [packages, setPackages] = useState([]);
  const [centerName, setCenterName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = await fetchTenantPublicHomeMeta();
        if (cancelled) return;
        const name = meta?.tenant?.name;
        setCenterName(name && String(name).trim() ? String(name).trim() : '');
        setPackages(
          Array.isArray(meta?.tenant?.consultationPackages)
            ? meta.tenant.consultationPackages
            : []
        );
      } catch (err) {
        console.warn('공개 상품 메타 로드 실패:', err);
        if (!cancelled) {
          setPackages([]);
          setCenterName('');
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
    ? `${centerName} — ${LEGAL_PUBLIC_LABELS.PRODUCTS}`
    : LEGAL_PUBLIC_LABELS.PRODUCTS;

  return (
    <CommonPageTemplate
      title={pageTitle}
      description={LEGAL_PUBLIC_LABELS.PRODUCTS}
      bodyClass="mg-platform-legal-body"
    >
      <div className="mg-platform-legal" data-testid="consultation-package-public-page">
        <header className="mg-platform-legal__chrome">
          <Link to="/" className="mg-platform-legal__back">
            홈
          </Link>
          <LegalPublicNav active="products" />
        </header>

        <main className="mg-platform-legal__main">
          {loading ? (
            <p className="mg-platform-legal__status">불러오는 중…</p>
          ) : (
            <ConsultationPackagePublicList
              packages={packages}
              eyebrow={LEGAL_PUBLIC_LABELS.PRODUCTS}
              title="상담 상품·가격"
            />
          )}
        </main>
      </div>
    </CommonPageTemplate>
  );
};

export default ConsultationPackagePublicPage;
