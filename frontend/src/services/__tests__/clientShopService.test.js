import StandardizedApi from '../../utils/standardizedApi';
import { fetchShopCart, fetchShopCatalog } from '../clientShopService';

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
});
