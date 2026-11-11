import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveProductDisplayPrice } from './client';
import { parseConsultationProductsResponse } from './schemas';

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '__fixtures__/consultation-products.sample.json',
);

describe('parseConsultationProductsResponse', () => {
  it('unwraps the envelope, drops malformed items, and sorts by displayOrder', () => {
    const raw = JSON.parse(readFileSync(fixturePath, 'utf8')) as unknown;
    const products = parseConsultationProductsResponse(raw);

    expect(products.map((p) => p.skuCode)).toEqual(['SAMPLE-A', 'SAMPLE-B']);
    expect(products[0]?.name).toBe('Sample A');
    expect(products[0]?.sessionMinutes).toBeNull();
    expect(products[1]?.eventPrice).toBe(90000);
  });

  it('returns [] when success is false or data is missing', () => {
    expect(
      parseConsultationProductsResponse({
        success: false,
        message: 'error',
        data: [],
      }),
    ).toEqual([]);
    expect(parseConsultationProductsResponse({ hello: 'world' })).toEqual([]);
  });
});

describe('resolveProductDisplayPrice', () => {
  it('shows eventPrice with struck-through price when eventPrice is set', () => {
    const view = resolveProductDisplayPrice({
      skuCode: 'SAMPLE-B',
      name: 'Sample B',
      price: 120000,
      eventPrice: 90000,
      eventStartDate: '2026-01-01',
      eventEndDate: '2026-12-31',
      sessionCount: 1,
      sessionMinutes: 50,
      displayOrder: 20,
      updatedAt: '2026-11-01T00:00:00',
    });
    expect(view).toEqual({
      amount: 90000,
      struckThroughPrice: 120000,
      isEvent: true,
    });
  });

  it('shows price alone when eventPrice is null', () => {
    const view = resolveProductDisplayPrice({
      skuCode: 'SAMPLE-A',
      name: 'Sample A',
      price: 100000,
      eventPrice: null,
      eventStartDate: null,
      eventEndDate: null,
      sessionCount: 1,
      sessionMinutes: null,
      displayOrder: 5,
      updatedAt: '2026-11-01T00:00:00',
    });
    expect(view).toEqual({
      amount: 100000,
      struckThroughPrice: null,
      isEvent: false,
    });
  });
});
