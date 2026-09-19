/**
 * isShopFulfillmentRetryable / hasShopFulfillmentRetryableLine / canClientShopFulfillRetry
 * SSOT: 재이행은 FAILED + retryable 만. COMPLETED/PENDING 등 + retryable:true → false.
 *
 * @author MindGarden
 * @since 2026-09-19
 */

import {
  canClientShopFulfillRetry,
  hasShopFulfillmentRetryableLine,
  isShopFulfillmentRetryable,
  SHOP_FULFILLMENT_RETRY_COPY
} from '../clientShopConstants';

describe('shop fulfillment retryable helpers', () => {
  test('COMPLETED + retryable:true → false (SSOT)', () => {
    expect(isShopFulfillmentRetryable({
      status: 'COMPLETED',
      retryable: true
    })).toBe(false);
  });

  test('PENDING + retryable:true → false', () => {
    expect(isShopFulfillmentRetryable({
      status: 'PENDING',
      retryable: true
    })).toBe(false);
  });

  test('FAILED + retryable:true → true', () => {
    expect(isShopFulfillmentRetryable({
      status: 'FAILED',
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

  test('FAILED + retryable message without flag → true', () => {
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
    expect(hasShopFulfillmentRetryableLine([
      { status: 'COMPLETED', retryable: true }
    ])).toBe(false);
    expect(hasShopFulfillmentRetryableLine([])).toBe(false);
    expect(hasShopFulfillmentRetryableLine(null)).toBe(false);
  });

  test('canClientShopFulfillRetry requires PAID + not success-consumed + retryable FAILED line', () => {
    const retryableLines = [
      { status: 'FAILED', message: 'erp failed (retryable)', retryable: true }
    ];
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      clientFulfillRetryAttempted: false,
      fulfillmentLines: retryableLines
    })).toBe(true);
    // 성공 재이행 소진 후에만 hide — 플래그 true
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      clientFulfillRetryAttempted: true,
      fulfillmentLines: retryableLines
    })).toBe(false);
    // FAILED+retryable + flag false → 버튼 유지 (클릭 1회 소진 아님)
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      clientFulfillRetryAttempted: false,
      fulfillmentLines: retryableLines
    })).toBe(true);
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
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      clientFulfillRetryAttempted: false,
      fulfillmentLines: [{ status: 'COMPLETED', retryable: true }]
    })).toBe(false);
  });

  test('SHOP_FULFILLMENT_RETRY_COPY keeps HINT for anti double-tap', () => {
    expect(SHOP_FULFILLMENT_RETRY_COPY.HINT).toBe('한 번만 눌러주세요');
  });
});
