/**
 * useStableUserId / useUserIdScopedLoad / useSoftResourceLoad 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { renderHook, act } from '@testing-library/react';
import { useStableUserId } from '../useStableUserId';
import { useUserIdScopedLoad } from '../useUserIdScopedLoad';
import { useSoftResourceLoad } from '../useSoftResourceLoad';

describe('useStableUserId', () => {
  it('user.id 를 userId 로 노출하고 ref 를 최신 user 로 유지한다', () => {
    const { result, rerender } = renderHook(
      ({ user }) => useStableUserId(user),
      { initialProps: { user: { id: 1, name: 'a' } } }
    );
    expect(result.current.userId).toBe(1);
    expect(result.current.userRef.current.name).toBe('a');

    rerender({ user: { id: 1, name: 'b' } });
    expect(result.current.userId).toBe(1);
    expect(result.current.userRef.current.name).toBe('b');

    rerender({ user: { id: 2, name: 'c' } });
    expect(result.current.userId).toBe(2);
  });
});

describe('useUserIdScopedLoad', () => {
  it('userId 변경 시에만 loadFn({ silent: false }) 를 호출한다', () => {
    const loadFn = jest.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ userId }) => useUserIdScopedLoad({ userId, loadFn, enabled: true }),
      { initialProps: { userId: 10 } }
    );
    expect(loadFn).toHaveBeenCalledTimes(1);
    expect(loadFn).toHaveBeenCalledWith({ silent: false });

    rerender({ userId: 10 });
    expect(loadFn).toHaveBeenCalledTimes(1);

    rerender({ userId: 11 });
    expect(loadFn).toHaveBeenCalledTimes(2);
  });

  it('userId 없으면 onMissingUserId 를 호출한다', () => {
    const onMissingUserId = jest.fn();
    const loadFn = jest.fn();
    renderHook(() =>
      useUserIdScopedLoad({
        userId: null,
        loadFn,
        onMissingUserId
      })
    );
    expect(onMissingUserId).toHaveBeenCalledTimes(1);
    expect(loadFn).not.toHaveBeenCalled();
  });

  it('인라인 onMissingUserId / loadFn 리렌더만으로는 loadFn 을 재호출하지 않는다', () => {
    const loadFn = jest.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ userId }) =>
        useUserIdScopedLoad({
          userId,
          loadFn: () => loadFn({ silent: false }),
          enabled: true,
          onMissingUserId: () => {}
        }),
      { initialProps: { userId: 10 } }
    );
    expect(loadFn).toHaveBeenCalledTimes(1);

    rerender({ userId: 10 });
    rerender({ userId: 10 });
    expect(loadFn).toHaveBeenCalledTimes(1);
  });

  it('enabled=false 이면 loadFn / onMissingUserId 를 호출하지 않는다', () => {
    const loadFn = jest.fn();
    const onMissingUserId = jest.fn();
    renderHook(() =>
      useUserIdScopedLoad({
        userId: 10,
        loadFn,
        enabled: false,
        onMissingUserId
      })
    );
    expect(loadFn).not.toHaveBeenCalled();
    expect(onMissingUserId).not.toHaveBeenCalled();
  });
});

describe('useSoftResourceLoad', () => {
  it('load 는 setLoading 을 켜고 softRefresh 는 silent', async() => {
    const setLoading = jest.fn();
    const loader = jest.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useSoftResourceLoad(setLoading, loader));

    await act(async() => {
      await result.current.load({ silent: false });
    });
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    expect(loader).toHaveBeenCalledTimes(1);

    setLoading.mockClear();
    await act(async() => {
      await result.current.softRefresh();
    });
    expect(setLoading).not.toHaveBeenCalled();
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
