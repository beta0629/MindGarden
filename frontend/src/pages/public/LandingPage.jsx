/**
 * LandingPage — Core Solution 서비스 랜딩 페이지
 *
 * Design v2 Refine v2 W3 — Multi-Tenant SaaS Platform 카피로 재정의.
 * LandingTemplate(Hero → Features → TrustBadgesGrid → CTA)에
 * i18n 키 기반 데이터를 주입하는 Page 계층.
 *
 * 라우트: / (북마크 호환: /landing → / 리다이렉트)
 *
 * 책임:
 * - react-helmet 으로 SEO meta 주입 (title / description / og)
 * - i18n 키 (common 네임스페이스, public.landing.*)
 * - 정적 Feature/Logo/Badge 데이터 구성 (key + 아이콘 컴포넌트만 코드, 카피는 i18n)
 * - CTA 핸들러 (회원가입 / 데모 라우팅)
 * - DashboardPreview 슬롯에 SVG 자산 주입 (mg-v2-* 토큰 + 16:10)
 *
 * mg-v2-* 토큰 한정, 하드코딩 0 (모든 카피는 i18n), safeDisplay 패턴 준수.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React, { useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LandingTemplate from '../../components/public/templates/LandingTemplate';
import HeroEyebrowChip from '../../components/public/atoms/HeroEyebrowChip';
import SocialProofLogos from '../../components/public/molecules/SocialProofLogos';
import DashboardPreview from '../../components/public/molecules/DashboardPreview';
import {
  IconMultiTenant,
  IconWorkflow,
  IconAnalytics,
} from '../../components/public/atoms/LandingFeatureIcons';
import {
  LANDING_ROUTE_SIGNUP,
  LANDING_ROUTE_DEMO,
  LANDING_ROUTE_CONTACT,
  LANDING_I18N_NAMESPACE,
  LANDING_SOCIAL_PROOF_LOGO_KEYS,
  LANDING_TRUST_BADGE_DEFAULT_ORDER,
  LANDING_TRUST_BADGE_DEFAULT_ARIA_LABEL,
  LANDING_DASHBOARD_PREVIEW_DEFAULT_ALT,
} from '../../constants/landingPublic';
import './LandingPage.css';

/* ────────────────────────────────────────────────
   Landing v2 SPEC §3.4 — Feature 카드 정의
   (아이콘 컴포넌트만 코드, 카피는 i18n 키)
──────────────────────────────────────────────── */
const FEATURE_DEFINITIONS = [
  { key: 'isolation', icon: IconMultiTenant, i18nKey: 'isolation' },
  { key: 'workflow', icon: IconWorkflow, i18nKey: 'workflow' },
  { key: 'analytics', icon: IconAnalytics, i18nKey: 'analytics' },
];

