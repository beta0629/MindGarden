/**
 * 쇼핑 결제 준비 후 포트원 V2 requestPayment + 서버 verify 헬퍼.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import {
  buildShopPaymentReturnUrl,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_VERIFY_ERROR_PHASE,
  stashShopPendingPaymentVerify
} from '../constants/clientShopConstants';
import { requestPortOnePayment } from './portonePayment';
import { PG_PROVIDER_IAMPORT } from '../constants/portonePgConfiguration';
import {
  mergePortOneCustomerFromPrepare,
  requireCompletePortOneCustomer
} from './clientShopPaymentCustomer';
import { verifyShopPaymentWithRetry } from './shopPaymentVerifyRetry';

/**
 * PortOne 요청 전 customer — verified phone 필수, email은 prepare 병합 후 검사.
 *
 * @param {*} customer
 * @returns {{ email: string, fullName: string, phoneNumber: string, phoneVerified: true }}
 */
const requireCompleteCustomer = (customer) => requireCompletePortOneCustomer(customer);

/**
 * prepare 응답에 storeId+channelKey 가 있으면 포트원 결제 모듈을 호출하고 verify 한다.
 * verify 는 fail-closed: isValid !== true 이면 throw (checkout 잔류 금지).
 *
 * @param {Object} prepareResult - prepareShopPayment 응답
 * @param {Object} [options]
 * @param {string} [options.orderName]
 * @param {string} [options.redirectUrl]
 * @param {Object} [options.customer] verified phone 필수; email은 prepare.customerEmail 병합
 * @returns {Promise<{ prepared: Object, portoneResult?: Object, verified?: boolean, skipped?: boolean }>}
 */
export const runShopPortOnePaymentIfReady = async(prepareResult, options = {}) => {
  if (!prepareResult) {
    throw new Error('결제 준비 결과가 없습니다.');
  }

  const storeId = prepareResult.storeId;
  const channelKey = prepareResult.channelKey;
  const paymentId = prepareResult.paymentId;
  const amount = prepareResult.cashAmount;
  const orderPublicId =
    prepareResult.orderPublicId != null && String(prepareResult.orderPublicId).trim()
      ? String(prepareResult.orderPublicId).trim()
      : null;
  const isIamport =
    prepareResult.paymentProvider === PG_PROVIDER_IAMPORT
    || prepareResult.pgReady === true
    || (storeId && channelKey);

  if (!isIamport || !storeId || !channelKey || !paymentId) {
    return { prepared: prepareResult, skipped: true };
  }

  const customer = requireCompleteCustomer(
    mergePortOneCustomerFromPrepare(options.customer, prepareResult)
  );

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }

  const redirectUrl =
    (options.redirectUrl && String(options.redirectUrl).trim())
    || buildShopPaymentReturnUrl(orderPublicId || '');

  stashShopPendingPaymentVerify({
    paymentId: String(paymentId).trim(),
    orderPublicId,
    cashAmount: amountNum
  });

  const portoneResult = await requestPortOnePayment({
    storeId,
    channelKey,
    paymentId,
    orderName: options.orderName || `주문 ${orderPublicId || ''}`.trim(),
    totalAmount: amountNum,
    currency: 'KRW',
    payMethod: prepareResult.payMethod || 'CARD',
    redirectUrl,
    customer,
    customData: orderPublicId ? { orderPublicId } : undefined
  });

  if (portoneResult?.code) {
    const err = new Error(portoneResult.message || `포트원 결제 실패: ${portoneResult.code}`);
    err.portoneResult = portoneResult;
    throw err;
  }

  // fail-closed: REST PAID 지연 대비 짧은 재시도 후, 최종 실패만 throw (soft-fail 금지)
  try {
    await verifyShopPaymentWithRetry(String(paymentId).trim(), amountNum);
  } catch (verifyError) {
    const err =
      verifyError instanceof Error
        ? verifyError
        : new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
    err.shopPaymentPhase = SHOP_PAYMENT_VERIFY_ERROR_PHASE;
    if (orderPublicId) {
      err.orderPublicId = orderPublicId;
    }
    throw err;
  }

  return { prepared: prepareResult, portoneResult, verified: true, skipped: false };
};
