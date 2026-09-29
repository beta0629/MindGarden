/**
 * MallCartBar — 좁은 웹(<900px) 하단 고정 한 줄 바 (h72 + safe-area · 요약 flex:1 · CTA 고정폭)
 * 넓은 화면에서는 CSS 로 숨김 — 같은 화면의 solid primary 는 항상 하나만 보인다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { CLIENT_MALL_CHECKOUT_COPY, CLIENT_MALL_COPY, CLIENT_MALL_TEST_IDS } from '../../../constants/clientMallConstants';
import { formatMallWon } from '../../../utils/clientMall';

/**
 * @param {{
 *   quantity: number,
 *   subtotalMinor: number,
 *   heading?: string,
 *   label?: string,
 *   caption?: string,
 *   onAction: () => void,
 *   disabled?: boolean,
 *   testId?: string,
 *   actionTestId?: string
 * }} props
 */
const MallCartBar = ({
  quantity,
  subtotalMinor,
  heading = CLIENT_MALL_COPY.BAR_LABEL,
  label = CLIENT_MALL_COPY.CART_CHECKOUT,
  caption = '',
  onAction,
  disabled = false,
  testId = CLIENT_MALL_TEST_IDS.CART_BAR,
  actionTestId = CLIENT_MALL_TEST_IDS.CART_BAR_CHECKOUT
}) => (
  <div className="client-mall-bar" data-testid={testId}>
    <div className="client-mall-bar__inner">
      <div className="client-mall-bar__sum">
        {heading ? <span className="client-mall-bar__label">{heading}</span> : null}
        <span className="client-mall-bar__qty">
          {quantity}
          {CLIENT_MALL_COPY.CART_COUNT_SUFFIX}
          {CLIENT_MALL_CHECKOUT_COPY.PAY_ROW_POINTS_SEPARATOR}
          {formatMallWon(subtotalMinor)}
        </span>
        {caption ? <span className="client-mall-bar__caption">{caption}</span> : null}
      </div>
      <MGButton
        variant="primary"
        disabled={disabled}
        preventDoubleClick={false}
        className="client-mall-btn client-mall-btn--primary client-mall-bar__cta"
        onClick={onAction}
        data-testid={actionTestId}
      >
        {label}
      </MGButton>
    </div>
  </div>
);

MallCartBar.propTypes = {
  quantity: PropTypes.number.isRequired,
  subtotalMinor: PropTypes.number.isRequired,
  heading: PropTypes.string,
  label: PropTypes.string,
  caption: PropTypes.string,
  onAction: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  testId: PropTypes.string,
  actionTestId: PropTypes.string
};

export default MallCartBar;
