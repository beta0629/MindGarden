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
        'admin:dashboard.v2.viz.subtitleMonthly': '최근 12개월',
        'admin:dashboard.v2.viz.subtitleYearly': '최근 5년',
        'admin:dashboard.v2.viz.subtitleTrendDaily': '최근 14일 추이',
        'admin:dashboard.v2.viz.subtitleTrendWeekly': '최근 6주 추이',
        'admin:dashboard.v2.viz.subtitleTrendMonthly': '최근 12개월 추이',
        'admin:dashboard.v2.viz.subtitleTrendYearly': '최근 5년 추이',
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
        'admin:dashboard.v2.viz.targetGoal.title': '목표 설정',
        'admin:dashboard.v2.viz.targetGoal.settingsAria': '목표 설정',
        'admin:dashboard.v2.viz.targetGoal.currentTarget': '현재 목표: {{count}}{{unit}}',
        'admin:dashboard.v2.viz.targetGoal.preset': '프리셋 선택',
        'admin:dashboard.v2.viz.targetGoal.quickAdd': '빠른 가산 (현재 입력값 기준)',
        'admin:dashboard.v2.viz.targetGoal.directInput': '직접 입력',
        'admin:dashboard.v2.viz.targetGoal.save': '저장',
        'admin:dashboard.v2.viz.targetGoal.cancel': '취소',
        'admin:dashboard.v2.viz.targetGoal.presetBtn': '{{count}}{{unit}}',
        'admin:dashboard.v2.viz.targetGoal.quickAddBtn': '+{{percent}}% ({{count}}{{unit}})',
        'admin:dashboard.v2.viz.targetGoal.errorEmpty': '목표 건수를 입력해주세요.',
        'admin:dashboard.v2.viz.targetGoal.errorMin': '목표는 1건 이상이어야 합니다.',
        'admin:dashboard.v2.viz.targetGoal.errorMax': '목표는 {{max}}건 이하여야 합니다.',
        'common:actions.close': '닫기',
        'action.close': '닫기',
        'admin:dashboard.v2.viz.newClientsTitle': '신규 내담자 유입',
        'admin:dashboard.v2.viz.newClientsSubtitle': '최근 12개월 신규 등록',
        'admin:dashboard.v2.viz.totalClientsLabel': '총 내담자 현황',
        'admin:dashboard.v2.viz.newClientsCountUnit': '명',
        'admin:dashboard.v2.viz.emptyInflowPeriod': '해당 기간에 집계된 데이터가 없습니다.',
        'admin:dashboard.v2.viz.dowTitle': '요일별 상담 건수',
        'admin:dashboard.v2.viz.dowSubtitle': '최근 12개월 요일별 합계',
        'admin:dashboard.v2.viz.dowPeakBadge': '최다 · {{count}}건',
        'admin:dashboard.v2.viz.dowPeakGroupLabel': '최다 요일',
        'admin:dashboard.v2.viz.dowShort.mon': '월',
        'admin:dashboard.v2.viz.dowShort.tue': '화',
        'admin:dashboard.v2.viz.dowShort.wed': '수',
        'admin:dashboard.v2.viz.dowShort.thu': '목',
        'admin:dashboard.v2.viz.dowShort.fri': '금',
        'admin:dashboard.v2.viz.dowShort.sat': '토',
        'admin:dashboard.v2.viz.dowShort.sun': '일',
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

jest.mock('../../utils/chartBarValueLabelPlugin', () => ({
  __esModule: true,
  ensureMgVizBarValueLabelsPlugin: jest.fn(),
  MG_VIZ_BAR_VALUE_LABELS_PLUGIN_ID: 'mgVizBarValueLabels'
}));

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
  return function MockIcon({ name, ...rest }) {
    return ReactActual.createElement('span', {
      'data-testid': `icon-${name}`,
      'aria-hidden': rest['aria-hidden'],
      'aria-label': rest['aria-label']
    });
  };
});

