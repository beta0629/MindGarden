/**
 * MallQtyStepper — − 수량 + (1~99)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CLIENT_MALL_COPY, CLIENT_MALL_LIMITS } from '../../../constants/clientMallConstants';

/**
 * @param {{
 *   quantity: number,
 *   onChange: (delta: number) => void,
 *   disabled?: boolean,
 *   allowZero?: boolean
 * }} props
 */
const MallQtyStepper = ({ quantity, onChange, disabled = false, allowZero = false }) => {
  const min = allowZero ? 0 : CLIENT_MALL_LIMITS.QTY_MIN;
  return (
    <div className="client-mall-qty">
      <button
        type="button"
        className="client-mall-qty__btn"
        aria-label={CLIENT_MALL_COPY.QTY_DECREASE}
        disabled={disabled || quantity <= min}
        onClick={() => onChange(-1)}
      >
        −
      </button>
      <span className="client-mall-qty__value" aria-live="polite">{quantity}</span>
      <button
        type="button"
        className="client-mall-qty__btn"
        aria-label={CLIENT_MALL_COPY.QTY_INCREASE}
        disabled={disabled || quantity >= CLIENT_MALL_LIMITS.QTY_MAX}
        onClick={() => onChange(1)}
      >
        +
      </button>
    </div>
  );
};

MallQtyStepper.propTypes = {
  quantity: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  allowZero: PropTypes.bool
};

export default MallQtyStepper;
