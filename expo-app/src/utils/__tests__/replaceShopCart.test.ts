const mockApiPut = jest.fn();

(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;

jest.mock('@/api/client', () => ({
  apiGet: jest.fn(),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@/hooks/useApiQueryReady', () => ({
  useApiQueryReady: jest.fn(),
}));

import { replaceShopCart } from '@/api/hooks/useClientShopCart';

describe('replaceShopCart', () => {
  const fallback = '장바구니 갱신에 실패했습니다.';

  beforeEach(() => {
    mockApiPut.mockReset();
  });

  it('succeeds when PUT returns success true with null data', async () => {
    mockApiPut.mockResolvedValue({ success: true, data: null });
    await expect(replaceShopCart([{ skuCode: 'SKU-1', quantity: 1 }])).resolves.toBeUndefined();
  });

  it('throws Error with server message on axios-like reject', async () => {
    mockApiPut.mockRejectedValue({ status: 400, message: '유효하지 않은 상품' });
    await expect(replaceShopCart([{ skuCode: 'BAD', quantity: 1 }])).rejects.toThrow(
      '유효하지 않은 상품',
    );
  });

  it('throws fallback when reject object has no message', async () => {
    mockApiPut.mockRejectedValue({ status: 500 });
    await expect(replaceShopCart([{ skuCode: 'SKU-1', quantity: 1 }])).rejects.toThrow(fallback);
  });

  it('throws server message when success is false in response body', async () => {
    mockApiPut.mockResolvedValue({ success: false, message: '재고 부족' });
    await expect(replaceShopCart([{ skuCode: 'SKU-1', quantity: 1 }])).rejects.toThrow(
      '재고 부족',
    );
  });
});
