/**
 * BW-1 Phase 3 — PushMonitor atoms 회귀 테스트.
 *
 * 검증 대상:
 *  - PushMonitorKpiCard: variant 별 클래스, 값 포맷, role=figure aria-label
 *  - PushMonitorMaskedRecipient: 백엔드 마스킹 그대로 노출 + 빈 값 fallback
 *  - PushMonitorOperationalBadge: warning/info tone 별 role + code chip 노출
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import PushMonitorKpiCard, { PUSH_MONITOR_KPI_VARIANTS } from '../PushMonitorKpiCard';
import PushMonitorMaskedRecipient from '../PushMonitorMaskedRecipient';
import PushMonitorOperationalBadge, { PUSH_MONITOR_BADGE_TONES } from '../PushMonitorOperationalBadge';

describe('PushMonitorKpiCard', () => {
  test('variant=success → success 클래스 + role=figure + 값 포맷', () => {
    render(
      <PushMonitorKpiCard
        variant={PUSH_MONITOR_KPI_VARIANTS.SUCCESS}
        label="성공"
        value={1234}
        unit="건"
        subtitle="최근 7일"
      />
    );
    const card = screen.getByTestId('push-monitor-kpi-card-success');
    expect(card).toHaveAttribute('role', 'figure');
    expect(card.className).toContain('mg-push-monitor__kpi-card--success');
    expect(card).toHaveTextContent('1,234');
    expect(card).toHaveTextContent('성공');
    expect(card).toHaveTextContent('최근 7일');
  });

  test('value=null → "—" placeholder', () => {
    render(
      <PushMonitorKpiCard
        variant={PUSH_MONITOR_KPI_VARIANTS.QUEUE}
        label="큐"
        value={null}
      />
    );
    expect(screen.getByTestId('push-monitor-kpi-card-queue'))
      .toHaveTextContent('—');
  });

  test('distribution 배열 → list item 렌더', () => {
    render(
      <PushMonitorKpiCard
        variant={PUSH_MONITOR_KPI_VARIANTS.SKIP}
        label="Skip"
        value={3}
        distribution={[
          { label: '검증 2' },
          { label: '정책 1' }
        ]}
      />
    );
    const card = screen.getByTestId('push-monitor-kpi-card-skip');
    expect(card).toHaveTextContent('검증 2');
    expect(card).toHaveTextContent('정책 1');
  });
});

describe('PushMonitorMaskedRecipient', () => {
  test('백엔드 마스킹 그대로 노출 (재마스킹 금지)', () => {
    render(<PushMonitorMaskedRecipient value="010-***-1234" />);
    expect(screen.getByTestId('push-monitor-masked-recipient'))
      .toHaveTextContent('010-***-1234');
  });

  test('빈 값 fallback "—"', () => {
    render(<PushMonitorMaskedRecipient value="" />);
    expect(screen.getByTestId('push-monitor-masked-recipient'))
      .toHaveTextContent('—');
  });
});

describe('PushMonitorOperationalBadge', () => {
  test('warning tone → role=status + code chip 노출', () => {
    render(
      <PushMonitorOperationalBadge
        tone={PUSH_MONITOR_BADGE_TONES.WARNING}
        title="알림톡 운영 OFF"
        description="환경 변수: "
        code="notification.batch.alimtalk-enabled"
      />
    );
    const banner = screen.getByTestId('push-monitor-banner-warning');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveTextContent('알림톡 운영 OFF');
    expect(banner).toHaveTextContent('notification.batch.alimtalk-enabled');
    expect(banner.className)
      .toContain('mg-push-monitor__operational-banner--warning');
  });

  test('info tone → role=note', () => {
    render(
      <PushMonitorOperationalBadge
        tone={PUSH_MONITOR_BADGE_TONES.INFO}
        title="PUSH 자동 추적 미지원"
        description="자동 발송 결과는 어드민 수동 발송에서만 추적됩니다."
      />
    );
    const banner = screen.getByTestId('push-monitor-banner-info');
    expect(banner).toHaveAttribute('role', 'note');
  });
});
