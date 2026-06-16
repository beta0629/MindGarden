/**
 * OnboardingTemplate — 40/60 Split View 레이아웃 (Phase C-Refine v2)
 *
 * SPEC §2, §3, §6 / docs/design/v2/refine/v2/DESIGN_V2_REFINE_V2_ONBOARDING_SPEC.md
 *   - 좌측 40% Dark Navy Panel: Brand wordmark + TenantNetworkVisual + Value Proposition + "STEP X OF N"
 *   - 우측 60% White Form Panel: 4-dot Stepper + 폼 children
 *   - 반응형: Desktop 40/60, Tablet 상단 hero 변환, Mobile 좌측 패널 숨김
 *
 * 자체 상태(useState) 없음 — Page 에서 모든 상태를 props 로 주입.
 * mg-v2-onboarding-* 토큰 100%, 하드코딩 0.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import BrandSymbol from '../atoms/BrandSymbol';
import OnboardingStepDots from '../atoms/OnboardingStepDots';
import TenantNetworkVisual from '../molecules/TenantNetworkVisual';
import '../../../styles/tokens/design-v2-tokens-refine.css';
import './OnboardingTemplate.css';

const DEFAULT_TOTAL_STEPS = 4;
const BRAND_SYMBOL_SIZE = 32;
const FULL_PERCENT = 100;

const OnboardingTemplate = ({
  currentStep,
  totalSteps = DEFAULT_TOTAL_STEPS,
  onStepClick,
  children,
}) => {
  const { t } = useTranslation('common');

  const safeCurrent = Math.max(0, Math.min(currentStep, totalSteps - 1));
  const progressPercent = ((safeCurrent + 1) / totalSteps) * FULL_PERCENT;

  return (
    <div
      className="mg-v2-onboarding-split"
      data-testid="onboarding-split"
    >
      <aside
        className="mg-v2-onboarding-split__left"
        aria-label={t('public.onboarding.v2.brandPanelAria', 'Core Solution 브랜드 패널')}
      >
        <header className="mg-v2-onboarding-split__brand">
          <BrandSymbol variant="dark" size={BRAND_SYMBOL_SIZE} />
          <span className="mg-v2-onboarding-split__brand-name">
            {t('public.brandName', 'Core Solution')}
          </span>
        </header>

        <TenantNetworkVisual className="mg-v2-onboarding-split__visual" />

        <footer className="mg-v2-onboarding-split__value-prop">
          <h2 className="mg-v2-onboarding-split__value-title">
            {t('public.onboarding.v2.valuePropTitle', '여러 테넌트, 하나의 플랫폼')}
          </h2>
          <p className="mg-v2-onboarding-split__value-desc">
            {t('public.onboarding.v2.valuePropDesc', 'Core Solution에서 비즈니스 운영을 통합하세요')}
          </p>
          <div className="mg-v2-onboarding-split__step-indicator" aria-live="polite">
            <span className="mg-v2-onboarding-split__step-label">
              <span className="mg-v2-onboarding-split__step-current">
                {`${t('public.onboarding.v2.stepLabel', 'STEP')} ${safeCurrent + 1}`}
              </span>
              <span className="mg-v2-onboarding-split__step-total">
                {` ${t('public.onboarding.v2.stepOf', 'OF')} ${totalSteps}`}
              </span>
            </span>
            <div
              className="mg-v2-onboarding-split__step-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalSteps}
              aria-valuenow={safeCurrent + 1}
            >
              <div
                className="mg-v2-onboarding-split__step-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </footer>
      </aside>

      <main className="mg-v2-onboarding-split__right">
        <div className="mg-v2-onboarding-split__form-wrapper">
          <OnboardingStepDots
            totalSteps={totalSteps}
            currentStep={safeCurrent}
            onStepClick={onStepClick}
          />
          {children}
        </div>
      </main>
    </div>
  );
};

OnboardingTemplate.propTypes = {
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number,
  onStepClick: PropTypes.func,
  children: PropTypes.node,
};

export default OnboardingTemplate;
