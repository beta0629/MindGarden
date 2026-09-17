import { SHOP_PAYMENT_LAUNCH_COPY } from '../../constants/clientShopConstants';
import { launchShopPaymentFromPrepare } from '../clientShopPaymentLaunch';
import { requestPortOnePayment } from '../portonePayment';

jest.mock('../portonePayment', () => ({
  requestPortOnePayment: jest.fn()
}));

describe('launchShopPaymentFromPrepare', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
  });

  afterAll(() => {
    window.open = originalOpen;
  });

  test('pgReady면 PortOne SDK를 호출한다', async() => {
    requestPortOnePayment.mockResolvedValueOnce({ paymentId: 'pay-1' });

    const result = await launchShopPaymentFromPrepare({
      pgReady: true,
      storeId: 'store-1',
      channelKey: 'channel-1',
      paymentId: 'pay-1',
      cashAmount: 15000
    });

    expect(requestPortOnePayment).toHaveBeenCalledWith({
      storeId: 'store-1',
      channelKey: 'channel-1',
      paymentId: 'pay-1',
      orderName: SHOP_PAYMENT_LAUNCH_COPY.ORDER_NAME,
      totalAmount: 15000,
      currency: 'KRW'
    });
    expect(result).toEqual({ mode: 'portone' });
    expect(window.open).not.toHaveBeenCalled();
  });

  test('PortOne result에 code가 있으면 throw한다', async() => {
    requestPortOnePayment.mockResolvedValueOnce({
      code: 'FAILURE_TYPE_PG',
      message: '사용자가 결제를 취소했습니다.'
    });

    await expect(
      launchShopPaymentFromPrepare({
        pgReady: true,
        storeId: 'store-1',
        channelKey: 'channel-1',
        paymentId: 'pay-1',
        cashAmount: 15000
      })
    ).rejects.toThrow('사용자가 결제를 취소했습니다.');
  });

  test('paymentUrl이면 새 창을 연다', async() => {
    const result = await launchShopPaymentFromPrepare({
      paymentUrl: 'https://pay.example/checkout'
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://pay.example/checkout',
      '_blank',
      SHOP_PAYMENT_LAUNCH_COPY.WINDOW_FEATURES
    );
    expect(result).toEqual({
      mode: 'url',
      paymentUrl: 'https://pay.example/checkout'
    });
    expect(requestPortOnePayment).not.toHaveBeenCalled();
  });

  test('진입 정보가 없으면 안내 메시지로 throw한다', async() => {
    await expect(launchShopPaymentFromPrepare({})).rejects.toThrow(
      SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE
    );
  });
});
