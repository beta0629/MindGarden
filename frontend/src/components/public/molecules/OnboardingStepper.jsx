/**
 * OnboardingStepper — 6단계 온보딩 progress indicator (Molecule)
 *
 * §P 옵션 C 결정: 셀프 신청 → 어드민 심사 하이브리드 (6-Step Stepper).
 * 현재/완료/대기 상태 시각화.
 * mg-v2-* 토큰 한정, 모바일 가로 스크롤.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import './OnboardingStepper.css';

const TOTAL_STEPS = 6;

const STEP_KEYS = [
  'public.onboarding.step1',
  'public.onboarding.step2',
  'public.onboarding.step3',
  'public.onboarding.step4',
  'public.onboarding.step5',
  'public.onboarding.step6',
];

const STEP_FALLBACKS = [
  'Basic Info',
  'Business Details',
  'Service Setup',
  'Plan Selection',
  'Verification',
  'Complete',
];

const StepStatus = {
  COMPLETED: 'completed',
  CURRENT: 'current',
  PENDING: 'pending',
};

const getStepStatus = (stepIndex, currentStep) => {
  if (stepIndex < currentStep) return StepStatus.COMPLETED;
  if (stepIndex === currentStep) return StepStatus.CURRENT;
  return StepStatus.PENDING;
};

const OnboardingStepper = ({ currentStep = 0, onStepClick }) => {
  const { t } = useTranslation('common');

  return (
    <nav
      className="mg-v2-onboarding-stepper"
      aria-label={t('public.onboarding.stepperAriaLabel', 'Onboarding progress')}
    >
      <ol className="mg-v2-onboarding-stepper__list" role="list">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => {
          const status = getStepStatus(index, currentStep);
          const stepNumber = index + 1;
          const isClickable = onStepClick && status === StepStatus.COMPLETED;

          return (
            <li
              key={index}
              className={`mg-v2-onboarding-stepper__item mg-v2-onboarding-stepper__item--${status}`}
            >
              {index > 0 && (
                <div
                  className={`mg-v2-onboarding-stepper__connector mg-v2-onboarding-stepper__connector--${
                    index <= currentStep ? 'active' : 'inactive'
                  }`}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                className={`mg-v2-onboarding-stepper__circle mg-v2-onboarding-stepper__circle--${status}`}
                onClick={isClickable ? () => onStepClick(index) : undefined}
                disabled={!isClickable}
                aria-current={status === StepStatus.CURRENT ? 'step' : undefined}
                aria-label={`${t('public.onboarding.stepLabel', 'Step')} ${stepNumber}: ${t(STEP_KEYS[index], STEP_FALLBACKS[index])} — ${
                  status === StepStatus.COMPLETED
                    ? t('public.onboarding.completed', 'Completed')
                    : status === StepStatus.CURRENT
                      ? t('public.onboarding.inProgress', 'In progress')
                      : t('public.onboarding.pending', 'Pending')
                }`}
                tabIndex={isClickable ? 0 : -1}
              >
                {status === StepStatus.COMPLETED ? (
                  <svg
                    className="mg-v2-onboarding-stepper__check-icon"
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
                  <span className="mg-v2-onboarding-stepper__number">{stepNumber}</span>
                )}
              </button>
              <span className="mg-v2-onboarding-stepper__label">
                {t(STEP_KEYS[index], STEP_FALLBACKS[index])}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default OnboardingStepper;
