/**
 * LandingPage — Core Solution 서비스 랜딩 페이지
 *
 * Phase C-3 W3: LandingTemplate에 데이터·이벤트를 주입하는 Page 계층.
 * 라우트: /landing
 *
 * 책임:
 * - react-helmet을 통한 SEO meta 주입 (title + description)
 * - i18n 텍스트 (common 네임스페이스, public.landing.* 키)
 * - 정적 features/testimonials 데이터 구성 (API 연동은 Phase 확장 시 추가)
 * - CTA 핸들러 (회원가입/문의 라우팅)
 * - PublicErrorBoundary는 LandingTemplate 내부에서 섹션별 격리
 *
 * react-helmet ^6.1.0 (package.json 확인 완료, react-helmet-async 미사용)
 * mg-v2-* 토큰 한정, 하드코딩 0, React #130 / safeDisplay 준수.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React, { useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LandingTemplate from '../../components/public/templates/LandingTemplate';
import './LandingPage.css';

/* ────────────────────────────────────────────────
   정적 Features 데이터 (Phase 확장 시 API로 대체)
──────────────────────────────────────────────── */
const STATIC_FEATURES = [
  {
    icon: '📅',
    title: null,
    description: null,
    featureKey: 'scheduling',
  },
  {
    icon: '🔒',
    title: null,
    description: null,
    featureKey: 'records',
  },
  {
    icon: '💰',
    title: null,
    description: null,
    featureKey: 'settlement',
  },
];

const STATIC_STATS = [
  { label: null, value: '500+', statKey: 'centers' },
  { label: null, value: '12,000+', statKey: 'users' },
  { label: null, value: '1,200,000+', statKey: 'reservations' },
  { label: null, value: '98%', statKey: 'satisfaction' },
];

const STATIC_TESTIMONIALS = [
  {
    contentKey: 'testimonial1Content',
    authorKey: 'testimonial1Author',
    avatar: null,
  },
  {
    contentKey: 'testimonial2Content',
    authorKey: 'testimonial2Author',
    avatar: null,
  },
  {
    contentKey: 'testimonial3Content',
    authorKey: 'testimonial3Author',
    avatar: null,
  },
];

const ROUTE_SIGNUP = '/onboarding';
const ROUTE_CONTACT = '/onboarding';
const ROUTE_PRICING = '/pricing';

const LandingPage = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  /* ─── CTA 핸들러 ─── */
  const handlePrimaryCtaClick = useCallback(() => {
    navigate(ROUTE_SIGNUP);
  }, [navigate]);

  const handleSecondaryCtaClick = useCallback(() => {
    navigate(ROUTE_PRICING);
  }, [navigate]);

  const handleCtaPrimaryClick = useCallback(() => {
    navigate(ROUTE_SIGNUP);
  }, [navigate]);

  const handleCtaSecondaryClick = useCallback(() => {
    navigate(ROUTE_CONTACT);
  }, [navigate]);

  /* ─── i18n 데이터 조합 ─── */
  const features = STATIC_FEATURES.map((f) => ({
    icon: f.icon,
    title: t(`public.landing.feature.${f.featureKey}.title`, f.featureKey),
    description: t(`public.landing.feature.${f.featureKey}.description`, f.featureKey),
  }));

  const stats = STATIC_STATS.map((s) => ({
    value: s.value,
    label: t(`public.landing.stat.${s.statKey}`, s.statKey),
  }));

  const testimonials = STATIC_TESTIMONIALS.map((item) => ({
    content: t(`public.landing.${item.contentKey}`, ''),
    author: t(`public.landing.${item.authorKey}`, ''),
    avatar: item.avatar,
  }));

  /* ─── 템플릿 props ─── */
  const heroProps = {
    titleSlot: t('public.landing.heroTitle', 'Core Solution for Counseling Centers'),
    subtitleSlot: t('public.landing.heroSubtitle', 'All-in-one solution for scheduling, records, and billing'),
    primaryCta: {
      label: t('public.landing.heroPrimaryCta', 'Get Started Free'),
      onClick: handlePrimaryCtaClick,
    },
    secondaryCta: {
      label: t('public.landing.heroSecondaryCta', 'View Pricing'),
      onClick: handleSecondaryCtaClick,
    },
  };

  const featuresProps = {
    featuresSlot: features,
    columnsDesktop: 3,
    columnsTablet: 2,
  };

  const testimonialsProps = {
    statsSlot: stats,
    testimonialsSlot: testimonials,
    autoPlayMs: 5000,
    pauseOnHover: true,
  };

  const ctaProps = {
    titleSlot: t('public.landing.ctaTitle', 'Experience the difference in counseling center management.'),
    subtitleSlot: t('public.landing.ctaSubtitle', 'Try all features free for 14 days.'),
    primaryCta: {
      label: t('public.landing.ctaPrimaryCta', 'Get Started Free'),
      onClick: handleCtaPrimaryClick,
    },
    secondaryCta: {
      label: t('public.landing.ctaSecondaryCta', 'Contact Us'),
      onClick: handleCtaSecondaryClick,
    },
  };

  return (
    <>
      <Helmet>
        <title>{t('public.landing.pageTitle', 'Core Solution — Counseling Center Management Solution')}</title>
        <meta
          name="description"
          content={t(
            'public.landing.pageDescription',
            'Core Solution provides all-in-one scheduling, records, and billing for counseling centers. Start your free trial today.'
          )}
        />
        <meta property="og:title" content={t('public.landing.pageTitle', 'Core Solution — Counseling Center Management Solution')} />
        <meta
          property="og:description"
          content={t(
            'public.landing.pageDescription',
            'Core Solution provides all-in-one scheduling, records, and billing for counseling centers. Start your free trial today.'
          )}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Core Solution" />
      </Helmet>

      <LandingTemplate
        heroProps={heroProps}
        featuresProps={featuresProps}
        testimonialsProps={testimonialsProps}
        ctaProps={ctaProps}
      />
    </>
  );
};

export default LandingPage;
