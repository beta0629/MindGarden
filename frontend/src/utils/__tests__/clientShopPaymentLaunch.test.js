import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_LAUNCH_COPY
} from '../../constants/clientShopConstants';
import {
  buildPortOneCustomerFromUser,
  isPortOneCustomerEmailFormat,
  isPortOneCustomerPhoneFormat,
  launchShopPaymentFromPrepare,
  resolvePortOneCustomer,
  resolveSessionEmail,
  resolveSessionFullName,
  resolveSessionPhoneNumber
} from '../clientShopPaymentLaunch';
import { requestPortOnePayment } from '../portonePayment';

jest.mock('../portonePayment', () => ({
  requestPortOnePayment: jest.fn()
}));

const VALID_CUSTOMER = {
  email: 'buyer@example.test',
  fullName: '홍길동',
  phoneNumber: '01012345678'
};

const pgReadyPrepare = {
  pgReady: true,
  storeId: 'store-1',
  channelKey: 'channel-1',
  paymentId: 'pay-1',
  cashAmount: 15000
};

describe('resolveSessionEmail', () => {
  test('email을 우선하고 userEmail로 폴백한다', () => {
    expect(resolveSessionEmail({ email: ' a@b.test ', userEmail: 'x@y.test' })).toBe(
      'a@b.test'
    );
    expect(resolveSessionEmail({ userEmail: ' fallback@test.com ' })).toBe(
      'fallback@test.com'
    );
    expect(resolveSessionEmail({ email: '  ' })).toBeNull();
    expect(resolveSessionEmail(null)).toBeNull();
  });
});

describe('resolveSessionFullName', () => {
  test('name을 우선하고 nickname으로 폴백한다', () => {
    expect(resolveSessionFullName({ name: ' 홍길동 ', nickname: '닉' })).toBe('홍길동');
    expect(resolveSessionFullName({ nickname: ' 닉 ' })).toBe('닉');
    expect(resolveSessionFullName({ name: '  ' })).toBeNull();
    expect(resolveSessionFullName(null)).toBeNull();
  });
});

describe('resolveSessionPhoneNumber', () => {
  test('phone을 우선하고 phoneNumber로 폴백하며 정규화한다', () => {
    expect(
      resolveSessionPhoneNumber({ phone: ' 010-1111-2222 ', phoneNumber: '01099998888' })
    ).toBe('01011112222');
    expect(resolveSessionPhoneNumber({ phoneNumber: '010-9999-8888' })).toBe('01099998888');
    expect(resolveSessionPhoneNumber({ phone: '1234' })).toBeNull();
    expect(resolveSessionPhoneNumber(null)).toBeNull();
  });
});

describe('isPortOneCustomerEmailFormat', () => {
  test('최소 local@domain 형식을 검증한다', () => {
    expect(isPortOneCustomerEmailFormat('a@b.test')).toBe(true);
    expect(isPortOneCustomerEmailFormat('  a@b  ')).toBe(true);
    expect(isPortOneCustomerEmailFormat('nodomain')).toBe(false);
    expect(isPortOneCustomerEmailFormat('  ')).toBe(false);
  });
});

describe('isPortOneCustomerPhoneFormat', () => {
  test('한국 휴대폰 형식을 검증한다', () => {
    expect(isPortOneCustomerPhoneFormat('010-1234-5678')).toBe(true);
    expect(isPortOneCustomerPhoneFormat('01012345678')).toBe(true);
    expect(isPortOneCustomerPhoneFormat('1234')).toBe(false);
    expect(isPortOneCustomerPhoneFormat('  ')).toBe(false);
  });
});

