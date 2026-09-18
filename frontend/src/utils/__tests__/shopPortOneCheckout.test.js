import { SHOP_PAYMENT_LAUNCH_COPY } from '../../constants/clientShopConstants';
import {
  assertPortOneCustomerReadyBeforeCheckout,
  buildPortOneCustomerFromUser,
  requireCompletePortOneCustomer,
  resolvePortOneCustomerFailMessage,
  resolveSessionEmail,
  resolveSessionFullName,
  resolveSessionPhoneNumber,
  resolveSessionPhoneVerified,
  resolveSessionVerifiedPhoneNumber
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

const VERIFIED_USER = {
  email: 'buyer@test.com',
  name: '홍길동',
  phone: '010-1234-5678',
  isPhoneVerified: true
};

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

  test('미인증 사용자는 verified phone이 null이고 설정을 가리키는 메시지를 반환한다', () => {
    const unverified = {
      email: 'a@b.test',
      name: '홍길동',
      phone: '01012345678',
      isPhoneVerified: false
    };
    expect(resolveSessionPhoneVerified(unverified)).toBe(false);
    expect(resolveSessionVerifiedPhoneNumber(unverified)).toBeNull();
    expect(resolvePortOneCustomerFailMessage(unverified)).toBe(
      SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED
    );
    expect(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED).toContain('/client/settings');
    expect(assertPortOneCustomerReadyBeforeCheckout(unverified).ready).toBe(false);
  });

  test('번호만 있고 플래그 없으면 미인증으로 차단한다', () => {
    const presenceOnly = {
      email: 'a@b.test',
      name: '홍길동',
      phone: '01012345678'
    };
    expect(assertPortOneCustomerReadyBeforeCheckout(presenceOnly).ready).toBe(false);
    expect(resolvePortOneCustomerFailMessage(presenceOnly)).toBe(
      SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED
    );
  });

  test('인증된 사용자(flag true + KR phone)는 재OTP 없이 customer를 만든다', () => {
    expect(buildPortOneCustomerFromUser(VERIFIED_USER)).toEqual({
      email: 'buyer@test.com',
      fullName: '홍길동',
      phoneNumber: '01012345678',
      phoneVerified: true
    });
    expect(assertPortOneCustomerReadyBeforeCheckout(VERIFIED_USER).ready).toBe(true);
  });

  test('세션 email·phone이 없으면 fail-closed 메시지를 반환한다', () => {
    expect(resolvePortOneCustomerFailMessage({})).toBe(
      SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED
    );
    expect(
      resolvePortOneCustomerFailMessage({ email: 'a@b.test', name: '홍길동' })
    ).toBe(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  });

  test('requireCompletePortOneCustomer는 phoneVerified 없으면 차단한다', () => {
    expect(() =>
      requireCompletePortOneCustomer({
        email: 'a@b.test',
        fullName: '홍길동',
        phoneNumber: '01012345678'
      })
    ).toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED);
    expect(
      requireCompletePortOneCustomer({
        email: 'a@b.test',
        fullName: '홍길동',
        phoneNumber: '01012345678',
        phoneVerified: true
      }).phoneVerified
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
    phoneNumber: '01012345678',
    phoneVerified: true
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
        customer: {
          email: '  ',
          fullName: '홍길동',
          phoneNumber: '01012345678',
          phoneVerified: true
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('customer phone이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(
      runShopPortOnePaymentIfReady(prepareReady, {
        customer: {
          email: 'a@b.test',
          fullName: '홍길동',
          phone: '  ',
          phoneVerified: true
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('customer가 미인증이면 SDK 호출 전에 throw한다', async() => {
    await expect(
      runShopPortOnePaymentIfReady(prepareReady, {
        customer: {
          email: 'a@b.test',
          fullName: '홍길동',
          phoneNumber: '01012345678'
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED);
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
