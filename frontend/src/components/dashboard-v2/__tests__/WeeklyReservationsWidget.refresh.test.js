/**
 * WeeklyReservationsWidget — 개별 새로고침 (loadData만, layout blank 금지)
 *
 * @author CoreSolution
 * @since 2026-08-13
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StandardizedApi from '../../../utils/standardizedApi';
import { WEEKLY_RESERVATIONS_API } from '../../../constants/weeklyReservationsConstants';
import WeeklyReservationsWidget from '../WeeklyReservationsWidget';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('../../common/SegmentedTabs', () => ({
  __esModule: true,
  default: () => <div data-testid="week-toggle-mock" />
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, ...rest }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {children}
    </button>
  )
}));

const emptyPayload = {
  weekStart: '2026-08-10',
  weekEnd: '2026-08-16',
  totalCount: 0,
  changeAbs: 0,
  changePercent: null,
  byDayOfWeek: [],
  byStatus: []
};

describe('WeeklyReservationsWidget refresh', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockResolvedValue({ data: emptyPayload });
  });

  test('마운트 시 weekly-reservations API 1회 호출', async() => {
    render(<WeeklyReservationsWidget />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        WEEKLY_RESERVATIONS_API.STATS,
        expect.objectContaining({ weekOffset: 0 })
      );
    });
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('weekly-reservations-widget')).toBeInTheDocument();
  });

  test('새로고침 클릭 시 loadData만 재호출 (동일 API)', async() => {
    render(<WeeklyReservationsWidget />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByTestId('weekly-reservations-refresh'));

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
    });
    expect(StandardizedApi.get).toHaveBeenLastCalledWith(
      WEEKLY_RESERVATIONS_API.STATS,
      expect.objectContaining({ weekOffset: 0 })
    );
  });
});
