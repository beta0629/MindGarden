/**
 * 쇼핑 PortOne 결제 BE verify 재시도 (fail-closed).
 * SDK UI 성공 직후 REST status가 아직 PAID가 아닐 때 짧은 backoff로 재호출한다.
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_VERIFY_RETRY
} from '../constants/clientShopConstants';
import { verifyShopPayment } from '../services/clientShopService';

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const sleepMs = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * @param {number} attemptIndex 0-based (첫 재시도 전 대기 = 0)
 * @param {{ baseDelayMs?: number, delayIncrementMs?: number }} [cfg]
 * @returns {number}
 */
export const resolveShopPaymentVerifyRetryDelayMs = (
  attemptIndex,
  {
    baseDelayMs = SHOP_PAYMENT_VERIFY_RETRY.BASE_DELAY_MS,
    delayIncrementMs = SHOP_PAYMENT_VERIFY_RETRY.DELAY_INCREMENT_MS
  } = {}
) => {
  const base = Number(baseDelayMs);
  const step = Number(delayIncrementMs);
  const index = Number(attemptIndex);
  if (!Number.isFinite(base) || !Number.isFinite(step) || !Number.isFinite(index)) {
    return SHOP_PAYMENT_VERIFY_RETRY.BASE_DELAY_MS;
  }
  return Math.max(0, base + index * step);
};

/**
 * verifyShopPayment 를 짧은 backoff로 재시도한다. 최종 실패만 throw.
 *
 * @param {string} paymentId
 * @param {number} amount
 * @param {Object} [options]
 * @param {(paymentId: string, amount: number) => Promise<{ isValid?: boolean }>} [options.verifyFn]
 * @param {(ms: number) => Promise<void>} [options.sleepFn]
 * @param {number} [options.maxAttempts]
 * @param {number} [options.baseDelayMs]
 * @param {number} [options.delayIncrementMs]
 * @returns {Promise<{ isValid: boolean, message?: string }>}
 */
export const verifyShopPaymentWithRetry = async(paymentId, amount, options = {}) => {
  const verifyFn =
    typeof options.verifyFn === 'function' ? options.verifyFn : verifyShopPayment;
  const sleepFn = typeof options.sleepFn === 'function' ? options.sleepFn : sleepMs;
  const maxAttempts = Number.isFinite(Number(options.maxAttempts))
    ? Math.max(1, Number(options.maxAttempts))
    : SHOP_PAYMENT_VERIFY_RETRY.MAX_ATTEMPTS;
  const baseDelayMs = Number.isFinite(Number(options.baseDelayMs))
    ? Number(options.baseDelayMs)
    : SHOP_PAYMENT_VERIFY_RETRY.BASE_DELAY_MS;
  const delayIncrementMs = Number.isFinite(Number(options.delayIncrementMs))
    ? Number(options.delayIncrementMs)
    : SHOP_PAYMENT_VERIFY_RETRY.DELAY_INCREMENT_MS;

  let lastError = new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await verifyFn(paymentId, amount);
      if (result && result.isValid === true) {
        return result;
      }
      lastError = new Error(
        (result && typeof result.message === 'string' && result.message.trim())
          || SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED
      );
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
    }

    if (attempt < maxAttempts) {
      const delayMs = resolveShopPaymentVerifyRetryDelayMs(attempt - 1, {
        baseDelayMs,
        delayIncrementMs
      });
      await sleepFn(delayMs);
    }
  }

  throw lastError;
};
