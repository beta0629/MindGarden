/**
 * useScrollEndLoadMore — 끝에 닿을 때만, 더 있을 때만, 불러오는 중이 아닐 때만 부른다
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import { renderHook } from '@testing-library/react';
import { useScrollEndLoadMore } from '../useScrollEndLoadMore';

const target = (scrollTop) => ({ currentTarget: { scrollTop, clientHeight: 200, scrollHeight: 1000 } });

describe('useScrollEndLoadMore', () => {
  test('목록 끝에 닿으면 다음 페이지를 부른다', () => {
    const onLoadMore = jest.fn();
    const { result } = renderHook(() => useScrollEndLoadMore({ onLoadMore, hasMore: true }));
    result.current(target(100));
    expect(onLoadMore).not.toHaveBeenCalled();
    result.current(target(800));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  test('마지막 페이지이거나 불러오는 중이면 부르지 않는다', () => {
    const onLoadMore = jest.fn();
    const { result, rerender } = renderHook((p) => useScrollEndLoadMore(p), {
      initialProps: { onLoadMore, hasMore: false }
    });
    result.current(target(800));
    rerender({ onLoadMore, hasMore: true, loadingMore: true });
    result.current(target(800));
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
