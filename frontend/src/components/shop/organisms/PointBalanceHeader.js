/**
 * PointBalanceHeader — 포인트 잔액 헤더 Organism
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import { formatShopPoints } from '../../../utils/clientShopFormat';

/**
 * @param {{ availableMinor: number, heldMinor?: number }} props
 */
const PointBalanceHeader = ({ availableMinor, heldMinor = 0 }) => (
  <header className="client-shop__point-balance-card" aria-label="사용 가능한 포인트">
    <p className="client-shop__point-label">사용 가능한 포인트</p>
    <p className="client-shop__point-amount">{formatShopPoints(availableMinor)}</p>
    {heldMinor > 0 ? (
      <p className="client-shop__point-label">
        예약 중 {formatShopPoints(heldMinor)}
      </p>
    ) : null}
  </header>
);

export default PointBalanceHeader;
