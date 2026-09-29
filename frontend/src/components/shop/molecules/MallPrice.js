/**
 * MallPrice — 「850,000원」 + 회당 단가 (₩ 미사용)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CLIENT_MALL_COPY } from '../../../constants/clientMallConstants';
import { formatMallNumber, formatMallWon, resolvePerSessionMinor } from '../../../utils/clientMall';

/**
 * @param {{ amountMinor: number, sessionCount?: number|string, size?: 'lg'|'md' }} props
 */
const MallPrice = ({ amountMinor, sessionCount = 1, size = 'lg' }) => {
  const perSession = resolvePerSessionMinor(amountMinor, sessionCount);
  return (
    <div className={`client-mall-price client-mall-price--${size}`}>
      <p className="client-mall-price__amount">
        <span className="client-mall-price__num">{formatMallNumber(amountMinor)}</span>
        <span className="client-mall-price__unit">{CLIENT_MALL_COPY.WON_UNIT}</span>
      </p>
      {perSession != null ? (
        <p className="client-mall-price__per">
          {CLIENT_MALL_COPY.PER_SESSION_PREFIX}
          {formatMallWon(perSession)}
        </p>
      ) : null}
    </div>
  );
};

MallPrice.propTypes = {
  amountMinor: PropTypes.number.isRequired,
  sessionCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  size: PropTypes.oneOf(['lg', 'md'])
};

export default MallPrice;
