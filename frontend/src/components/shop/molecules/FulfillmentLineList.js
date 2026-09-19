/**
 * 주문 상세 — SKU 단위 이행(fulfillment) 상태 목록
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import React from 'react';
import {
  formatShopFulfillmentBadge,
  hasShopFulfillmentRetryableLine,
  SHOP_FULFILLMENT_RETRY_COPY,
  SHOP_FULFILLMENT_RETRY_TEST_IDS
} from '../../../constants/clientShopConstants';

/**
 * @param {{
 *   fulfillmentLines?: Array<{ skuCode?: string, category?: string, status?: string, message?: string, retryable?: boolean }>,
 *   onRetry?: () => void,
 *   retrying?: boolean,
 *   showRetry?: boolean
 * }} props
 */
const FulfillmentLineList = ({
  fulfillmentLines = [],
  onRetry,
  retrying = false,
  showRetry = false
}) => {
  if (!fulfillmentLines.length) {
    return null;
  }

  const canShowRetry =
    showRetry
    && typeof onRetry === 'function'
    && hasShopFulfillmentRetryableLine(fulfillmentLines);

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
      {canShowRetry ? (
        <button
          type="button"
          className="client-shop__cta client-shop__cta--fulfill-retry"
          data-testid={SHOP_FULFILLMENT_RETRY_TEST_IDS.BUTTON}
          aria-label={SHOP_FULFILLMENT_RETRY_COPY.BUTTON}
          disabled={retrying}
          onClick={onRetry}
        >
          {retrying
            ? SHOP_FULFILLMENT_RETRY_COPY.LOADING
            : SHOP_FULFILLMENT_RETRY_COPY.BUTTON}
        </button>
      ) : null}
    </section>
  );
};

export default FulfillmentLineList;
