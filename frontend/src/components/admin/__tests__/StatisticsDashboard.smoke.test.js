/**
 * StatisticsDashboard — AdminCommonLayout 스모크 테스트 (G-14 Pilot 2).
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key, fallbackOrOpts) => {
    if (typeof fallbackOrOpts === 'string') return fallbackOrOpts;
    if (fallbackOrOpts && typeof fallbackOrOpts === 'object' && fallbackOrOpts.defaultValue) {
      return fallbackOrOpts.defaultValue;
    }
    if (key === 'common:misc.App.t_4938fae0') return '통계';
    if (key === 'common:misc.App.t_505d75b1') return '통계 대시보드';
    if (key === 'admin.actions.refresh') return '새로고침';
    return key;
  };
  return {
    useTranslation: () => ({
      t: stableT,
      i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
    }),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: () => {} }
  };
});

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title, loading }) => (
    <div data-testid="admin-common-layout" data-title={title} data-loading={String(loading)}>
      {children}
    </div>
  )
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn((url) => {
    if (url.includes('overall')) {
      return Promise.resolve({
        data: {
          totalClients: 10,
          totalConsultants: 5,
          totalSessions: 100,
          activeMappings: 8,
          completionRate: 85,
          totalRevenue: 1000000
        }
      });
    }
    if (url.includes('trends')) {
      return Promise.resolve({
        data: {
          clientGrowth: 5,
          consultantGrowth: 2,
          sessionGrowth: 10,
          revenueGrowth: 3
        }
      });
    }
    if (url.includes('chart-data')) {
      return Promise.resolve({
        data: {
          labels: ['1월', '2월'],
          datasets: [{ label: '성장', data: [1, 2] }]
        }
      });
    }
    if (url.includes('recent-activity')) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: {} });
  })
}));

jest.mock('../../../utils/notification', () => ({
  showNotification: jest.fn()
}));

jest.mock('../../common/Chart', () => () => <div data-testid="statistics-chart" />);
jest.mock('../../common/MGButton', () => ({ children, ...rest }) => (
  <button type="button" {...rest}>{children}</button>
));

import { MemoryRouter } from 'react-router-dom';
import StatisticsDashboard from '../StatisticsDashboard';

const renderStatistics = (path = '/admin/statistics') => render(
  <MemoryRouter initialEntries={[path]}>
    <StatisticsDashboard />
  </MemoryRouter>
);

describe('StatisticsDashboard AdminCommonLayout 스모크', () => {
  test('mount 시 AdminCommonLayout title 및 본문 data-testid 렌더', async() => {
    renderStatistics();

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '통계');
    expect(screen.getByTestId('statistics-dashboard-page')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    });
  });

  test('/admin/statistics-dashboard 경로에서 layout title이 통계 대시보드', async() => {
    renderStatistics('/admin/statistics-dashboard');

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', '통계 대시보드');
  });

  test('로드 후 KPI 카드 6종 렌더', async() => {
    renderStatistics();

    await waitFor(() => {
      expect(screen.getByText('총 내담자')).toBeInTheDocument();
      expect(screen.getByText('총 상담사')).toBeInTheDocument();
      expect(screen.getByText('총 상담 세션')).toBeInTheDocument();
      expect(screen.getByText('활성 매칭')).toBeInTheDocument();
      expect(screen.getByText('총 수익')).toBeInTheDocument();
      expect(screen.getByText('성과 지표')).toBeInTheDocument();
    });
  });
});
