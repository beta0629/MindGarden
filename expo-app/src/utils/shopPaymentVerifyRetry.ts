/**
 * 쇼핑 PortOne 결제 BE verify 재시도 (fail-closed).
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { verifyShopPayment, type ShopPaymentVerifyResult } from '@/api/shopPayment';
import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_VERIFY_RETRY,
} from '@/constants/clientShopConstants';

/**
 * @param ms 대기 ms
 */
export const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * @param attemptIndex 0-based (첫 재시도 전 대기 = 0)
 * @param cfg delay 설정
 */
export const resolveShopPaymentVerifyRetryDelayMs = (
  attemptIndex: number,
  {
    baseDelayMs = SHOP_PAYMENT_VERIFY_RETRY.BASE_DELAY_MS,
    delayIncrementMs = SHOP_PAYMENT_VERIFY_RETRY.DELAY_INCREMENT_MS,
  }: { baseDelayMs?: number; delayIncrementMs?: number } = {},
): number => {
  const base = Number(baseDelayMs);
  const step = Number(delayIncrementMs);
  const index = Number(attemptIndex);
  if (!Number.isFinite(base) || !Number.isFinite(step) || !Number.isFinite(index)) {
    return SHOP_PAYMENT_VERIFY_RETRY.BASE_DELAY_MS;
  }
  return Math.max(0, base + index * step);
};

export type VerifyShopPaymentWithRetryOptions = {
  verifyFn?: (paymentId: string, amount: number) => Promise<ShopPaymentVerifyResult>;
  sleepFn?: (ms: number) => Promise<void>;
  maxAttempts?: number;
  baseDelayMs?: number;
  delayIncrementMs?: number;
};

/**
 * verifyShopPayment 를 짧은 backoff로 재시도한다. 최종 실패만 throw.
 *
 * @param paymentId PortOne paymentId
 * @param amount cashAmount
 * @param options DI (테스트용)
 */
export const verifyShopPaymentWithRetry = async (
  paymentId: string,
  amount: number,
  options: VerifyShopPaymentWithRetryOptions = {},
): Promise<ShopPaymentVerifyResult> => {
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

  let lastError: Error = new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await verifyFn(paymentId, amount);
      if (result && result.isValid === true) {
        return result;
      }
      lastError = new Error(
        (result && typeof result.message === 'string' && result.message.trim()) ||
          SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED,
      );
    } catch (e) {
      lastError =
        e instanceof Error ? e : new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
    }

    if (attempt < maxAttempts) {
      const delayMs = resolveShopPaymentVerifyRetryDelayMs(attempt - 1, {
        baseDelayMs,
        delayIncrementMs,
      });
      await sleepFn(delayMs);
    }
  }

  throw lastError;
};
