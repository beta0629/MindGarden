/**
 * OnboardingStepDots — 4-dot 온보딩 진행 표시기 Atom (Phase C-Refine v2)
 *
 * SPEC §3.2 / §8: 상단 중앙 배치, dot 크기 32x32px, 활성 상태 배경 Primary.
 * 기존 텍스트 기반 OnboardingStepper(6단계) 와 별개로 v2 mockup 의 4-dot 시각 stepper.
 *
 * Reference: docs/design/v2/refine/v2/DESIGN_V2_REFINE_V2_ONBOARDING_SPEC.md §3.2 §8 OnboardingStepper.jsx
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './OnboardingStepDots.css';

const DEFAULT_TOTAL_STEPS = 4;

const STEP_STATUS = Object.freeze({
  COMPLETED: 'completed',
  CURRENT: 'current',
  PENDING: 'pending',
});

const getStatus = (index, current) => {
  if (index < current) return STEP_STATUS.COMPLETED;
  if (index === current) return STEP_STATUS.CURRENT;
  return STEP_STATUS.PENDING;
};

const OnboardingStepDots = ({
  totalSteps = DEFAULT_TOTAL_STEPS,
  currentStep = 0,
  onStepClick,
  className = '',
}) => {
  const { t } = useTranslation('common');

  return (
    <nav
      className={`mg-v2-onboarding-step-dots ${className}`.trim()}
      aria-label={t('public.onboarding.v2.stepperAriaLabel', '온보딩 진행률')}
    >
      <ol className="mg-v2-onboarding-step-dots__list" role="list">
        {Array.from({ length: totalSteps }, (_, index) => {
          const status = getStatus(index, currentStep);
          const stepNumber = index + 1;
          const isClickable = Boolean(onStepClick) && status === STEP_STATUS.COMPLETED;

          return (
            <li
              key={index}
              className={`mg-v2-onboarding-step-dots__item mg-v2-onboarding-step-dots__item--${status}`}
            >
              {index > 0 && (
                <span
                  className={`mg-v2-onboarding-step-dots__connector mg-v2-onboarding-step-dots__connector--${
                    index <= currentStep ? 'active' : 'inactive'
                  }`}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                className={`mg-v2-onboarding-step-dots__dot mg-v2-onboarding-step-dots__dot--${status}`}
                onClick={isClickable ? () => onStepClick(index) : undefined}
                disabled={!isClickable}
                aria-current={status === STEP_STATUS.CURRENT ? 'step' : undefined}
                aria-label={`${t('public.onboarding.v2.stepLabel', 'Step')} ${stepNumber} ${t('public.onboarding.v2.stepOf', 'OF')} ${totalSteps}`}
                tabIndex={isClickable ? 0 : -1}
              >
                {status === STEP_STATUS.COMPLETED ? (
                  <svg
                    className="mg-v2-onboarding-step-dots__check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="mg-v2-onboarding-step-dots__number">{stepNumber}</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

OnboardingStepDots.propTypes = {
  totalSteps: PropTypes.number,
  currentStep: PropTypes.number,
  onStepClick: PropTypes.func,
  className: PropTypes.string,
};

export default OnboardingStepDots;
