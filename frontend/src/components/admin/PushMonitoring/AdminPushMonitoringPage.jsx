/**
 * AdminPushMonitoringPage — BW-1 「푸시 설정 모니터링」 본 데이터 페이지.
 *
 * 설계: docs/project-management/2026-06-07/BW1_PUSH_MONITORING_DESIGN_HANDOFF.md
 *
 * 핸드오프 §11 작업 순서를 따라 placeholder(`AdminPushMonitoringPlaceholderPage`) 를 라우터
 * import 만 교체한다(파일 자체는 후속 회수 PR 에서 제거). 본 페이지는 다음 컴포지션:
 *
 *   AdminCommonLayout
 *     └ ContentArea
 *        ├ ContentHeader (title, subtitle)
 *        ├ PushMonitorFilters (range / channel / refresh)
 *        ├ PushMonitorKpiRow (4 KPI 카드)
 *        ├ PushMonitorOperationalSection (alimtalk OFF / PUSH 갭 / 비용 placeholder)
 *        ├ PushMonitorTrendSection (CSS-driven stacked bar)
 *        ├ PushMonitorSnapshotSection (테넌트 설정 스냅샷)
 *        └ PushMonitorFailureSection (실패 사례 + 재발송 confirm)
 *
 * 60s 폴링은 `usePushMonitoringSnapshot` 단일 진입.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React, { useCallback, useState } from 'react';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import PushMonitorFilters from './molecules/PushMonitorFilters';
import PushMonitorKpiRow from './molecules/PushMonitorKpiRow';
import PushMonitorTrendSection from './organisms/PushMonitorTrendSection';
import PushMonitorSnapshotSection from './organisms/PushMonitorSnapshotSection';
import PushMonitorFailureSection from './organisms/PushMonitorFailureSection';
import PushMonitorOperationalSection from './organisms/PushMonitorOperationalSection';
import SmsLogCard from './organisms/SmsLogCard';
import usePushMonitoringSnapshot from '../../../hooks/usePushMonitoringSnapshot';
import notificationManager from '../../../utils/notification';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../constants/adminWebScaffold';
import {
  PUSH_MONITORING_RANGE,
  PUSH_MONITORING_CHANNEL,
  resendPushMonitoringFailure
} from '../../../api/admin/pushMonitoringApi';
import './AdminPushMonitoringPage.css';

const PAGE_TITLE_ID = 'admin-push-monitoring-title';

const unwrapPayload = (response) => {
  if (response && typeof response === 'object' && response.success === true && response.data) {
    return response.data;
  }
  return response;
};

const AdminPushMonitoringPage = () => {
  const [range, setRange] = useState(PUSH_MONITORING_RANGE.D7);
  const [channel, setChannel] = useState(PUSH_MONITORING_CHANNEL.ALL);
  const [isResending, setIsResending] = useState(false);

  const {
    snapshot,
    isLoading,
    isRefreshing,
    error,
    lastRefreshedAtIso,
    refresh,
    intervalMs
  } = usePushMonitoringSnapshot({ range, channel });

  const handleResend = useCallback(async (entry) => {
    if (!entry || isResending) {
      return;
    }
    setIsResending(true);
    try {
      const response = await resendPushMonitoringFailure(entry.id, entry.source);
      const payload = unwrapPayload(response);
      if (payload && payload.success === false) {
        const message = payload.errorMessage
          || ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_TOAST_FAILURE_PREFIX;
        notificationManager.error(`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_TOAST_FAILURE_PREFIX}${message}`);
      } else {
        notificationManager.success(ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_TOAST_SUCCESS);
      }
      refresh();
    } catch (err) {
      const message = err && err.message ? err.message : 'unknown';
      notificationManager.error(`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RESEND_TOAST_FAILURE_PREFIX}${message}`);
    } finally {
      setIsResending(false);
    }
  }, [isResending, refresh]);

  const alimtalkRouteEnabled = !!snapshot?.tenantSnapshot?.alimtalkEnabled;
  const channelBreakdown = Array.isArray(snapshot?.channelBreakdown)
    ? snapshot.channelBreakdown
    : null;

  return (
    <AdminCommonLayout title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TITLE}>
      <div className="mg-v2-ad-b0kla mg-push-monitor" data-testid="admin-push-monitoring-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TITLE}>
            <ContentHeader
              title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TITLE}
              subtitle={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SUBTITLE}
              titleId={PAGE_TITLE_ID}
            />
            <div className="mg-push-monitor__sections">
              <PushMonitorFilters
                range={range}
                channel={channel}
                onRangeChange={setRange}
                onChannelChange={setChannel}
                lastRefreshedAtIso={lastRefreshedAtIso}
                intervalMs={intervalMs}
                isPolling={isRefreshing || isLoading}
                hasError={!!error}
              />
              <PushMonitorKpiRow
                kpi={snapshot?.kpi || null}
                channelBreakdown={channelBreakdown}
                loading={isLoading}
              />
              <PushMonitorOperationalSection
                alimtalkRouteEnabled={alimtalkRouteEnabled}
                channelBreakdown={channelBreakdown}
              />
              <PushMonitorTrendSection
                points={snapshot?.trendPoints || []}
                channel={channel}
              />
              <PushMonitorSnapshotSection
                snapshot={snapshot?.tenantSnapshot || null}
              />
              <SmsLogCard />
              <PushMonitorFailureSection
                entries={snapshot?.failures || []}
                totalCount={snapshot?.failuresTotal || 0}
                onResend={handleResend}
                isResending={isResending}
              />
              {error ? (
                <div className="mg-push-monitor__error-banner" role="alert">
                  <span>{ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_ERROR_BANNER}</span>
                  <button
                    type="button"
                    onClick={refresh}
                    className="mg-push-monitor__error-banner__retry"
                  >
                    {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_ERROR_RETRY}
                  </button>
                </div>
              ) : null}
            </div>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminPushMonitoringPage;
