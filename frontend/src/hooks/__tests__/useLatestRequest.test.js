/**
 * useLatestRequest / createLatestRequestGuard — stale 응답 가드
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import { act, renderHook } from '@testing-library/react';
import { useLatestRequest } from '../useLatestRequest';
import { createLatestRequestGuard, isAbortError } from '../../utils/latestRequestGuard';

describe('createLatestRequestGuard', () => {
  test('이전 핸들은 begin 이후 stale 이고 signal 이 abort 된다', () => {
    const guard = createLatestRequestGuard();
    const first = guard.begin();
    expect(first.isCurrent()).toBe(true);
    expect(first.isStale()).toBe(false);

    const second = guard.begin();
    expect(first.isStale()).toBe(true);
    expect(first.signal?.aborted).toBe(true);
    expect(second.isCurrent()).toBe(true);
    expect(second.isStale()).toBe(false);
  });

  test('abort 는 in-flight 를 stale 처리한다', () => {
    const guard = createLatestRequestGuard();
    const handle = guard.begin();
    guard.abort();
    expect(handle.isStale()).toBe(true);
    expect(handle.signal?.aborted).toBe(true);
  });

  test('isAbortError 는 AbortError 를 인식한다', () => {
    expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(new Error('network'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});

describe('useLatestRequest', () => {
  test('연속 begin 시 이전 요청만 stale', () => {
    const { result } = renderHook(() => useLatestRequest());
    let first;
    let second;
    act(() => {
      first = result.current();
      second = result.current();
    });
    expect(first.isStale()).toBe(true);
    expect(second.isCurrent()).toBe(true);
  });

  test('언마운트 시 진행 중 요청이 abort 된다', () => {
    const { result, unmount } = renderHook(() => useLatestRequest());
    let handle;
    act(() => {
      handle = result.current();
    });
    unmount();
    expect(handle.isStale()).toBe(true);
    expect(handle.signal?.aborted).toBe(true);
  });
});
