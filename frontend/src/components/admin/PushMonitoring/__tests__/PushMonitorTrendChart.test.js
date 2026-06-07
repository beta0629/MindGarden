/**
 * PushMonitorTrendChart — 단위 테스트.
 *
 * 검증 매트릭스:
 *  - T1: points 가 비어있을 때 EmptyState 노출 (testid push-monitor-trend-chart-empty)
 *  - T2: points 가 있을 때 chart 컨테이너 + day li 렌더 + tooltip(aria-label) 포함
 *  - T3: 합계 0 인 점은 empty 로 fallback
 *  - T4: channel filter 적용 시 비매칭 segment 에 dimmed modifier 클래스 추가
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import PushMonitorTrendChart from '../molecules/PushMonitorTrendChart';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';

const samplePoints = [
  {
    dateIso: '2026-06-01',
    alimtalkCount: 10,
    smsCount: 5,
    pushCount: 0,
    successCount: 13,
    failureCount: 1,
    skipCount: 1,
    pendingCount: 0
  },
  {
    dateIso: '2026-06-02',
    alimtalkCount: 0,
    smsCount: 4,
    pushCount: 6,
    successCount: 9,
    failureCount: 1,
    skipCount: 0,
    pendingCount: 0
  }
];

describe('PushMonitorTrendChart', () => {
  test('T1: 빈 points 일 때 EmptyState 노출', () => {
    render(<PushMonitorTrendChart points={[]} />);
    expect(screen.getByTestId('push-monitor-trend-chart-empty')).toBeInTheDocument();
    expect(screen.getByText(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_EMPTY_TITLE)).toBeInTheDocument();
  });

  test('T2: points 가 있을 때 chart 컨테이너 + tooltip 포함', () => {
    render(<PushMonitorTrendChart points={samplePoints} />);
    expect(screen.getByTestId('push-monitor-trend-chart')).toBeInTheDocument();

    const days = screen.getAllByRole('listitem');
    expect(days.length).toBe(samplePoints.length);

    const firstAria = days[0].getAttribute('aria-label') || '';
    expect(firstAria).toMatch(/2026/);
    expect(firstAria).toMatch(new RegExp(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK));
    expect(firstAria).toMatch(new RegExp(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_TOOLTIP_SUCCESS));
  });

  test('T3: 합계 0 인 데이터셋은 empty 로 fallback', () => {
    const zeroPoints = [{
      dateIso: '2026-06-03',
      alimtalkCount: 0,
      smsCount: 0,
      pushCount: 0,
      successCount: 0,
      failureCount: 0,
      skipCount: 0,
      pendingCount: 0
    }];
    render(<PushMonitorTrendChart points={zeroPoints} />);
    expect(screen.getByTestId('push-monitor-trend-chart-empty')).toBeInTheDocument();
  });

  test('T4: channel=ALIMTALK 시 비매칭 segment 에 dimmed 클래스 부여', () => {
    const { container } = render(
      <PushMonitorTrendChart points={samplePoints} channel="ALIMTALK" />
    );
    const dimmedSegments = container.querySelectorAll('.mg-push-monitor__trend-chart__segment--dimmed');
    expect(dimmedSegments.length).toBeGreaterThan(0);
    const alimtalkSegments = container.querySelectorAll('.mg-push-monitor__trend-chart__segment--alimtalk');
    alimtalkSegments.forEach((node) => {
      expect(node.classList.contains('mg-push-monitor__trend-chart__segment--dimmed')).toBe(false);
    });
  });
});
