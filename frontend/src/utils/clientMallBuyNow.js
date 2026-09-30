/**
 * 바로 구매 — 장바구니를 건드리지 않는다. 상품 코드·수량을 결제 전 확인 주소에 싣고,
 * 결제 전 확인은 그 한 줄만 서버 체크아웃 {@code lines} 로 보낸다 (§14-9).
 * React/DOM 의존 없음 → Expo 앱이 그대로 재사용할 수 있다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  CLIENT_MALL_LIMITS,
  CLIENT_MALL_QUERY,
  CLIENT_MALL_ROUTES
} from '../constants/clientMallConstants';

/**
 * @param {number|string|null|undefined} quantity
 * @returns {number} QTY_MIN..QTY_MAX
 */
export const clampBuyNowQuantity = (quantity) => {
  const n = Math.floor(Number(quantity));
  if (!Number.isFinite(n)) {
    return CLIENT_MALL_LIMITS.QTY_MIN;
  }
  return Math.max(CLIENT_MALL_LIMITS.QTY_MIN, Math.min(CLIENT_MALL_LIMITS.QTY_MAX, n));
};

/**
 * 바로 구매 결제 전 확인 경로.
 *
 * @param {string} skuCode
 * @param {number} [quantity]
 * @returns {string} 예: /client/shop/checkout?mode=buyNow&sku=PKG10&qty=1
 */
export const buildBuyNowCheckoutPath = (skuCode, quantity = CLIENT_MALL_LIMITS.QTY_MIN) => {
  const params = new URLSearchParams();
  params.set(CLIENT_MALL_QUERY.MODE, CLIENT_MALL_QUERY.MODE_BUY_NOW);
  params.set(CLIENT_MALL_QUERY.SKU, String(skuCode || ''));
  params.set(CLIENT_MALL_QUERY.QTY, String(clampBuyNowQuantity(quantity)));
  return `${CLIENT_MALL_ROUTES.CHECKOUT}?${params.toString()}`;
};

/**
 * @param {string} search location.search
 * @returns {{ skuCode: string, quantity: number }|null} 바로 구매 주소가 아니면 null
 */
export const parseBuyNowQuery = (search) => {
  const params = new URLSearchParams(search || '');
  if (params.get(CLIENT_MALL_QUERY.MODE) !== CLIENT_MALL_QUERY.MODE_BUY_NOW) {
    return null;
  }
  const skuCode = (params.get(CLIENT_MALL_QUERY.SKU) || '').trim();
  if (!skuCode) {
    return null;
  }
  return { skuCode, quantity: clampBuyNowQuantity(params.get(CLIENT_MALL_QUERY.QTY)) };
};

/**
 * 서버 체크아웃 {@code lines} 본문.
 *
 * @param {{ skuCode: string, quantity: number }|null} buyNow
 * @returns {Array<{ skuCode: string, quantity: number }>|null}
 */
export const toBuyNowCheckoutLines = (buyNow) => (
  buyNow ? [{ skuCode: buyNow.skuCode, quantity: clampBuyNowQuantity(buyNow.quantity) }] : null
);
