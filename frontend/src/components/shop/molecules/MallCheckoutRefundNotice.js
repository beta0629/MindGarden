/**
 * MallCheckoutRefundNotice — 결제 전 환불 차감 요약 bullet + /legal/refund 전문 링크
 *
 * @author MindGarden
 * @since 2026-11-24
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CLIENT_CHECKOUT_REFUND_COPY } from '../../../constants/clientMallConstants';
import { LEGAL_PUBLIC_PATHS } from '../../../constants/legalPublic';

/**
 * @param {{
 *   lines: string[],
 *   showLink?: boolean,
 *   linkClassName?: string,
 *   linkLabel?: string,
 *   asList?: boolean
 * }} props
 */
const MallCheckoutRefundNotice = ({
  lines,
  showLink = true,
  linkClassName = 'client-mall-link-cta',
  linkLabel = CLIENT_CHECKOUT_REFUND_COPY.FULL_POLICY_LINK,
  asList = true
}) => {
  const safeLines = Array.isArray(lines) ? lines.filter((line) => line && String(line).trim()) : [];

  return (
    <div className="client-mall-refund-notice">
      {asList ? (
        <ul className="client-mall-bullets">
          {safeLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <div className="client-mall-refund-notice__paras">
          {safeLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {showLink ? (
        <p className="client-mall-refund-notice__link-wrap">
          <Link to={LEGAL_PUBLIC_PATHS.REFUND} className={linkClassName}>
            {linkLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
};

MallCheckoutRefundNotice.propTypes = {
  lines: PropTypes.arrayOf(PropTypes.string).isRequired,
  showLink: PropTypes.bool,
  linkClassName: PropTypes.string,
  linkLabel: PropTypes.string,
  asList: PropTypes.bool
};

export default MallCheckoutRefundNotice;
