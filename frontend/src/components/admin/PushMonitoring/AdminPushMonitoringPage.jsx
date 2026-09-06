/**
 * AdminPushMonitoringPage — BW-1 「메시지 발송」 본 데이터 페이지.
 *
 * Clinic-OS chrome: push-monitoring--clinic-os (B0KlA 제거).
 * 설계: docs/project-management/2026-06-07/BW1_PUSH_MONITORING_DESIGN_HANDOFF.md
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 * @updated 2026-09-05 — Clinic-OS chrome alignment
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
      <div
        className="mg-push-monitor push-monitoring--clinic-os"
        data-testid="admin-push-monitoring-page"
      >
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
            <div className="mg-push-monitor__stage">
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
          </div>
        </ContentArea>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminPushMonitoringPage;
