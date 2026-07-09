/**
 * ConsultantDashboardListSection — ListTableView skeleton/error/retry (PR-WEB-DASH-C01)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ConsultantDashboardListSection from '../ConsultantDashboardListSection';
import {
  CONSULTANT_DASHBOARD_LIST_ERROR_LABEL,
  CONSULTANT_DASHBOARD_LIST_RETRY_LABEL
} from '../../../../constants/consultantDashboardConstants';

jest.mock('../../../common/ListTableView', () => ({
  __esModule: true,
  default: () => <table data-testid="list-table-view" />
}));

jest.mock('../../../ui/Icon/Icon', () => () => null);

const BASE_PROPS = {
  title: '테스트 목록',
  columns: [{ key: 'name', label: '이름' }],
  emptyText: '항목이 없습니다.'
};

describe('ConsultantDashboardListSection', () => {
  test('empty state renders when data is empty', () => {
    render(
      <MemoryRouter>
        <ConsultantDashboardListSection {...BASE_PROPS} data={[]} dataTestId="test-list" />
      </MemoryRouter>
    );

    expect(screen.getByText('항목이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByTestId('list-table-view')).not.toBeInTheDocument();
  });

  test('loading state renders ListTableView skeleton', () => {
    render(
      <MemoryRouter>
        <ConsultantDashboardListSection {...BASE_PROPS} loading dataTestId="test-list" />
      </MemoryRouter>
    );

    expect(screen.getByTestId('consultant-dashboard-list-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('list-table-view')).not.toBeInTheDocument();
  });

  test('error state renders with alert role and retry', async() => {
    const onRetry = jest.fn();
    render(
      <MemoryRouter>
        <ConsultantDashboardListSection
          {...BASE_PROPS}
          error="테넌트 오류"
          onRetry={onRetry}
          dataTestId="test-list"
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('테넌트 오류');
    expect(screen.queryByText(CONSULTANT_DASHBOARD_LIST_ERROR_LABEL)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: CONSULTANT_DASHBOARD_LIST_RETRY_LABEL }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