describe('resolvePortOneCustomer', () => {
  test('세션 필드가 있으면 checkout보다 우선한다', () => {
    expect(
      resolvePortOneCustomer({
        user: {
          email: ' session@test.com ',
          name: '홍길동',
          phone: '010-1111-2222'
        },
        checkoutEmail: 'checkout@test.com',
        checkoutFullName: '체크아웃이름',
        checkoutPhone: '01099998888'
      })
    ).toEqual({
      email: 'session@test.com',
      fullName: '홍길동',
      phoneNumber: '01011112222'
    });
  });

  test('세션이 없으면 checkout email·fullName·phone을 사용한다', () => {
    expect(
      resolvePortOneCustomer({
        user: {},
        checkoutEmail: '  checkout@test.com ',
        checkoutFullName: ' 체크아웃이름 ',
        checkoutPhone: ' 010-9999-8888 '
      })
    ).toEqual({
      email: 'checkout@test.com',
      fullName: '체크아웃이름',
      phoneNumber: '01099998888'
    });
  });

  test('세션 phone·checkout phone을 정규화해 전달한다', () => {
    expect(
      resolvePortOneCustomer({
        user: {
          email: 'a@b.test',
          name: '홍길동',
          phoneNumber: '010-3333-4444'
        }
      })
    ).toEqual({
      email: 'a@b.test',
      fullName: '홍길동',
      phoneNumber: '01033334444'
    });

    expect(
      resolvePortOneCustomer({
        user: { email: 'a@b.test', nickname: '닉' },
        checkoutPhone: '01055556666'
      })
    ).toEqual({
      email: 'a@b.test',
      fullName: '닉',
      phoneNumber: '01055556666'
    });
  });

  test('세션 name·checkout fullName을 전달한다', () => {
    expect(
      resolvePortOneCustomer({
        user: {
          email: 'a@b.test',
          nickname: '닉네임',
          phone: '01012345678'
        }
      })
    ).toEqual({
      email: 'a@b.test',
      fullName: '닉네임',
      phoneNumber: '01012345678'
    });

    expect(
      resolvePortOneCustomer({
        user: { email: 'a@b.test', phone: '01012345678' },
        checkoutFullName: '입력이름'
      })
    ).toEqual({
      email: 'a@b.test',
      fullName: '입력이름',
      phoneNumber: '01012345678'
    });
  });

  test('email·fullName·phone 중 하나라도 없으면 null을 반환한다', () => {
    expect(
      resolvePortOneCustomer({
        user: { name: '홍길동', phone: '01012345678' },
        checkoutEmail: ''
      })
    ).toBeNull();
    expect(
      resolvePortOneCustomer({
        user: { email: 'a@b.test', phone: '01012345678' }
      })
    ).toBeNull();
    expect(
      resolvePortOneCustomer({
        user: { email: 'a@b.test', name: '홍길동' }
      })
    ).toBeNull();
    expect(resolvePortOneCustomer({ checkoutEmail: '  ' })).toBeNull();
    expect(resolvePortOneCustomer({})).toBeNull();
  });

  test('userEmail·nickname·phoneNumber 폴백을 세션으로 사용한다', () => {
    expect(
      resolvePortOneCustomer({
        user: {
          userEmail: 'fallback@test.com',
          nickname: '닉',
          phoneNumber: '01099998888'
        },
        checkoutEmail: 'ignored@test.com'
      })
    ).toEqual({
      email: 'fallback@test.com',
      fullName: '닉',
      phoneNumber: '01099998888'
    });
  });

  test('잘못된 checkout phone이면 null을 반환한다(가짜 번호 금지)', () => {
    expect(
      resolvePortOneCustomer({
        user: { email: 'a@b.test', name: '홍길동' },
        checkoutPhone: '1234'
      })
    ).toBeNull();
  });
});

describe('buildPortOneCustomerFromUser', () => {
  test('email·name·phone을 PortOne customer로 매핑한다', () => {
    expect(
      buildPortOneCustomerFromUser({
        email: '  a@b.test ',
        name: ' 이름 ',
        phone: ' 01011112222 '
      })
    ).toEqual({
      email: 'a@b.test',
      fullName: '이름',
      phoneNumber: '01011112222'
    });
  });

  test('userEmail·nickname·phoneNumber 폴백을 사용한다', () => {
    expect(
      buildPortOneCustomerFromUser({
        userEmail: 'fallback@test.com',
        nickname: '닉',
        phoneNumber: '01099998888'
      })
    ).toEqual({
      email: 'fallback@test.com',
      fullName: '닉',
      phoneNumber: '01099998888'
    });
  });

  test('필수 필드가 하나라도 없으면 null을 반환한다(가짜 값 생성 금지)', () => {
    expect(buildPortOneCustomerFromUser({ name: '홍길동' })).toBeNull();
    expect(
      buildPortOneCustomerFromUser({ email: 'a@b.test', name: '홍길동' })
    ).toBeNull();
    expect(buildPortOneCustomerFromUser(null)).toBeNull();
  });
});

