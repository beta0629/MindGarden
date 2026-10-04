/**
 * usePagedList 단위 테스트 — page/size · 더 보기 · enabled 게이트 · 늦은 응답 무시
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { usePagedList } from '../usePagedList';

const makeItems = (from, count) => Array.from({ length: count }, (_, i) => ({ id: from + i }));

describe('usePagedList', () => {
  test('page 0 부터 size 로 읽고 더 보기로 이어 붙인다 (23건 / size 20)', async() => {
    const fetchPage = jest.fn((page, size) => Promise.resolve({
      messages: makeItems(page * size, page === 0 ? size : 3),
      totalElements: 23,
      totalPages: 2
    }));
    const { result } = renderHook(() => usePagedList({ fetchPage, pageSize: 20 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchPage).toHaveBeenCalledWith(0, 20);
    expect(result.current.items).toHaveLength(20);
    expect(result.current.totalElements).toBe(23);
    expect(result.current.hasMore).toBe(true);

    await act(async() => {
      await result.current.loadMore();
    });
    expect(fetchPage).toHaveBeenLastCalledWith(1, 20);
    expect(result.current.items).toHaveLength(23);
    expect(result.current.items[22].id).toBe(22);
    expect(result.current.hasMore).toBe(false);
  });

  test('알림 6건 / size 5 → 5건 + 더 보기 → 6건', async() => {
    const fetchPage = jest.fn((page) => Promise.resolve({
      notifications: page === 0 ? makeItems(0, 5) : makeItems(5, 1),
      totalElements: 6,
      totalPages: 2
    }));
    const { result } = renderHook(() => usePagedList({ fetchPage, pageSize: 5 }));
    await waitFor(() => expect(result.current.items).toHaveLength(5));
    expect(result.current.hasMore).toBe(true);
    await act(async() => {
      await result.current.loadMore();
    });
    expect(result.current.items).toHaveLength(6);
    expect(result.current.hasMore).toBe(false);
  });

  test('enabled=false 이면 요청하지 않고, true 가 되면 첫 페이지를 읽는다', async() => {
    const fetchPage = jest.fn().mockResolvedValue({ items: [], totalElements: 0 });
    const { result, rerender } = renderHook(
      ({ enabled }) => usePagedList({ fetchPage, enabled }),
      { initialProps: { enabled: false } }
    );
    expect(fetchPage).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  test('재조회 중 늦게 끝난 이전 응답은 목록을 덮지 않는다', async() => {
    const resolvers = [];
    const fetchPage = jest.fn(() => new Promise((resolve) => resolvers.push(resolve)));
    const { result, rerender } = renderHook(
      ({ resetKey }) => usePagedList({ fetchPage, resetKey }),
      { initialProps: { resetKey: 'a' } }
    );
    rerender({ resetKey: 'b' });
    expect(fetchPage).toHaveBeenCalledTimes(2);

    await act(async() => {
      resolvers[1]({ items: [{ id: 'new' }], totalElements: 1 });
    });
    await act(async() => {
      resolvers[0]({ items: [{ id: 'old' }], totalElements: 1 });
    });
    expect(result.current.items).toEqual([{ id: 'new' }]);
    expect(result.current.loading).toBe(false);
  });

  test('loadMore 중복 클릭은 한 번만 요청한다', async() => {
    let resolveMore;
    const fetchPage = jest.fn((page) => (page === 0
      ? Promise.resolve({ items: makeItems(0, 20), totalElements: 40 })
      : new Promise((resolve) => {
        resolveMore = resolve;
      })));
    const { result } = renderHook(() => usePagedList({ fetchPage }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    expect(fetchPage).toHaveBeenCalledTimes(2);
    await act(async() => {
      resolveMore({ items: makeItems(20, 20), totalElements: 40 });
    });
    expect(result.current.items).toHaveLength(40);
  });

  test('첫 페이지 실패 → error · 빈 목록 · loading 해제', async() => {
    const fetchPage = jest.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => usePagedList({ fetchPage }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.items).toEqual([]);
  });
});
