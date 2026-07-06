/**
 * BillingCycleToggle — 월간/연간 결제 전환 (Molecule)
 *
 * Spec §3.2 / §6:
 *   - Pill 형태 (border-radius: 9999px)
 *   - 월간 vs 연간 (20% 할인)
 *   - Active 시 그라데이션 배경 + 텍스트 반전
 *
 * 순수 controlled 컴포넌트:
 *   - cycle (PRICING_BILLING_CYCLE)
 *   - onCycleChange(cycle)
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PRICING_BILLING_CYCLE } from '../../../constants/pricing';
import { toDisplayString } from '../../../utils/safeDisplay';
import './BillingCycleToggle.css';

const BillingCycleToggle = ({ cycle, onCycleChange, ariaLabelKey, className = '' }) => {
  const { t } = useTranslation('common');

  const wrapperClass = [
    'mg-v2-billing-cycle-toggle',
    className,
  ].filter(Boolean).join(' ');

  const handleSelect = (nextCycle) => {
    if (typeof onCycleChange !== 'function') return;
    if (cycle === nextCycle) return;
    onCycleChange(nextCycle);
  };

  const monthlyActive = cycle === PRICING_BILLING_CYCLE.MONTHLY;
  const yearlyActive = cycle === PRICING_BILLING_CYCLE.YEARLY;

  const monthlyClass = [
    'mg-v2-billing-cycle-toggle__option',
    monthlyActive ? 'mg-v2-billing-cycle-toggle__option--active' : '',
  ].filter(Boolean).join(' ');

  const yearlyClass = [
    'mg-v2-billing-cycle-toggle__option',
    yearlyActive ? 'mg-v2-billing-cycle-toggle__option--active' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={wrapperClass}
      role="tablist"
      aria-label={t(ariaLabelKey || 'public.pricing.billingCycle.ariaLabel', '결제 주기 선택')}
      data-testid="billing-cycle-toggle"
    >
      <button
        type="button"
        role="tab"
        aria-selected={monthlyActive}
        className={monthlyClass}
        onClick={() => handleSelect(PRICING_BILLING_CYCLE.MONTHLY)}
        data-testid="billing-cycle-toggle-monthly"
      >
        {toDisplayString(t('public.pricing.billingCycle.monthly', '월간'))}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={yearlyActive}
        className={yearlyClass}
        onClick={() => handleSelect(PRICING_BILLING_CYCLE.YEARLY)}
        data-testid="billing-cycle-toggle-yearly"
      >
        <span>{toDisplayString(t('public.pricing.billingCycle.yearly', '연간'))}</span>
        <span className="mg-v2-billing-cycle-toggle__discount-badge">
          {toDisplayString(t('public.pricing.billingCycle.discount', '20% 할인'))}
        </span>
      </button>
    </div>
  );
};

BillingCycleToggle.propTypes = {
  cycle: PropTypes.oneOf(Object.values(PRICING_BILLING_CYCLE)).isRequired,
  onCycleChange: PropTypes.func.isRequired,
  ariaLabelKey: PropTypes.string,
  className: PropTypes.string,
};

export default BillingCycleToggle;
