/**
 * clientShopPaymentCustomer — PortOne customer gate / prepare merge.
 */
import {
  PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK,
  SHOP_PAYMENT_LAUNCH_COPY,
} from '@/constants/clientShopConstants';
import {
  assertPortOneCustomerReadyBeforeCheckout,
  mergePortOneCustomerFromPrepare,
  requireCompletePortOneCustomer,
  resolvePortOneCustomerFailMessage,
  resolveSessionEmail,
  resolveSessionFullName,
  resolveSessionPhoneNumber,
  resolveSessionPhoneVerified,
  resolveSessionVerifiedPhoneNumber,
} from '@/utils/clientShopPaymentCustomer';
import { isShopPrepareReadyForPortOne } from '@/utils/shopCheckoutPortOneGuard';

describe('clientShopPaymentCustomer', () => {
  test('resolveSessionEmail은 email을 우선하고 userEmail로 폴백한다', () => {
    expect(resolveSessionEmail({ email: ' a@b.test ', userEmail: 'x@y.test' })).toBe(
      'a@b.test',
    );
    expect(resolveSessionEmail({ userEmail: ' fallback@test.com ' })).toBe(
      'fallback@test.com',
    );
    expect(resolveSessionEmail({ email: '  ' })).toBeNull();
    expect(resolveSessionEmail(null)).toBeNull();
  });

  test('resolveSessionFullName은 name을 우선하고 nickname으로 폴백한다', () => {
    expect(resolveSessionFullName({ name: ' 홍길동 ', nickname: '닉' })).toBe('홍길동');
    expect(resolveSessionFullName({ nickname: ' 닉 ' })).toBe('닉');
  });

  test('resolveSessionPhoneNumber는 phone을 우선·정규화한다', () => {
    expect(
      resolveSessionPhoneNumber({ phone: ' 010-1111-2222 ', phoneNumber: '01099998888' }),
    ).toBe('01011112222');
    expect(resolveSessionPhoneNumber({ phone: '1234' })).toBeNull();
  });

  test('미인증 사용자는 verified phone이 null', () => {
    const unverified = {
      email: 'a@b.test',
      name: '홍길동',
      phone: '01012345678',
      isPhoneVerified: false,
    };
    expect(resolveSessionPhoneVerified(unverified)).toBe(false);
    expect(resolveSessionVerifiedPhoneNumber(unverified)).toBeNull();
    expect(resolvePortOneCustomerFailMessage(unverified)).toBe(
      SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED,
    );
    expect(assertPortOneCustomerReadyBeforeCheckout(unverified).ready).toBe(false);
  });

  test('인증 사용자는 ready', () => {
    const verified = {
      email: 'buyer@test.com',
      name: '홍길동',
      phone: '010-1234-5678',
      isPhoneVerified: true,
    };
    const gate = assertPortOneCustomerReadyBeforeCheckout(verified);
    expect(gate.ready).toBe(true);
    expect(gate.customer?.phoneNumber).toBe('01012345678');
    expect(gate.customer?.phoneVerified).toBe(true);
  });

  test('mergePortOneCustomerFromPrepare는 세션 email 유지·비어 있으면 BE 채움', () => {
    const merged = mergePortOneCustomerFromPrepare(
      {
        email: null,
        fullName: PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK,
        phoneNumber: '01012345678',
        phoneVerified: true,
      },
      { customerEmail: 'synth@tenant.test', customerName: '고객명' },
    );
    expect(merged?.email).toBe('synth@tenant.test');
    expect(merged?.fullName).toBe(PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK);
  });

  test('requireCompletePortOneCustomer는 email 없으면 MODULE_UNAVAILABLE', () => {
    expect(() =>
      requireCompletePortOneCustomer({
        email: null,
        fullName: '홍길동',
        phoneNumber: '01012345678',
        phoneVerified: true,
      }),
    ).toThrow(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
  });
});

describe('isShopPrepareReadyForPortOne', () => {
  test('storeId+channelKey+paymentId 모두 있어야 true', () => {
    expect(
      isShopPrepareReadyForPortOne({
        storeId: 'store-1',
        channelKey: 'channel-1',
        paymentId: 'pay-1',
      }),
    ).toBe(true);
    expect(
      isShopPrepareReadyForPortOne({
        storeId: 'store-1',
        channelKey: '',
        paymentId: 'pay-1',
      }),
    ).toBe(false);
    expect(isShopPrepareReadyForPortOne(null)).toBe(false);
  });
});
