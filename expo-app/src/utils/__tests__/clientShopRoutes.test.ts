import {
  buildShopOrderDetailPath,
  buildShopSkuDetailPath,
  CLIENT_SHOP_ROUTES,
  isShopOrderAwaitingPayment,
} from '@/constants/clientShopConstants';

describe('CLIENT_SHOP_ROUTES', () => {
  it('exposes orders and sku detail base paths', () => {
    expect(CLIENT_SHOP_ROUTES.ORDERS).toBe('/(client)/(shop)/orders');
    expect(CLIENT_SHOP_ROUTES.SKU_DETAIL).toBe('/(client)/(shop)/sku');
  });
});

describe('buildShopOrderDetailPath', () => {
  it('appends encoded order public id', () => {
    expect(buildShopOrderDetailPath('ord-1')).toBe('/(client)/(shop)/orders/ord-1');
    expect(buildShopOrderDetailPath('a/b')).toBe('/(client)/(shop)/orders/a%2Fb');
  });
});

describe('buildShopSkuDetailPath', () => {
  it('appends encoded sku code', () => {
    expect(buildShopSkuDetailPath('SKU-1')).toBe('/(client)/(shop)/sku/SKU-1');
    expect(buildShopSkuDetailPath('a b')).toBe('/(client)/(shop)/sku/a%20b');
  });
});

describe('isShopOrderAwaitingPayment', () => {
  it('returns true for pending payment with cash due', () => {
    expect(
      isShopOrderAwaitingPayment({ status: 'PENDING_PAYMENT', cashDueMinor: 1000 }),
    ).toBe(true);
    expect(isShopOrderAwaitingPayment({ status: 'CREATED', cashDueMinor: 1 })).toBe(true);
  });

  it('returns false when paid, refunded, or no cash due', () => {
    expect(isShopOrderAwaitingPayment({ status: 'PAID', cashDueMinor: 1000 })).toBe(false);
    expect(isShopOrderAwaitingPayment({ status: 'REFUNDED', cashDueMinor: 1000 })).toBe(false);
    expect(isShopOrderAwaitingPayment({ status: 'PENDING_PAYMENT', cashDueMinor: 0 })).toBe(
      false,
    );
    expect(isShopOrderAwaitingPayment(null)).toBe(false);
  });
});
