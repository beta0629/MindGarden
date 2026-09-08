/**
 * MappingPaymentAttentionRail — amber one-liner (오늘 손볼 결제)
 * N=0이면 숨김. 합계 금액만 var(--color-red-700). 클릭 → payment 경로.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatKrw } from '../../../../utils/erpFinancialAmountStack';
import { aggregateMappingPaymentAttention } from '../utils/mappingPaymentAttention';
import './MappingPaymentAttentionRail.css';

const MappingPaymentAttentionRail = ({ mappings = [], onClick }) => {
  const { count, totalAmount } = useMemo(
    () => aggregateMappingPaymentAttention(mappings),
    [mappings]
  );

  if (count === 0) {
    return null;
  }

  return (
    <button
      type="button"
      className="mapping-payment-attention-rail"
      onClick={onClick}
      data-testid="mapping-payment-attention-rail"
      aria-label={`오늘 손볼 결제 ${count}건, 합계 ${formatKrw(totalAmount)}`}
    >
      <span className="mapping-payment-attention-rail__text">
        오늘 손볼 결제 {count}건 · 합계{' '}
        <span className="mapping-payment-attention-rail__amount">
          {formatKrw(totalAmount)}
        </span>
      </span>
    </button>
  );
};

MappingPaymentAttentionRail.propTypes = {
  mappings: PropTypes.array,
  onClick: PropTypes.func
};

export default MappingPaymentAttentionRail;
