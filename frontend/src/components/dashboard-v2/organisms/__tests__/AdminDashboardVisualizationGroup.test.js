/**
 * AdminDashboardVisualizationGroup — 기간 시각화 v2 스모크
 *
 * - 기간 pill 4종
 * - 예약/완료 차트 2시리즈 + MoM/목표 KPI
 * - empty / loading 경로
 * - V3 index 툴팁 interaction
 *
 * @author CoreSolution
 * @since 2026-07-28
 */

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DASHBOARD_CHART_PERIOD } from '../../utils/dashboardChartPeriodUtils';

const chartCalls = [];

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, options) => {
      const map = {
        'admin:dashboard.v2.period.daily': '일간',
        'admin:dashboard.v2.period.weekly': '주간',
        'admin:dashboard.v2.period.monthly': '월간',
        'admin:dashboard.v2.period.yearly': '년간',
        'admin:dashboard.v2.viz.periodGroupLabel': '통계 기간 선택',
        'admin:dashboard.v2.viz.stackedBarTitle': '상담 현황',
        'admin:dashboard.v2.viz.multiLineTitle': '추이 비교',
        'admin:dashboard.v2.viz.subtitleDaily': '최근 14일',
        'admin:dashboard.v2.viz.subtitleWeekly': '최근 6주',
        'admin:dashboard.v2.viz.subtitleMonthly': '최근 6개월',
        'admin:dashboard.v2.viz.subtitleYearly': '최근 5년',
        'admin:dashboard.v2.viz.emptyPeriod': '해당 기간의 데이터가 없습니다',
        'admin:dashboard.v2.viz.seriesBooked': '예약',
        'admin:dashboard.v2.viz.seriesCompleted': '완료',
        'admin:dashboard.v2.viz.countUnit': '건',
        'admin:dashboard.v2.viz.previousDaily': '전일',
        'admin:dashboard.v2.viz.previousWeekly': '전주',
        'admin:dashboard.v2.viz.previousMonthly': '지난달',
        'admin:dashboard.v2.viz.previousYearly': '전년',
        'admin:dashboard.v2.viz.growthFromZero': '▲ 신규',
        'admin:dashboard.v2.viz.growthVsPrevious': '{{previous}} 대비 {{badge}}',
        'admin:dashboard.v2.viz.growthSeriesVsPrevious': '{{series}} {{previous}} 대비 {{badge}}',
        'admin:dashboard.v2.viz.growthBadgesGroupLabel': '전기간 대비 증감',
        'admin:dashboard.v2.viz.targetTitle': '목표 달성률 (완료 기준)',
        'admin:dashboard.v2.viz.targetAchieved': '목표 달성',
        'admin:dashboard.v2.viz.targetInProgress': '{{percent}}% 진행',
        'admin:dashboard.v2.viz.targetMeta': '{{actual}}{{unit}} / 목표 {{target}}{{unit}}',
        'common:dashboard-v2.AdminDashboardV2.t_01c7a211': '시각화 그룹'
      };
      let text = map[key] || key;
      if (options && typeof options === 'object') {
        Object.keys(options).forEach((optKey) => {
          text = text.replace(
            new RegExp(`\\{\\{${optKey}\\}\\}`, 'g'),
            String(options[optKey])
          );
        });
      }
      return text;
    }
  })
}));

jest.mock('../../../../utils/resolveCssColorVarToHex', () => ({
  __esModule: true,
  resolveCssColorVarToHex: (_varName, fallback) => fallback || 'var(--fallback)'
}));

jest.mock('../../../common/Chart', () => {
  const ReactActual = require('react');
  return function MockChart(props) {
    chartCalls.push(props);
    return ReactActual.createElement('div', {
      'data-testid': `mock-chart-${props.type}`,
      'data-datasets': String(props.data?.datasets?.length || 0)
    });
  };
});

jest.mock('../../../common/MGButton', () => {
  const ReactActual = require('react');
  return function MockMGButton({
    children,
    className,
    onClick,
    type = 'button',
    loadingText: _loadingText,
    preventDoubleClick: _preventDoubleClick,
    ...rest
  }) {
    return ReactActual.createElement(
      'button',
      { type, className, onClick, ...rest },
      children
    );
  };
});

