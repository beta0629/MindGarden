/**
 * Step 3: 요금제 선택 — mockup v2 Pricing cards + BillingCycleToggle + TrustBadges
 */

"use client";

import { useMemo, useState } from "react";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import CoreSolutionLogo from "../CoreSolutionLogo";
import BillingCycleToggle, {
  type BillingCycle,
} from "./BillingCycleToggle";
import PricingCard, { type PricingCardVariant } from "./PricingCard";
import TrustBadges from "./TrustBadges";
import type { PricingPlan } from "../../utils/api";
import type { OnboardingFormData } from "../../hooks/useOnboarding";

interface Step3PricingPlanProps {
  formData: OnboardingFormData;
  setFormData: (
    data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)
  ) => void;
  pricingPlans: PricingPlan[];
  loading: boolean;
}

function resolvePlanMeta(plan: PricingPlan) {
  const code = (plan.planCode || plan.name || "").toLowerCase();
  const { PLAN_META } = TRINITY_CONSTANTS.PRICING;

  if (code.includes("enterprise") || code.includes("enter")) {
    return PLAN_META.enterprise;
  }
  if (code.includes("pro") || (plan as { isPopular?: boolean }).isPopular) {
    return PLAN_META.pro;
  }
  return PLAN_META.starter;
}

function formatPrice(amount: number, currency: string = "KRW") {
  if (currency === "KRW") {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return `${amount} ${currency}`;
}

export default function Step3PricingPlan({
  formData,
  setFormData,
  pricingPlans,
  loading,
}: Step3PricingPlanProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    TRINITY_CONSTANTS.PRICING.BILLING_CYCLE.MONTHLY
  );
  const { LABELS, YEARLY_DISCOUNT_RATE } = TRINITY_CONSTANTS.PRICING;

  const displayPlans = useMemo(() => {
    return pricingPlans.map((plan) => {
      const planId = plan.planId || plan.id || plan.planCode || "";
      const meta = resolvePlanMeta(plan);
      const baseFee = plan.baseFee ?? 0;
      const yearlyFee = Math.round(baseFee * (1 - YEARLY_DISCOUNT_RATE));
      const displayFee =
        billingCycle === TRINITY_CONSTANTS.PRICING.BILLING_CYCLE.YEARLY
          ? yearlyFee
          : baseFee;

      const features =
        plan.descriptionKo || plan.description
          ? [plan.descriptionKo || plan.description || ""]
          : meta.fallbackFeatures;

      return {
        planId,
        name: plan.displayNameKo || plan.name || plan.planCode || "요금제",
        priceLabel: formatPrice(displayFee, plan.currency),
        periodLabel:
          billingCycle === TRINITY_CONSTANTS.PRICING.BILLING_CYCLE.YEARLY
            ? LABELS.PERIOD_YEARLY
            : LABELS.PERIOD_MONTHLY,
        subText:
          billingCycle === TRINITY_CONSTANTS.PRICING.BILLING_CYCLE.YEARLY
            ? LABELS.BILLING_DISCOUNT
            : undefined,
        variant: meta.variant as PricingCardVariant,
        iconSrc: meta.iconSrc,
        badgeLabel: "badgeLabel" in meta ? meta.badgeLabel : undefined,
        features,
      };
    });
  }, [pricingPlans, billingCycle, LABELS, YEARLY_DISCOUNT_RATE]);

  const handlePlanSelect = (planId: string) => {
    setFormData((prev) => ({ ...prev, planId }));
  };

  return (
    <div className="trinity-onboarding__step trinity-onboarding-pricing-v2">
      <CoreSolutionLogo variant="primary" className="trinity-core-solution-logo--step" />

      <div className="trinity-onboarding-pricing-v2__toolbar">
        <BillingCycleToggle cycle={billingCycle} onCycleChange={setBillingCycle} />
      </div>

      {loading && pricingPlans.length === 0 ? (
        <div className="trinity-onboarding__message">
          {TRINITY_CONSTANTS.MESSAGES.LOADING_PRICING}
        </div>
      ) : pricingPlans.length === 0 ? (
        <div className="trinity-onboarding__message trinity-onboarding__message--error">
          {TRINITY_CONSTANTS.MESSAGES.NO_PRICING_PLANS}
        </div>
      ) : (
        <div className="trinity-onboarding-pricing-v2__grid">
          {displayPlans.map((plan) => (
            <PricingCard
              key={plan.planId}
              planKey={plan.planId}
              variant={plan.variant}
              nameLabel={plan.name}
              priceLabel={plan.priceLabel}
              periodLabel={plan.periodLabel}
              subText={plan.subText}
              iconSrc={plan.iconSrc}
              badgeLabel={plan.badgeLabel}
              features={plan.features}
              selected={formData.planId === plan.planId}
              onSelect={() => handlePlanSelect(plan.planId)}
            />
          ))}
        </div>
      )}

      <TrustBadges className="trinity-onboarding-pricing-v2__trust" />

      <div className="trinity-onboarding__warning-box">
        <p className="trinity-onboarding__warning-title">
          ⚠️ PG사 결제 프로세스는 추후 진행 예정입니다
        </p>
        <p className="trinity-onboarding__warning-text">
          현재는 결제 수단 등록 없이 바로 온보딩 등록이 가능합니다.
          <br />
          온보딩 승인 후 서비스 이용 시점에 결제 수단을 등록하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
