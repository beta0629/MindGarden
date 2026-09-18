import { SHOP_PAYMENT_LAUNCH_COPY } from '../../constants/clientShopConstants';
import {
  assertPortOneCustomerReadyBeforeCheckout,
  buildPortOneCustomerFromUser,
  resolvePortOneCustomerFailMessage,
  resolveSessionEmail,
  resolveSessionFullName,
  resolveSessionPhoneNumber
} from '../clientShopPaymentCustomer';
import { runShopPortOnePaymentIfReady } from '../shopPortOneCheckout';
import { requestPortOnePayment } from '../portonePayment';
import StandardizedApi from '../standardizedApi';
import { PG_PROVIDER_IAMPORT } from '../../constants/portonePgConfiguration';

jest.mock('../portonePayment', () => ({
  requestPortOnePayment: jest.fn()
}));

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));

describe('clientShopPaymentCustomer', () => {
  test('resolveSessionEmail은 email을 우선하고 userEmail로 폴백한다', () => {
    expect(resolveSessionEmail({ email: ' a@b.test ', userEmail: 'x@y.test' })).toBe(
      'a@b.test'
    );
    expect(resolveSessionEmail({ userEmail: ' fallback@test.com ' })).toBe(
      'fallback@test.com'
    );
    expect(resolveSessionEmail({ email: '  ' })).toBeNull();
    expect(resolveSessionEmail(null)).toBeNull();
  });

  test('resolveSessionFullName은 name을 우선하고 nickname으로 폴백한다', () => {
    expect(resolveSessionFullName({ name: ' 홍길동 ', nickname: '닉' })).toBe('홍길동');
    expect(resolveSessionFullName({ nickname: ' 닉 ' })).toBe('닉');
    expect(resolveSessionFullName({ name: '  ' })).toBeNull();
  });

  test('resolveSessionPhoneNumber는 phone을 우선·정규화한다', () => {
    expect(
      resolveSessionPhoneNumber({ phone: ' 010-1111-2222 ', phoneNumber: '01099998888' })
    ).toBe('01011112222');
    expect(resolveSessionPhoneNumber({ phoneNumber: '010-9999-8888' })).toBe('01099998888');
    expect(resolveSessionPhoneNumber({ phone: '1234' })).toBeNull();
  });

  test('세션 email·fullName·phone이 모두 있으면 customer를 만든다', () => {
    expect(
      buildPortOneCustomerFromUser({
        email: ' buyer@test.com ',
        name: ' 홍길동 ',
        phone: '010-1234-5678'
      })
    ).toEqual({
      email: 'buyer@test.com',
      fullName: '홍길동',
      phoneNumber: '01012345678'
    });
  });

  test('세션 email·phone이 없으면 fail-closed 메시지를 반환한다', () => {
    expect(resolvePortOneCustomerFailMessage({})).toBe(
      SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED
    );
    expect(
      resolvePortOneCustomerFailMessage({ email: 'a@b.test', name: '홍길동' })
    ).toBe(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
    expect(
      resolvePortOneCustomerFailMessage({
        email: 'a@b.test',
        name: '홍길동',
        phone: '01012345678'
      })
    ).toBeNull();
  });

  test('assertPortOneCustomerReadyBeforeCheckout는 create 전 가드다', () => {
    expect(assertPortOneCustomerReadyBeforeCheckout({}).ready).toBe(false);
    expect(
      assertPortOneCustomerReadyBeforeCheckout({
        email: 'a@b.test',
        name: '홍길동',
        phone: '01012345678'
      }).ready
    ).toBe(true);
  });
});

describe('runShopPortOnePaymentIfReady', () => {
  const prepareReady = {
    paymentProvider: PG_PROVIDER_IAMPORT,
    storeId: 'store-1',
    channelKey: 'channel-1',
    paymentId: 'pay-1',
    cashAmount: 15000,
    orderPublicId: 'ord-1'
  };

  const validCustomer = {
    email: 'buyer@example.test',
    fullName: '홍길동',
    phoneNumber: '01012345678'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    requestPortOnePayment.mockResolvedValue({ paymentId: 'pay-1' });
    StandardizedApi.post.mockResolvedValue({ isValid: true });
  });

  test('customer가 없으면 SDK 호출 전에 fail-closed throw한다', async() => {
    await expect(
      runShopPortOnePaymentIfReady(prepareReady, { orderName: '주문 ord-1' })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('customer email이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(
      runShopPortOnePaymentIfReady(prepareReady, {
        customer: { email: '  ', fullName: '홍길동', phoneNumber: '01012345678' }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('customer phone이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(
      runShopPortOnePaymentIfReady(prepareReady, {
        customer: { email: 'a@b.test', fullName: '홍길동', phone: '  ' }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('payMethod CARD를 requestPortOnePayment에 전달한다', async() => {
    const result = await runShopPortOnePaymentIfReady(prepareReady, {
      orderName: '주문 ord-1',
      customer: validCustomer
    });

    expect(requestPortOnePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        payMethod: 'CARD',
        customer: validCustomer,
        storeId: 'store-1',
        channelKey: 'channel-1',
        paymentId: 'pay-1',
        totalAmount: 15000
      })
    );
    expect(result.skipped).toBe(false);
    expect(result.verified).toBe(true);
  });

  test('prepareResult.payMethod가 있으면 그대로 전달한다', async() => {
    await runShopPortOnePaymentIfReady(
      { ...prepareReady, payMethod: 'TRANSFER' },
      { customer: validCustomer }
    );

    expect(requestPortOnePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        payMethod: 'TRANSFER'
      })
    );
  });
});
