/**
 * PushMonitorKpiRow — Clinic-OS 4-cell summary strip
 * Twin: MappingKpiSection / PgConfigurationList summary (`mapping-management-summary--cols-4`)
 *
 * 기존 snapshot.kpi 4지표(queue/success/failure/skip)를 스트립으로 재매핑.
 * 비즈니스 메트릭 변경 없음.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 * @updated 2026-09-05 — Clinic-OS summary strip
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import KpiNumeral from '../../../dashboard-v2/atoms/KpiNumeral';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorKpiRow.css';

const UNIT_COUNT = ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT || '건';

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

  return (
    <section
      className={[
        'mg-push-monitor__kpi-row',
        'mapping-management-summary',
        'mapping-management-summary--cols-4',
        loading ? 'mg-push-monitor__kpi-row--loading' : ''
      ].filter(Boolean).join(' ')}
      role="list"
      aria-label={`${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_QUEUE_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SUCCESS_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_FAILURE_LABEL}, ${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_SKIP_LABEL}`}
      data-testid="push-monitor-kpi-row"
    >
      {cells.map((cell) => (
        <article
          key={cell.id}
          className="mapping-management-summary__cell"
          role="listitem"
          data-testid={`push-monitor-kpi-card-${cell.id}`}
        >
          <div className="mapping-management-summary__hit">
            <p className="mapping-management-summary__label">{cell.label}</p>
            <div className="mapping-management-summary__amount">
              <KpiNumeral value={String(cell.value)} unit={UNIT_COUNT} />
            </div>
            {cell.caption ? (
              <p className="mg-push-monitor__kpi-caption">{cell.caption}</p>
            ) : null}
          </div>
        </article>
      ))}
    </section>
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
