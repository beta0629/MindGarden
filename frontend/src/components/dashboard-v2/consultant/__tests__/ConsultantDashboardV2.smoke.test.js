/**
 * Consultant Dashboard V2 — Clinic-OS Cover+Chapter 스모크
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const MOCK_USER_NAME = '김상담';

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
    t: (key, opts) => opts?.defaultValue ?? key
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

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
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
  totalToday: 0,
  completedToday: 0,
  inProgressToday: 0,
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

let mockPreparation = { consultation: null };
let mockScheduleList = [];

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (String(url).includes('incomplete-records')) {
        return Promise.resolve(mockIncompleteRecords);
      }
      if (String(url).includes('upcoming-preparation')) {
        return Promise.resolve(mockPreparation);
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
        return Promise.resolve({ schedules: mockScheduleList });
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
import {
  COVER_CHAPTER_CTA_OPEN_SCHEDULE,
  COVER_CHAPTER_CTA_OPEN_CONSULTATION,
  COVER_CHAPTER_CTA_SCHEDULE,
  COVER_CHAPTER_TEST_ID,
  COVER_CHAPTER_NEXT_SHEET_TEST_ID,
  COVER_CHAPTER_WEEKLY_SCHEDULE_LINK
} from '../consultantCoverChapterConstants';
import { fetchConsultantSessionStatistics } from '../../../../api/consultantSessionStatisticsClient';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

const mockApiGet = (url) => {
  const u = String(url);
  if (u.includes('incomplete-records')) {
    return Promise.resolve(mockIncompleteRecords);
  }
  if (u.includes('upcoming-preparation')) {
    return Promise.resolve(mockPreparation);
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
    return Promise.resolve({ schedules: mockScheduleList });
  }
  return Promise.resolve(mockStatsResponse);
};

const renderDashboard = () => render(
  <MemoryRouter>
    <ConsultantDashboardV2 user={{ id: 42, name: MOCK_USER_NAME, tenantId: 'tenant-1' }} />
  </MemoryRouter>
);

describe('ConsultantDashboardV2 Cover+Chapter', () => {
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
    mockPreparation = { consultation: null };
    mockScheduleList = [];
    mockStatsResponse.totalToday = 0;
    mockStatsResponse.completedToday = 0;
    mockStatsResponse.inProgressToday = 0;
    fetchConsultantSessionStatistics.mockImplementation(() => Promise.resolve(mockSessionStats));
    StandardizedApi.get.mockImplementation(mockApiGet);
  });

  test('G-14: ACL title 생략, Cover+Chapter 루트, Clinic-OS 클래스', async() => {
    renderDashboard();

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '');
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute(
      'data-classname',
      'mg-v2-dashboard-layout'
    );

    expect(screen.getByTestId('consultant-dashboard-v2-page')).toBeInTheDocument();
    expect(document.querySelector('.consultant-dashboard-v2.mg-v2-clinic-os')).toBeInTheDocument();
    expect(document.querySelector('.consultant-dashboard-v2--cover-chapter')).toBeInTheDocument();
    expect(screen.getByTestId(COVER_CHAPTER_TEST_ID)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute(
        'id',
        CONSULTANT_DASHBOARD_TITLE_ID
      );
    });

    expect(screen.queryByTestId('consultant-dashboard-quick-action-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('consultant-dashboard-kpi-section')).not.toBeInTheDocument();
    expect(screen.queryByText('직접예약')).not.toBeInTheDocument();
  });

  test('zero next-sheet: Primary 일정 열기 only, 주간 일정 보기 링크', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID)).toHaveAttribute('data-state', 'zero');
    });

    expect(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_SCHEDULE })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COVER_CHAPTER_CTA_OPEN_CONSULTATION })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: COVER_CHAPTER_WEEKLY_SCHEDULE_LINK })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_SCHEDULE }));
    expect(mockNavigate).toHaveBeenCalledWith(CONSULTANT_DASHBOARD_ROUTES.SCHEDULE);
  });

  test('has next-sheet: todaySchedules SSOT (preparation empty) → 상담 열기 + 일정 CTA', async() => {
    // preparation 비어 있어도 오늘 대기 일정이 있으면 has (A 버그 회귀 방지)
    mockPreparation = { consultation: null };
    const start = new Date();
    start.setHours(start.getHours() + 2, 0, 0, 0);
    const end = new Date(start.getTime() + 50 * 60000);
    mockScheduleList = [
      {
        id: 501,
        scheduleId: 501,
        clientId: 9,
        clientName: '남궁민서윤아림정한솔예린',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'PENDING',
        packageName: '개인상담',
        roomName: '3층 상담실 B'
      }
    ];
    mockStatsResponse.totalToday = 1;
    mockStatsResponse.inProgressToday = 1;

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID)).toHaveAttribute('data-state', 'has');
    });

    expect(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_CONSULTATION })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COVER_CHAPTER_CTA_SCHEDULE })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COVER_CHAPTER_CTA_OPEN_SCHEDULE })).not.toBeInTheDocument();
    expect(screen.queryByText('직접예약')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_CONSULTATION }));
    expect(mockNavigate).toHaveBeenCalledWith('/consultant/consultation-record/501');
  });

  test('dashboard link SSOT avoids renewal and dashboard-v2 paths', () => {
    expect(CONSULTANT_DASHBOARD_ROUTES.DASHBOARD).toBe('/consultant/dashboard');
    expect(CONSULTANT_DASHBOARD_KPI_ROUTES.UNREAD_MESSAGES).toBe('/consultant/messages');

    const quickPaths = CONSULTANT_DASHBOARD_QUICK_ACTIONS.map((action) => action.path);
    quickPaths.forEach((path) => {
      expect(path).not.toMatch(/dashboard-v2|\/renewal\//);
    });
    expect(quickPaths).toContain('/consultant/schedule');
  });

  test('schedules uses date-range with startDate/endDate (not full GET /schedules)', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      const dateRangeCalls = StandardizedApi.get.mock.calls.filter(([url]) =>
        String(url).includes('/api/v1/schedules/date-range')
      );
      expect(dateRangeCalls.length).toBeGreaterThanOrEqual(1);
      expect(dateRangeCalls[0][1]).toEqual(expect.objectContaining({
        userId: 42,
        userRole: 'CONSULTANT',
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      }));
    });

    const fullScheduleCalls = StandardizedApi.get.mock.calls.filter(([url]) => {
      const u = String(url);
      if (u.includes('/date-range') || u.includes('/upcoming') || u.includes('/today')
          || u.includes('incomplete') || u.includes('high-priority')
          || u.includes('upcoming-preparation') || u.includes('consultants/')) {
        return false;
      }
      return u === '/api/v1/schedules' || (u.endsWith('/schedules') && !u.includes('date'));
    });
    expect(fullScheduleCalls).toHaveLength(0);
  });

  test('same mount calls schedules date-range only once (in-flight guard)', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId(COVER_CHAPTER_TEST_ID)).toBeInTheDocument();
    });

    await waitFor(() => {
      const dateRangeCalls = StandardizedApi.get.mock.calls.filter(([url]) =>
        String(url).includes('/api/v1/schedules/date-range')
      );
      expect(dateRangeCalls).toHaveLength(1);
    });
  });

  test('unread-count does not attach unconditional Date.now _t cache buster', async() => {
    renderDashboard();

    await waitFor(() => {
      const unreadCalls = StandardizedApi.get.mock.calls.filter(([url]) =>
        String(url).includes('unread-count')
      );
      expect(unreadCalls.length).toBeGreaterThanOrEqual(1);
    });

    const unreadCalls = StandardizedApi.get.mock.calls.filter(([url]) =>
      String(url).includes('unread-count')
    );
    unreadCalls.forEach(([, params]) => {
      expect(params).not.toHaveProperty('_t');
    });
  });

  test('guide shows incomplete hint; click opens consultation log modal', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/미작성 일지 2건/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('안내 더보기'));

    await waitFor(() => {
      expect(screen.getByTestId('consultation-log-modal')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith(CONSULTANT_DASHBOARD_ROUTES.NOTIFICATIONS);
  });
});

