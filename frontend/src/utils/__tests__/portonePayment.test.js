import * as PortOne from '@portone/browser-sdk/v2';
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
});
