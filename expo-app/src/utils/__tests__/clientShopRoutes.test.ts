import {
  buildShopOrderDetailPath,
  buildShopPaymentCompletePath,
  buildShopSkuDetailPath,
  CLIENT_SHOP_MENU_TEMPORARILY_DISABLED,
  CLIENT_SHOP_ROUTES,
  isClientShopMoreMenuVisible,
  isShopOrderAwaitingPayment,
} from '@/constants/clientShopConstants';

describe('isClientShopMoreMenuVisible', () => {
  it('shows menu when shop enabled and not temporarily disabled', () => {
    expect(CLIENT_SHOP_MENU_TEMPORARILY_DISABLED).toBe(false);
    expect(isClientShopMoreMenuVisible(true)).toBe(true);
    expect(isClientShopMoreMenuVisible(false)).toBe(false);
    expect(isClientShopMoreMenuVisible(undefined)).toBe(false);
  });
});

describe('CLIENT_SHOP_ROUTES', () => {
  it('exposes orders, sku, payment-return and complete paths', () => {
    expect(CLIENT_SHOP_ROUTES.ORDERS).toBe('/(client)/(shop)/orders');
    expect(CLIENT_SHOP_ROUTES.SKU_DETAIL).toBe('/(client)/(shop)/sku');
    expect(CLIENT_SHOP_ROUTES.PAYMENT_RETURN).toBe('/(client)/(shop)/payment-return');
    expect(CLIENT_SHOP_ROUTES.COMPLETE).toBe('/(client)/(shop)/complete');
  });
});

describe('buildShopOrderDetailPath', () => {
  it('appends encoded order public id', () => {
    expect(buildShopOrderDetailPath('ord-1')).toBe('/(client)/(shop)/orders/ord-1');
    expect(buildShopOrderDetailPath('a/b')).toBe('/(client)/(shop)/orders/a%2Fb');
  });
});

describe('buildShopPaymentCompletePath', () => {
  it('appends encoded order public id under complete', () => {
    expect(buildShopPaymentCompletePath('ord-1')).toBe(
      '/(client)/(shop)/complete/ord-1',
    );
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
