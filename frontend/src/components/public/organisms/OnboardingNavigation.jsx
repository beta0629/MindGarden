/**
 * OnboardingNavigation — 온보딩 하단 이동·제출 Organism
 *
 * Phase C-1 Onboarding §10 사양.
 * 이전·다음·임시저장·완료 버튼 배치.
 * mg-v2-* 토큰 한정, 다크 모드 자동 지원.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './OnboardingNavigation.css';

const FIRST_STEP = 0;
const LAST_STEP = 5;

const OnboardingNavigation = ({
  currentStep = 0,
  totalSteps = 6,
  onPrev,
  onNext,
  onSave,
  onSubmit,
  isValid = false,
  isSubmitting = false,
}) => {
  const { t } = useTranslation('common');

  const isFirstStep = currentStep === FIRST_STEP;
  const isLastStep = currentStep === LAST_STEP;
  const isSubmitStep = currentStep === LAST_STEP - 1;

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      if (isLastStep) return;
      if (isSubmitStep && onSubmit && isValid) {
        onSubmit();
      } else if (onNext && isValid) {
        onNext();
      }
    }
  }, [isLastStep, isSubmitStep, onSubmit, onNext, isValid]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLastStep) {
    return (
      <nav
        className="mg-v2-onboarding-nav"
        aria-label={t('public.onboarding.navLabel', '온보딩 네비게이션')}
        data-step={currentStep}
      >
        <div className="mg-v2-onboarding-nav__right">
          <button
            type="button"
            className="mg-v2-onboarding-nav__btn mg-v2-onboarding-nav__btn--primary"
            onClick={onNext}
          >
            {t('public.onboarding.goHome', '홈으로 돌아가기')}
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="mg-v2-onboarding-nav"
      aria-label={t('public.onboarding.navLabel', '온보딩 네비게이션')}
      data-step={currentStep}
    >
      <div className="mg-v2-onboarding-nav__left">
        {onSave && (
          <button
            type="button"
            className="mg-v2-onboarding-nav__btn mg-v2-onboarding-nav__btn--secondary"
            onClick={onSave}
            disabled={isSubmitting}
          >
            {t('public.onboarding.saveDraft', '임시저장')}
          </button>
        )}
      </div>

      <div className="mg-v2-onboarding-nav__right">
        {!isFirstStep && (
          <button
            type="button"
            className="mg-v2-onboarding-nav__btn mg-v2-onboarding-nav__btn--outline"
            onClick={onPrev}
            disabled={isSubmitting}
          >
            {t('public.onboarding.prev', '이전')}
          </button>
        )}

        {isSubmitStep ? (
          <button
            type="button"
            className="mg-v2-onboarding-nav__btn mg-v2-onboarding-nav__btn--primary"
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <span className="mg-v2-onboarding-nav__spinner" aria-hidden="true" />}
            {isSubmitting
              ? t('public.onboarding.submitting', '처리 중...')
              : t('public.onboarding.submit', '신청 완료하기')}
          </button>
        ) : (
          <button
            type="button"
            className="mg-v2-onboarding-nav__btn mg-v2-onboarding-nav__btn--primary"
            onClick={onNext}
            disabled={!isValid || isSubmitting}
          >
            {t('public.onboarding.next', '다음 단계로')}
          </button>
        )}
      </div>
    </nav>
  );
};

OnboardingNavigation.propTypes = {
  currentStep: PropTypes.number,
  totalSteps: PropTypes.number,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  onSave: PropTypes.func,
  onSubmit: PropTypes.func,
  isValid: PropTypes.bool,
  isSubmitting: PropTypes.bool,
};

export default OnboardingNavigation;
