/**
 * Clinic-OS 샵 체크아웃 ↔ PortOne 기동 가드.
 * create(postShopCheckout) 전에 customer fail-closed.
 * create 이후 PortOne 미기동 시 CREATED 주문 cancel (고아 미결제 방지).
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import { SHOP_PAYMENT_LAUNCH_COPY } from '../constants/clientShopConstants';
import { assertPortOneCustomerReadyBeforeCheckout } from './clientShopPaymentCustomer';

/** @typedef {'BLOCKED_CUSTOMER'|'NON_PAYMENT'|'PORTONE_READY'|'ORPHAN_CANCELLED'|'PAYMENT_VERIFIED'|'PAYMENT_LAUNCHED'} ShopCheckoutPortOneStatus */

/**
 * prepare 응답으로 PortOne SDK를 열 수 있는지.
 *
 * @param {object|null|undefined} prepared
 * @returns {boolean}
 */
export const isShopPrepareReadyForPortOne = (prepared) => {
  if (!prepared || typeof prepared !== 'object') {
    return false;
  }
  const paymentId = prepared.paymentId != null ? String(prepared.paymentId).trim() : '';
  const storeId = prepared.storeId != null ? String(prepared.storeId).trim() : '';
  const channelKey = prepared.channelKey != null ? String(prepared.channelKey).trim() : '';
  return Boolean(paymentId && storeId && channelKey);
};

/**
 * 고아 방지용 주문 취소 (실패해도 throw하지 않음).
 *
 * @param {(orderPublicId: string) => Promise<*>} cancelShopOrderFn
 * @param {string} orderPublicId
 * @returns {Promise<boolean>} 취소 성공 여부
 */
export const cancelOrphanShopOrderQuietly = async(cancelShopOrderFn, orderPublicId) => {
  if (!orderPublicId || typeof cancelShopOrderFn !== 'function') {
    return false;
  }
  try {
    await cancelShopOrderFn(orderPublicId);
    return true;
  } catch (e) {
    console.warn('쇼핑 고아 주문 취소 실패:', orderPublicId, e);
    return false;
  }
};

/**
 * 체크아웃 → prepare → PortOne. incomplete customer면 post 호출 없이 차단.
 * create 후 PortOne 미기동(customer race / prepare 필드 부족 / SDK skip)이면 cancel.
 *
 * @param {object} deps
 * @param {object|null|undefined} deps.user
 * @param {number} deps.pointsRedeemMinor
 * @param {string|number|null|undefined} deps.mappingIdForCheckout
 * @param {() => string} deps.createIdempotencyKey
 * @param {(key: string, points: number, mappingId: *) => Promise<object>} deps.postShopCheckout
 * @param {(orderPublicId: string) => Promise<object>} deps.prepareShopPayment
 * @param {(prepared: object, options: object) => Promise<object>} deps.runShopPortOnePaymentIfReady
 * @param {(orderPublicId: string) => Promise<*>} deps.cancelShopOrder
 * @returns {Promise<{
 *   status: ShopCheckoutPortOneStatus,
 *   message: string,
 *   posted: boolean,
 *   checkoutResult?: object|null,
 *   cancelled?: boolean,
 *   customer?: object,
 *   portoneFlow?: object
 * }>}
 */
export const runShopCheckoutWithPortOneGuard = async({
  user,
  pointsRedeemMinor,
  mappingIdForCheckout,
  createIdempotencyKey,
  postShopCheckout,
  prepareShopPayment,
  runShopPortOnePaymentIfReady,
  cancelShopOrder
}) => {
  const gate = assertPortOneCustomerReadyBeforeCheckout(user);
  if (!gate.ready) {
    return {
      status: 'BLOCKED_CUSTOMER',
      message: gate.message,
      posted: false,
      checkoutResult: null
    };
  }

  const checkoutResult = await postShopCheckout(
    createIdempotencyKey(),
    pointsRedeemMinor,
    mappingIdForCheckout
  );

  if (checkoutResult?.nextStep !== 'PAYMENT' || !checkoutResult.orderPublicId) {
    return {
      status: 'NON_PAYMENT',
      message: SHOP_PAYMENT_LAUNCH_COPY.ORDER_ACCEPTED_FOLLOW_GUIDE,
      posted: true,
      checkoutResult,
      customer: gate.customer
    };
  }

  const orderPublicId = checkoutResult.orderPublicId;

  // create 직후 race: customer가 사라지면 prepare 전에 cancel
  const raceGate = assertPortOneCustomerReadyBeforeCheckout(user);
  if (!raceGate.ready) {
    const cancelled = await cancelOrphanShopOrderQuietly(cancelShopOrder, orderPublicId);
    return {
      status: 'ORPHAN_CANCELLED',
      message: raceGate.message || SHOP_PAYMENT_LAUNCH_COPY.ORPHAN_ORDER_CANCELLED,
      posted: true,
      checkoutResult,
      cancelled,
      customer: null
    };
  }

  let prepared;
  try {
    prepared = await prepareShopPayment(orderPublicId);
  } catch (prepareError) {
    await cancelOrphanShopOrderQuietly(cancelShopOrder, orderPublicId);
    throw prepareError;
  }

  if (!isShopPrepareReadyForPortOne(prepared)) {
    const cancelled = await cancelOrphanShopOrderQuietly(cancelShopOrder, orderPublicId);
    return {
      status: 'ORPHAN_CANCELLED',
      message: SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE,
      posted: true,
      checkoutResult,
      cancelled,
      customer: raceGate.customer
    };
  }

  let portoneFlow;
  try {
    portoneFlow = await runShopPortOnePaymentIfReady(prepared, {
      orderName: `주문 ${orderPublicId}`,
      customer: raceGate.customer
    });
  } catch (portoneError) {
    // prepare까지 성공·SDK 호출 단계 오류는 재결제 경로 유지 — cancel하지 않음
    throw portoneError;
  }

  if (portoneFlow?.skipped) {
    const cancelled = await cancelOrphanShopOrderQuietly(cancelShopOrder, orderPublicId);
    return {
      status: 'ORPHAN_CANCELLED',
      message: SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE,
      posted: true,
      checkoutResult,
      cancelled,
      customer: raceGate.customer,
      portoneFlow
    };
  }

  if (portoneFlow?.verified) {
    return {
      status: 'PAYMENT_VERIFIED',
      message: SHOP_PAYMENT_LAUNCH_COPY.PAYMENT_COMPLETED,
      posted: true,
      checkoutResult,
      customer: raceGate.customer,
      portoneFlow
    };
  }

  return {
    status: 'PAYMENT_LAUNCHED',
    message: SHOP_PAYMENT_LAUNCH_COPY.PAYMENT_MODULE_CALLED,
    posted: true,
    checkoutResult,
    customer: raceGate.customer,
    portoneFlow
  };
};
