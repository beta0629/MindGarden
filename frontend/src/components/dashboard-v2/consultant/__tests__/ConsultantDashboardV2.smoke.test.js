/**
 * ConsultantDashboardV2 — G-14 header dedup · B0KlA · ContentHeader SSOT 스모크 (ROLE-C-02)
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

jest.mock('../../../consultant/ConsultationLogModal', () => () => null);
jest.mock('../../../ui/Icon/Icon', () => () => null);

const mockStatsResponse = {
  newClients: 1,
  unreadMessages: 2,
  weeklyStats: [{ period: '07/01', completedCount: 5 }]
};

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (String(url).includes('incomplete-records')) {
        return Promise.resolve({ count: 2, records: [] });
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

const renderDashboard = () => render(
  <MemoryRouter>
    <ConsultantDashboardV2 user={{ id: 42, name: MOCK_USER_NAME, tenantId: 'tenant-1' }} />
  </MemoryRouter>
);

describe('ConsultantDashboardV2 (ROLE-C-02 PR-C2)', () => {
  beforeEach(() => {
    mockStatsResponse.weeklyStats = [{ period: '07/01', completedCount: 5 }];
  });

  test('G-14: ACL title 생략, ContentHeader welcome SSOT, B0KlA 루트', async() => {
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
    expect(document.querySelector('.mg-v2-ad-b0kla.consultant-dashboard-v2')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-kpi-section')).toBeInTheDocument();
    });

    expect(screen.getByTestId('consultant-dashboard-quick-action-bar')).toBeInTheDocument();
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

    expect(screen.getByRole('button', { name: '상담일지 작성' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일정 조회' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내담자 관리' })).toBeInTheDocument();
  });

  test('weekly chart empty uses B0KlA chart-empty (not legacy empty-state)', async() => {
    mockStatsResponse.weeklyStats = [];

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('consultant-dashboard-weekly-chart')).toBeInTheDocument();
    });

    expect(document.querySelector('.consultant-dashboard-v2__chart-empty')).toBeInTheDocument();
    expect(document.querySelector('.consultant-dashboard-v2__chart-empty-text')).toBeInTheDocument();
    expect(document.querySelector('.empty-state')).not.toBeInTheDocument();
    expect(document.querySelector('.chart-container')).not.toBeInTheDocument();
  });
});
