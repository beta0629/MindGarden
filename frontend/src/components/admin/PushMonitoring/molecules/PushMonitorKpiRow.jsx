/**
 * PushMonitorKpiRow — KPI 4 카드를 가로 배치하는 molecule.
 *
 * 디자이너 핸드오프 §3 트리·§5.1 `mg-push-monitor__kpi-row`. 4개 카드 grid (1×4 / 2×2 /
 * 1×4 stacked). 채널별 분포는 `channelBreakdown` 으로 KPI #2 (success) 카드의 distribution
 * 에 매핑한다.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PushMonitorKpiCard, {
  PUSH_MONITOR_KPI_VARIANTS
} from '../atoms/PushMonitorKpiCard';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorKpiRow.css';

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

const PushMonitorKpiRow = ({ kpi, channelBreakdown, loading }) => {
  const queueValue = safeNumber(kpi?.recentFiveMinuteCount);
  const pendingValue = safeNumber(kpi?.pendingCount);
  const successValue = safeNumber(kpi?.successCount);
  const failureValue = safeNumber(kpi?.externalFailureCount);
  const validationSkip = safeNumber(kpi?.validationSkipCount);
  const policySkip = safeNumber(kpi?.policySkipCount);
  const skipTotal = safeNumber(kpi?.skipTotalCount) || (validationSkip + policySkip);
  const failureRate = safeNumber(kpi?.failureRate);

  const successDistribution = useMemo(() => {
    if (!Array.isArray(channelBreakdown) || channelBreakdown.length === 0) {
      return null;
    }
    return channelBreakdown.map((row) => ({
      label: `${labelForChannel(row.channel)} ${formatPercent(safeNumber(row.ratio))}`
    }));
  }, [channelBreakdown]);

  const skipDistribution = useMemo(() => ([
    { label: `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_VALIDATION_LABEL} ${validationSkip.toLocaleString('ko-KR')}` },
    { label: `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_POLICY_LABEL} ${policySkip.toLocaleString('ko-KR')}` }
  ]), [validationSkip, policySkip]);

  const queueSubtitle = `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_SUBTITLE_PREFIX}${pendingValue.toLocaleString('ko-KR')}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_SUBTITLE_SUFFIX}`;
  const failureSubtitle = `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_FAILURE_RATE_PREFIX}${formatPercent(failureRate)}`;

  return (
    <div
      className="mg-push-monitor__kpi-row"
      role="list"
      aria-label={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SUCCESS_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_FAILURE_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_LABEL}`}
      data-testid="push-monitor-kpi-row"
    >
      <PushMonitorKpiCard
        variant={PUSH_MONITOR_KPI_VARIANTS.QUEUE}
        label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_LABEL}
        value={queueValue}
        unit={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT}
        subtitle={queueSubtitle}
        loading={loading}
      />
      <PushMonitorKpiCard
        variant={PUSH_MONITOR_KPI_VARIANTS.SUCCESS}
        label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SUCCESS_LABEL}
        value={successValue}
        unit={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT}
        distribution={successDistribution}
        loading={loading}
      />
      <PushMonitorKpiCard
        variant={PUSH_MONITOR_KPI_VARIANTS.FAILURE}
        label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_FAILURE_LABEL}
        value={failureValue}
        unit={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT}
        subtitle={failureSubtitle}
        loading={loading}
      />
      <PushMonitorKpiCard
        variant={PUSH_MONITOR_KPI_VARIANTS.SKIP}
        label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_LABEL}
        value={skipTotal}
        unit={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT}
        distribution={skipDistribution}
        loading={loading}
      />
    </div>
  );
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

PushMonitorKpiRow.defaultProps = {
  kpi: null,
  channelBreakdown: null,
  loading: false
};

export default PushMonitorKpiRow;
