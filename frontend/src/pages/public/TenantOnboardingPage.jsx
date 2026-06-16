/**
 * TenantOnboardingPage — 테넌트 신청 온보딩 페이지 스켈레톤
 *
 * §P 옵션 C: 셀프 신청 → 어드민 심사 하이브리드.
 * 6단계 Stepper 진입점 (각 Step 컴포넌트는 Phase C에서 구현).
 * 라우트: /onboarding
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../components/public/layouts/PublicLayout';
import OnboardingStepper from '../../components/public/molecules/OnboardingStepper';
import './TenantOnboardingPage.css';

const INITIAL_STEP = 0;

const TenantOnboardingPage = () => {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP);

  const handleStepClick = useCallback((stepIndex) => {
    setCurrentStep(stepIndex);
  }, []);

  return (
    <PublicLayout>
      <div className="mg-v2-onboarding-page">
        <header className="mg-v2-onboarding-page__header">
          <h1 className="mg-v2-onboarding-page__title">
            {t('public.onboarding.pageTitle', 'Get Started with Core Solution')}
          </h1>
          <p className="mg-v2-onboarding-page__subtitle">
            {t('public.onboarding.pageSubtitle', 'Set up your counseling center in minutes.')}
          </p>
        </header>

        <OnboardingStepper
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        <section
          className="mg-v2-onboarding-page__step-content"
          aria-live="polite"
          aria-label={t('public.onboarding.stepContentLabel', 'Step content')}
        >
          <div className="mg-v2-onboarding-page__skeleton">
            <div className="mg-v2-onboarding-page__skeleton-block" />
            <div className="mg-v2-onboarding-page__skeleton-block mg-v2-onboarding-page__skeleton-block--short" />
            <div className="mg-v2-onboarding-page__skeleton-block" />
            <p className="mg-v2-onboarding-page__skeleton-text">
              {t('public.onboarding.comingSoon', 'Step content will be available in Phase C.')}
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default TenantOnboardingPage;
