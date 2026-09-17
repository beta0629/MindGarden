import StandardizedApi from '../../utils/standardizedApi';
import {
  fetchShopCart,
  fetchShopCatalog,
  postShopCheckout,
  prepareShopPayment
} from '../clientShopService';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  }
}));

describe('clientShopService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchShopCatalog', () => {
    test('StandardizedApi가 배열을 직접 반환하면 카탈로그를 파싱한다', async() => {
      StandardizedApi.get.mockResolvedValueOnce([
        { skuCode: 'DEV-CONSULT-DEMO-01', catalogCategory: 'CONSULTATION' }
      ]);

      const catalog = await fetchShopCatalog();

      expect(catalog).toHaveLength(1);
      expect(catalog[0].skuCode).toBe('DEV-CONSULT-DEMO-01');
      expect(catalog[0].catalogCategory).toBe('CONSULTATION');
    });

    test('ApiResponse 래퍼를 반환하면 data 배열을 파싱한다', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        success: true,
        data: [{ skuCode: 'SKU-2', catalogCategory: 'ASSESSMENT' }]
      });

      const catalog = await fetchShopCatalog();

      expect(catalog).toHaveLength(1);
      expect(catalog[0].skuCode).toBe('SKU-2');
      expect(catalog[0].catalogCategory).toBe('ASSESSMENT');
    });
  });

  describe('fetchShopCart', () => {
    test('StandardizedApi가 장바구니 객체를 직접 반환하면 그대로 사용한다', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        lines: [{ skuCode: 'DEV-CONSULT-DEMO-01', quantity: 1 }],
        subtotalMinor: 50000
      });

      const cart = await fetchShopCart();

      expect(cart.lines).toHaveLength(1);
      expect(cart.subtotalMinor).toBe(50000);
    });
  });

  describe('postShopCheckout', () => {
    test('언랩된 checkout DTO를 반환하면 throw 없이 그 객체를 반환한다', async() => {
      const dto = {
        orderPublicId: 'ord-abc',
        nextStep: 'PAYMENT',
        cashDueMinor: 10000
      };
      StandardizedApi.post.mockResolvedValueOnce(dto);

      const result = await postShopCheckout('idem-1', 0, null);

      expect(result).toEqual(dto);
      expect(result.orderPublicId).toBe('ord-abc');
    });

    test('success:false envelope면 message로 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: false,
        message: '장바구니가 비어 있습니다.'
      });

      await expect(postShopCheckout('idem-2', 0, null)).rejects.toThrow(
        '장바구니가 비어 있습니다.'
      );
    });
  });

  describe('prepareShopPayment', () => {
    test('언랩된 prepare DTO를 반환하면 throw 없이 그 객체를 반환한다', async() => {
      const dto = {
        paymentId: 'pay-1',
        pgReady: true,
        storeId: 'store-1',
        channelKey: 'channel-1',
        cashAmount: 10000
      };
      StandardizedApi.post.mockResolvedValueOnce(dto);

      const result = await prepareShopPayment('ord-abc');

      expect(result).toEqual(dto);
      expect(result.pgReady).toBe(true);
    });

    test('success:false envelope면 message로 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: false,
        message: '결제를 준비할 수 없습니다.'
      });

      await expect(prepareShopPayment('ord-abc')).rejects.toThrow(
        '결제를 준비할 수 없습니다.'
      );
    });
  });
});
