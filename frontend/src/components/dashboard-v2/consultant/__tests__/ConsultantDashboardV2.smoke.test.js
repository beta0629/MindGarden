/**
 * Consultant Dashboard V2 — Expo 홈 패리티 · Clinic-OS 스모크
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const MOCK_USER_NAME = '김상담';
const WELCOME_TITLE = `환영합니다, ${MOCK_USER_NAME} 상담사님`;

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

jest.mock('../../../consultant/ConsultationLogModal', () => () => null);
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
    items: [{ consultantId: 42, consultantName: '김상담', missingDates: ['2026-08-18'] }],
    isLoading: false,
    error: null
  })
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { warning: jest.fn(), error: jest.fn(), success: jest.fn() }
}));

jest.mock('../../../../api/consultantSalaryCalculationsClient', () => ({
  loadConsultantSalaryCalculations: jest.fn(() => Promise.resolve({
    items: [{ calculationPeriod: '2026-08', netSalary: 1200000 }],
    source: 'api',
    error: null
  }))
}));

jest.mock('../../../../api/consultantSessionStatisticsClient', () => ({
  fetchConsultantSessionStatistics: jest.fn(() => Promise.resolve({
    totalCompleted: 8,
    previousPeriodTotal: 5,
    buckets: [
      { label: 'W1', value: 3 },
      { label: 'W2', value: 5 }
    ]
  }))
}));

jest.mock('../../../../utils/consultationMessagesApi', () => ({
  getConsultationMessagesListPath: () => '/api/v1/consultation-messages/consultant/42'
}));

const mockStatsResponse = {
  newClients: 1,
  unreadMessages: 2,
  totalToday: 1
};

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (String(url).includes('incomplete-records')) {
        return Promise.resolve({ count: 2, records: [] });
      }
      if (String(url).includes('high-priority-clients')) {
        return Promise.resolve({ clients: [{ clientId: 7, clientName: '긴급내담', sessionNumber: 1, riskLevel: 'HIGH', mainIssue: '이슈' }] });
      }
      if (String(url).includes('upcoming-preparation')) {
        return Promise.resolve({ consultation: null });
      }
      if (String(url).includes('unread-count')) {
        return Promise.resolve({ unreadCount: 3 });
      }
      if (String(url).includes('consultation-messages')) {
        return Promise.resolve([
          {
            senderId: 7,
            senderName: '내담자A',
            receiverId: 42,
            content: '안녕하세요',
            createdAt: '2026-09-01T10:00:00'
          }
        ]);
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

const renderDashboard = () => render(
  <MemoryRouter>
    <ConsultantDashboardV2 user={{ id: 42, name: MOCK_USER_NAME, tenantId: 'tenant-1' }} />
  </MemoryRouter>
);

describe('ConsultantDashboardV2 (Expo home parity)', () => {
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
    expect(screen.getByTestId('consultant-dashboard-action-strip')).toBeInTheDocument();
    expect(screen.getByTestId('consultant-dashboard-missing-logs')).toBeInTheDocument();
    expect(screen.getByTestId('missing-consultation-logs-list')).toHaveTextContent('items:1');
    expect(screen.getByTestId('consultant-dashboard-today-schedules')).toBeInTheDocument();
    expect(screen.getByTestId('consultant-dashboard-snapshot')).toBeInTheDocument();
    expect(screen.getByTestId('consultant-dashboard-session-chart')).toBeInTheDocument();
  });

  test('섹션 순서·라벨: 손볼 일 → KPI → 오늘 스케줄 → 스냅샷 → 회기 추이 → 빠른 액션', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('지금 손볼 일')).toBeInTheDocument();
    });

    expect(screen.getByText('오늘 상담')).toBeInTheDocument();
    expect(screen.getByText('안읽은 메시지')).toBeInTheDocument();
    expect(screen.getByText('신규 내담')).toBeInTheDocument();
    expect(screen.queryByText('주간 상담 건수')).not.toBeInTheDocument();
    expect(screen.queryByText('작성 대기 일지')).not.toBeInTheDocument();
    expect(screen.getByText('오늘의 스케줄')).toBeInTheDocument();
    expect(screen.getByText('완료 회기 추이')).toBeInTheDocument();
    expect(screen.queryByText('최근 일정 (오늘·어제)')).not.toBeInTheDocument();
    expect(screen.queryByText('최근 알림')).not.toBeInTheDocument();
    expect(screen.queryByTestId('consultant-dashboard-notifications')).not.toBeInTheDocument();
    expect(screen.queryByTestId('consultant-dashboard-upcoming-schedules')).not.toBeInTheDocument();
  });

  test('ExpectedVisitsWidget 미렌더', async() => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-kpi-section')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('expected-visits-widget')).not.toBeInTheDocument();
  });

  test('KPI 3종 및 Expo 정렬 빠른 액션', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('오늘 상담')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '일정 추가' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '근무 설정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '메시지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '급여' })).toBeInTheDocument();
  });

  test('session chart renders buckets from session-statistics', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-session-chart')).toBeInTheDocument();
    });

    expect(document.querySelector('.consultant-dashboard-v2__chart-container')).toBeInTheDocument();
    expect(screen.getByText('W1')).toBeInTheDocument();
    expect(screen.getByText('W2')).toBeInTheDocument();
    expect(document.querySelector('.empty-state')).not.toBeInTheDocument();
  });

  test('dashboard link SSOT avoids renewal and dashboard-v2 paths', () => {
    expect(CONSULTANT_DASHBOARD_ROUTES.DASHBOARD).toBe('/consultant/dashboard');
    expect(CONSULTANT_DASHBOARD_KPI_ROUTES.UNREAD_MESSAGES).toBe('/consultant/messages');
    expect(CONSULTANT_DASHBOARD_KPI_ROUTES.TODAY_SESSIONS).toBe('/consultant/schedule');

    const quickPaths = CONSULTANT_DASHBOARD_QUICK_ACTIONS.map((action) => action.path);
    quickPaths.forEach((path) => {
      expect(path).not.toMatch(/dashboard-v2|\/renewal\//);
    });
    expect(quickPaths).toContain('/consultant/schedule');
    expect(quickPaths).toContain('/consultant/availability');
    expect(quickPaths).toContain('/consultant/consultation-records?filter=incomplete');
    expect(quickPaths).toContain('/consultant/salary-settlement');
  });

  test('QuickActionBar is last major section in DOM order', async() => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-quick-action-bar')).toBeInTheDocument();
    });
    const page = screen.getByTestId('consultant-dashboard-v2-page');
    const chart = screen.getByTestId('consultant-dashboard-session-chart');
    const quick = screen.getByTestId('consultant-dashboard-quick-action-bar');
    const position = chart.compareDocumentPosition(quick);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(page.contains(quick)).toBe(true);
  });
});
