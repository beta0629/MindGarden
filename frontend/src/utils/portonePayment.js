/**
 * 포트원 V2 브라우저 SDK 결제 요청 유틸.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

import * as PortOne from '@portone/browser-sdk/v2';

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
 * @param {string} [params.redirectUrl]
 * @param {Object} [params.customer]
 * @returns {Promise<Object|undefined>}
 */
export const requestPortOnePayment = async({
  storeId,
  channelKey,
  paymentId,
  orderName,
  totalAmount,
  currency = 'KRW',
  redirectUrl,
  customer
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

  const request = {
    storeId: String(storeId).trim(),
    channelKey: String(channelKey).trim(),
    paymentId: String(paymentId).trim(),
    orderName: orderName || '결제',
    totalAmount: amount,
    currency: currency || 'KRW'
  };
  if (redirectUrl) {
    request.redirectUrl = redirectUrl;
  }
  if (customer && typeof customer === 'object') {
    request.customer = customer;
  }

  return PortOne.requestPayment(request);
};