jest.mock('../../../common/StatusBadge', () => {
  const ReactActual = require('react');
  return function MockStatusBadge({ children, variant, className, ...rest }) {
    return ReactActual.createElement(
      'span',
      {
        'data-testid': rest['data-testid'] || 'status-badge',
        'data-variant': variant,
        'data-tone': rest['data-tone'],
        'data-kind': rest['data-kind'],
        className,
        role: 'status'
      },
      children
    );
  };
});

jest.mock('../../../ui/Icon/Icon', () => {
  const ReactActual = require('react');
  return function MockIcon({ name }) {
    return ReactActual.createElement('span', { 'data-testid': `icon-${name}` });
  };
});

import AdminDashboardVisualizationGroup from '../AdminDashboardVisualizationGroup';
import { CHART_TYPES } from '../../../../constants/charts';

const sampleStats = {
  dailyData: [
    { period: '07/01', bookedCount: 1, inProgressCount: 0, completedCount: 1 },
    { period: '07/02', bookedCount: 2, inProgressCount: 1, completedCount: 0 }
  ],
  weeklyData: [
    { period: '07/07', bookedCount: 3, inProgressCount: 1, completedCount: 2 }
  ],
  monthlyData: [
    { period: '2026-06', bookedCount: 4, inProgressCount: 2, completedCount: 3 },
    { period: '2026-07', bookedCount: 5, inProgressCount: 1, completedCount: 4 }
  ],
  yearlyData: [
    { period: '2025', bookedCount: 10, inProgressCount: 2, completedCount: 8 },
    { period: '2026', bookedCount: 12, inProgressCount: 3, completedCount: 9 }
  ]
};

const emptyStats = {
  dailyData: [
    { period: '07/01', bookedCount: 0, inProgressCount: 0, completedCount: 0 }
  ],
  weeklyData: [
    { period: '07/07', bookedCount: 0, inProgressCount: 0, completedCount: 0 }
  ],
  monthlyData: [
    { period: '2026-07', bookedCount: 0, inProgressCount: 0, completedCount: 0 }
  ],
  yearlyData: [
    { period: '2026', bookedCount: 0, inProgressCount: 0, completedCount: 0 }
  ]
};

