/**
 * PricingPage — 요금제 페이지 스켈레톤
 *
 * §P 옵션 C: Basic/Pro 공개 + Enterprise 견적.
 * PricingCard 3종 (Basic/Pro/Enterprise) 배치 + FAQ 섹션 스켈레톤.
 * 라우트: /pricing
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/layouts/PublicLayout';
import PricingCard from '../../components/public/molecules/PricingCard';
import './PricingPage.css';

const PRICING_PLANS = [
  {
    planKey: 'basic',
    nameLabel: 'Basic',
    price: '49,000',
    priceUnit: '₩',
    pricePeriod: 'mo',
    features: [
      'Up to 5 consultants',
      'Basic scheduling',
      'Client management',
      'Session records',
      'Email support',
    ],
    ctaLabel: null,
    isHighlighted: false,
    isEnterprise: false,
  },
  {
    planKey: 'pro',
    nameLabel: 'Pro',
    price: '149,000',
    priceUnit: '₩',
    pricePeriod: 'mo',
    features: [
      'Up to 20 consultants',
      'Advanced scheduling',
      'Client & session analytics',
      'ERP integration',
      'SMS/Kakao notifications',
      'Priority support',
    ],
    ctaLabel: null,
    isHighlighted: true,
    isEnterprise: false,
  },
  {
    planKey: 'enterprise',
    nameLabel: 'Enterprise',
    price: null,
    priceUnit: null,
    pricePeriod: null,
    features: [
      'Unlimited consultants',
      'Custom branding',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'On-premise option',
    ],
    ctaLabel: null,
    isHighlighted: false,
    isEnterprise: true,
  },
];

const PricingPage = () => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
      <div className="mg-v2-pricing-page">
        <header className="mg-v2-pricing-page__header">
          <h1 className="mg-v2-pricing-page__title">
            {t('public.pricing.pageTitle', 'Simple, Transparent Pricing')}
          </h1>
          <p className="mg-v2-pricing-page__subtitle">
            {t('public.pricing.pageSubtitle', 'Choose the plan that fits your counseling center.')}
          </p>
        </header>

        <section
          className="mg-v2-pricing-page__cards"
          aria-label={t('public.pricing.plansAriaLabel', 'Pricing plans')}
        >
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.planKey}
              {...plan}
              ctaLabel={
                plan.isEnterprise
                  ? t('public.pricing.contactSales', 'Contact Sales')
                  : t('public.pricing.getStarted', 'Get Started')
              }
              ctaTo={plan.isEnterprise ? '/onboarding' : '/onboarding'}
            />
          ))}
        </section>

        <section className="mg-v2-pricing-page__faq" aria-label={t('public.pricing.faqAriaLabel', 'FAQ')}>
          <h2 className="mg-v2-pricing-page__faq-title">
            {t('public.pricing.faqTitle', 'Frequently Asked Questions')}
          </h2>
          <div className="mg-v2-pricing-page__faq-skeleton">
            <div className="mg-v2-pricing-page__faq-item" />
            <div className="mg-v2-pricing-page__faq-item" />
            <div className="mg-v2-pricing-page__faq-item" />
            <p className="mg-v2-pricing-page__faq-coming-soon">
              {t('public.pricing.faqComingSoon', 'FAQ content will be available in Phase C.')}
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default PricingPage;
