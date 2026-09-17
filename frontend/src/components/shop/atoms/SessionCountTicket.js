/**
 * SessionCountTicket — 샵 상품 회기수 티켓 (Clinic-OS ink/slate)
 *
 * SSOT: docs/design-system/clinic-os-client-cart.md (shot-client-cart-tobe)
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import {
  SHOP_SESSION_COUNT_COPY,
  formatShopSessionCountDisplay
} from '../../../constants/clientShopConstants';
import { normalizeShopSessionCount } from '../../../utils/shopSessionCount';
import './SessionCountTicket.css';

/**
 * @param {{
 *   sessionCount?: number|string|null,
 *   className?: string,
 *   testId?: string
 * }} props
 */
const SessionCountTicket = ({
  sessionCount = 1,
  className = '',
  testId = 'shop-session-count-ticket'
}) => {
  const count = normalizeShopSessionCount(sessionCount);
  const label = formatShopSessionCountDisplay(count);
  const classes = ['client-shop__session-ticket', className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      data-testid={testId}
      data-session-count={count}
      title={`${SHOP_SESSION_COUNT_COPY.LABEL} ${label}`}
      aria-label={`${SHOP_SESSION_COUNT_COPY.LABEL} ${label}`}
    >
      <span className="client-shop__session-ticket-stub" aria-hidden="true" />
      <span className="client-shop__session-ticket-body">
        <SafeText>{label}</SafeText>
      </span>
    </span>
  );
};

SessionCountTicket.propTypes = {
  sessionCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  testId: PropTypes.string
};

export default SessionCountTicket;
