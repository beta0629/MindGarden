/**
 * MallCartSummary — 목록 오른쪽 sticky 장바구니 (줄 · 합계 · 결제하기 · 장바구니 수정)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { CLIENT_MALL_COPY, CLIENT_MALL_TEST_IDS } from '../../../constants/clientMallConstants';
import { CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import { formatMallNumber, formatMallWon } from '../../../utils/clientMall';

const CartIcon = ICONS.SHOPPING_CART;

/**
 * @param {{
 *   cart: { lines: Array<object> },
 *   summary: { quantity: number, subtotalMinor: number, totalSessions: number, validityMonths: number|null, isEmpty: boolean },
 *   lastAddedSku?: string|null,
 *   onCheckout: () => void,
 *   disabled?: boolean,
 *   secondary?: boolean
 * }} props
 */
const MallCartSummary = ({ cart, summary, lastAddedSku = null, onCheckout, disabled = false, secondary = false }) => (
  <section className="client-mall-cart" data-testid={CLIENT_MALL_TEST_IDS.CART_SUMMARY} aria-live="polite">
    <header className="client-mall-cart__head">
      <h2 className="client-mall-cart__title">
        {CartIcon ? <CartIcon size={ICON_SIZES.LG} aria-hidden /> : null}
        {CLIENT_MALL_COPY.CART_TITLE}
      </h2>
      <span className="client-mall-cart__count">
        {summary.quantity}
        {CLIENT_MALL_COPY.CART_COUNT_SUFFIX}
      </span>
    </header>
    {summary.isEmpty ? (
      <div className="client-mall-cart__empty">
        <p className="client-mall-cart__empty-title">{CLIENT_MALL_COPY.CART_EMPTY_TITLE}</p>
        <p className="client-mall-cart__empty-body">{CLIENT_MALL_COPY.CART_EMPTY_BODY}</p>
      </div>
    ) : (
      <ul className="client-mall-cart__lines">
        {cart.lines.map((line) => (
          <li
            key={line.skuCode}
            className={[
              'client-mall-cart__line',
              line.skuCode === lastAddedSku ? 'client-mall-cart__line--new' : ''
            ].filter(Boolean).join(' ')}
          >
            <span className="client-mall-cart__line-name">
              <SafeText>{line.title}</SafeText>
              {' × '}
              {line.quantity}
              {line.skuCode === lastAddedSku ? (
                <span className="client-mall-cart__new-tag">{CLIENT_MALL_COPY.CART_JUST_ADDED}</span>
              ) : null}
            </span>
            <span className="client-mall-cart__line-amount">
              {formatMallWon((Number(line.unitPriceMinor) || 0) * (Number(line.quantity) || 0))}
            </span>
          </li>
        ))}
      </ul>
    )}
    <div className="client-mall-cart__total">
      <span className="client-mall-cart__total-label">{CLIENT_MALL_COPY.CART_TOTAL}</span>
      <span className="client-mall-cart__total-amount">
        <span className="client-mall-cart__total-num">{formatMallNumber(summary.subtotalMinor)}</span>
        {CLIENT_MALL_COPY.WON_UNIT}
      </span>
    </div>
    {!summary.isEmpty && summary.totalSessions > 0 ? (
      <p className="client-mall-cart__meta">
        {summary.totalSessions}
        {CLIENT_MALL_COPY.SESSION_UNIT}
        {summary.validityMonths != null ? (
          <>
            {' · '}
            {CLIENT_MALL_COPY.VALIDITY_PREFIX}
            {summary.validityMonths}
            {CLIENT_MALL_COPY.CART_USE_WITHIN_SUFFIX}
          </>
        ) : null}
      </p>
    ) : null}
    <MGButton
      variant={secondary ? 'outline' : 'primary'}
      size="large"
      fullWidth
      disabled={disabled || summary.isEmpty}
      preventDoubleClick={false}
      className={secondary ? 'client-mall-btn client-mall-btn--ink-line' : 'client-mall-btn client-mall-btn--primary'}
      onClick={onCheckout}
      data-testid={CLIENT_MALL_TEST_IDS.CART_SUMMARY_CHECKOUT}
    >
      {CLIENT_MALL_COPY.CART_CHECKOUT}
    </MGButton>
    {summary.isEmpty ? (
      <p className="client-mall-cart__help">{CLIENT_MALL_COPY.CART_EMPTY_HELP}</p>
    ) : (
      <Link className="client-mall-cart__edit" to={CLIENT_SHOP_ROUTES.CART}>
        {CLIENT_MALL_COPY.CART_EDIT}
      </Link>
    )}
  </section>
);

MallCartSummary.propTypes = {
  cart: PropTypes.shape({ lines: PropTypes.arrayOf(PropTypes.object) }).isRequired,
  summary: PropTypes.shape({
    quantity: PropTypes.number,
    subtotalMinor: PropTypes.number,
    totalSessions: PropTypes.number,
    validityMonths: PropTypes.number,
    isEmpty: PropTypes.bool
  }).isRequired,
  lastAddedSku: PropTypes.string,
  onCheckout: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  secondary: PropTypes.bool
};

export default MallCartSummary;
