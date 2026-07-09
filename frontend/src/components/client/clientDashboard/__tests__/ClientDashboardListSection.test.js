/**
 * ClientDashboardListSection — skeleton · error · retry (v1.4)
 *
 * @author CoreSolution
 * @since 2026-07-09
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientDashboardListSection from '../ClientDashboardListSection';
import {
  CLIENT_DASHBOARD_LIST_ERROR_LABEL,
  CLIENT_SCHEDULE_EMPTY_BODY
} from '../constants';

jest.mock('../../../common/ListTableView', () => ({
  __esModule: true,
  default: () => <table data-testid="list-table-view" />
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));

const BASE_PROPS = {
  title: '다음 일정',
  columns: [{ key: 'titleLabel', label: '제목' }],
  emptyText: CLIENT_SCHEDULE_EMPTY_BODY
};

describe('ClientDashboardListSection', () => {
  test('empty state renders when data is empty', () => {
    render(
      <MemoryRouter>
        <ClientDashboardListSection {...BASE_PROPS} data={[]} dataTestId="test-list" />
      </MemoryRouter>
    );

    expect(screen.getByText(CLIENT_SCHEDULE_EMPTY_BODY)).toBeInTheDocument();
    expect(screen.queryByTestId('list-table-view')).not.toBeInTheDocument();
  });

  test('loading state renders 3-row skeleton', () => {
    render(
      <MemoryRouter>
        <ClientDashboardListSection {...BASE_PROPS} loading dataTestId="test-list" />
      </MemoryRouter>
    );

    expect(screen.getByTestId('client-dashboard-list-skeleton')).toBeInTheDocument();
  });

  test('error state renders alert with retry', () => {
    const onRetry = jest.fn();
    render(
      <MemoryRouter>
        <ClientDashboardListSection
          {...BASE_PROPS}
          error={CLIENT_DASHBOARD_LIST_ERROR_LABEL}
          onRetry={onRetry}
          dataTestId="test-list"
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(CLIENT_DASHBOARD_LIST_ERROR_LABEL);
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