jest.mock('../../../common/modals/UnifiedModal', () => {
  const ReactActual = require('react');
  return function MockUnifiedModal({
    isOpen,
    children,
    actions,
    title,
    onClose: _onClose,
    ...rest
  }) {
    if (!isOpen) {
      return null;
    }
    return ReactActual.createElement(
      'div',
      {
        role: 'dialog',
        'data-testid': rest['data-testid'] || 'unified-modal',
        className: rest.className
      },
      ReactActual.createElement('h2', null, title),
      children,
      actions
        ? ReactActual.createElement('div', { 'data-testid': 'viz-target-goal-actions' }, actions)
        : null
    );
  };
});


import AdminDashboardVisualizationGroup from '../AdminDashboardVisualizationGroup';
import { CHART_TYPES, DASHBOARD_VIZ_TARGET_MODES } from '../../../../constants/charts';
import { buildVizTargetStorageKey } from '../../utils/dashboardVizTargetStorage';

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
  const originalSessionManager = window.sessionManager;

  beforeEach(() => {
    chartCalls.length = 0;
    localStorage.clear();
    window.sessionManager = {
      getUser: () => ({ id: 'user-1', tenantId: 'tenant-test' })
    };
  });

  afterAll(() => {
    window.sessionManager = originalSessionManager;
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

    const stackedCard = screen.getByTestId('viz-stacked-bar-card');
    expect(within(stackedCard).getByTestId(`mock-chart-${CHART_TYPES.BAR}`)).toHaveAttribute(
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
    expect(bookedGrowth).toHaveAttribute('data-variant', 'danger');
    expect(bookedGrowth).toHaveAttribute('data-tone', 'up');
    expect(bookedGrowth).toHaveTextContent('▲ 25%');
    expect(completedGrowth).toHaveAttribute('data-variant', 'danger');
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
    expect(bookedBadge).toHaveAttribute('data-variant', 'danger');
    expect(bookedBadge).toHaveAttribute('data-tone', 'up');
    expect(bookedBadge).toHaveTextContent('예약 지난달 대비 ▲ 25%');
    expect(completedBadge).toHaveAttribute('data-variant', 'danger');
    expect(completedBadge).toHaveTextContent('완료 지난달 대비 ▲ 33%');

    const multiCard = screen.getByTestId('viz-multi-line-card');
    expect(within(multiCard).getByTestId('viz-multi-line-growth-completed'))
      .toHaveTextContent('완료 지난달 대비 ▲ 33%');
  });

  test('월간 버킷·직전 완료값>0이면 상담 현황 카드에 증감 배지가 나온다', () => {
    const twelveMonthStats = {
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
      <AdminDashboardVisualizationGroup consultationStats={twelveMonthStats} loading={false} />
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

  test('감소 시 neutral(teal CSS)·동일 시 neutral 배지를 노출한다', () => {
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
    expect(bookedGrowth).toHaveAttribute('data-variant', 'neutral');
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

  test('차트 카드 감소 배지는 neutral(teal)·상담 현황 제목 옆에 노출한다', () => {
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
    expect(completedBadge).toHaveAttribute('data-variant', 'neutral');
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

  test('추이 비교·상담 현황 Y축 max는 dataMax*1.1 자동 상한(고정 64 없음)', () => {
    const highStats = {
      ...sampleStats,
      monthlyData: [
        { period: '2026-02', bookedCount: 10, inProgressCount: 0, completedCount: 40 },
        { period: '2026-03', bookedCount: 12, inProgressCount: 0, completedCount: 45 },
        { period: '2026-04', bookedCount: 8, inProgressCount: 0, completedCount: 50 },
        { period: '2026-05', bookedCount: 15, inProgressCount: 0, completedCount: 55 },
        { period: '2026-06', bookedCount: 20, inProgressCount: 0, completedCount: 59 },
        { period: '2026-07', bookedCount: 25, inProgressCount: 0, completedCount: 63 }
      ]
    };
    render(
      <AdminDashboardVisualizationGroup consultationStats={highStats} loading={false} />
    );
    const lineCall = chartCalls.find((c) => c.type === CHART_TYPES.LINE);
    const barCall = chartCalls.find(
      (c) => c.type === CHART_TYPES.BAR && c.data?.datasets?.length === 2
    );
    // line max series = 63 → ceil(63*1.1)=70
    expect(lineCall.options.scales.y.max).toBe(70);
    expect(lineCall.options.scales.y.max).toBeGreaterThan(64);
    expect(lineCall.options.scales.y.suggestedMax).toBeUndefined();
    // stacked max = 25+63=88 → ceil(88*1.1)=97
    expect(barCall.options.scales.y.max).toBe(97);
    expect(barCall.options.scales.y.suggestedMax).toBeUndefined();
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

  test('empty 경로: V2/V3/유입/요일 empty 4개 (A/B props 없음)', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={emptyStats} loading={false} />
    );
    const empties = screen.getAllByTestId('viz-chart-empty');
    expect(empties.length).toBe(4);
    empties.forEach((node) => {
      expect(within(node).getByTestId('icon-BAR_CHART_3')).toBeInTheDocument();
    });
    expect(screen.getByTestId('viz-new-clients-card')).toBeInTheDocument();
    expect(screen.getByTestId('viz-dow-card')).toBeInTheDocument();
  });

  test('요일 Zero: items 있으면 축 유지(차트 렌더)·피크 배지 숨김', () => {
    const zeroDow = {
      items: [
        { dayOfWeek: 1, label: '월요일', count: 0 },
        { dayOfWeek: 2, label: '화요일', count: 0 },
        { dayOfWeek: 3, label: '수요일', count: 0 },
        { dayOfWeek: 4, label: '목요일', count: 0 },
        { dayOfWeek: 5, label: '금요일', count: 0 },
        { dayOfWeek: 6, label: '토요일', count: 0 },
        { dayOfWeek: 7, label: '일요일', count: 0 }
      ],
      peakDayOfWeek: null,
      peakCount: null
    };
    render(
      <AdminDashboardVisualizationGroup
        consultationStats={sampleStats}
        loading={false}
        consultationsByDow={zeroDow}
      />
    );
    expect(within(screen.getByTestId('viz-dow-card'))
      .getByTestId(`mock-chart-${CHART_TYPES.BAR}`)).toBeInTheDocument();
    expect(screen.queryByTestId('viz-dow-peak-badge')).not.toBeInTheDocument();
  });

  test('loading 경로: 차트·KPI skeleton', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading />
    );
    expect(screen.getByTestId('viz-kpi-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('viz-total-clients-skeleton')).toBeInTheDocument();
    expect(document.querySelectorAll('.mg-v2-skeleton').length).toBeGreaterThanOrEqual(5);
    expect(screen.queryByTestId(`mock-chart-${CHART_TYPES.BAR}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId('viz-kpi-card-booked')).not.toBeInTheDocument();
    expect(screen.queryByTestId('viz-total-clients-value')).not.toBeInTheDocument();
    expect(screen.getByTestId('viz-total-clients-kpi')).toHaveTextContent('총 내담자 현황');
  });

  test('총 내담자 KPI: totalClients 큰 숫자·단위·0 표시', () => {
    const { rerender } = render(
      <AdminDashboardVisualizationGroup
        consultationStats={sampleStats}
        loading={false}
        totalClients={1204}
      />
    );

    expect(screen.getByTestId('viz-total-clients-kpi')).toHaveTextContent('총 내담자 현황');
    expect(screen.getByTestId('viz-total-clients-value')).toHaveTextContent('1,204');
    expect(screen.getByTestId('viz-total-clients-kpi')).toHaveTextContent('명');
    expect(screen.queryByTestId('viz-total-clients-skeleton')).not.toBeInTheDocument();

    rerender(
      <AdminDashboardVisualizationGroup
        consultationStats={sampleStats}
        loading={false}
        totalClients={0}
      />
    );
    expect(screen.getByTestId('viz-total-clients-value')).toHaveTextContent('0');
    expect(screen.getByTestId('viz-total-clients-kpi')).toHaveTextContent('명');
  });

  test('A/B 카드: 신규 유입 막대·요일 피크 배지·수치 라벨 옵션', () => {
    const newClientStats = {
      items: [
        { period: '2026-05', newClientCount: 10, growthRate: null },
        { period: '2026-06', newClientCount: 20, growthRate: 100 },
        { period: '2026-07', newClientCount: 25, growthRate: 25 }
      ],
      growthRate: 25
    };
    const consultationsByDow = {
      items: [
        { dayOfWeek: 1, label: '월요일', count: 12 },
        { dayOfWeek: 2, label: '화요일', count: 18 },
        { dayOfWeek: 3, label: '수요일', count: 32 },
        { dayOfWeek: 4, label: '목요일', count: 5 },
        { dayOfWeek: 5, label: '금요일', count: 8 },
        { dayOfWeek: 6, label: '토요일', count: 2 },
        { dayOfWeek: 7, label: '일요일', count: 1 }
      ],
      peakDayOfWeek: 3,
      peakCount: 32
    };

    render(
      <AdminDashboardVisualizationGroup
        consultationStats={sampleStats}
        loading={false}
        newClientStats={newClientStats}
        consultationsByDow={consultationsByDow}
        totalClients={1204}
      />
    );

    expect(screen.getByTestId('viz-inflow-dow-grid')).toBeInTheDocument();
    expect(screen.getByTestId('viz-new-clients-card')).toBeInTheDocument();
    expect(screen.getByTestId('viz-dow-card')).toBeInTheDocument();
    expect(screen.getByText('신규 내담자 유입')).toBeInTheDocument();
    expect(screen.getByText('요일별 상담 건수')).toBeInTheDocument();
    expect(screen.getByTestId('viz-dow-peak-badge')).toHaveTextContent('수요일');
    expect(screen.getByTestId('viz-dow-peak-badge')).toHaveTextContent('최다 · 32건');
    expect(screen.getByTestId('viz-new-clients-growth')).toHaveTextContent('지난달 대비 ▲ 25%');
    expect(screen.getByTestId('viz-total-clients-value')).toHaveTextContent('1,204');
    expect(screen.getByTestId('viz-total-clients-kpi')).toHaveTextContent('총 내담자 현황');

    const barCharts = screen.getAllByTestId(`mock-chart-${CHART_TYPES.BAR}`);
    expect(barCharts.length).toBeGreaterThanOrEqual(3);

    const dowCall = chartCalls.find(
      (call) => call?.options?.plugins?.mgVizBarValueLabels?.peakIndex === 2
    );
    expect(dowCall).toBeTruthy();
    expect(dowCall.options.plugins.mgVizBarValueLabels.enabled).toBe(true);
    expect(dowCall.data.datasets[0].data[2]).toBe(32);
  });

  test('목표 설정 트리거·UnifiedModal 열림', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );
    const settingsBtn = screen.getByTestId('viz-target-goal-settings');
    expect(settingsBtn).toHaveAttribute('aria-label', '목표 설정');
    expect(screen.queryByTestId('viz-target-goal-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('viz-target-settings-popover')).not.toBeInTheDocument();

    fireEvent.click(settingsBtn);
    expect(screen.getByTestId('viz-target-goal-modal')).toBeInTheDocument();
    expect(screen.getByText('프리셋 선택')).toBeInTheDocument();
    expect(screen.getByText('빠른 가산 (현재 입력값 기준)')).toBeInTheDocument();
    expect(screen.getByText('직접 입력')).toBeInTheDocument();
    expect(screen.getByTestId('viz-target-goal-current')).toHaveTextContent('현재 목표: 100건');
  });

  test('목표 프리셋 선택 후 저장 시 preset 모드·모달 닫힘·달성률 재계산', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );

    const targetCard = screen.getByTestId('viz-kpi-card-target');
    expect(targetCard).toHaveTextContent('4%');
    expect(targetCard).toHaveTextContent('4건 / 목표 100건');

    fireEvent.click(screen.getByTestId('viz-target-goal-settings'));
    fireEvent.click(screen.getByRole('radio', { name: '50건' }));
    fireEvent.click(screen.getByTestId('viz-target-goal-save'));

    expect(screen.queryByTestId('viz-target-goal-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('viz-kpi-card-target')).toHaveTextContent('8%');
    expect(screen.getByTestId('viz-kpi-card-target')).toHaveTextContent('4건 / 목표 50건');

    const storageKey = buildVizTargetStorageKey({
      tenantId: 'tenant-test',
      userId: 'user-1'
    });
    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored.mode).toBe(DASHBOARD_VIZ_TARGET_MODES.PRESET);
    expect(stored.targetCompleted).toBe(50);
  });

  test('빠른 가산 +10%/+20%는 현재 입력값 기준·custom 저장', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );

    fireEvent.click(screen.getByTestId('viz-target-goal-settings'));
    // 현재 입력 100 → +10% = 110
    expect(screen.getByTestId('viz-target-goal-quick-plus10')).toHaveTextContent('+10% (110건)');
    expect(screen.getByTestId('viz-target-goal-quick-plus20')).toHaveTextContent('+20% (120건)');
    fireEvent.click(screen.getByTestId('viz-target-goal-quick-plus10'));
    expect(screen.getByTestId('viz-target-goal-input')).toHaveValue(110);
    fireEvent.click(screen.getByTestId('viz-target-goal-save'));

    expect(screen.queryByTestId('viz-target-goal-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('viz-kpi-card-target')).toHaveTextContent('4건 / 목표 110건');

    const storageKey = buildVizTargetStorageKey({
      tenantId: 'tenant-test',
      userId: 'user-1'
    });
    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored.mode).toBe(DASHBOARD_VIZ_TARGET_MODES.CUSTOM);
    expect(stored.targetCompleted).toBe(110);
  });

  test('직접 입력 유효성·저장', () => {
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );

    fireEvent.click(screen.getByTestId('viz-target-goal-settings'));
    const input = screen.getByTestId('viz-target-goal-input');
    const saveBtn = screen.getByTestId('viz-target-goal-save');

    fireEvent.change(input, { target: { value: '' } });
    expect(saveBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: '0' } });
    expect(saveBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: '200' } });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    expect(screen.queryByTestId('viz-target-goal-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('viz-kpi-card-target')).toHaveTextContent('4건 / 목표 200건');
    expect(screen.getByTestId('viz-kpi-card-target')).toHaveTextContent('2%');

    const storageKey = buildVizTargetStorageKey({
      tenantId: 'tenant-test',
      userId: 'user-1'
    });
    const stored = JSON.parse(localStorage.getItem(storageKey));
    expect(stored.mode).toBe(DASHBOARD_VIZ_TARGET_MODES.CUSTOM);
    expect(stored.targetCompleted).toBe(200);
  });

  test('tenantId 없으면 저장 no-op·UI 목표만 반영', () => {
    window.sessionManager = {
      getUser: () => ({ id: 'user-1', tenantId: null })
    };
    render(
      <AdminDashboardVisualizationGroup consultationStats={sampleStats} loading={false} />
    );

    fireEvent.click(screen.getByTestId('viz-target-goal-settings'));
    fireEvent.click(screen.getByRole('radio', { name: '50건' }));
    fireEvent.click(screen.getByTestId('viz-target-goal-save'));

    expect(screen.getByTestId('viz-kpi-card-target')).toHaveTextContent('4건 / 목표 50건');
    expect(localStorage.length).toBe(0);
  });
});
