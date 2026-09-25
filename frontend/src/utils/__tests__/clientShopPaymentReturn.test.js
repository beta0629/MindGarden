/**
 * clientShopPaymentReturn — redirect 쿼리·금액 해석 단위 테스트
 */

import {
  CLIENT_SHOP_PENDING_VERIFY_STORAGE,
  clearShopPendingPaymentVerify,
  SHOP_CHECKOUT_ERROR_COPY,
  stashShopPendingPaymentVerify
} from '../../constants/clientShopConstants';
import {
  parseShopPaymentReturnQuery,
  resolveCashAmountFromOrder,
  resolveShopPaymentReturnPaymentId,
  resolveShopPaymentVerifyAmount
} from '../clientShopPaymentReturn';
import { verifyShopPayment } from '../../services/clientShopService';
import { verifyShopPaymentWithRetry } from '../shopPaymentVerifyRetry';

jest.mock('../../services/clientShopService', () => ({
  verifyShopPayment: jest.fn()
}));

describe('parseShopPaymentReturnQuery', () => {
  test('paymentId·orderPublicId·code·message를 파싱한다', () => {
    const params = new URLSearchParams(
      'paymentId=pay-9&orderPublicId=ord-1&code=FAILURE_TYPE_PG&message=취소됨'
    );
    expect(parseShopPaymentReturnQuery(params)).toEqual({
      paymentId: 'pay-9',
      orderPublicId: 'ord-1',
      code: 'FAILURE_TYPE_PG',
      message: '취소됨'
    });
  });

  test('빈·공백 값은 null로 정규화한다', () => {
    const params = new URLSearchParams('paymentId=%20&orderPublicId=');
    expect(parseShopPaymentReturnQuery(params)).toEqual({
      paymentId: null,
      orderPublicId: null,
      code: null,
      message: null
    });
  });
});

describe('resolveShopPaymentReturnPaymentId', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    clearShopPendingPaymentVerify();
  });

  test('query paymentId가 있으면 그대로 사용한다', () => {
    stashShopPendingPaymentVerify({
      paymentId: 'pay-stash',
      orderPublicId: 'ord-1',
      cashAmount: 1000
    });
    expect(
      resolveShopPaymentReturnPaymentId({
        paymentId: 'pay-query',
        orderPublicId: 'ord-1'
      })
    ).toBe('pay-query');
  });

  test('query paymentId 없고 stash orderPublicId 일치 시 stash paymentId', () => {
    stashShopPendingPaymentVerify({
      paymentId: 'pay-from-stash',
      orderPublicId: 'ord-match',
      cashAmount: 15000
    });
    expect(
      resolveShopPaymentReturnPaymentId({
        paymentId: null,
        orderPublicId: 'ord-match'
      })
    ).toBe('pay-from-stash');
  });

  test('orderPublicId 불일치·stash 없으면 null (fail-closed)', () => {
    stashShopPendingPaymentVerify({
      paymentId: 'pay-x',
      orderPublicId: 'ord-a',
      cashAmount: 1000
    });
    expect(
      resolveShopPaymentReturnPaymentId({
        paymentId: null,
        orderPublicId: 'ord-b'
      })
    ).toBeNull();
    clearShopPendingPaymentVerify();
    expect(
      resolveShopPaymentReturnPaymentId({
        paymentId: null,
        orderPublicId: 'ord-a'
      })
    ).toBeNull();
  });
});

describe('resolveCashAmountFromOrder', () => {
  test('cashDueMinor를 우선하고 cashDue로 폴백한다', () => {
    expect(resolveCashAmountFromOrder({ cashDueMinor: 12000 })).toBe(12000);
    expect(resolveCashAmountFromOrder({ cashDue: 9900 })).toBe(9900);
    expect(resolveCashAmountFromOrder({ cashDueMinor: 0 })).toBeNull();
    expect(resolveCashAmountFromOrder(null)).toBeNull();
  });
});

