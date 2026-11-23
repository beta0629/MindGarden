/**
 * clientShopPaymentReturn — redirect 쿼리·금액 해석.
 */
import { SHOP_CHECKOUT_ERROR_COPY } from '@/constants/clientShopConstants';
import {
  parseShopPaymentReturnQuery,
  resolveCashAmountFromOrder,
  resolveShopPaymentReturnPaymentId,
  resolveShopPaymentVerifyAmount,
} from '@/utils/clientShopPaymentReturn';
import {
  clearShopPendingPaymentVerify,
  stashShopPendingPaymentVerify,
} from '@/utils/shopPendingPaymentVerify';

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `mindgarden://${path}`),
}));

jest.mock('@/lib/getMmkv', () => {
  const store = new Map<string, string>();
  return {
    getMmkv: () => ({
      getString: (key: string) => store.get(key),
      set: (key: string, value: string | number | boolean) => {
        store.set(key, String(value));
      },
      remove: (key: string) => {
        store.delete(key);
      },
      getNumber: () => undefined,
    }),
  };
});

describe('parseShopPaymentReturnQuery', () => {
  test('URLSearchParams에서 필드를 파싱한다', () => {
    const params = new URLSearchParams(
      'paymentId=pay-1&orderPublicId=ord-1&code=FAIL&message=err',
    );
    expect(parseShopPaymentReturnQuery(params)).toEqual({
      paymentId: 'pay-1',
      orderPublicId: 'ord-1',
      code: 'FAIL',
      message: 'err',
    });
  });

  test('Record 쿼리도 파싱한다', () => {
    expect(
      parseShopPaymentReturnQuery({
        paymentId: ' pay-2 ',
        orderPublicId: 'ord-2',
      }),
    ).toEqual({
      paymentId: 'pay-2',
      orderPublicId: 'ord-2',
      code: null,
      message: null,
    });
  });
});

describe('resolveShopPaymentReturnPaymentId', () => {
  afterEach(() => {
    clearShopPendingPaymentVerify();
  });

  test('쿼리 paymentId 우선', () => {
    expect(
      resolveShopPaymentReturnPaymentId({ paymentId: 'pay-q', orderPublicId: 'ord' }),
    ).toBe('pay-q');
  });

  test('쿼리 없으면 stash orderPublicId 일치 시 폴백', () => {
    stashShopPendingPaymentVerify({
      paymentId: 'pay-stash',
      orderPublicId: 'ord-1',
      cashAmount: 1000,
    });
    expect(
      resolveShopPaymentReturnPaymentId({ paymentId: null, orderPublicId: 'ord-1' }),
    ).toBe('pay-stash');
    expect(
      resolveShopPaymentReturnPaymentId({ paymentId: null, orderPublicId: 'other' }),
    ).toBeNull();
  });
});

describe('resolveCashAmountFromOrder / resolveShopPaymentVerifyAmount', () => {
  afterEach(() => {
    clearShopPendingPaymentVerify();
  });

  test('cashDueMinor만 허용', () => {
    expect(resolveCashAmountFromOrder({ cashDueMinor: 15000 })).toBe(15000);
    expect(resolveCashAmountFromOrder({ cashDueMinor: 0 })).toBeNull();
    expect(resolveCashAmountFromOrder(null)).toBeNull();
  });

  test('stash 일치 시 금액 반환', async () => {
    stashShopPendingPaymentVerify({
      paymentId: 'pay-v',
      orderPublicId: 'ord-v',
      cashAmount: 15000,
    });
    await expect(
      resolveShopPaymentVerifyAmount({
        paymentId: 'pay-v',
        orderPublicId: 'ord-v',
      }),
    ).resolves.toBe(15000);
  });

  test('stash 없으면 fetchOrder 폴백, 없으면 throw', async () => {
    await expect(resolveShopPaymentVerifyAmount({})).rejects.toThrow(
      SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT,
    );
    await expect(
      resolveShopPaymentVerifyAmount({
        orderPublicId: 'ord-x',
        fetchOrder: async () => ({ cashDueMinor: 9000 }),
      }),
    ).resolves.toBe(9000);
  });
});
