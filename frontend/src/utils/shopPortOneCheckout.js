/**
 * 쇼핑 결제 준비 후 포트원 V2 requestPayment + 서버 verify 헬퍼.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import StandardizedApi from './standardizedApi';
import { requestPortOnePayment } from './portonePayment';
import { PG_PROVIDER_IAMPORT } from '../constants/portonePgConfiguration';
import { SHOP_PAYMENT_LAUNCH_COPY } from '../constants/clientShopConstants';

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
 * PortOne 요청 전 customer fail-closed (email·fullName·phoneNumber|phone).
 *
 * @param {*} customer
 * @returns {{ email: string, fullName: string, phoneNumber: string }}
 */
const requireCompleteCustomer = (customer) => {
  if (!customer || typeof customer !== 'object') {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
  }
  const email = nonBlankTrimmed(customer.email);
  if (!email) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
  }
  const fullName = nonBlankTrimmed(customer.fullName);
  if (!fullName) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED);
  }
  const phoneNumber =
    nonBlankTrimmed(customer.phoneNumber) || nonBlankTrimmed(customer.phone);
  if (!phoneNumber) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  }
  return {
    ...customer,
    email,
    fullName,
    phoneNumber
  };
};

/**
 * prepare 응답에 storeId+channelKey 가 있으면 포트원 결제 모듈을 호출하고 verify 한다.
 *
 * @param {Object} prepareResult - prepareShopPayment 응답
 * @param {Object} [options]
 * @param {string} [options.orderName]
 * @param {string} [options.redirectUrl]
 * @param {Object} [options.customer] email·fullName·phone 필수(fail-closed)
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
  const isIamport =
    prepareResult.paymentProvider === PG_PROVIDER_IAMPORT
    || prepareResult.pgReady === true
    || (storeId && channelKey);

  if (!isIamport || !storeId || !channelKey || !paymentId) {
    return { prepared: prepareResult, skipped: true };
  }

  const customer = requireCompleteCustomer(options.customer);

  const portoneResult = await requestPortOnePayment({
    storeId,
    channelKey,
    paymentId,
    orderName: options.orderName || `주문 ${prepareResult.orderPublicId || ''}`.trim(),
    totalAmount: Number(amount),
    currency: 'KRW',
    payMethod: prepareResult.payMethod || 'CARD',
    redirectUrl: options.redirectUrl,
    customer
  });

  if (portoneResult?.code) {
    const err = new Error(portoneResult.message || `포트원 결제 실패: ${portoneResult.code}`);
    err.portoneResult = portoneResult;
    throw err;
  }

  let verified = false;
  try {
    const amountNum = Number(amount);
    const verifyRes = await StandardizedApi.post(
      `/api/v1/payments/${encodeURIComponent(paymentId)}/verify?amount=${encodeURIComponent(amountNum)}`,
      {}
    );
    verified = Boolean(verifyRes?.isValid);
  } catch (e) {
    console.warn('포트원 결제 서버 검증 호출 실패(웹훅으로 완료될 수 있음):', e);
  }

  return { prepared: prepareResult, portoneResult, verified, skipped: false };
};