describe('resolveShopPaymentVerifyAmount + verify 경로', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearShopPendingPaymentVerify();
  });

  test('stash가 paymentId와 일치하면 session 금액을 사용한다', async() => {
    stashShopPendingPaymentVerify({
      paymentId: 'pay-1',
      orderPublicId: 'ord-1',
      cashAmount: 15000
    });
    const fetchOrder = jest.fn();
    const amount = await resolveShopPaymentVerifyAmount({
      paymentId: 'pay-1',
      orderPublicId: 'ord-other',
      fetchOrder
    });
    expect(amount).toBe(15000);
    expect(fetchOrder).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(CLIENT_SHOP_PENDING_VERIFY_STORAGE.KEY)).toBeTruthy();
  });

  test('stash가 없으면 주문 조회로 cashDueMinor를 쓴다', async() => {
    const fetchOrder = jest.fn().mockResolvedValue({ cashDueMinor: 8800 });
    const amount = await resolveShopPaymentVerifyAmount({
      paymentId: 'pay-2',
      orderPublicId: 'ord-2',
      fetchOrder
    });
    expect(amount).toBe(8800);
    expect(fetchOrder).toHaveBeenCalledWith('ord-2');
  });

  test('금액 확정 불가 시 INVALID_CASH_AMOUNT (fail-closed)', async() => {
    await expect(
      resolveShopPaymentVerifyAmount({
        paymentId: 'pay-3',
        orderPublicId: null,
        fetchOrder: jest.fn()
      })
    ).rejects.toThrow(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  });

  test('paymentId query 없고 stash에 있으면 verify 호출; retry 후 성공', async() => {
    stashShopPendingPaymentVerify({
      paymentId: 'pay-v',
      orderPublicId: 'ord-v',
      cashAmount: 15000
    });
    verifyShopPayment
      .mockRejectedValueOnce(new Error('pending'))
      .mockResolvedValueOnce({ isValid: true });

    const query = parseShopPaymentReturnQuery(
      new URLSearchParams('orderPublicId=ord-v')
    );
    const paymentId = resolveShopPaymentReturnPaymentId(query);
    expect(paymentId).toBe('pay-v');
    expect(query.code).toBeNull();

    const amount = await resolveShopPaymentVerifyAmount({
      paymentId,
      orderPublicId: query.orderPublicId,
      fetchOrder: jest.fn()
    });
    const sleepFn = jest.fn().mockResolvedValue(undefined);
    await verifyShopPaymentWithRetry(paymentId, amount, { sleepFn, maxAttempts: 3 });
    expect(verifyShopPayment).toHaveBeenCalledTimes(2);
    expect(verifyShopPayment).toHaveBeenCalledWith('pay-v', 15000);
  });

  test('파싱된 paymentId와 금액으로 verifyShopPayment를 호출하는 흐름', async() => {
    stashShopPendingPaymentVerify({
      paymentId: 'pay-v',
      orderPublicId: 'ord-v',
      cashAmount: 15000
    });
    verifyShopPayment.mockResolvedValue({ isValid: true });

    const query = parseShopPaymentReturnQuery(
      new URLSearchParams('paymentId=pay-v&orderPublicId=ord-v')
    );
    expect(query.code).toBeNull();
    const amount = await resolveShopPaymentVerifyAmount({
      paymentId: query.paymentId,
      orderPublicId: query.orderPublicId,
      fetchOrder: jest.fn()
    });
    await verifyShopPayment(query.paymentId, amount);
    expect(verifyShopPayment).toHaveBeenCalledWith('pay-v', 15000);
  });

  test('PortOne code가 있으면 verify를 호출하지 않는 계약(호출부 가드)', () => {
    const query = parseShopPaymentReturnQuery(
      new URLSearchParams('paymentId=pay-x&code=FAILURE_TYPE_PG&message=취소')
    );
    expect(query.code).toBe('FAILURE_TYPE_PG');
    expect(query.message).toBe('취소');
    expect(verifyShopPayment).not.toHaveBeenCalled();
  });
});
