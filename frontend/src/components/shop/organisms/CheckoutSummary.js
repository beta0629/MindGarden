/**
 * CheckoutSummary — 결제 금액 요약 Organism
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import { formatShopMoney } from '../../../utils/clientShopFormat';

/**
 * @param {{ subtotalMinor: number, pointsRedeemMinor: number, cashDueMinor: number }} props
 */
const CheckoutSummary = ({ subtotalMinor, pointsRedeemMinor, cashDueMinor }) => (
  <section className="client-shop__section" aria-label="결제 금액 요약">
    <h2 className="client-shop__section-title">결제 금액</h2>
    <div className="client-shop__summary-row">
      <span>상품 총액</span>
      <span>{formatShopMoney(subtotalMinor)}</span>
    </div>
    <div className="client-shop__summary-row client-shop__summary-row--discount">
      <span>포인트 할인</span>
      <span>- {formatShopMoney(pointsRedeemMinor)}</span>
    </div>
    <div className="client-shop__summary-row client-shop__summary-total">
      <span>최종 PG 결제액</span>
      <span>{formatShopMoney(cashDueMinor)}</span>
    </div>
  </section>
);

export default CheckoutSummary;
