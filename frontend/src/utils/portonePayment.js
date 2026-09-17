/**
 * 포트원 V2 브라우저 SDK 결제 요청 유틸.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import * as PortOne from '@portone/browser-sdk/v2';
import { SHOP_PAYMENT_LAUNCH_COPY } from '../constants/clientShopConstants';

/** PortOne V2 카드 일시불(개월 0) — SDK monthOption.fixedMonth */
const PORTONE_CARD_INSTALLMENT_LUMP_SUM = {
  installment: {
    monthOption: {
      fixedMonth: 0
    }
  }
};

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
 * 포트원 V2 requestPayment 호출.
 *
 * @param {Object} params
 * @param {string} params.storeId
 * @param {string} params.channelKey
 * @param {string} params.paymentId
 * @param {string} params.orderName
 * @param {number} params.totalAmount
 * @param {string} [params.currency='KRW']
 * @param {string} [params.payMethod='CARD']
 * @param {string} [params.redirectUrl]
 * @param {Object} [params.customer] 전달 시 email·fullName·phoneNumber(또는 phone) 필수(이니시스 V2)
 * @param {Object} [params.card] 명시 시 그대로 사용. 없으면 CARD일 때 일시불 기본값
 * @returns {Promise<Object|undefined>}
 */
export const requestPortOnePayment = async({
  storeId,
  channelKey,
  paymentId,
  orderName,
  totalAmount,
  currency = 'KRW',
  payMethod,
  redirectUrl,
  customer,
  card
}) => {
  if (!storeId || !String(storeId).trim()) {
    throw new Error('포트원 storeId 가 없습니다.');
  }
  if (!channelKey || !String(channelKey).trim()) {
    throw new Error('포트원 channelKey 가 없습니다.');
  }
  if (!paymentId || !String(paymentId).trim()) {
    throw new Error('paymentId 가 없습니다.');
  }
  const amount = Number(totalAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('결제 금액이 유효하지 않습니다.');
  }

  const resolvedPayMethod = (payMethod && String(payMethod).trim()) || 'CARD';
  const request = {
    storeId: String(storeId).trim(),
    channelKey: String(channelKey).trim(),
    paymentId: String(paymentId).trim(),
    orderName: orderName || '결제',
    totalAmount: amount,
    currency: currency || 'KRW',
    payMethod: resolvedPayMethod
  };
  if (redirectUrl) {
    request.redirectUrl = redirectUrl;
  }

  if (customer && typeof customer === 'object') {
    const customerEmail = nonBlankTrimmed(customer.email);
    if (!customerEmail) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
    }
    const customerFullName = nonBlankTrimmed(customer.fullName);
    if (!customerFullName) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED);
    }
    const customerPhoneNumber =
      nonBlankTrimmed(customer.phoneNumber) || nonBlankTrimmed(customer.phone);
    if (!customerPhoneNumber) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
    }
    request.customer = {
      ...customer,
      email: customerEmail,
      fullName: customerFullName,
      phoneNumber: customerPhoneNumber
    };
  }

  const normalizedPayMethod = String(resolvedPayMethod).trim().toUpperCase();
  if (card && typeof card === 'object') {
    request.card = card;
  } else if (normalizedPayMethod === 'CARD') {
    request.card = PORTONE_CARD_INSTALLMENT_LUMP_SUM;
  }

  return PortOne.requestPayment(request);
};
