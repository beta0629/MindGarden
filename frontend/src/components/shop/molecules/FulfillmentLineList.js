/**
 * 주문 상세 — SKU 단위 이행(fulfillment) 상태 목록
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import { formatShopFulfillmentBadge } from '../../../constants/clientShopConstants';

/**
 * @param {{ fulfillmentLines?: Array<{ skuCode?: string, category?: string, status?: string, message?: string }> }} props
 */
const FulfillmentLineList = ({ fulfillmentLines = [] }) => {
  if (!fulfillmentLines.length) {
    return null;
  }

  return (
    <section className="client-shop__section" aria-label="이행 상태">
      <h2 className="client-shop__section-title">이행 상태</h2>
      <ul className="client-shop__fulfillment-list">
        {fulfillmentLines.map((line) => {
          const key = `${line.skuCode}-${line.category}-${line.status}`;
          const badge = formatShopFulfillmentBadge(line);
          return (
            <li key={key} className="client-shop__fulfillment-item">
              <div className="client-shop__fulfillment-item-head">
                <span className="client-shop__fulfillment-sku">{line.skuCode}</span>
                <span
                  className={`client-shop__badge client-shop__fulfillment-badge client-shop__fulfillment-badge--${(
                    line.status || ''
                  ).toLowerCase()}`}
                >
                  {badge}
                </span>
              </div>
              {line.message ? (
                <p className="client-shop__fulfillment-message">{line.message}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default FulfillmentLineList;
