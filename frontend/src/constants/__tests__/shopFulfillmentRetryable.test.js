/**
 * isShopFulfillmentRetryable / hasShopFulfillmentRetryableLine
 *
 * @author MindGarden
 * @since 2026-09-19
 */

import {
  hasShopFulfillmentRetryableLine,
  isShopFulfillmentRetryable
} from '../clientShopConstants';

describe('shop fulfillment retryable helpers', () => {
  test('retryable flag true wins', () => {
    expect(isShopFulfillmentRetryable({
      status: 'COMPLETED',
      retryable: true
    })).toBe(true);
  });

  test('retryable flag false wins over FAILED message', () => {
    expect(isShopFulfillmentRetryable({
      status: 'FAILED',
      message: 'failed retryable',
      retryable: false
    })).toBe(false);
  });

  test('FAILED + retryable message without flag', () => {
    expect(isShopFulfillmentRetryable({
      status: 'FAILED',
      message: 'Consultation ERP sync failed (retryable)'
    })).toBe(true);
  });

  test('COMPLETED / non-retryable FAILED / null', () => {
    expect(isShopFulfillmentRetryable({
      status: 'COMPLETED',
      message: 'done'
    })).toBe(false);
    expect(isShopFulfillmentRetryable({
      status: 'FAILED',
      message: 'permanent failure'
    })).toBe(false);
    expect(isShopFulfillmentRetryable(null)).toBe(false);
  });

  test('hasShopFulfillmentRetryableLine scans array', () => {
    expect(hasShopFulfillmentRetryableLine([
      { status: 'COMPLETED' },
      { status: 'FAILED', message: 'x retryable y' }
    ])).toBe(true);
    expect(hasShopFulfillmentRetryableLine([])).toBe(false);
    expect(hasShopFulfillmentRetryableLine(null)).toBe(false);
  });
});
