/**
 * PricingTemplate — 요금제 페이지 템플릿 (Template, Refine v2)
 *
 * Spec §3 / §9 (W2):
 *   - Eyebrow ("PRICING")
 *   - H1 + Sub-H1
 *   - BillingCycleToggle (월간/연간 20% 할인)
 *   - 3-카드 그리드 (Starter / Pro / Enterprise)
 *   - 자세한 비교 보기 토글 (Compare Matrix expand/collapse)
 *   - TrustBadges 행
 *
 * 설계 원칙:
 *   - useState 금지 (순수 프레젠테이셔널) — 단, 비교 토글 펼침 상태는 컴포넌트 로컬 UI 토글로 한정.
 *   - 가격 계산/주기 상태는 PricingPage 에서 props 로 주입.
 *   - mg-v2-* 토큰 100% · 하드코딩 0 · 인라인 style 0
 *   - React #130 / safeDisplay (toDisplayString)
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import PricingCard from '../molecules/PricingCard';
import BillingCycleToggle from '../molecules/BillingCycleToggle';
import TrustBadges from '../molecules/TrustBadges';
import PricingCompareToggle from '../molecules/PricingCompareToggle';
import PricingFeatureMatrix from '../organisms/PricingFeatureMatrix';
import {
  PRICING_BILLING_CYCLE,
  PRICING_ONBOARDING_PATH,
  PRICING_COMPARE_TARGET_ID,
} from '../../../constants/pricing';
import { toDisplayString } from '../../../utils/safeDisplay';
import './PricingTemplate.css';

const PricingTemplate = ({
  plans = [],
  matrixPlans = [],
  matrixCategories = [],
  selectedPlanKey = null,
  cycle = PRICING_BILLING_CYCLE.MONTHLY,
  onCycleChange,
  onSelectPlan,
  onContactSales,
  initialCompareExpanded = false,
}) => {
  const { t } = useTranslation('common');

  /* 비교 토글 펼침 상태 — 표시/숨김 UI 토글 */
  const [compareExpanded, setCompareExpanded] = useState(initialCompareExpanded);
  const toggleCompare = useCallback(() => {
    setCompareExpanded((prev) => !prev);
  }, []);

  const handleCardAreaClick = (plan) => {
    if (plan.isEnterprise) {
      if (typeof onContactSales === 'function') onContactSales();
    } else if (typeof onSelectPlan === 'function') {
      onSelectPlan(plan.planKey);
    }
  };

  /* Cycle 변화 — page 가 미주입 시 안전 noop */
  const handleCycleChange = useCallback(
    (next) => {
      if (typeof onCycleChange === 'function') onCycleChange(next);
    },
    [onCycleChange]
  );

  const hasMatrix = matrixPlans.length > 0 && matrixCategories.length > 0;

  return (
    <div className="mg-v2-pricing-template">
      <header className="mg-v2-pricing-template__header">
        <span className="mg-v2-pricing-template__eyebrow" aria-hidden="false">
          {toDisplayString(t('public.pricing.eyebrow', 'PRICING'))}
        </span>
        <h1 className="mg-v2-pricing-template__title">
          {toDisplayString(t('public.pricing.heroTitle', '비즈니스 규모에 맞춘 합리적인 요금'))}
        </h1>
        <p className="mg-v2-pricing-template__subtitle">
          {toDisplayString(
            t('public.pricing.heroSubtitle', '모든 플랜은 투명한 가격과 유연한 확장성을 제공합니다.')
          )}
        </p>
        <div className="mg-v2-pricing-template__cycle-toggle">
          <BillingCycleToggle cycle={cycle} onCycleChange={handleCycleChange} />
        </div>
      </header>

      <section
        className="mg-v2-pricing-template__cards"
        aria-label={t('public.pricing.plansAriaLabel', '요금제 플랜')}
        data-testid="pricing-template-cards"
      >
        {plans.map((plan) => {
          const isSelected = selectedPlanKey === plan.planKey;
          const wrapperClass = [
            'mg-v2-pricing-template__card-wrapper',
            isSelected ? 'mg-v2-pricing-template__card-wrapper--selected' : '',
          ].filter(Boolean).join(' ');

          /* 가격: cycle 에 따라 monthly/yearly 표시값 분기 */
          const isYearly = cycle === PRICING_BILLING_CYCLE.YEARLY;
          const numericPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const formattedPrice =
            numericPrice != null
              ? Number(numericPrice).toLocaleString('ko-KR')
              : null;

          const ctaLabel = plan.ctaKey
            ? t(plan.ctaKey, plan.ctaDefault)
            : plan.isEnterprise
              ? t('public.pricing.contactSales', '영업팀 문의')
              : t('public.pricing.getStarted', '시작하기');

          const subText = plan.subTextKey
            ? t(plan.subTextKey, plan.subTextDefault)
            : plan.subTextDefault || null;

          const badgeLabel = plan.badgeKey
            ? t(plan.badgeKey, plan.badgeDefault)
            : null;

          const periodLabel = plan.billingPeriodLabel
            ? plan.billingPeriodLabel
            : null;

          return (
            <div
              key={toDisplayString(plan.planKey)}
              className={wrapperClass}
              onClick={() => handleCardAreaClick(plan)}
              data-testid={`pricing-card-wrapper-${toDisplayString(plan.planKey)}`}
            >
              <PricingCard
                planKey={plan.planKey}
                variant={plan.variant}
                nameLabel={toDisplayString(plan.nameLabel)}
                price={formattedPrice}
                priceUnit={plan.currency}
                pricePeriod={periodLabel}
                subText={subText}
                iconKey={plan.iconKey}
                badgeLabel={badgeLabel}
                features={Array.isArray(plan.features) ? plan.features.map((f) => toDisplayString(f)) : []}
                ctaLabel={ctaLabel}
                ctaTo={PRICING_ONBOARDING_PATH}
                isHighlighted={!!plan.isHighlighted}
                isEnterprise={!!plan.isEnterprise}
              />
            </div>
          );
        })}
      </section>

      <section
        className="mg-v2-pricing-template__bottom"
        aria-label={t('public.pricing.bottomAriaLabel', '추가 정보')}
        data-testid="pricing-template-bottom"
      >
        {hasMatrix && (
          <>
            <div className="mg-v2-pricing-template__compare">
              <PricingCompareToggle
                expanded={compareExpanded}
                onToggle={toggleCompare}
                controlsId={PRICING_COMPARE_TARGET_ID}
              />
            </div>

            <section
              id={PRICING_COMPARE_TARGET_ID}
              className={`mg-v2-pricing-template__matrix${
                compareExpanded ? ' mg-v2-pricing-template__matrix--expanded' : ''
              }`}
              aria-label={t('public.pricing.matrixAriaLabel', '기능 비교')}
              data-testid="pricing-template-matrix"
              hidden={!compareExpanded}
            >
              <h2 className="mg-v2-pricing-template__matrix-title">
                {toDisplayString(t('public.pricing.matrixTitle', '플랜 상세 기능 비교'))}
              </h2>
              <PricingFeatureMatrix
                plans={matrixPlans}
                featureCategories={matrixCategories}
              />
            </section>
          </>
        )}

        <div className="mg-v2-pricing-template__trust">
          <TrustBadges />
        </div>
      </section>
    </div>
  );
};

