"use client";

import { TRINITY_CONSTANTS } from "../../constants/trinity";
import "../../styles/components/onboarding-pricing-v2.css";

export type BillingCycle =
  (typeof TRINITY_CONSTANTS.PRICING.BILLING_CYCLE)[keyof typeof TRINITY_CONSTANTS.PRICING.BILLING_CYCLE];

interface BillingCycleToggleProps {
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
}

/**
 * Step3 요금제 — 월간/연간 전환 (mockup Pricing v2 패턴)
 */
export default function BillingCycleToggle({
  cycle,
  onCycleChange,
}: BillingCycleToggleProps) {
  const { BILLING_CYCLE, LABELS } = TRINITY_CONSTANTS.PRICING;
  const monthlyActive = cycle === BILLING_CYCLE.MONTHLY;
  const yearlyActive = cycle === BILLING_CYCLE.YEARLY;

  return (
    <div
      className="trinity-billing-cycle-toggle"
      role="tablist"
      aria-label={LABELS.BILLING_CYCLE_ARIA}
    >
      <button
        type="button"
        role="tab"
        aria-selected={monthlyActive}
        className={`trinity-billing-cycle-toggle__option ${
          monthlyActive ? "trinity-billing-cycle-toggle__option--active" : ""
        }`}
        onClick={() => onCycleChange(BILLING_CYCLE.MONTHLY)}
      >
        {LABELS.BILLING_MONTHLY}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={yearlyActive}
        className={`trinity-billing-cycle-toggle__option ${
          yearlyActive ? "trinity-billing-cycle-toggle__option--active" : ""
        }`}
        onClick={() => onCycleChange(BILLING_CYCLE.YEARLY)}
      >
        <span>{LABELS.BILLING_YEARLY}</span>
        <span className="trinity-billing-cycle-toggle__discount">
          {LABELS.BILLING_DISCOUNT}
        </span>
      </button>
    </div>
  );
}
