/**
 * Consultant Dashboard V2 — G-14 header dedup · Clinic-OS · ContentHeader SSOT 스모크 (ROLE-C-02)
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const MOCK_USER_NAME = '김상담';
const WELCOME_TITLE = `환영합니다, ${MOCK_USER_NAME} 상담사님`;

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'common:dashboard-v2.ConsultantDashboardV2.t_808c1f0c': '상담 대시보드',
        'common:dashboard-v2.ConsultantDashboardV2.t_484d08c9': '대시보드를 불러오는 중...',
        'common:dashboard-v2.ConsultantDashboardV2.t_f39a6b65': '최근 일정 (오늘·어제)',
        'common:dashboard-v2.ConsultantDashboardV2.t_1e4cd526': '다가오는 상담',
        'common:dashboard-v2.ConsultantDashboardV2.t_74e4a0da': '최근 알림',
        'common:dashboard-v2.ConsultantDashboardV2.t_2a22e022': '주간 상담 현황',
        'common:dashboard-v2.ConsultantDashboardV2.t_b2218467': '오늘·어제 예정된 일정이 없습니다.',
        'common:dashboard-v2.ConsultantDashboardV2.t_7f221836': '다가오는 상담이 없습니다.',
        'common:dashboard-v2.ConsultantDashboardV2.t_00fa1636': '새로운 알림이 없습니다.',
        'common:dashboard-v2.ConsultantDashboardV2.t_b283cb3a': '최근 주간 상담 추이 데이터가 없습니다.',
        'admin.labels.client': '내담자'
      };
      return map[key] ?? key;
    }
  })
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title, className }) => (
    <div
      data-testid="admin-common-layout"
      data-title={title ?? ''}
      data-classname={className ?? ''}
    >
      {children}
    </div>
  )
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  )
}));

jest.mock('../../../common/ListTableView', () => ({
  __esModule: true,
  default: ({ data, columns }) => (
    <table data-testid="list-table-view">
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}));

jest.mock('../../../consultant/ConsultationLogModal', () => ({
  __esModule: true,
  default: ({ isOpen, scheduleData }) => (
    isOpen ? (
      <div data-testid="consultation-log-modal">
        {scheduleData?.id || scheduleData?.clientName || 'open'}
      </div>
    ) : null
  )
}));
jest.mock('../../ExpectedVisitsWidget', () => () => null);
jest.mock('../../../ui/Icon/Icon', () => () => null);
jest.mock('../../../ui/Schedule/MissingConsultationLogsList', () => ({
  __esModule: true,
  default: ({ items }) => (
    <div data-testid="missing-consultation-logs-list">
      {Array.isArray(items) ? `items:${items.length}` : 'items:null'}
    </div>
  )
}));

jest.mock('../../../../hooks/useCumulativeMissingConsultationLogs', () => ({
  __esModule: true,
  default: () => ({
    items: mockCumulativeMissingItems,
    isLoading: false,
    error: null
  })
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { warning: jest.fn(), error: jest.fn(), success: jest.fn(), info: jest.fn() }
}));

const mockResolveMissingLogSchedule = jest.fn();

jest.mock('../../../../utils/missingConsultationLogNavigation', () => {
  const actual = jest.requireActual('../../../../utils/missingConsultationLogNavigation');
  return {
    ...actual,
    resolveMissingLogSchedule: (...args) => mockResolveMissingLogSchedule(...args)
  };
});

const mockSessionStats = {
  totalCompleted: 5,
  previousPeriodTotal: 3,
  buckets: [
    { label: '3/1', value: 1 },
    { label: '3/2', value: 4 }
  ]
};

jest.mock('../../../../api/consultantSessionStatisticsClient', () => ({
  fetchConsultantSessionStatistics: jest.fn(() => Promise.resolve(mockSessionStats))
}));

const mockStatsResponse = {
  newClients: 1,
  unreadMessages: 2
};

let mockCumulativeMissingItems = [
  { consultantId: 42, consultantName: '김상담', missingDates: ['2026-08-18'] }
];

let mockIncompleteRecords = {
  count: 2,
  records: [
    {
      scheduleId: 901,
      clientId: 7,
      clientName: '홍내담',
      sessionDate: '2026-03-01',
      sessionNumber: 3
    }
  ]
};

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (String(url).includes('incomplete-records')) {
        return Promise.resolve(mockIncompleteRecords);
      }
      if (String(url).includes('high-priority-clients')) {
        return Promise.resolve({ clients: [] });
      }
      if (String(url).includes('upcoming-preparation')) {
        return Promise.resolve({ consultation: null });
      }
      if (String(url).includes('unread-count')) {
        return Promise.resolve({ unreadCount: 3 });
      }
      if (String(url).includes('notifications')) {
        return Promise.resolve([]);
      }
      if (String(url).includes('upcoming')) {
        return Promise.resolve({ schedules: [] });
      }
      if (String(url).includes('schedules')) {
        return Promise.resolve({ schedules: [] });
      }
      return Promise.resolve(mockStatsResponse);
    })
  }
}));

import ConsultantDashboardV2 from '../ConsultantDashboardV2';
import { CONSULTANT_DASHBOARD_TITLE_ID } from '../../../../constants/consultantDashboardConstants';
import {
  CONSULTANT_DASHBOARD_KPI_ROUTES,
  CONSULTANT_DASHBOARD_QUICK_ACTIONS,
  CONSULTANT_DASHBOARD_ROUTES
} from '../../../../constants/consultantDashboardRoutes';
import { fetchConsultantSessionStatistics } from '../../../../api/consultantSessionStatisticsClient';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

const mockApiGet = (url) => {
  const u = String(url);
  if (u.includes('incomplete-records')) {
    return Promise.resolve(mockIncompleteRecords);
  }
  if (u.includes('high-priority-clients')) {
    return Promise.resolve({ clients: [] });
  }
  if (u.includes('upcoming-preparation')) {
    return Promise.resolve({ consultation: null });
  }
  if (u.includes('unread-count')) {
    return Promise.resolve({ unreadCount: 3 });
  }
  if (u.includes('notifications')) {
    return Promise.resolve([]);
  }
  if (u.includes('upcoming')) {
    return Promise.resolve({ schedules: [] });
  }
  if (u.includes('schedules')) {
    return Promise.resolve({ schedules: [] });
  }
  return Promise.resolve(mockStatsResponse);
};

const renderDashboard = () => render(
  <MemoryRouter>
    <ConsultantDashboardV2 user={{ id: 42, name: MOCK_USER_NAME, tenantId: 'tenant-1' }} />
  </MemoryRouter>
);

describe('ConsultantDashboardV2 (ROLE-C-02 PR-C2)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockResolveMissingLogSchedule.mockReset();
    mockResolveMissingLogSchedule.mockResolvedValue({
      id: 'schedule-555',
      consultantId: 42,
      clientId: 9,
      sessionDate: '2026-08-18'
    });
    notificationManager.info.mockClear();
    notificationManager.warning.mockClear();
    notificationManager.error.mockClear();
    mockSessionStats.totalCompleted = 5;
    mockSessionStats.buckets = [
      { label: '3/1', value: 1 },
      { label: '3/2', value: 4 }
    ];
    mockCumulativeMissingItems = [
      { consultantId: 42, consultantName: '김상담', missingDates: ['2026-08-18'] }
    ];
    mockIncompleteRecords = {
      count: 2,
      records: [
        {
          scheduleId: 901,
          clientId: 7,
          clientName: '홍내담',
          sessionDate: '2026-03-01',
          sessionNumber: 3
        }
      ]
    };
    fetchConsultantSessionStatistics.mockImplementation(() => Promise.resolve(mockSessionStats));
    StandardizedApi.get.mockImplementation(mockApiGet);
  });

  test('G-14: ACL title 생략, ContentHeader welcome SSOT, Clinic-OS 루트', async() => {
    renderDashboard();

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute(
      'data-classname',
      'mg-v2-dashboard-layout'
    );

    expect(screen.getByRole('heading', { level: 1, name: WELCOME_TITLE })).toHaveAttribute(
      'id',
      CONSULTANT_DASHBOARD_TITLE_ID
    );

    expect(screen.getByTestId('consultant-dashboard-v2-page')).toBeInTheDocument();
    expect(document.querySelector('.consultant-dashboard-v2.mg-v2-clinic-os')).toBeInTheDocument();
    expect(document.querySelector('.mg-v2-ad-b0kla.consultant-dashboard-v2')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-kpi-section')).toBeInTheDocument();
    });

    expect(screen.getByTestId('consultant-summary-strip')).toBeInTheDocument();
    expect(screen.getByTestId('consultant-dashboard-quick-action-bar')).toBeInTheDocument();
    expect(screen.getByTestId('consultant-dashboard-missing-logs')).toBeInTheDocument();
    expect(screen.getByTestId('missing-consultation-logs-list')).toHaveTextContent('items:1');
    expect(screen.getByTestId('consultant-dashboard-recent-schedules')).toBeInTheDocument();
    expect(screen.getByTestId('consultant-dashboard-upcoming-schedules')).toBeInTheDocument();
    expect(screen.getByTestId('consultant-dashboard-notifications')).toBeInTheDocument();
  });

  test('KPI 4종 및 ListTableView 기반 목록 섹션 렌더', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('주간 상담 건수')).toBeInTheDocument();
      expect(screen.getByText('신규 내담자')).toBeInTheDocument();
      expect(screen.getByText('미확인 메시지')).toBeInTheDocument();
      expect(screen.getByText('작성 대기 일지')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: '일정 등록' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일정 확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내담자 메시지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일지 작성' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정산 확인' })).toBeInTheDocument();
  });

  test('dashboard link SSOT avoids renewal and dashboard-v2 paths', () => {
    expect(CONSULTANT_DASHBOARD_ROUTES.DASHBOARD).toBe('/consultant/dashboard');
    expect(CONSULTANT_DASHBOARD_KPI_ROUTES.UNREAD_MESSAGES).toBe('/consultant/messages');

    const quickPaths = CONSULTANT_DASHBOARD_QUICK_ACTIONS.map((action) => action.path);
    quickPaths.forEach((path) => {
      expect(path).not.toMatch(/dashboard-v2|\/renewal\//);
    });
    expect(quickPaths).toContain('/consultant/schedule');
    expect(quickPaths).toContain('/consultant/consultation-records?filter=incomplete');
    expect(CONSULTANT_DASHBOARD_QUICK_ACTIONS.map((a) => a.id)).not.toContain('create-schedule');
  });

  test('weekly chart uses session statistics buckets (not decorative empty bars)', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-weekly-chart')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetchConsultantSessionStatistics).toHaveBeenCalled();
    });

    expect(document.querySelector('.consultant-dashboard-v2__chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('consultant-dashboard-weekly-summary')).toBeInTheDocument();
    expect(document.querySelector('.empty-state')).not.toBeInTheDocument();
  });

  test('weekly chart empty uses Clinic-OS chart-empty (not legacy empty-state)', async() => {
    mockSessionStats.totalCompleted = 0;
    mockSessionStats.buckets = [];
    fetchConsultantSessionStatistics.mockImplementation(() => Promise.resolve(mockSessionStats));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-weekly-chart')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(document.querySelector('.consultant-dashboard-v2__chart-empty')).toBeInTheDocument();
    });
    expect(document.querySelector('.consultant-dashboard-v2__chart-empty-text')).toBeInTheDocument();
    expect(document.querySelector('.empty-state')).not.toBeInTheDocument();
    expect(document.querySelector('.chart-container')).not.toBeInTheDocument();
  });

  test('일지 작성 opens ConsultationLogModal when incomplete schedules exist', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-incomplete-records-alert')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '일지 작성' }));

    await waitFor(() => {
      expect(screen.getByTestId('consultation-log-modal')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith(
      '/consultant/consultation-records?filter=incomplete'
    );
    expect(mockResolveMissingLogSchedule).not.toHaveBeenCalled();
  });

  test('일지 작성 uses cumulative missing when incompleteRecords empty', async() => {
    mockIncompleteRecords = { count: 0, records: [] };

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-weekly-summary')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('consultant-incomplete-records-alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '일지 작성' }));

    await waitFor(() => {
      expect(mockResolveMissingLogSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          consultantId: 42,
          date: '2026-08-18'
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('consultation-log-modal')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith(
      '/consultant/consultation-records?filter=incomplete'
    );
  });

  test('일지 작성 stays on home with info when no write target', async() => {
    mockIncompleteRecords = { count: 0, records: [] };
    mockCumulativeMissingItems = [];

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-weekly-summary')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '일지 작성' }));

    await waitFor(() => {
      expect(notificationManager.info).toHaveBeenCalledWith('작성할 미작성 일지가 없습니다.');
    });
    expect(mockResolveMissingLogSchedule).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith(
      '/consultant/consultation-records?filter=incomplete'
    );
    expect(screen.queryByTestId('consultation-log-modal')).not.toBeInTheDocument();
  });
});
