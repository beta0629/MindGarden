/**
 * AdminPushMonitoringPage — 스모크 테스트.
 *
 * 본 테스트는 페이지가 라우터 로드 시 의존성 그래프 전체를 정상적으로 import / mount 할 수
 * 있는지 검증한다(런타임 import 누락·circular dep 가드). 데이터 fetch 는 mock 으로 즉시
 * 응답한다.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';

jest.mock('../../../../api/admin/pushMonitoringApi', () => {
  const actual = jest.requireActual('../../../../api/admin/pushMonitoringApi');
  return {
    __esModule: true,
    ...actual,
    getPushMonitoringSnapshot: jest.fn(),
    resendPushMonitoringFailure: jest.fn()
  };
});

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="admin-common-layout">{children}</div>
  )
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

import {
  getPushMonitoringSnapshot
} from '../../../../api/admin/pushMonitoringApi';
import AdminPushMonitoringPage from '../AdminPushMonitoringPage';

const stubResponse = () => ({
  success: true,
  data: {
    generatedAt: '2026-06-07T00:00:00',
    range: 'D7',
    channel: 'ALL',
    kpi: {
      recentFiveMinuteCount: 1,
      pendingCount: 0,
      successCount: 5,
      externalFailureCount: 0,
      failureRate: 0,
      validationSkipCount: 0,
      policySkipCount: 0,
      skipTotalCount: 0
    },
    channelBreakdown: [
      { channel: 'ALIMTALK', successCount: 5, totalCount: 5, ratio: 1 }
    ],
    trendPoints: [],
    tenantSnapshot: {
      alimtalkEnabled: false,
      kakaoApiKeyRegistered: true,
      kakaoSenderKeyRegistered: false,
      templateMapping: { filled: 5, total: 7 },
      alimtalkBizTemplateCodeCount: 12,
      expoPushAccessTokenRegistered: true,
      operationalToggle: { alimtalk: false, sms: true, push: true }
    },
    operationalToggle: { alimtalk: false, sms: true, push: true },
    failures: [],
    failuresTotal: 0,
    pushAutoTrackingAvailable: false,
    costAvailable: false
  }
});

describe('AdminPushMonitoringPage 스모크', () => {
  beforeEach(() => {
    getPushMonitoringSnapshot.mockReset();
    getPushMonitoringSnapshot.mockResolvedValue(stubResponse());
  });

  test('페이지 마운트 시 ContentHeader / 4 KPI 카드 / 운영 배너 렌더', async() => {
    await act(async() => {
      render(<AdminPushMonitoringPage />);
    });

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-push-monitoring-page')).toBeInTheDocument();
    // KPI 4종
    expect(screen.getByTestId('push-monitor-kpi-card-queue')).toBeInTheDocument();
    expect(screen.getByTestId('push-monitor-kpi-card-success')).toBeInTheDocument();
    expect(screen.getByTestId('push-monitor-kpi-card-failure')).toBeInTheDocument();
    expect(screen.getByTestId('push-monitor-kpi-card-skip')).toBeInTheDocument();
    // 운영 배너 (warning + info)
    expect(screen.getByTestId('push-monitor-banner-warning')).toBeInTheDocument();
    expect(screen.getByTestId('push-monitor-banner-info')).toBeInTheDocument();
    // 스냅샷 테이블
    expect(screen.getByTestId('push-monitor-snapshot-table')).toBeInTheDocument();
  });
});
