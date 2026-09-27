/**
 * 초기 로딩만 본문을 가리고, 이후 loading 은 자식을 유지한다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { renderHook } from '@testing-library/react';
import { useInitialOnlyBlockingLoading } from '../useInitialOnlyBlockingLoading';

describe('useInitialOnlyBlockingLoading', () => {
  it('처음 loading 이면 가리고, 콘텐츠 이후에는 가리지 않는다', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useInitialOnlyBlockingLoading(loading),
      { initialProps: { loading: true } }
    );
    expect(result.current).toBe(true);

    rerender({ loading: false });
    expect(result.current).toBe(false);

    rerender({ loading: true });
    expect(result.current).toBe(false);
  });

  it('처음부터 loading 이 아니면 가리지 않는다', () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useInitialOnlyBlockingLoading(loading),
      { initialProps: { loading: false } }
    );
    expect(result.current).toBe(false);
    rerender({ loading: true });
    expect(result.current).toBe(false);
  });
});
