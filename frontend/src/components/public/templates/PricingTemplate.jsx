/**
 * PricingTemplate — 요금제 페이지 템플릿 (Template)
 *
 * PublicLayout 슬롯 내부 레이아웃 조립 담당.
 * PricingCard 3종(Phase C-1) + PricingFeatureMatrix(Phase C-2) 와이어링.
 *
 * 설계 원칙:
 * - useState 금지 (순수 프레젠테이셔널)
 * - 모든 상태/핸들러는 props로 주입 (PricingPage에서 관리)
 * - mg-v2-* 토큰 100% · 하드코딩 0 · 인라인 style 0
 * - 다크 모드 자동 지원 (토큰 기반)
 * - React #130 / safeDisplay 준수 (toDisplayString 사용)
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import PricingCard from '../molecules/PricingCard';
import PricingFeatureMatrix from '../organisms/PricingFeatureMatrix';
import { toDisplayString } from '../../../utils/safeDisplay';
import './PricingTemplate.css';

/** @type {string} */
const ONBOARDING_PATH = '/onboarding';

const PricingTemplate = ({
  plans = [],
  matrixPlans = [],
  matrixCategories = [],
  selectedPlanKey = null,
  onSelectPlan,
  onContactSales,
}) => {
  const { t } = useTranslation('common');

  const handleCardAreaClick = (plan) => {
    if (plan.isEnterprise) {
      if (typeof onContactSales === 'function') onContactSales();
    } else {
      if (typeof onSelectPlan === 'function') onSelectPlan(plan.planKey);
    }
  };

  const hasMatrix = matrixPlans.length > 0 && matrixCategories.length > 0;

  return (
    <div className="mg-v2-pricing-template">
      <header className="mg-v2-pricing-template__header">
        <h1 className="mg-v2-pricing-template__title">
          {t('pricing.pageTitle', 'Simple, Transparent Pricing')}
        </h1>
        <p className="mg-v2-pricing-template__subtitle">
          {t('pricing.pageSubtitle', 'Choose the plan that fits your counseling center.')}
        </p>
      </header>

      <section
        className="mg-v2-pricing-template__cards"
        aria-label={t('pricing.plansAriaLabel', 'Pricing plans')}
        data-testid="pricing-template-cards"
      >
        {plans.map((plan) => {
          const isSelected = selectedPlanKey === plan.planKey;
          const wrapperClass = [
            'mg-v2-pricing-template__card-wrapper',
            isSelected ? 'mg-v2-pricing-template__card-wrapper--selected' : '',
          ].filter(Boolean).join(' ');

          const ctaLabel = plan.isEnterprise
            ? t('pricing.contactSales', 'Contact Sales')
            : t('pricing.getStarted', 'Get Started');

          return (
            <div
              key={toDisplayString(plan.planKey)}
              className={wrapperClass}
              onClick={() => handleCardAreaClick(plan)}
              data-testid={`pricing-card-wrapper-${toDisplayString(plan.planKey)}`}
            >
              <PricingCard
                planKey={plan.planKey}
                nameLabel={toDisplayString(plan.nameLabel)}
                price={plan.price != null ? toDisplayString(plan.price) : null}
                priceUnit={plan.priceUnit != null ? toDisplayString(plan.priceUnit) : null}
                pricePeriod={plan.pricePeriod != null ? toDisplayString(plan.pricePeriod) : null}
                features={Array.isArray(plan.features) ? plan.features.map((f) => toDisplayString(f)) : []}
                ctaLabel={ctaLabel}
                ctaTo={ONBOARDING_PATH}
                isHighlighted={!!plan.isHighlighted}
                isEnterprise={!!plan.isEnterprise}
              />
            </div>
          );
        })}
      </section>

      {hasMatrix && (
        <section
          className="mg-v2-pricing-template__matrix"
          aria-label={t('pricing.matrixAriaLabel', 'Feature comparison')}
          data-testid="pricing-template-matrix"
        >
          <h2 className="mg-v2-pricing-template__matrix-title">
            {t('pricing.matrixTitle', 'Compare plans in detail')}
          </h2>
          <PricingFeatureMatrix
            plans={matrixPlans}
            featureCategories={matrixCategories}
          />
        </section>
      )}
    </div>
  );
};

PricingTemplate.propTypes = {
  /** 요금제 카드 데이터 배열 */
  plans: PropTypes.arrayOf(
    PropTypes.shape({
      planKey: PropTypes.string.isRequired,
      nameLabel: PropTypes.string,
      price: PropTypes.string,
      priceUnit: PropTypes.string,
      pricePeriod: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string),
      isHighlighted: PropTypes.bool,
      isEnterprise: PropTypes.bool,
    })
  ),
  /** PricingFeatureMatrix plans prop */
  matrixPlans: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  /** PricingFeatureMatrix featureCategories prop */
  matrixCategories: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      features: PropTypes.array.isRequired,
    })
  ),
  /** 선택된 요금제 키 (하이라이트 표시) */
  selectedPlanKey: PropTypes.string,
  /** 요금제 선택 핸들러 (planKey 전달) */
  onSelectPlan: PropTypes.func,
  /** Enterprise 카드 문의 핸들러 */
  onContactSales: PropTypes.func,
};

export default PricingTemplate;
