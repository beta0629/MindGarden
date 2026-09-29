/**
 * MallPayPanel — 결제 금액 요약 + 「N원 결제하기」(화면 유일 solid primary) + 비활성 이유(§5.8)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_COPY,
  CLIENT_MALL_TEST_IDS
} from '../../../constants/clientMallConstants';
import { formatMallNumber, formatMallWon } from '../../../utils/clientMall';

/**
 * @param {{
 *   subtotalMinor: number,
 *   pointsRedeemMinor: number,
 *   cashDueMinor: number,
 *   totalSessions: number,
 *   validityMonths: number|null,
 *   mixedValidity: boolean,
 *   blockMessage: string,
 *   disabled: boolean,
 *   loading: boolean,
 *   onPay: () => void,
 *   cancelled?: boolean,
 *   message?: string
 * }} props
 */
const MallPayPanel = ({
  subtotalMinor,
  pointsRedeemMinor,
  cashDueMinor,
  totalSessions,
  validityMonths,
  mixedValidity,
  blockMessage,
  disabled,
  loading,
  onPay,
  cancelled = false,
  message = ''
}) => (
  <section className="client-mall-pay" aria-label={CLIENT_MALL_CHECKOUT_COPY.PAY_SECTION}>
    <h2 className="client-mall-box__title">{CLIENT_MALL_CHECKOUT_COPY.PAY_SECTION}</h2>
    <dl className="client-mall-pay__rows">
      <div className="client-mall-pay__row">
        <dt>{CLIENT_MALL_CHECKOUT_COPY.PAY_ROW_SUBTOTAL}</dt>
        <dd>{formatMallWon(subtotalMinor)}</dd>
      </div>
      {pointsRedeemMinor > 0 ? (
        <div className="client-mall-pay__row">
          <dt>{CLIENT_MALL_CHECKOUT_COPY.PAY_ROW_POINTS}</dt>
          <dd>
            {'− '}
            {formatMallWon(pointsRedeemMinor)}
          </dd>
        </div>
      ) : null}
      <div className="client-mall-pay__row">
        <dt>{CLIENT_MALL_CHECKOUT_COPY.PAY_ROW_SESSIONS}</dt>
        <dd>
          {totalSessions}
          {CLIENT_MALL_COPY.SESSION_UNIT}
        </dd>
      </div>
    </dl>
    <div className="client-mall-pay__total">
      <span>{CLIENT_MALL_CHECKOUT_COPY.PAY_TOTAL}</span>
      <span className="client-mall-pay__total-amount">
        <span className="client-mall-pay__total-num">{formatMallNumber(cashDueMinor)}</span>
        {CLIENT_MALL_COPY.WON_UNIT}
      </span>
    </div>
    {validityMonths != null ? (
      <p className="client-mall-pay__meta">
        {CLIENT_MALL_CHECKOUT_COPY.PAY_VALIDITY_PREFIX}
        {validityMonths}
        {CLIENT_MALL_CHECKOUT_COPY.PAY_VALIDITY_SUFFIX}
      </p>
    ) : null}
    {mixedValidity ? <p className="client-mall-pay__meta">{CLIENT_MALL_CHECKOUT_COPY.PAY_VALIDITY_MIXED}</p> : null}
    {cancelled ? (
      <div className="client-mall-alert client-mall-alert--warn" role="status" data-testid={CLIENT_MALL_TEST_IDS.CHECKOUT_CANCELLED}>
        <p className="client-mall-alert__title">{CLIENT_MALL_CHECKOUT_COPY.CANCELLED_TITLE}</p>
        <p className="client-mall-alert__body">{CLIENT_MALL_CHECKOUT_COPY.CANCELLED_BODY}</p>
      </div>
    ) : null}
    {message ? <p className="client-mall-pay__message" role="status">{message}</p> : null}
    <div className="client-mall-pay__cta-wrap">
      <MGButton
        type="button"
        variant="primary"
        size="large"
        fullWidth
        className="client-mall-btn client-mall-btn--primary client-mall-pay__cta"
        disabled={disabled}
        loading={loading}
        preventDoubleClick
        onClick={onPay}
        data-testid={CLIENT_MALL_TEST_IDS.CHECKOUT_PAY}
      >
        {formatMallWon(cashDueMinor)}
        {CLIENT_MALL_CHECKOUT_COPY.PAY_CTA_SUFFIX}
      </MGButton>
      <p
        className={['client-mall-pay__reason', blockMessage ? 'client-mall-pay__reason--block' : ''].filter(Boolean).join(' ')}
        data-testid={CLIENT_MALL_TEST_IDS.CHECKOUT_BLOCK_REASON}
      >
        {blockMessage || CLIENT_MALL_CHECKOUT_COPY.PAY_WINDOW_HINT}
      </p>
    </div>
  </section>
);

MallPayPanel.propTypes = {
  subtotalMinor: PropTypes.number.isRequired,
  pointsRedeemMinor: PropTypes.number.isRequired,
  cashDueMinor: PropTypes.number.isRequired,
  totalSessions: PropTypes.number.isRequired,
  validityMonths: PropTypes.number,
  mixedValidity: PropTypes.bool,
  blockMessage: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onPay: PropTypes.func.isRequired,
  cancelled: PropTypes.bool,
  message: PropTypes.string
};

export default MallPayPanel;
