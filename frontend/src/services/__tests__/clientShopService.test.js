import StandardizedApi from '../../utils/standardizedApi';
import {
  fetchShopCart,
  fetchShopCatalog,
  postShopCheckout,
  prepareShopPayment,
  verifyShopPayment
} from '../clientShopService';
import { SHOP_CHECKOUT_ERROR_COPY } from '../../constants/clientShopConstants';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('../../utils/ensurePublicShopTenantContext', () => ({
  ensurePublicShopTenantContext: jest.fn().mockResolvedValue('tenant-test')
}));

describe('clientShopService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchShopCatalog', () => {
    test('공개 카탈로그 API를 호출한다', async() => {
      StandardizedApi.get.mockResolvedValueOnce([]);

      await fetchShopCatalog();

      expect(StandardizedApi.get).toHaveBeenCalledWith('/api/v1/shop/catalog');
    });

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
    test('bare ShopCheckoutResponse를 그대로 반환한다', async() => {
      const bare = { orderPublicId: 'ord-1', nextStep: 'PAYMENT' };
      StandardizedApi.post.mockResolvedValueOnce(bare);

      const result = await postShopCheckout('idem-1', 0, null);

      expect(result).toEqual(bare);
      expect(result.orderPublicId).toBe('ord-1');
    });

    test('성공 래퍼면 data를 반환한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: true,
        data: { orderPublicId: 'ord-1' }
      });

      const result = await postShopCheckout('idem-1', 0, null);

      expect(result).toEqual({ orderPublicId: 'ord-1' });
    });

    test('실패 엔벨로프 message를 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: false,
        message: '장바구니가 비어 있습니다.'
      });

      await expect(postShopCheckout('idem-1', 0, null)).rejects.toThrow(
        '장바구니가 비어 있습니다.'
      );
    });

    test('실패 엔벨로프에 message가 없으면 기본 메시지를 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({ success: false });

      await expect(postShopCheckout('idem-1', 0, null)).rejects.toThrow(
        '체크아웃에 실패했습니다.'
      );
    });

    test('null 응답이면 기본 메시지를 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce(null);

      await expect(postShopCheckout('idem-1', 0, null)).rejects.toThrow(
        '체크아웃에 실패했습니다.'
      );
    });
  });

  describe('prepareShopPayment', () => {
    const preparePayload = {
      paymentId: 'pay-1',
      storeId: 'store-1',
      channelKey: 'channel-1',
      customerEmail: 'a@b.c'
    };

    test('bare prepare 객체를 그대로 반환한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce(preparePayload);

      const result = await prepareShopPayment('ord-1');

      expect(result).toEqual(preparePayload);
    });

    test('성공 래퍼면 data를 반환한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: true,
        data: preparePayload
      });

      const result = await prepareShopPayment('ord-1');

      expect(result).toEqual(preparePayload);
    });

    test('실패 엔벨로프 message를 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: false,
        message: '결제 수단을 준비할 수 없습니다.'
      });

      await expect(prepareShopPayment('ord-1')).rejects.toThrow(
        '결제 수단을 준비할 수 없습니다.'
      );
    });

    test('실패 엔벨로프에 message가 없으면 기본 메시지를 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({ success: false });

      await expect(prepareShopPayment('ord-1')).rejects.toThrow(
        '결제 준비에 실패했습니다.'
      );
    });

    test('null 응답이면 기본 메시지를 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce(null);

      await expect(prepareShopPayment('ord-1')).rejects.toThrow(
        '결제 준비에 실패했습니다.'
      );
    });
  });

  describe('verifyShopPayment', () => {
    test('isValid true면 검증 결과를 반환한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        isValid: true,
        message: '결제가 유효합니다.'
      });

      const result = await verifyShopPayment('pay-1', 15000);

      expect(StandardizedApi.post).toHaveBeenCalledWith(
        '/api/v1/payments/pay-1/verify?amount=15000',
        {}
      );
      expect(result).toEqual({
        isValid: true,
        message: '결제가 유효합니다.'
      });
    });

    test('isValid false면 VERIFY_FAILED로 throw한다', async() => {
      StandardizedApi.post.mockResolvedValueOnce({
        isValid: false,
        message: '결제가 유효하지 않습니다.'
      });

      await expect(verifyShopPayment('pay-1', 15000)).rejects.toThrow(
        '결제가 유효하지 않습니다.'
      );
    });

    test('paymentId 없으면 VERIFY_FAILED로 throw한다', async() => {
      await expect(verifyShopPayment('', 1000)).rejects.toThrow(
        SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED
      );
      expect(StandardizedApi.post).not.toHaveBeenCalled();
    });
  });
});
