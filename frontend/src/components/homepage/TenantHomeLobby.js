/**
 * Clinic-OS Tenant Branding Home v3 — 테넌트 호스트 루트 로비
 *
 * 상담 안내 destination: 페이지 내 #counseling-guide (소프트 워시 슬롯)로 스크롤.
 * 상품·가격은 CONSULTATION_PACKAGE 공개 리스트. 약관은 /legal/* 푸터 링크.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import MerchantLegalFooterPreview from '../tenant/MerchantLegalFooterPreview';
import ConsultationPackagePublicList from '../legal/ConsultationPackagePublicList';
import { LEGAL_PUBLIC_LABELS } from '../../constants/legalPublic';
import { fetchTenantPublicHomeMeta } from '../../utils/tenantPublicHomeMeta';
import './TenantHomeLobby.css';

const EMPTY_LEGAL = {
  businessRegistrationNumber: '',
  representativeName: '',
  businessLandline: '',
  businessAddress: '',
  mailOrderReportNumber: '',
  refundPolicyText: '',
  productPriceGuideText: ''
};

const TenantHomeLobby = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchTenantPublicHomeMeta();
        if (!cancelled) setMeta(result);
      } catch (err) {
        console.warn('테넌트 홈 메타 로드 실패:', err);
        if (!cancelled) setMeta({ found: false, tenant: null, host: window.location.host, subdomain: '' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setEntered(true);
      return undefined;
    }
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, [loading]);

  const centerName = useMemo(() => {
    const n = meta?.tenant?.name;
    return n && String(n).trim() ? String(n).trim() : '{센터명}';
  }, [meta]);

  const hostLabel = meta?.host || (typeof window !== 'undefined' ? window.location.host : '');
  const brand = meta?.tenant?.primaryColor || '';
  const legal = meta?.tenant?.merchantLegal || EMPTY_LEGAL;
  const consultationPackages = meta?.tenant?.consultationPackages || [];

  const styleVars = brand
    ? { '--brand': brand, '--tenant-primary': brand }
    : undefined;

  const scrollToGuide = (e) => {
    e.preventDefault();
    const el = document.getElementById('counseling-guide');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <CommonPageTemplate title="센터 홈" description="심리상담센터 홈" bodyClass="mg-tenant-home-body">
        <div className="mg-tenant-home mg-tenant-home--loading" aria-busy="true">
          <p className="mg-tenant-home__loading-text">불러오는 중…</p>
        </div>
      </CommonPageTemplate>
    );
  }

  return (
    <CommonPageTemplate
      title={`${centerName} — 심리상담센터`}
      description={`${centerName} 홈. 예약과 안내는 로그인 후 이어집니다.`}
      bodyClass="mg-tenant-home-body"
    >
      <div
        className={`mg-tenant-home${entered ? ' mg-tenant-home--entered' : ''}`}
        style={styleVars}
        data-testid="tenant-home-lobby"
      >
        <header className="mg-tenant-home__chrome" role="banner">
          <div className="mg-tenant-home__chrome-left">
            <span className="mg-tenant-home__center-name" data-testid="tenant-home-center-name">
              {centerName}
            </span>
            <span className="mg-tenant-home__host" data-testid="tenant-home-host">
              {hostLabel}
            </span>
          </div>
          <button
            type="button"
            className="mg-tenant-home__ghost-login"
            onClick={() => navigate('/login')}
          >
            로그인
          </button>
        </header>

        <main className="mg-tenant-home__main">
          <section className="mg-tenant-home__hero" aria-labelledby="tenant-home-h1">
            <p className="mg-tenant-home__eyebrow">심리상담센터</p>
            <h1 id="tenant-home-h1" className="mg-tenant-home__h1">
              <span className="mg-tenant-home__h1-name">{centerName}</span>
              <span className="mg-tenant-home__h1-line">천천히, 안전하게.</span>
            </h1>
            <p className="mg-tenant-home__lead">
              이 주소는 이 센터의 홈입니다. 예약과 안내는 로그인 후 이어지고, 사업자·약관은 아래 푸터에서
              확인할 수 있어요.
            </p>
            <div className="mg-tenant-home__cta-row">
              <button
                type="button"
                className="mg-tenant-home__cta-primary"
                onClick={() => navigate('/login')}
                data-testid="tenant-home-login-cta"
              >
                로그인
              </button>
              <a
                href="#counseling-guide"
                className="mg-tenant-home__cta-text"
                onClick={scrollToGuide}
                data-testid="tenant-home-guide-link"
              >
                상담 안내
              </a>
            </div>
          </section>

          <section
            id="counseling-guide"
            className="mg-tenant-home__wash"
            aria-label="상담 안내"
            data-testid="tenant-home-wash"
          >
            <div className="mg-tenant-home__wash-inner">
              <h2 className="mg-tenant-home__wash-title">상담 안내</h2>
              <p className="mg-tenant-home__wash-body">
                예약·일정·안내는 로그인 후 이어집니다. 이용약관·개인정보·상품·가격은 아래 공개 페이지와
                푸터 링크에서 확인할 수 있습니다.
              </p>
            </div>
          </section>

          <ConsultationPackagePublicList
            id="tenant-home-products"
            className="mg-tenant-home__products"
            packages={consultationPackages}
            eyebrow={LEGAL_PUBLIC_LABELS.PRODUCTS}
            title="상담 상품·가격"
          />
        </main>

        <MerchantLegalFooterPreview centerName={centerName} legal={legal} />
      </div>
    </CommonPageTemplate>
  );
};

export default TenantHomeLobby;
