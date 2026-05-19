import { mergeCartLine, buildCartLinesPayload, createShopIdempotencyKey } from '@/utils/clientShopCart';

describe('mergeCartLine', () => {
  it('adds a new line when sku is absent', () => {
    expect(mergeCartLine([], 'SKU-1', 1)).toEqual([{ skuCode: 'SKU-1', quantity: 1 }]);
  });

  it('increments quantity for existing sku', () => {
    expect(mergeCartLine([{ skuCode: 'SKU-1', quantity: 1 }], 'SKU-1', 1)).toEqual([
      { skuCode: 'SKU-1', quantity: 2 },
    ]);
  });

  it('removes line when quantity reaches zero', () => {
    expect(mergeCartLine([{ skuCode: 'SKU-1', quantity: 1 }], 'SKU-1', -1)).toEqual([]);
  });

  it('caps quantity at 99', () => {
    expect(mergeCartLine([{ skuCode: 'SKU-1', quantity: 99 }], 'SKU-1', 1)).toEqual([
      { skuCode: 'SKU-1', quantity: 99 },
    ]);
  });
});

describe('buildCartLinesPayload', () => {
  it('maps lines to payload shape', () => {
    expect(
      buildCartLinesPayload([
        { skuCode: 'A', quantity: 2 },
        { skuCode: 'B', quantity: 1 },
      ]),
    ).toEqual([
      { skuCode: 'A', quantity: 2 },
      { skuCode: 'B', quantity: 1 },
    ]);
  });

  it('returns empty array for nullish input', () => {
    expect(buildCartLinesPayload(null)).toEqual([]);
  });
});

describe('createShopIdempotencyKey', () => {
  it('returns a non-empty string', () => {
    expect(createShopIdempotencyKey().length).toBeGreaterThan(0);
  });
});
