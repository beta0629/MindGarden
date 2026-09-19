/**
 * isShopFulfillmentRetryable / hasShopFulfillmentRetryableLine / canClientShopFulfillRetry
 *
 * @author MindGarden
 * @since 2026-09-19
 */

import {
  canClientShopFulfillRetry,
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

  test('canClientShopFulfillRetry requires PAID + not attempted + retryable line', () => {
    const retryableLines = [
      { status: 'FAILED', message: 'erp failed (retryable)', retryable: true }
    ];
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      clientFulfillRetryAttempted: false,
      fulfillmentLines: retryableLines
    })).toBe(true);
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      clientFulfillRetryAttempted: true,
      fulfillmentLines: retryableLines
    })).toBe(false);
    expect(canClientShopFulfillRetry({
      status: 'PENDING_PAYMENT',
      clientFulfillRetryAttempted: false,
      fulfillmentLines: retryableLines
    })).toBe(false);
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      clientFulfillRetryAttempted: false,
      fulfillmentLines: [{ status: 'COMPLETED' }]
    })).toBe(false);
  });
});
