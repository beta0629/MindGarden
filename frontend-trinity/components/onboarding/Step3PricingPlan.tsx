/**
 * Step 3: 요금제 선택 컴포넌트
 */

import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import type { PricingPlan } from "../../utils/api";
import type { OnboardingFormData } from "../../hooks/useOnboarding";

interface Step3PricingPlanProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)) => void;
  pricingPlans: PricingPlan[];
  loading: boolean;
}

export default function Step3PricingPlan({
  formData,
  setFormData,
  pricingPlans,
  loading,
}: Step3PricingPlanProps) {
  const handlePlanSelect = (planId: string) => {
    setFormData({ ...formData, planId });
  };

  const formatPrice = (price: number, currency: string = "KRW") => {
    if (currency === "KRW") {
      return new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
      }).format(price);
    }
    return `${price} ${currency}`;
  };

  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <h3 className="trinity-onboarding__step-title">요금제 선택</h3>
      <p className="trinity-onboarding__step-description">
        원하시는 요금제를 선택해주세요.
      </p>

      {loading && pricingPlans.length === 0 ? (
        <div className={COMPONENT_CSS.ONBOARDING.MESSAGE}>
          {TRINITY_CONSTANTS.MESSAGES.LOADING_PRICING}
        </div>
      ) : pricingPlans.length === 0 ? (
        <div className={COMPONENT_CSS.ONBOARDING.MESSAGE_ERROR}>
          {TRINITY_CONSTANTS.MESSAGES.NO_PRICING_PLANS}
        </div>
      ) : (
        <div className={COMPONENT_CSS.PRICING.CONTAINER}>
          <div className={COMPONENT_CSS.ONBOARDING.GRID}>
            {pricingPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => handlePlanSelect(plan.id)}
                className={`${COMPONENT_CSS.PRICING.CARD} ${
                  formData.planId === plan.id
                    ? "trinity-onboarding__grid-button--active"
                    : ""
                } ${(plan as any).isPopular ? COMPONENT_CSS.PRICING.CARD_POPULAR : ""}`}
              >
                <div className={COMPONENT_CSS.PRICING.TITLE}>
                  {plan.name}
                </div>
                <div className={COMPONENT_CSS.PRICING.PRICE}>
                  {formatPrice(plan.price, plan.currency)}
                  <span className={COMPONENT_CSS.ONBOARDING.SMALL_TEXT}>
                    /월
                  </span>
                </div>
                {plan.description && (
                  <p className={COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY}>
                    {plan.description}
                  </p>
                )}
                {formData.planId === (plan.planId || plan.id || plan.planCode) && (
                  <div className={COMPONENT_CSS.ONBOARDING.SUCCESS_TEXT}>
                    ✓ 선택됨
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

