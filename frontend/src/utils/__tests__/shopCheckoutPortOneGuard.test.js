/**
 * shopCheckoutPortOneGuard — unverified phone이면 post 금지, PortOne 미기동 시 cancel.
 * 이메일·이름 부재는 게이트 차단 사유가 아님.
 */

import { SHOP_PAYMENT_LAUNCH_COPY, PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK } from '../../constants/clientShopConstants';
import { assertPortOneCustomerReadyBeforeCheckout } from '../clientShopPaymentCustomer';
import {
  cancelOrphanShopOrderQuietly,
  isShopPrepareReadyForPortOne,
  runShopCheckoutWithPortOneGuard
} from '../shopCheckoutPortOneGuard';

describe('assertPortOneCustomerReadyBeforeCheckout', () => {
  test('휴대폰 없으면 ready=false + phone 메시지 (이메일은 게이트 아님)', () => {
    const gate = assertPortOneCustomerReadyBeforeCheckout({ email: 'a@b.test' });
    expect(gate.ready).toBe(false);
    expect(gate.customer).toBeNull();
    expect(gate.message).toBe(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  });

  test('번호만 있고 미인증이면 ready=false + settings 안내', () => {
    const gate = assertPortOneCustomerReadyBeforeCheckout({
      email: 'buyer@test.com',
      name: '홍길동',
      phone: '010-1234-5678'
    });
    expect(gate.ready).toBe(false);
    expect(gate.message).toBe(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED);
    expect(gate.message).toContain('/client/settings');
  });

  test('이메일 없어도 인증된 휴대폰이면 ready=true', () => {
    const gate = assertPortOneCustomerReadyBeforeCheckout({
      phone: '010-1234-5678',
      isPhoneVerified: true
    });
    expect(gate.ready).toBe(true);
    expect(gate.message).toBeNull();
    expect(gate.customer).toEqual({
      email: null,
      fullName: PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK,
      phoneNumber: '01012345678',
      phoneVerified: true
    });
  });

  test('email 키 누락(undefined) + verified phone → ready=true (회귀)', () => {
    const gate = assertPortOneCustomerReadyBeforeCheckout({
      name: '홍길동',
      mobile: '01012345678',
      isPhoneVerified: true
    });
    expect(gate.ready).toBe(true);
    expect(gate.message).toBeNull();
    expect(gate.customer.email).toBeNull();
    expect(gate.customer.phoneNumber).toBe('01012345678');
  });

  test('인증된 customer면 ready=true + customer 객체', () => {
    const gate = assertPortOneCustomerReadyBeforeCheckout({
      email: 'buyer@test.com',
      name: '홍길동',
      phone: '010-1234-5678',
      isPhoneVerified: true
    });
    expect(gate.ready).toBe(true);
    expect(gate.message).toBeNull();
    expect(gate.customer).toEqual({
      email: 'buyer@test.com',
      fullName: '홍길동',
      phoneNumber: '01012345678',
      phoneVerified: true
    });
  });
});

describe('isShopPrepareReadyForPortOne', () => {
  test('paymentId·storeId·channelKey 모두 있어야 true', () => {
    expect(
      isShopPrepareReadyForPortOne({
        paymentId: 'pay-1',
        storeId: 'store-1',
        channelKey: 'ch-1'
      })
    ).toBe(true);
    expect(isShopPrepareReadyForPortOne({ paymentId: 'pay-1', storeId: 's' })).toBe(false);
    expect(isShopPrepareReadyForPortOne(null)).toBe(false);
  });
});

describe('runShopCheckoutWithPortOneGuard', () => {
  const validUser = {
    email: 'buyer@test.com',
    name: '홍길동',
    phone: '01012345678',
    isPhoneVerified: true
  };

  const phoneOnlyVerifiedUser = {
    phone: '01012345678',
    isPhoneVerified: true
  };

  const createIdempotencyKey = () => 'idem-test-1';

  let postShopCheckout;
  let prepareShopPayment;
  let runShopPortOnePaymentIfReady;
  let cancelShopOrder;

  beforeEach(() => {
    postShopCheckout = jest.fn();
    prepareShopPayment = jest.fn();
    runShopPortOnePaymentIfReady = jest.fn();
    cancelShopOrder = jest.fn().mockResolvedValue(null);
  });

  test('미인증 phone → postShopCheckout를 호출하지 않는다', async() => {
    const result = await runShopCheckoutWithPortOneGuard({
      user: { email: 'a@b.test' },
      pointsRedeemMinor: 0,
      mappingIdForCheckout: null,
      createIdempotencyKey,
      postShopCheckout,
      prepareShopPayment,
      runShopPortOnePaymentIfReady,
      cancelShopOrder
    });

    expect(result.status).toBe('BLOCKED_CUSTOMER');
    expect(result.posted).toBe(false);
    expect(result.message).toBe(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
    expect(postShopCheckout).not.toHaveBeenCalled();
    expect(prepareShopPayment).not.toHaveBeenCalled();
    expect(runShopPortOnePaymentIfReady).not.toHaveBeenCalled();
    expect(cancelShopOrder).not.toHaveBeenCalled();
  });

  test('이메일 없는 인증 사용자도 checkout → prepare → PortOne 경로를 탄다', async() => {
    postShopCheckout.mockResolvedValue({
      nextStep: 'PAYMENT',
      orderPublicId: 'ord-phone-only'
    });
    prepareShopPayment.mockResolvedValue({
      paymentId: 'pay-1',
      storeId: 'store-1',
      channelKey: 'channel-1',
      cashAmount: 15000,
      orderPublicId: 'ord-phone-only',
      customerEmail: 'phone-01012345678@tenant-shop.clients.noreply'
    });
    runShopPortOnePaymentIfReady.mockResolvedValue({
      skipped: false,
      verified: true
    });

    const result = await runShopCheckoutWithPortOneGuard({
      user: phoneOnlyVerifiedUser,
      pointsRedeemMinor: 0,
      mappingIdForCheckout: null,
      createIdempotencyKey,
      postShopCheckout,
      prepareShopPayment,
      runShopPortOnePaymentIfReady,
      cancelShopOrder
    });

    expect(postShopCheckout).toHaveBeenCalled();
    expect(runShopPortOnePaymentIfReady).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'phone-01012345678@tenant-shop.clients.noreply'
      }),
      expect.objectContaining({
        customer: {
          email: null,
          fullName: PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK,
          phoneNumber: '01012345678',
          phoneVerified: true
        }
      })
    );
    expect(result.status).toBe('PAYMENT_VERIFIED');
  });

  test('완전 customer → checkout → prepare → PortOne(customer+CARD 경로)', async() => {
    postShopCheckout.mockResolvedValue({
      nextStep: 'PAYMENT',
      orderPublicId: 'ord-ready-1'
    });
    prepareShopPayment.mockResolvedValue({
      paymentId: 'pay-1',
      storeId: 'store-1',
      channelKey: 'channel-1',
      cashAmount: 15000,
      orderPublicId: 'ord-ready-1'
    });
    runShopPortOnePaymentIfReady.mockResolvedValue({
      skipped: false,
      verified: true
    });

    const result = await runShopCheckoutWithPortOneGuard({
      user: validUser,
      pointsRedeemMinor: 100,
      mappingIdForCheckout: 42,
      createIdempotencyKey,
      postShopCheckout,
      prepareShopPayment,
      runShopPortOnePaymentIfReady,
      cancelShopOrder
    });

    expect(postShopCheckout).toHaveBeenCalledWith('idem-test-1', 100, 42);
    expect(prepareShopPayment).toHaveBeenCalledWith('ord-ready-1');
    expect(runShopPortOnePaymentIfReady).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: 'pay-1', storeId: 'store-1' }),
      expect.objectContaining({
        orderName: '주문 ord-ready-1',
        customer: {
          email: 'buyer@test.com',
          fullName: '홍길동',
          phoneNumber: '01012345678',
          phoneVerified: true
        }
      })
    );
    expect(cancelShopOrder).not.toHaveBeenCalled();
    expect(result.status).toBe('PAYMENT_VERIFIED');
    expect(result.posted).toBe(true);
    expect(result.message).toBe(SHOP_PAYMENT_LAUNCH_COPY.PAYMENT_COMPLETED);
  });

  test('create 성공 후 prepare에 paymentId 없으면 cancelShopOrder 호출', async() => {
    postShopCheckout.mockResolvedValue({
      nextStep: 'PAYMENT',
      orderPublicId: 'ord-orphan-1'
    });
    prepareShopPayment.mockResolvedValue({
      storeId: 'store-1',
      channelKey: 'channel-1'
    });

    const result = await runShopCheckoutWithPortOneGuard({
      user: validUser,
      pointsRedeemMinor: 0,
      mappingIdForCheckout: null,
      createIdempotencyKey,
      postShopCheckout,
      prepareShopPayment,
      runShopPortOnePaymentIfReady,
      cancelShopOrder
    });

    expect(postShopCheckout).toHaveBeenCalled();
    expect(runShopPortOnePaymentIfReady).not.toHaveBeenCalled();
    expect(cancelShopOrder).toHaveBeenCalledWith('ord-orphan-1');
    expect(result.status).toBe('ORPHAN_CANCELLED');
    expect(result.cancelled).toBe(true);
    expect(result.message).toBe(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
  });

  test('create 성공 후 PortOne skipped면 cancelShopOrder 호출', async() => {
    postShopCheckout.mockResolvedValue({
      nextStep: 'PAYMENT',
      orderPublicId: 'ord-skip-1'
    });
    prepareShopPayment.mockResolvedValue({
      paymentId: 'pay-1',
      storeId: 'store-1',
      channelKey: 'channel-1'
    });
    runShopPortOnePaymentIfReady.mockResolvedValue({ skipped: true });

    const result = await runShopCheckoutWithPortOneGuard({
      user: validUser,
      pointsRedeemMinor: 0,
      mappingIdForCheckout: null,
      createIdempotencyKey,
      postShopCheckout,
      prepareShopPayment,
      runShopPortOnePaymentIfReady,
      cancelShopOrder
    });

    expect(cancelShopOrder).toHaveBeenCalledWith('ord-skip-1');
    expect(result.status).toBe('ORPHAN_CANCELLED');
    expect(result.cancelled).toBe(true);
  });

  test('prepare 실패 시 cancel 후 에러를 다시 throw', async() => {
    postShopCheckout.mockResolvedValue({
      nextStep: 'PAYMENT',
      orderPublicId: 'ord-prep-fail'
    });
    prepareShopPayment.mockRejectedValue(new Error('결제 준비에 실패했습니다.'));

    await expect(
      runShopCheckoutWithPortOneGuard({
        user: validUser,
        pointsRedeemMinor: 0,
        mappingIdForCheckout: null,
        createIdempotencyKey,
        postShopCheckout,
        prepareShopPayment,
        runShopPortOnePaymentIfReady,
        cancelShopOrder
      })
    ).rejects.toThrow('결제 준비에 실패했습니다.');

    expect(cancelShopOrder).toHaveBeenCalledWith('ord-prep-fail');
    expect(runShopPortOnePaymentIfReady).not.toHaveBeenCalled();
  });
});

describe('cancelOrphanShopOrderQuietly', () => {
  test('cancel 실패해도 false만 반환하고 throw하지 않는다', async() => {
    const cancelFn = jest.fn().mockRejectedValue(new Error('conflict'));
    await expect(cancelOrphanShopOrderQuietly(cancelFn, 'ord-x')).resolves.toBe(false);
    expect(cancelFn).toHaveBeenCalledWith('ord-x');
  });
});
