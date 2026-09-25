/**
 * PortOne redirect 복귀 → BE verify 금액·쿼리 해석 (fail-closed).
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import {
  readShopPendingPaymentVerify,
  SHOP_CHECKOUT_ERROR_COPY
} from '../constants/clientShopConstants';

/**
 * @param {*} value
 * @returns {string|null}
 */
const nonBlankTrimmed = (value) => {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
};

/**
 * 복귀 쿼리 paymentId가 없으면 stash(orderPublicId 일치)에서 폴백한다.
 * stash도 없거나 주문 불일치면 null (fail-closed).
 *
 * @param {{ paymentId?: string|null, orderPublicId?: string|null }} [query]
 * @returns {string|null}
 */
export const resolveShopPaymentReturnPaymentId = (query = {}) => {
  const fromQuery = nonBlankTrimmed(query.paymentId);
  if (fromQuery) {
    return fromQuery;
  }
  const stash = readShopPendingPaymentVerify();
  if (!stash || !stash.paymentId) {
    return null;
  }
  const oid = nonBlankTrimmed(query.orderPublicId);
  if (
    oid &&
    stash.orderPublicId &&
    stash.orderPublicId === oid
  ) {
    return stash.paymentId;
  }
  return null;
};

/**
 * URLSearchParams / query 유사 객체에서 복귀 쿼리를 파싱한다.
 *
 * @param {URLSearchParams|{ get?: (key: string) => string|null }|null|undefined} searchParams
 * @returns {{
 *   paymentId: string|null,
 *   orderPublicId: string|null,
 *   code: string|null,
 *   message: string|null
 * }}
 */
export const parseShopPaymentReturnQuery = (searchParams) => {
  const get =
    searchParams && typeof searchParams.get === 'function'
      ? (key) => nonBlankTrimmed(searchParams.get(key))
      : () => null;
  return {
    paymentId: get('paymentId'),
    orderPublicId: get('orderPublicId'),
    code: get('code'),
    message: get('message')
  };
};

/**
 * 주문 객체에서 현금 결제 금액을 꺼낸다 (invent 금지).
 *
 * @param {object|null|undefined} order
 * @returns {number|null}
 */
export const resolveCashAmountFromOrder = (order) => {
  if (!order || typeof order !== 'object') {
    return null;
  }
  const raw = order.cashDueMinor ?? order.cashDue;
  if (raw != null && typeof raw === 'object') {
    return null;
  }
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount;
};

/**
 * sessionStorage stash 또는 주문 조회로 verify 금액을 확정한다.
 *
 * @param {{
 *   paymentId?: string|null,
 *   orderPublicId?: string|null,
 *   fetchOrder?: (orderPublicId: string) => Promise<object|null>
 * }} params
 * @returns {Promise<number>}
 */
export const resolveShopPaymentVerifyAmount = async({
  paymentId,
  orderPublicId,
  fetchOrder
} = {}) => {
  const stash = readShopPendingPaymentVerify();
  if (stash) {
    const matchesPayment =
      paymentId && stash.paymentId === String(paymentId).trim();
    const matchesOrder =
      orderPublicId &&
      stash.orderPublicId &&
      stash.orderPublicId === String(orderPublicId).trim();
    if (matchesPayment || matchesOrder) {
      return stash.cashAmount;
    }
  }

  const oid = nonBlankTrimmed(orderPublicId);
  if (!oid || typeof fetchOrder !== 'function') {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }
  const order = await fetchOrder(oid);
  const fromOrder = resolveCashAmountFromOrder(order);
  if (fromOrder == null) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }
  return fromOrder;
};