PricingTemplate.propTypes = {
  /** 요금제 카드 데이터 배열 */
  plans: PropTypes.arrayOf(
    PropTypes.shape({
      planKey: PropTypes.string.isRequired,
      variant: PropTypes.string,
      nameLabel: PropTypes.string,
      monthlyPrice: PropTypes.number,
      yearlyPrice: PropTypes.number,
      currency: PropTypes.string,
      billingPeriodLabel: PropTypes.string,
      subTextKey: PropTypes.string,
      subTextDefault: PropTypes.string,
      badgeKey: PropTypes.string,
      badgeDefault: PropTypes.string,
      iconKey: PropTypes.string,
      ctaKey: PropTypes.string,
      ctaDefault: PropTypes.string,
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
  /** 결제 주기 ('monthly' | 'yearly') */
  cycle: PropTypes.oneOf(Object.values(PRICING_BILLING_CYCLE)),
  /** 결제 주기 변경 핸들러 */
  onCycleChange: PropTypes.func,
  /** 요금제 선택 핸들러 (planKey 전달) */
  onSelectPlan: PropTypes.func,
  /** Enterprise 카드 문의 핸들러 */
  onContactSales: PropTypes.func,
  /** 비교 매트릭스 초기 펼침 여부 (기본 false) */
  initialCompareExpanded: PropTypes.bool,
};

export default PricingTemplate;
