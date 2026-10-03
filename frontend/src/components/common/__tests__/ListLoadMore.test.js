/**
 * ListLoadMore 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ListLoadMore from '../ListLoadMore';
import { PAGED_LIST_TEST_IDS } from '../../../constants/pagedList';

describe('ListLoadMore', () => {
  test('더 있음 → 「n / total」 + 더 보기 버튼 클릭', () => {
    const onLoadMore = jest.fn();
    render(<ListLoadMore loadedCount={5} totalCount={6} hasMore onLoadMore={onLoadMore} />);
    expect(screen.getByTestId(PAGED_LIST_TEST_IDS.COUNT)).toHaveTextContent('5 / 6');
    fireEvent.click(screen.getByTestId(PAGED_LIST_TEST_IDS.LOAD_MORE_BUTTON));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  test('다 읽음 → 건수만 · 버튼 없음', () => {
    render(<ListLoadMore loadedCount={6} totalCount={6} hasMore={false} onLoadMore={jest.fn()} />);
    expect(screen.getByTestId(PAGED_LIST_TEST_IDS.COUNT)).toHaveTextContent('6 / 6');
    expect(screen.queryByTestId(PAGED_LIST_TEST_IDS.LOAD_MORE_BUTTON)).toBeNull();
  });

  test('총계 모름 + 더 없음 → 렌더 안 함', () => {
    const { container } = render(<ListLoadMore loadedCount={3} hasMore={false} onLoadMore={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('불러오는 중 → 버튼 비활성', () => {
    render(<ListLoadMore loadedCount={20} totalCount={40} hasMore loading onLoadMore={jest.fn()} />);
    expect(screen.getByTestId(PAGED_LIST_TEST_IDS.LOAD_MORE_BUTTON)).toBeDisabled();
  });
});
