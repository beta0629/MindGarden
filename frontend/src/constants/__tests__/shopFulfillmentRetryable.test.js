/**
 * isShopFulfillmentRetryable / hasShopFulfillmentRetryableLine / canClientShopFulfillRetry
 * / resolveShopFulfillmentLines
 * SSOT: 재이행은 FAILED + retryable 만. COMPLETED/PENDING 등 + retryable:true → false.
 * events 우선; lines-only / null events 폴백으로 버튼 노출.
 *
 * @author MindGarden
 * @since 2026-09-19
 */

import {
  canClientShopFulfillRetry,
  hasShopFulfillmentRetryableLine,
  isShopFulfillmentRetryable,
  resolveShopFulfillmentLines,
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

  test('resolveShopFulfillmentLines prefers events; falls back to lines', () => {
    const lines = [{ status: 'COMPLETED', skuCode: 'L1' }];
    const events = [{ status: 'FAILED', retryable: true, skuCode: 'E1' }];
    expect(resolveShopFulfillmentLines(lines)).toEqual(lines);
    expect(resolveShopFulfillmentLines({ fulfillmentLines: lines })).toEqual(lines);
    expect(resolveShopFulfillmentLines({
      fulfillmentLines: lines,
      fulfillmentEvents: events
    })).toEqual(events);
    expect(resolveShopFulfillmentLines({ fulfillmentEvents: events })).toEqual(events);
    expect(resolveShopFulfillmentLines({ fulfillmentEvents: null, fulfillmentLines: lines }))
      .toEqual(lines);
    expect(resolveShopFulfillmentLines({ fulfillmentLines: null, fulfillmentEvents: events }))
      .toEqual(events);
    expect(resolveShopFulfillmentLines({ fulfillmentLines: [] })).toEqual([]);
    expect(resolveShopFulfillmentLines({ fulfillmentEvents: [] })).toEqual([]);
    expect(resolveShopFulfillmentLines(null)).toEqual([]);
    expect(resolveShopFulfillmentLines({})).toEqual([]);
  });

  test('canClientShopFulfillRetry requires PAID + retryable FAILED line (sticky flag must NOT hide)', () => {
    const retryableLines = [
      { status: 'FAILED', message: 'erp failed (retryable)', retryable: true }
    ];
    // sticky flag true + FAILED+retryable → 버튼 유지 (고착 플래그로 hide 금지)
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      clientFulfillRetryAttempted: true,
      fulfillmentLines: retryableLines
    })).toBe(true);
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
      clientFulfillRetryAttempted: true,
      fulfillmentLines: [{ status: 'COMPLETED' }]
    })).toBe(false);
  });

  test('canClientShopFulfillRetry events-only (no fulfillmentLines) → true', () => {
    const retryableEvents = [{ status: 'FAILED', retryable: true }];
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      fulfillmentEvents: retryableEvents
    })).toBe(true);
    expect(canClientShopFulfillRetry({
      status: 'PAID',
      fulfillmentLines: null,
      fulfillmentEvents: retryableEvents
    })).toBe(true);
  });

  test('SHOP_FULFILLMENT_RETRY_COPY keeps HINT for anti double-tap', () => {
    expect(SHOP_FULFILLMENT_RETRY_COPY.HINT).toBe('한 번만 눌러주세요');
  });
});