describe('AdminDashboardVisualizationGroup', () => {
  beforeEach(() => {
    chartCalls.length = 0;
  });

  test('기간 pill 4종(일/주/월/년)을 렌더한다', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );
    const group = screen.getByRole('group', { name: '통계 기간 선택' });
    expect(within(group).getByText('일간')).toBeInTheDocument();
    expect(within(group).getByText('주간')).toBeInTheDocument();
    expect(within(group).getByText('월간')).toBeInTheDocument();
    expect(within(group).getByText('년간')).toBeInTheDocument();
  });

  test('데이터 있을 때 예약/완료 2시리즈 차트와 MoM·목표 KPI를 렌더한다', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );

    expect(screen.getByTestId(`mock-chart-${CHART_TYPES.BAR}`)).toHaveAttribute(
      'data-datasets',
      '2'
    );
    expect(screen.getByTestId(`mock-chart-${CHART_TYPES.LINE}`)).toHaveAttribute(
      'data-datasets',
      '2'
    );
    expect(screen.getByTestId('viz-kpi-card-booked')).toBeInTheDocument();
    expect(screen.getByTestId('viz-kpi-card-completed')).toBeInTheDocument();
    expect(screen.getByTestId('viz-kpi-card-target')).toBeInTheDocument();
    expect(screen.queryByTestId('viz-kpi-card-inProgress')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kpi-sparkline')).not.toBeInTheDocument();

    const bookedGrowth = screen.getByTestId('viz-kpi-card-booked-growth');
    const completedGrowth = screen.getByTestId('viz-kpi-card-completed-growth');
    expect(bookedGrowth).toBeInTheDocument();
    expect(completedGrowth).toBeInTheDocument();
    expect(bookedGrowth).toHaveAttribute('data-variant', 'success');
    expect(bookedGrowth).toHaveAttribute('data-tone', 'up');
    expect(bookedGrowth).toHaveTextContent('▲ 25%');
    expect(completedGrowth).toHaveAttribute('data-variant', 'success');
    expect(completedGrowth).toHaveTextContent('▲ 33%');
    expect(screen.getByText('지난달 4건')).toBeInTheDocument();
    expect(screen.getByTestId('viz-target-progress')).toBeInTheDocument();
  });

  test('상담 현황 차트 카드 제목 옆에 지난달 대비 예약·완료 증감 배지를 노출한다', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );

    const stackedCard = screen.getByTestId('viz-stacked-bar-card');
    expect(within(stackedCard).getByTestId('viz-stacked-bar-growth-badges')).toBeInTheDocument();

    const bookedBadge = within(stackedCard).getByTestId('viz-stacked-bar-growth-booked');
    const completedBadge = within(stackedCard).getByTestId('viz-stacked-bar-growth-completed');
    expect(bookedBadge).toHaveAttribute('data-variant', 'success');
    expect(bookedBadge).toHaveAttribute('data-tone', 'up');
    expect(bookedBadge).toHaveTextContent('예약 지난달 대비 ▲ 25%');
    expect(completedBadge).toHaveAttribute('data-variant', 'success');
    expect(completedBadge).toHaveTextContent('완료 지난달 대비 ▲ 33%');

    const multiCard = screen.getByTestId('viz-multi-line-card');
    expect(within(multiCard).getByTestId('viz-multi-line-growth-completed'))
      .toHaveTextContent('완료 지난달 대비 ▲ 33%');
  });

  test('6개월 버킷·직전 완료값>0이면 상담 현황 카드에 증감 배지가 나온다', () => {
    const sixMonthStats = {
      ...sampleStats,
      monthlyData: [
        { period: '2026-02', bookedCount: 0, inProgressCount: 0, completedCount: 0 },
        { period: '2026-03', bookedCount: 0, inProgressCount: 0, completedCount: 0 },
        { period: '2026-04', bookedCount: 0, inProgressCount: 0, completedCount: 42 },
        { period: '2026-05', bookedCount: 1, inProgressCount: 0, completedCount: 52 },
        { period: '2026-06', bookedCount: 0, inProgressCount: 0, completedCount: 59 },
        { period: '2026-07', bookedCount: 8, inProgressCount: 0, completedCount: 63 }
      ]
    };
    render(
      <AdminDashboardVisualizationGroup consultationStats={sixMonthStats} loading={false} />
    );
    const stackedCard = screen.getByTestId('viz-stacked-bar-card');
    const completedBadge = within(stackedCard).getByTestId('viz-stacked-bar-growth-completed');
    expect(completedBadge).toHaveAttribute('data-tone', 'up');
    expect(completedBadge).toHaveTextContent('완료 지난달 대비 ▲ 7%');
    const bookedBadge = within(stackedCard).getByTestId('viz-stacked-bar-growth-booked');
    expect(bookedBadge).toHaveAttribute('data-kind', 'fromZero');
    expect(bookedBadge).toHaveTextContent('예약 지난달 대비 ▲ 신규');
  });

  test('전기간 0·현재 증가 시 ▲ 신규 배지를 success로 노출한다', () => {
    const fromZeroStats = {
      ...sampleStats,
      monthlyData: [
        { period: '2026-06', bookedCount: 0, inProgressCount: 0, completedCount: 0 },
        { period: '2026-07', bookedCount: 5, inProgressCount: 0, completedCount: 3 }
      ]
    };
    render(
      <AdminDashboardVisualizationGroup consultationStats={fromZeroStats} loading={false} />
    );
    const bookedGrowth = screen.getByTestId('viz-kpi-card-booked-growth');
    expect(bookedGrowth).toHaveAttribute('data-variant', 'success');
    expect(bookedGrowth).toHaveAttribute('data-kind', 'fromZero');
    expect(bookedGrowth).toHaveTextContent('▲ 신규');
  });

  test('감소 시 danger 배지, 동일 시 neutral 배지를 노출한다', () => {
    const downFlatStats = {
      ...sampleStats,
      monthlyData: [
        { period: '2026-06', bookedCount: 10, inProgressCount: 0, completedCount: 8 },
        { period: '2026-07', bookedCount: 5, inProgressCount: 0, completedCount: 8 }
      ]
    };
    render(
      <AdminDashboardVisualizationGroup consultationStats={downFlatStats} loading={false} />
    );
    const bookedGrowth = screen.getByTestId('viz-kpi-card-booked-growth');
    const completedGrowth = screen.getByTestId('viz-kpi-card-completed-growth');
    expect(bookedGrowth).toHaveAttribute('data-variant', 'danger');
    expect(bookedGrowth).toHaveAttribute('data-tone', 'down');
    expect(bookedGrowth).toHaveTextContent('▼ 50%');
    expect(completedGrowth).toHaveAttribute('data-variant', 'neutral');
    expect(completedGrowth).toHaveAttribute('data-tone', 'flat');
    expect(completedGrowth).toHaveTextContent('- 0%');
  });

  test('버킷 1개·previous API 없으면 MoM 배지를 숨긴다', () => {
    const singleBucketStats = {
      ...sampleStats,
      monthlyData: [
        { period: '2026-07', bookedCount: 5, inProgressCount: 0, completedCount: 4 }
      ]
    };
    render(
      <AdminDashboardVisualizationGroup consultationStats={singleBucketStats} loading={false} />
    );
    expect(screen.queryByTestId('viz-kpi-card-booked-growth')).not.toBeInTheDocument();
    expect(screen.queryByTestId('viz-kpi-card-completed-growth')).not.toBeInTheDocument();
    expect(screen.queryByTestId('viz-stacked-bar-growth-badges')).not.toBeInTheDocument();
    expect(screen.queryByTestId('viz-stacked-bar-growth-booked')).not.toBeInTheDocument();
    expect(screen.queryByTestId('viz-stacked-bar-growth-completed')).not.toBeInTheDocument();
  });

  test('차트 카드 감소 배지는 danger·상담 현황 제목 옆에 노출한다', () => {
    const downStats = {
      ...sampleStats,
      monthlyData: [
        { period: '2026-06', bookedCount: 10, inProgressCount: 0, completedCount: 80 },
        { period: '2026-07', bookedCount: 5, inProgressCount: 0, completedCount: 40 }
      ]
    };
    render(
      <AdminDashboardVisualizationGroup consultationStats={downStats} loading={false} />
    );
    const stackedCard = screen.getByTestId('viz-stacked-bar-card');
    const completedBadge = within(stackedCard).getByTestId('viz-stacked-bar-growth-completed');
    expect(completedBadge).toHaveAttribute('data-variant', 'danger');
    expect(completedBadge).toHaveAttribute('data-tone', 'down');
    expect(completedBadge).toHaveTextContent('완료 지난달 대비 ▼ 50%');
  });

  test('V3 라인 차트는 index 모드 동시 툴팁을 사용한다', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );
    const lineCall = chartCalls.find((c) => c.type === CHART_TYPES.LINE);
    expect(lineCall).toBeTruthy();
    expect(lineCall.options.interaction).toEqual({ mode: 'index', intersect: false });
    expect(lineCall.options.plugins.tooltip.mode).toBe('index');
    expect(lineCall.options.plugins.tooltip.intersect).toBe(false);
  });

  test('기간 전환 시 다른 소스 데이터를 사용한다', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );
    fireEvent.click(screen.getByText('일간'));
    const lineAfterDaily = [...chartCalls]
      .reverse()
      .find((c) => c.type === CHART_TYPES.LINE);
    expect(lineAfterDaily.data.datasets[0].data).toEqual([1, 2]);

    fireEvent.click(screen.getByText('년간'));
    const lineAfterYearly = [...chartCalls]
      .reverse()
      .find((c) => c.type === CHART_TYPES.LINE);
    expect(lineAfterYearly.data.datasets[0].data).toEqual([10, 12]);
    expect(DASHBOARD_CHART_PERIOD.YEARLY).toBe('yearly');
  });

  test('empty 경로: 바·라인 empty 카드 2개', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={emptyStats} loading={false} />
    );
    const empties = screen.getAllByTestId('viz-chart-empty');
    expect(empties.length).toBe(2);
    empties.forEach((node) => {
      expect(within(node).getByTestId('icon-BAR_CHART_3')).toBeInTheDocument();
      expect(within(node).getByText('해당 기간의 데이터가 없습니다')).toBeInTheDocument();
    });
    expect(screen.queryByTestId(`mock-chart-${CHART_TYPES.BAR}`)).not.toBeInTheDocument();
  });

  test('loading 경로: 차트·KPI skeleton', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading />
    );
    expect(screen.getByTestId('viz-kpi-skeleton')).toBeInTheDocument();
    expect(document.querySelectorAll('.mg-v2-skeleton').length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByTestId(`mock-chart-${CHART_TYPES.BAR}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId('viz-kpi-card-booked')).not.toBeInTheDocument();
  });
});
