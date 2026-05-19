/**
 * PriceText — 금액 표시 Atom
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import { formatShopMoney } from '../../../utils/clientShopFormat';

/**
 * @param {{ amountMinor: number, currency?: string, className?: string }} props
 */
const PriceText = ({ amountMinor, currency = 'KRW', className = 'client-shop__price' }) => (
  <span className={className}>{formatShopMoney(amountMinor, currency)}</span>
);

export default PriceText;
