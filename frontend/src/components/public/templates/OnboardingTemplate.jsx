/**
 * OnboardingTemplate — 6단계 온보딩 Template
 *
 * Phase C-3 W1: PublicLayout 안에 OnboardingStepper → OnboardingStepForm → OnboardingNavigation 조립.
 * 자체 상태(useState) 없음 — Page에서 모든 상태를 props로 주입.
 * mg-v2-* 토큰 100%, 다크 모드 자동 지원.
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../layouts/PublicLayout';
import OnboardingStepper from '../molecules/OnboardingStepper';
import OnboardingStepForm from '../organisms/OnboardingStepForm';
import OnboardingNavigation from '../organisms/OnboardingNavigation';
import '../../../styles/tokens/design-v2-tokens-refine.css';
import './OnboardingTemplate.css';

const TOTAL_STEPS = 6;

const OnboardingTemplate = ({
  currentStep,
  formData,
  errors = {},
  domainStatus = 'idle',
  isValid = false,
  isSubmitting = false,
  onChange,
  onDomainCheck,
  onStepClick,
  onPrev,
  onNext,
  onSave,
  onSubmit,
}) => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout className="mg-v2-onboarding-template-layout">
      <article className="mg-v2-onboarding-template">
        <header className="mg-v2-onboarding-template__header">
          <h1 className="mg-v2-onboarding-template__title">
            {t('public.onboarding.pageTitle', 'Core Solution 시작하기')}
          </h1>
          <p className="mg-v2-onboarding-template__subtitle">
            {t('public.onboarding.pageSubtitle', '몇 분이면 상담센터를 개설할 수 있습니다.')}
          </p>
        </header>

        <OnboardingStepper
          currentStep={currentStep}
          onStepClick={onStepClick}
        />

        <section
          className="mg-v2-onboarding-template__body"
          aria-live="polite"
          aria-label={t('public.onboarding.stepContentLabel', '단계별 입력 영역')}
        >
          <OnboardingStepForm
            currentStep={currentStep}
            formData={formData}
            onChange={onChange}
            errors={errors}
            onDomainCheck={onDomainCheck}
            domainStatus={domainStatus}
          />
        </section>

        <OnboardingNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onPrev={onPrev}
          onNext={onNext}
          onSave={onSave}
          onSubmit={onSubmit}
          isValid={isValid}
          isSubmitting={isSubmitting}
        />
      </article>
    </PublicLayout>
  );
};

OnboardingTemplate.propTypes = {
  currentStep: PropTypes.number.isRequired,
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object,
  domainStatus: PropTypes.oneOf(['idle', 'checking', 'available', 'taken']),
  isValid: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onDomainCheck: PropTypes.func,
  onStepClick: PropTypes.func,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  onSave: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default OnboardingTemplate;
