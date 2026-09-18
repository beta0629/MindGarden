import * as PortOne from '@portone/browser-sdk/v2';
import { SHOP_PAYMENT_LAUNCH_COPY } from '../../constants/clientShopConstants';
import { requestPortOnePayment } from '../portonePayment';

jest.mock(
  '@portone/browser-sdk/v2',
  () => ({
    requestPayment: jest.fn()
  }),
  { virtual: true }
);

describe('requestPortOnePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    PortOne.requestPayment.mockResolvedValue({ paymentId: 'pay-1' });
  });

  const baseParams = {
    storeId: 'store-1',
    channelKey: 'channel-1',
    paymentId: 'pay-1',
    orderName: '테스트 결제',
    totalAmount: 15000
  };

  const validCustomer = {
    email: 'buyer@example.test',
    fullName: '홍길동',
    phoneNumber: '01012345678',
    phoneVerified: true
  };

  test('CARD 기본 시 payMethod CARD와 일시불 card.installment를 포함한다', async() => {
    await requestPortOnePayment(baseParams);

    expect(PortOne.requestPayment).toHaveBeenCalledWith({
      storeId: 'store-1',
      channelKey: 'channel-1',
      paymentId: 'pay-1',
      orderName: '테스트 결제',
      totalAmount: 15000,
      currency: 'KRW',
      payMethod: 'CARD',
      card: {
        installment: {
          monthOption: {
            fixedMonth: 0
          }
        }
      }
    });
  });

  test('customer 필수 필드가 있으면 SDK payload에 포함한다', async() => {
    await requestPortOnePayment({
      ...baseParams,
      customer: {
        email: ' buyer@example.test ',
        fullName: ' 홍길동 ',
        phoneNumber: ' 01012345678 ',
        phoneVerified: true
      }
    });

    expect(PortOne.requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: {
          email: 'buyer@example.test',
          fullName: '홍길동',
          phoneNumber: '01012345678'
        }
      })
    );
  });

  test('customer.phone 별칭을 phoneNumber로 정규화한다', async() => {
    await requestPortOnePayment({
      ...baseParams,
      customer: {
        email: 'buyer@example.test',
        fullName: '홍길동',
        phone: '01099998888',
        phoneVerified: true
      }
    });

    expect(PortOne.requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          email: 'buyer@example.test',
          fullName: '홍길동',
          phoneNumber: '01099998888'
        })
      })
    );
  });

  test('customer가 있는데 email이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(
      requestPortOnePayment({
        ...baseParams,
        customer: {
          email: '   ',
          fullName: '홍길동',
          phoneNumber: '01012345678',
          phoneVerified: true
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
    expect(PortOne.requestPayment).not.toHaveBeenCalled();
  });

  test('customer가 있는데 fullName이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(
      requestPortOnePayment({
        ...baseParams,
        customer: {
          email: 'buyer@example.test',
          fullName: '  ',
          phoneNumber: '01012345678',
          phoneVerified: true
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED);
    expect(PortOne.requestPayment).not.toHaveBeenCalled();
  });

  test('customer가 있는데 phone이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(
      requestPortOnePayment({
        ...baseParams,
        customer: {
          email: 'buyer@example.test',
          fullName: '홍길동',
          phoneNumber: '   ',
          phoneVerified: true
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
    expect(PortOne.requestPayment).not.toHaveBeenCalled();
  });

  test('customer가 미인증이면 SDK 호출 전에 throw한다', async() => {
    await expect(
      requestPortOnePayment({
        ...baseParams,
        customer: {
          email: 'buyer@example.test',
          fullName: '홍길동',
          phoneNumber: '01012345678'
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED);
    expect(PortOne.requestPayment).not.toHaveBeenCalled();
  });

  test('payMethod가 card(소문자)여도 일시불 card 객체를 포함한다', async() => {
    await requestPortOnePayment({
      ...baseParams,
      payMethod: ' card '
    });

    expect(PortOne.requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        payMethod: 'card',
        card: {
          installment: {
            monthOption: {
              fixedMonth: 0
            }
          }
        }
      })
    );
  });

  test('payMethod TRANSFER면 card를 넣지 않는다', async() => {
    await requestPortOnePayment({
      ...baseParams,
      payMethod: 'TRANSFER'
    });

    const payload = PortOne.requestPayment.mock.calls[0][0];
    expect(payload.payMethod).toBe('TRANSFER');
    expect(payload).not.toHaveProperty('card');
  });

  test('params.card가 명시되면 기본 일시불 대신 override를 쓴다', async() => {
    const customCard = {
      installment: {
        monthOption: {
          fixedMonth: 3
        }
      }
    };

    await requestPortOnePayment({
      ...baseParams,
      payMethod: 'CARD',
      card: customCard
    });

    expect(PortOne.requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        payMethod: 'CARD',
        card: customCard
      })
    );
  });

  test('validCustomer와 함께 CARD를 요청해도 customer를 유지한다', async() => {
    await requestPortOnePayment({
      ...baseParams,
      customer: validCustomer
    });

    expect(PortOne.requestPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: {
          email: 'buyer@example.test',
          fullName: '홍길동',
          phoneNumber: '01012345678'
        }
      })
    );
  });
});
