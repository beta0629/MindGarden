/**
 * PushMonitorKpiRow — settings-shell SettingsSummaryStrip 4지표 요약 띠
 *
 * 기존 snapshot.kpi 4지표(queue/success/failure/skip)를 스트립으로 재매핑.
 * 비즈니스 메트릭 변경 없음.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 * @updated 2026-09-05 — Clinic-OS summary strip
 * @updated 2026-10-03 — 매핑 요약 스트립·숫자 atom → SettingsSummaryStrip
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { SettingsSummaryStrip } from '../../settings-shell';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorKpiRow.css';

const UNIT_COUNT = ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT;

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatPercent = (ratio) => {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return '0%';
  }
  const pct = Math.round(ratio * 1000) / 10;
  return `${pct}%`;
};

const labelForChannel = (channelKey) => {
  switch (channelKey) {
    case 'ALIMTALK':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK;
    case 'SMS':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS;
    case 'PUSH':
      return ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_PUSH;
    default:
      return channelKey || '';
  }
};

const PushMonitorKpiRow = ({ kpi = null, channelBreakdown = null, loading = false }) => {
  const queueValue = safeNumber(kpi?.recentFiveMinuteCount);
  const pendingValue = safeNumber(kpi?.pendingCount);
  const successValue = safeNumber(kpi?.successCount);
  const failureValue = safeNumber(kpi?.externalFailureCount);
  const validationSkip = safeNumber(kpi?.validationSkipCount);
  const policySkip = safeNumber(kpi?.policySkipCount);
  const skipTotal = safeNumber(kpi?.skipTotalCount) || (validationSkip + policySkip);
  const failureRate = safeNumber(kpi?.failureRate);

  const successCaption = useMemo(() => {
    if (!Array.isArray(channelBreakdown) || channelBreakdown.length === 0) {
      return null;
    }
    return channelBreakdown
      .map((row) => `${labelForChannel(row.channel)} ${formatPercent(safeNumber(row.ratio))}`)
      .join(' · ');
  }, [channelBreakdown]);

  const skipCaption = useMemo(() => (
    `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_VALIDATION_LABEL} ${validationSkip.toLocaleString('ko-KR')}`
    + ` · ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_POLICY_LABEL} ${policySkip.toLocaleString('ko-KR')}`
  ), [validationSkip, policySkip]);

  const queueSubtitle = `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_SUBTITLE_PREFIX}${pendingValue.toLocaleString('ko-KR')}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_SUBTITLE_SUFFIX}`;
  const failureSubtitle = `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_FAILURE_RATE_PREFIX}${formatPercent(failureRate)}`;

  const cells = [
    {
      id: 'queue',
      label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_LABEL,
      value: queueValue,
      caption: queueSubtitle
    },
    {
      id: 'success',
      label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SUCCESS_LABEL,
      value: successValue,
      caption: successCaption
    },
    {
      id: 'failure',
      label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_FAILURE_LABEL,
      value: failureValue,
      caption: failureSubtitle
    },
    {
      id: 'skip',
      label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_LABEL,
      value: skipTotal,
      caption: skipCaption
    }
  ];

  const items = cells.map((cell) => ({
    key: cell.id,
    label: cell.label,
    value: `${cell.value.toLocaleString('ko-KR')}${UNIT_COUNT}`,
    caption: cell.caption || undefined,
    testId: `push-monitor-kpi-card-${cell.id}`
  }));

  return (
    <div className="mg-push-monitor__kpi-row" aria-busy={loading}>
      <SettingsSummaryStrip
        items={items}
        ariaLabel={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SUCCESS_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_FAILURE_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_LABEL}`}
        testId="push-monitor-kpi-row"
      />
    </div>
  );
};

PushMonitorKpiRow.propTypes = {
  kpi: PropTypes.shape({
    recentFiveMinuteCount: PropTypes.number,
    pendingCount: PropTypes.number,
    successCount: PropTypes.number,
    externalFailureCount: PropTypes.number,
    failureRate: PropTypes.number,
    validationSkipCount: PropTypes.number,
    policySkipCount: PropTypes.number,
    skipTotalCount: PropTypes.number
  }),
  channelBreakdown: PropTypes.arrayOf(PropTypes.shape({
    channel: PropTypes.string,
    ratio: PropTypes.number
  })),
  loading: PropTypes.bool
};

export default PushMonitorKpiRow;
