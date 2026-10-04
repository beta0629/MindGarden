/**
 * useSoftResourceLoad — 겹친 blocking load 는 마지막 호출만 loading 을 내린다 · 언마운트 뒤 setLoading 없음
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { act, renderHook } from '@testing-library/react';
import { useSoftResourceLoad } from '../useSoftResourceLoad';

describe('useSoftResourceLoad overlap', () => {
  test('앞선 요청 완료가 진행 중인 뒤 요청의 로딩을 끄지 않는다', async() => {
    const setLoading = jest.fn();
    const resolvers = [];
    const loader = jest.fn(() => new Promise((resolve) => resolvers.push(resolve)));
    const { result } = renderHook(() => useSoftResourceLoad(setLoading, loader));

    let first;
    let second;
    act(() => {
      first = result.current.load({ silent: false });
      second = result.current.load({ silent: false });
    });
    setLoading.mockClear();

    await act(async() => {
      resolvers[0]();
      await first;
    });
    expect(setLoading).not.toHaveBeenCalledWith(false);

    await act(async() => {
      resolvers[1]();
      await second;
    });
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  test('silent 재조회는 blocking 로딩 순번을 바꾸지 않는다', async() => {
    const setLoading = jest.fn();
    const resolvers = [];
    const loader = jest.fn(() => new Promise((resolve) => resolvers.push(resolve)));
    const { result } = renderHook(() => useSoftResourceLoad(setLoading, loader));

    let blocking;
    let silent;
    act(() => {
      blocking = result.current.load({ silent: false });
      silent = result.current.softRefresh();
    });
    await act(async() => {
      resolvers[1]();
      await silent;
    });
    await act(async() => {
      resolvers[0]();
      await blocking;
    });
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  test('언마운트 뒤 끝난 요청은 setLoading 을 부르지 않는다', async() => {
    const setLoading = jest.fn();
    let resolveLoad;
    const loader = jest.fn(() => new Promise((resolve) => {
      resolveLoad = resolve;
    }));
    const { result, unmount } = renderHook(() => useSoftResourceLoad(setLoading, loader));
    let pending;
    act(() => {
      pending = result.current.load({ silent: false });
    });
    unmount();
    setLoading.mockClear();
    await act(async() => {
      resolveLoad();
      await pending;
    });
    expect(setLoading).not.toHaveBeenCalled();
  });
});
