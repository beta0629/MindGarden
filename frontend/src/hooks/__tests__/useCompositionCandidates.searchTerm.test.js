/**
 * 구성 후보 훅이 검색어를 q 로 실서비스까지 넘기는지 확인한다.
 * adminShopCompositionService 는 목으로 바꾸지 않는다.
 */

import { renderHook, act } from '@testing-library/react';
import StandardizedApi from '../../utils/standardizedApi';
import { ADMIN_SHOP_API } from '../../constants/adminShopApi';
import useCompositionCandidates, { COMPOSITION_SEARCH_DEBOUNCE_MS } from '../useCompositionCandidates';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

const flushMicrotasks = async() => {
  await act(async() => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('useCompositionCandidates 검색어 q', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue({ items: [], totalActive: 0 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('초기 검색어는 첫 조회부터 q 로 후보 API 를 부른다', async() => {
    renderHook(() => useCompositionCandidates({ query: '초기' }));
    await flushMicrotasks();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      ADMIN_SHOP_API.COMPOSITION_CANDIDATES,
      { q: '초기' }
    );
    expect(ADMIN_SHOP_API.COMPOSITION_CANDIDATES).toBe(
      '/api/v1/admin/shop/catalog-skus/composition-candidates'
    );
  });

  test('빈 검색어는 q 없이 부르고, 초기로 바꾸면 디바운스 뒤에 q 를 붙인다', async() => {
    jest.useFakeTimers();
    const { rerender } = renderHook(
      ({ query }) => useCompositionCandidates({ query }),
      { initialProps: { query: '' } }
    );
    await flushMicrotasks();
    expect(StandardizedApi.get).toHaveBeenCalledWith(ADMIN_SHOP_API.COMPOSITION_CANDIDATES, {});
    expect(StandardizedApi.get).not.toHaveBeenCalledWith(
      ADMIN_SHOP_API.COMPOSITION_CANDIDATES,
      { q: '초기' }
    );

    rerender({ query: '초기' });
    await flushMicrotasks();
    expect(StandardizedApi.get).not.toHaveBeenCalledWith(
      ADMIN_SHOP_API.COMPOSITION_CANDIDATES,
      { q: '초기' }
    );

    await act(async() => {
      jest.advanceTimersByTime(COMPOSITION_SEARCH_DEBOUNCE_MS);
    });
    await flushMicrotasks();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      ADMIN_SHOP_API.COMPOSITION_CANDIDATES,
      { q: '초기' }
    );
  });
});
