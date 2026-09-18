/**
 * shopPaymentVerifyRetry — PortOne REST PAID 지연 대비 BE verify backoff.
 */

import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_VERIFY_RETRY
} from '../../constants/clientShopConstants';
import {
  resolveShopPaymentVerifyRetryDelayMs,
  verifyShopPaymentWithRetry
} from '../shopPaymentVerifyRetry';

describe('resolveShopPaymentVerifyRetryDelayMs', () => {
  test('BASE + index * INCREMENT (400→800)', () => {
    expect(resolveShopPaymentVerifyRetryDelayMs(0)).toBe(
      SHOP_PAYMENT_VERIFY_RETRY.BASE_DELAY_MS
    );
    expect(resolveShopPaymentVerifyRetryDelayMs(1)).toBe(500);
    expect(resolveShopPaymentVerifyRetryDelayMs(4)).toBe(800);
  });
});

describe('verifyShopPaymentWithRetry', () => {
  test('첫 호출 reject → 이후 성공 → verified, reconcile 없음', async() => {
    const verifyFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('not paid yet'))
      .mockResolvedValueOnce({ isValid: true });
    const sleepFn = jest.fn().mockResolvedValue(undefined);

    const result = await verifyShopPaymentWithRetry('pay-1', 15000, {
      verifyFn,
      sleepFn,
      maxAttempts: 5
    });

    expect(result).toEqual({ isValid: true });
    expect(verifyFn).toHaveBeenCalledTimes(2);
    expect(verifyFn).toHaveBeenNthCalledWith(1, 'pay-1', 15000);
    expect(verifyFn).toHaveBeenNthCalledWith(2, 'pay-1', 15000);
    expect(sleepFn).toHaveBeenCalledTimes(1);
    expect(sleepFn).toHaveBeenCalledWith(SHOP_PAYMENT_VERIFY_RETRY.BASE_DELAY_MS);
  });

  test('isValid false → 재시도 후 성공', async() => {
    const verifyFn = jest
      .fn()
      .mockResolvedValueOnce({ isValid: false, message: 'pending' })
      .mockResolvedValueOnce({ isValid: true });
    const sleepFn = jest.fn().mockResolvedValue(undefined);

    await expect(
      verifyShopPaymentWithRetry('pay-2', 1000, { verifyFn, sleepFn, maxAttempts: 3 })
    ).resolves.toEqual({ isValid: true });
    expect(verifyFn).toHaveBeenCalledTimes(2);
  });

  test('최종 실패 시 throw (fail-closed)', async() => {
    const verifyFn = jest.fn().mockRejectedValue(new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED));
    const sleepFn = jest.fn().mockResolvedValue(undefined);

    await expect(
      verifyShopPaymentWithRetry('pay-fail', 1000, {
        verifyFn,
        sleepFn,
        maxAttempts: 3,
        baseDelayMs: 10,
        delayIncrementMs: 5
      })
    ).rejects.toThrow(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);

    expect(verifyFn).toHaveBeenCalledTimes(3);
    expect(sleepFn).toHaveBeenCalledTimes(2);
  });
});
