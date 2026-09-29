/**
 * MallCheckoutLine — 결제 전 확인 한 줄: 상품 · 회기 · 이용기간(+예시 날짜) · 수량 · §9 안내(그 상품 개월 수)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';
import MallSessionChip from '../atoms/MallSessionChip';
import MallInfoRows from '../molecules/MallInfoRows';
import MallQtyStepper from '../molecules/MallQtyStepper';
import MallUsageBanner from '../molecules/MallUsageBanner';
import {
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_COPY,
  CLIENT_MALL_TEST_IDS,
  buildClientMallProductUsageNotice
} from '../../../constants/clientMallConstants';
import {
  buildValidityExampleText,
  formatMallSessionLabel,
  formatMallWon,
  formatValidityLabel
} from '../../../utils/clientMall';

/**
 * @param {{
 *   line: { skuCode: string, title?: string, quantity: number, unitPriceMinor?: number, sessionCount?: number },
 *   validityMonths: number|null,
 *   onQuantityChange: (delta: number) => void,
 *   disabled?: boolean,
 *   today?: Date
 * }} props
 */
const MallCheckoutLine = ({ line, validityMonths, onQuantityChange, disabled = false, today }) => {
  const unit = Number(line.unitPriceMinor) || 0;
  const rows = [
    { key: 'sessions', label: CLIENT_MALL_CHECKOUT_COPY.ROW_SESSIONS, value: formatMallSessionLabel(line.sessionCount) }
  ];
  if (validityMonths != null) {
    rows.push({
      key: 'validity',
      label: CLIENT_MALL_CHECKOUT_COPY.ROW_VALIDITY,
      value: formatValidityLabel(validityMonths),
      sub: buildValidityExampleText(validityMonths, today || new Date())
    });
  }
  rows.push({
    key: 'qty',
    label: CLIENT_MALL_CHECKOUT_COPY.ROW_QUANTITY,
    value: <MallQtyStepper quantity={line.quantity} onChange={onQuantityChange} disabled={disabled} />
  });

  return (
    <article className="client-mall-line" data-testid={CLIENT_MALL_TEST_IDS.CHECKOUT_LINE}>
      <header className="client-mall-line__head">
        <div className="client-mall-line__name">
          <p className="client-mall-line__title">
            <SafeText>{line.title}</SafeText>
            <MallSessionChip sessionCount={line.sessionCount} testId={`checkout-session-ticket-${line.skuCode}`} />
          </p>
          <p className="client-mall-line__unit">
            {formatMallWon(unit)}
            {CLIENT_MALL_COPY.LINE_TIMES}
            {line.quantity}
          </p>
        </div>
        <span className="client-mall-line__total">{formatMallWon(unit * line.quantity)}</span>
      </header>
      <MallInfoRows rows={rows} />
      {validityMonths != null ? (
        <MallUsageBanner
          compact
          text={buildClientMallProductUsageNotice(validityMonths)}
          testId={CLIENT_MALL_TEST_IDS.CHECKOUT_LINE_NOTICE}
        />
      ) : null}
    </article>
  );
};

MallCheckoutLine.propTypes = {
  line: PropTypes.shape({
    skuCode: PropTypes.string.isRequired,
    title: PropTypes.string,
    quantity: PropTypes.number.isRequired,
    unitPriceMinor: PropTypes.number,
    sessionCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  validityMonths: PropTypes.number,
  onQuantityChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  today: PropTypes.instanceOf(Date)
};

export default MallCheckoutLine;