const LandingPage = () => {
  const { t } = useTranslation(LANDING_I18N_NAMESPACE);
  const navigate = useNavigate();

  /* ─── CTA 핸들러 ─── */
  const handlePrimaryHeroCta = useCallback(() => {
    navigate(LANDING_ROUTE_SIGNUP);
  }, [navigate]);

  const handleSecondaryHeroCta = useCallback(() => {
    navigate(LANDING_ROUTE_DEMO);
  }, [navigate]);

  const handlePrimaryFinalCta = useCallback(() => {
    navigate(LANDING_ROUTE_SIGNUP);
  }, [navigate]);

  const handleSecondaryFinalCta = useCallback(() => {
    navigate(LANDING_ROUTE_CONTACT);
  }, [navigate]);

  /* ─── i18n 데이터 조합 ─── */
  const features = useMemo(
    () =>
      FEATURE_DEFINITIONS.map((def) => {
        const IconComponent = def.icon;
        return {
          key: def.key,
          icon: <IconComponent ariaLabel={t(`public.landing.feature.${def.i18nKey}.title`, def.key)} />,
          title: t(`public.landing.feature.${def.i18nKey}.title`, def.key),
          description: t(`public.landing.feature.${def.i18nKey}.desc`, def.key),
        };
      }),
    [t]
  );

  const socialProofLogos = useMemo(
    () => LANDING_SOCIAL_PROOF_LOGO_KEYS.map((logo) => ({ key: logo.key, name: logo.name })),
    []
  );

  const trustBadgeLabels = useMemo(
    () =>
      LANDING_TRUST_BADGE_DEFAULT_ORDER.reduce((acc, key) => {
        acc[key] = t(`public.landing.trust.badge.${key}`, key);
        return acc;
      }, {}),
    [t]
  );

  const pageTitle = t(
    'public.landing.pageTitle',
    'Core Solution — Multi-Tenant SaaS Platform'
  );
  const pageDescription = t(
    'public.landing.pageDescription',
    'Core Solution is a multi-tenant SaaS platform that unifies tenant isolation, automation workflows, and real-time analytics in a single console.'
  );

  /* ─── 템플릿 props ─── */
  const heroProps = {
    eyebrowSlot: (
      <HeroEyebrowChip>
        {t('public.landing.hero.eyebrow', 'Multi-Tenant SaaS Platform')}
      </HeroEyebrowChip>
    ),
    titleLine1Slot: t('public.landing.hero.titleLine1', 'One platform.'),
    titleLine2Slot: t('public.landing.hero.titleLine2', 'Many tenants.'),
    subtitleSlot: t(
      'public.landing.hero.subtitle',
      'Core Solution unifies tenant isolation, automation, and real-time analytics in a single console.'
    ),
    primaryCta: {
      label: t('public.landing.cta.primary', 'Get Started Free'),
      onClick: handlePrimaryHeroCta,
    },
    secondaryCta: {
      label: t('public.landing.cta.secondary', 'View Demo'),
      onClick: handleSecondaryHeroCta,
    },
    socialProofSlot: (
      <SocialProofLogos
        label={t('public.landing.socialProof.title', 'Trusted by 200+ companies')}
        logos={socialProofLogos}
        listAriaLabel={t('public.landing.socialProof.ariaLabel', 'Customer logos')}
      />
    ),
    dashboardSlot: (
      <DashboardPreview
        alt={t('public.landing.preview.alt', LANDING_DASHBOARD_PREVIEW_DEFAULT_ALT)}
        caption={null}
        loading="eager"
      />
    ),
  };

  const featuresProps = {
    featuresSlot: features,
    columnsDesktop: 3,
    columnsTablet: 2,
    ariaLabel: t('public.landing.features.ariaLabel', 'Features'),
  };

  const trustBadgesProps = {
    heading: t('public.landing.trust.heading', 'Trusted Security & Compliance'),
    badges: LANDING_TRUST_BADGE_DEFAULT_ORDER,
    labels: trustBadgeLabels,
    ariaLabel: t('public.landing.trust.ariaLabel', LANDING_TRUST_BADGE_DEFAULT_ARIA_LABEL),
  };

  const ctaProps = {
    titleSlot: t(
      'public.landing.finalCta.title',
      'Run every tenant on a single, scalable console.'
    ),
    subtitleSlot: t(
      'public.landing.finalCta.subtitle',
      'Try Core Solution free for 14 days. No credit card required.'
    ),
    primaryCta: {
      label: t('public.landing.cta.primary', 'Get Started Free'),
      onClick: handlePrimaryFinalCta,
    },
    secondaryCta: {
      label: t('public.landing.cta.contact', 'Contact Sales'),
      onClick: handleSecondaryFinalCta,
    },
  };

  return (
    <>
      <Helmet>
        <html lang={t('public.landing.htmlLang', 'ko')} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={t('public.brandName', 'Core Solution')} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      <LandingTemplate
        heroProps={heroProps}
        featuresProps={featuresProps}
        trustBadgesProps={trustBadgesProps}
        ctaProps={ctaProps}
      />
    </>
  );
};

export default LandingPage;
