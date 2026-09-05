/**
 * PushMonitorKpiRow — 단위 테스트 (Clinic-OS summary strip).
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 * @updated 2026-09-05 — summary strip assertions
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import PushMonitorKpiRow from '../molecules/PushMonitorKpiRow';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const baseKpi = {
  recentFiveMinuteCount: 12,
  pendingCount: 3,
  successCount: 1234,
  externalFailureCount: 5,
  failureRate: 0.0123,
  validationSkipCount: 2,
  policySkipCount: 7,
  skipTotalCount: 9
};

const baseChannelBreakdown = [
  { channel: 'ALIMTALK', successCount: 800, totalCount: 1000, ratio: 0.8 },
  { channel: 'SMS', successCount: 200, totalCount: 250, ratio: 0.8 },
  { channel: 'PUSH', successCount: 234, totalCount: 234, ratio: 1.0 }
];

describe('PushMonitorKpiRow', () => {
  test('K1: 4 KPI 셀 모두 렌더 (summary strip)', () => {
    const { container } = render(
      <PushMonitorKpiRow kpi={baseKpi} channelBreakdown={baseChannelBreakdown} />
    );
    expect(container.querySelector('.mapping-management-summary')).toBeInTheDocument();
    expect(container.querySelector('.mapping-management-summary--cols-4')).toBeInTheDocument();
    expect(screen.getByTestId('push-monitor-kpi-card-queue')).toBeInTheDocument();
    expect(screen.getByTestId('push-monitor-kpi-card-success')).toBeInTheDocument();
    expect(screen.getByTestId('push-monitor-kpi-card-failure')).toBeInTheDocument();
    expect(screen.getByTestId('push-monitor-kpi-card-skip')).toBeInTheDocument();
  });

  test('K2: KPI 값이 KpiNumeral 로 노출', () => {
    render(<PushMonitorKpiRow kpi={baseKpi} channelBreakdown={baseChannelBreakdown} />);
    const successCard = screen.getByTestId('push-monitor-kpi-card-success');
    expect(within(successCard).getByLabelText(/1234/)).toBeInTheDocument();
  });

  test('K3: channelBreakdown 이 success 캡션으로 매핑', () => {
    render(<PushMonitorKpiRow kpi={baseKpi} channelBreakdown={baseChannelBreakdown} />);
    const successCard = screen.getByTestId('push-monitor-kpi-card-success');
    expect(within(successCard).getByText(/알림톡 80%/)).toBeInTheDocument();
    expect(within(successCard).getByText(/SMS 80%/)).toBeInTheDocument();
    expect(within(successCard).getByText(/PUSH 100%/)).toBeInTheDocument();
  });

  test('K4: pending subtitle, failureRate subtitle 노출', () => {
    render(<PushMonitorKpiRow kpi={baseKpi} channelBreakdown={baseChannelBreakdown} />);
    const queueCard = screen.getByTestId('push-monitor-kpi-card-queue');
    const failureCard = screen.getByTestId('push-monitor-kpi-card-failure');
    expect(within(queueCard).getByText(
      new RegExp(`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_SUBTITLE_PREFIX}3`)
    )).toBeInTheDocument();
    expect(within(failureCard).getByText(
      new RegExp(`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_FAILURE_RATE_PREFIX}1\\.2%`)
    )).toBeInTheDocument();
  });

  test('K5: kpi 미지정 시 0 으로 fallback', () => {
    render(<PushMonitorKpiRow />);
    const queueCard = screen.getByTestId('push-monitor-kpi-card-queue');
    const successCard = screen.getByTestId('push-monitor-kpi-card-success');
    expect(within(queueCard).getByLabelText(/^0/)).toBeInTheDocument();
    expect(within(successCard).getByLabelText(/^0/)).toBeInTheDocument();
  });
});