describe('launchShopPaymentFromPrepare', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
  });

  afterAll(() => {
    window.open = originalOpen;
  });

  test('pgReady면 PortOne SDK를 customer 전체와 함께 호출한다', async() => {
    requestPortOnePayment.mockResolvedValueOnce({ paymentId: 'pay-1' });

    const result = await launchShopPaymentFromPrepare(pgReadyPrepare, {
      customer: VALID_CUSTOMER
    });

    expect(requestPortOnePayment).toHaveBeenCalledWith({
      storeId: 'store-1',
      channelKey: 'channel-1',
      paymentId: 'pay-1',
      orderName: SHOP_PAYMENT_LAUNCH_COPY.ORDER_NAME,
      totalAmount: 15000,
      currency: 'KRW',
      payMethod: 'CARD',
      customer: VALID_CUSTOMER
    });
    expect(result).toEqual({ mode: 'portone' });
    expect(window.open).not.toHaveBeenCalled();
  });

  test('customer가 없거나 email이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(launchShopPaymentFromPrepare(pgReadyPrepare)).rejects.toThrow(
      SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED
    );
    await expect(
      launchShopPaymentFromPrepare(pgReadyPrepare, { customer: { email: '  ' } })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('fullName이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(
      launchShopPaymentFromPrepare(pgReadyPrepare, {
        customer: {
          email: 'buyer@example.test',
          fullName: '  ',
          phoneNumber: '01012345678'
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('phone이 비면 SDK 호출 전에 throw한다', async() => {
    await expect(
      launchShopPaymentFromPrepare(pgReadyPrepare, {
        customer: {
          email: 'buyer@example.test',
          fullName: '홍길동',
          phoneNumber: '  '
        }
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('customer.phone 별칭을 phoneNumber로 정규화해 전달한다', async() => {
    requestPortOnePayment.mockResolvedValueOnce({ paymentId: 'pay-1' });

    await launchShopPaymentFromPrepare(pgReadyPrepare, {
      customer: {
        email: 'buyer@example.test',
        fullName: '홍길동',
        phone: '010-1234-5678'
      }
    });

    expect(requestPortOnePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          email: 'buyer@example.test',
          fullName: '홍길동',
          phoneNumber: '01012345678'
        })
      })
    );
  });

  test('resolvePortOneCustomer가 null이면 launch 전에 fail-closed한다', async() => {
    const customer = resolvePortOneCustomer({
      user: { name: '홍길동' },
      checkoutEmail: ''
    });
    expect(customer).toBeNull();
    await expect(
      launchShopPaymentFromPrepare(pgReadyPrepare, { customer })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('prepareResult.payMethod가 있으면 PortOne에 pass-through한다', async() => {
    requestPortOnePayment.mockResolvedValueOnce({ paymentId: 'pay-2' });

    await launchShopPaymentFromPrepare(
      {
        ...pgReadyPrepare,
        paymentId: 'pay-2',
        cashAmount: 20000,
        payMethod: 'TRANSFER'
      },
      { customer: VALID_CUSTOMER }
    );

    expect(requestPortOnePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay-2',
        payMethod: 'TRANSFER',
        customer: expect.objectContaining({
          email: 'buyer@example.test',
          fullName: '홍길동',
          phoneNumber: '01012345678'
        })
      })
    );
  });

  test('PortOne result에 code가 있으면 throw한다', async() => {
    requestPortOnePayment.mockResolvedValueOnce({
      code: 'FAILURE_TYPE_PG',
      message: '사용자가 결제를 취소했습니다.'
    });

    await expect(
      launchShopPaymentFromPrepare(pgReadyPrepare, { customer: VALID_CUSTOMER })
    ).rejects.toThrow('사용자가 결제를 취소했습니다.');
  });

  test('PortOne이 string으로 reject하면 Error로 정규화한다', async() => {
    requestPortOnePayment.mockRejectedValueOnce('결제창을 닫았습니다.');

    await expect(
      launchShopPaymentFromPrepare(pgReadyPrepare, { customer: VALID_CUSTOMER })
    ).rejects.toThrow('결제창을 닫았습니다.');
  });

  test('PortOne이 빈 message Error로 reject하면 fallback 메시지를 쓴다', async() => {
    requestPortOnePayment.mockRejectedValueOnce(new Error(''));

    await expect(
      launchShopPaymentFromPrepare(pgReadyPrepare, { customer: VALID_CUSTOMER })
    ).rejects.toThrow(SHOP_CHECKOUT_ERROR_COPY.PAYMENT_LAUNCH_FAILED);
  });

  test('cashAmount가 object이면 금액 오류로 throw한다', async() => {
    await expect(
      launchShopPaymentFromPrepare({
        ...pgReadyPrepare,
        cashAmount: { amount: 15000 }
      })
    ).rejects.toThrow(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('paymentUrl이면 새 창을 연다', async() => {
    const result = await launchShopPaymentFromPrepare({
      paymentUrl: 'https://pay.real-pg.test/checkout'
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://pay.real-pg.test/checkout',
      '_blank',
      SHOP_PAYMENT_LAUNCH_COPY.WINDOW_FEATURES
    );
    expect(result).toEqual({
      mode: 'url',
      paymentUrl: 'https://pay.real-pg.test/checkout'
    });
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('example.com 더미 paymentUrl이면 MODULE_UNAVAILABLE로 throw한다', async() => {
    await expect(
      launchShopPaymentFromPrepare({
        pgReady: false,
        paymentUrl: 'https://api.payment.example.com/pay/PAY_dummy',
        paymentProvider: 'TOSS'
      })
    ).rejects.toThrow(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
    expect(window.open).not.toHaveBeenCalled();
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('진입 정보가 없으면 안내 메시지로 throw한다', async() => {
    await expect(launchShopPaymentFromPrepare({})).rejects.toThrow(
      SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE
    );
  });
});
