/**
 * Clinic-OS 샵 체크아웃 ↔ PortOne 기동 가드.
 * create(postShopCheckout) 전에 customer fail-closed.
 * create 이후 PortOne 미기동 시 CREATED 주문 cancel (고아 미결제 방지).
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import { SHOP_PAYMENT_LAUNCH_COPY, SHOP_USER_CANCEL_OUTCOME } from '../constants/clientShopConstants';
import { assertPortOneCustomerReadyBeforeCheckout } from './clientShopPaymentCustomer';
import { isPortOneUserCancel } from './shopPaymentCancel';

/** @typedef {'BLOCKED_CUSTOMER'|'NON_PAYMENT'|'PORTONE_READY'|'ORPHAN_CANCELLED'|'PAYMENT_VERIFIED'|'PAYMENT_LAUNCHED'|'USER_CANCELLED'|'PAID_AFTER_CANCEL'} ShopCheckoutPortOneStatus */

/**
 * 사용자 취소 후 서버 정리. 서버 호출이 실패해도 취소 흐름(들어온 곳으로 복귀)은 유지한다 —
 * 남은 미결제 주문은 재결제 시 같은 내용이면 재사용된다.
 * PortOne 이 이미 PAID 면 PAID_AFTER_CANCEL 로 정상 결제 확인에 넘긴다.
 *
 * @param {object} params
 * @returns {Promise<object>}
 */
const settleUserCancel = async({ cancelShopPaymentByUser, orderPublicId, checkoutResult, customer }) => {
  let cancelResult = null;
  if (typeof cancelShopPaymentByUser === 'function') {
    try {
      cancelResult = await cancelShopPaymentByUser(orderPublicId);
    } catch (e) {
      console.warn('결제창 취소 후 주문 정리 실패:', orderPublicId, e);
    }
  }
  if (cancelResult?.outcome === SHOP_USER_CANCEL_OUTCOME.PAID && cancelResult.paymentId) {
    return {
      status: 'PAID_AFTER_CANCEL',
      message: '',
      posted: true,
      checkoutResult,
      customer,
      paymentId: String(cancelResult.paymentId)
    };
  }
  return {
    status: 'USER_CANCELLED',
    message: '',
    posted: true,
    checkoutResult,
    customer,
    cancelOutcome: cancelResult?.outcome ?? null
  };
};

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
 * @param {(orderPublicId: string) => Promise<{ outcome: string, paymentId?: string }>} [deps.cancelShopPaymentByUser]
 *   PAY_PROCESS_CANCELED(사용자 취소)일 때만 호출 — 서버가 PortOne 미승인 확인 후 주문 정리
 * @returns {Promise<{
 *   status: ShopCheckoutPortOneStatus,
 *   message: string,
 *   posted: boolean,
 *   checkoutResult?: object|null,
 *   cancelled?: boolean,
 *   customer?: object,
 *   portoneFlow?: object,
 *   cancelOutcome?: string|null,
 *   paymentId?: string
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
  cancelShopOrder,
  cancelShopPaymentByUser
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
    if (isPortOneUserCancel(portoneError?.portoneResult)) {
      return settleUserCancel({
        cancelShopPaymentByUser,
        orderPublicId,
        checkoutResult,
        customer: raceGate.customer
      });
    }
    // 카드 거절 등 실패는 결제 화면에 머묾 — 주문은 재결제용으로 유지
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
