/**
 * 내담자 샵 prepare 응답 → PortOne SDK 또는 paymentUrl 결제 진입.
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_LAUNCH_COPY
} from '../constants/clientShopConstants';
import { requestPortOnePayment } from './portonePayment';

/**
 * BE simulate / 미연동 더미 paymentUrl 여부 (example.com 계열).
 *
 * @param {string} paymentUrl
 * @returns {boolean}
 */
const isDummyExamplePaymentUrl = (paymentUrl) => {
  if (!paymentUrl || typeof paymentUrl !== 'string') {
    return false;
  }
  const trimmed = paymentUrl.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return host === 'example.com' || host.endsWith('.example.com');
  } catch {
    return /example\.com/i.test(trimmed);
  }
};

/**
 * PortOne SDK 거절값(string / Error / {message,code} / 빈 메시지)을 Error로 정규화한다.
 *
 * @param {*} error
 * @param {string} fallback
 * @returns {Error}
 */
const toPortOneError = (error, fallback) => {
  if (error instanceof Error) {
    const msg = typeof error.message === 'string' ? error.message.trim() : '';
    return new Error(msg || fallback);
  }
  if (typeof error === 'string') {
    const msg = error.trim();
    return new Error(msg || fallback);
  }
  if (error && typeof error === 'object') {
    const msg = typeof error.message === 'string' ? error.message.trim() : '';
    if (msg) {
      return new Error(msg);
    }
    if (error.code != null && String(error.code).trim()) {
      return new Error(`결제 모듈 오류: ${error.code}`);
    }
  }
  return new Error(fallback);
};

/**
 * prepare DTO로 결제 UI를 연다.
 *
 * @param {object|null|undefined} prepareResult prepareShopPayment 언랩 결과
 * @param {{ orderName?: string }} [options]
 * @returns {Promise<{ mode: 'portone'|'url', paymentUrl?: string }>}
 */
export const launchShopPaymentFromPrepare = async(prepareResult, options = {}) => {
  const orderName =
    (options.orderName && String(options.orderName).trim()) ||
    SHOP_PAYMENT_LAUNCH_COPY.ORDER_NAME;

  const rawCash = prepareResult?.cashAmount;
  if (rawCash != null && typeof rawCash === 'object') {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }
  const cashAmount = Number(rawCash);
  const canUsePortOne =
    prepareResult?.pgReady === true &&
    prepareResult?.storeId &&
    prepareResult?.channelKey &&
    prepareResult?.paymentId &&
    Number.isFinite(cashAmount) &&
    cashAmount > 0;

  if (canUsePortOne) {
    let portOneResult;
    try {
      portOneResult = await requestPortOnePayment({
        storeId: prepareResult.storeId,
        channelKey: prepareResult.channelKey,
        paymentId: prepareResult.paymentId,
        orderName,
        totalAmount: cashAmount,
        currency: 'KRW'
      });
    } catch (error) {
      throw toPortOneError(error, SHOP_CHECKOUT_ERROR_COPY.PAYMENT_LAUNCH_FAILED);
    }
    if (portOneResult?.code) {
      throw new Error(
        (typeof portOneResult.message === 'string' && portOneResult.message.trim())
          || `결제 모듈 오류: ${portOneResult.code}`
      );
    }
    return { mode: 'portone' };
  }

  const paymentUrl = prepareResult?.paymentUrl;
  if (paymentUrl) {
    // BE simulate 더미(example.com)는 pgReady 여부와 관계없이 성공 경로로 열지 않음
    if (isDummyExamplePaymentUrl(paymentUrl)) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
    }
    window.open(
      paymentUrl,
      '_blank',
      SHOP_PAYMENT_LAUNCH_COPY.WINDOW_FEATURES
    );
    return { mode: 'url', paymentUrl };
  }

  throw new Error(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
};
