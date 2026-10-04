import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TodayStats from '../TodayStats';
import { SCHEDULE_API } from '../../../constants/api';

/**
 * 오늘 통계 — 레거시 /api/schedules 전체 목록(userId=0&userRole=ADMIN) 대신 세션 기준 집계 API 만 호출한다.
 */

const mockGet = jest.fn();
let mockUser = { id: 20, role: 'CLIENT', tenantId: 'tenant-test' };

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));
jest.mock('../../../i18n', () => ({ t: (key) => key }));
jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: mockUser })
}));
jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: (...args) => mockGet(...args) }
}));
jest.mock('../../common/UnifiedLoading', () => ({ __esModule: true, default: () => <div>loading</div> }));
jest.mock('../../dashboard-v2/content', () => ({
  ContentKpiRow: ({ items }) => (
    <ul>
      {items.map((item) => <li key={item.id} data-testid={`kpi-${item.id}`}>{item.value}</li>)}
    </ul>
  )
}));

describe('TodayStats — 세션 기준 오늘 통계', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockGet.mockReset();
    mockUser = { id: 20, role: 'CLIENT', tenantId: 'tenant-test' };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('세션 집계 API 만 호출하고 userId·ADMIN 을 보내지 않는다', async() => {
    mockGet.mockResolvedValue({ totalToday: 3, completedToday: 1, inProgressToday: 1, cancelledToday: 1 });

    render(<TodayStats />);

    await waitFor(() => expect(screen.getByTestId('kpi-total')).toHaveTextContent('3'));
    expect(mockGet).toHaveBeenCalledWith(SCHEDULE_API.TODAY_STATISTICS, { userRole: 'CLIENT' });
    expect(SCHEDULE_API.TODAY_STATISTICS).toBe('/api/v1/schedules/today/statistics');
    const params = mockGet.mock.calls[0][1];
    expect(params).not.toHaveProperty('userId');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('세션 사용자가 없으면 호출하지 않는다', () => {
    mockUser = null;

    render(<TodayStats />);

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('조회 실패 시 공통 오류 문구만 보여 준다', async() => {
    mockGet.mockRejectedValue(new Error('server detail should not show'));

    render(<TodayStats />);

    expect(await screen.findByText('error:schedule.TodayStats.t_52590b31')).toBeInTheDocument();
    expect(screen.queryByText(/server detail/)).not.toBeInTheDocument();
  });
});
