/**
 * PushMonitorTrendChart — CSS-driven stacked bar 일별 발송 추이.
 *
 * 디자이너 핸드오프 §6.2 — 외부 차트 라이브러리 미도입(D11). 직전 PR `mg-v2-cumulative-chart`
 * 패턴 답습. 채널별 stacked 막대 + Tooltip + Empty state.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import EmptyState from '../../../common/EmptyState';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import { PUSH_MONITORING_CHANNEL } from '../../../../api/admin/pushMonitoringApi';
import './PushMonitorTrendChart.css';

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatDateShort = (iso) => {
  if (!iso) {
    return '';
  }
  const parts = String(iso).split('-');
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`;
  }
  return String(iso);
};

const formatDateAria = (iso) => {
  if (!iso) {
    return '';
  }
  const parts = String(iso).split('-');
  if (parts.length === 3) {
    return `${parts[0]}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_DATE_FORMAT_YEAR} `
      + `${parts[1]}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_DATE_FORMAT_MONTH} `
      + `${parts[2]}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_DATE_FORMAT_DAY}`;
  }
  return String(iso);
};

const PushMonitorTrendChart = ({ points, channel }) => {
  const safePoints = useMemo(() => {
    if (!Array.isArray(points)) {
      return [];
    }
    return points;
  }, [points]);

  const max = useMemo(() => {
    let m = 0;
    safePoints.forEach((p) => {
      const total = safeNumber(p.alimtalkCount)
        + safeNumber(p.smsCount)
        + safeNumber(p.pushCount);
      if (total > m) {
        m = total;
      }
    });
    return m;
  }, [safePoints]);

  if (safePoints.length === 0 || max <= 0) {
    return (
      <div className="mg-push-monitor__trend-chart" data-testid="push-monitor-trend-chart-empty">
        <EmptyState
          title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_EMPTY_TITLE}
          description={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_EMPTY_DESC}
        />
      </div>
    );
  }

  const isChannelDimmed = (segmentChannel) => {
    if (channel === PUSH_MONITORING_CHANNEL.ALL || !channel) {
      return false;
    }
    return segmentChannel !== channel;
  };

  return (
    <div className="mg-push-monitor__trend-chart" data-testid="push-monitor-trend-chart">
      <ol
        className="mg-push-monitor__trend-chart__list"
        role="img"
        aria-label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_TITLE}
      >
        {safePoints.map((p) => {
          const alimtalk = safeNumber(p.alimtalkCount);
          const sms = safeNumber(p.smsCount);
          const push = safeNumber(p.pushCount);
          const total = alimtalk + sms + push;
          const success = safeNumber(p.successCount);
          const failure = safeNumber(p.failureCount);
          const skip = safeNumber(p.skipCount);
          const pending = safeNumber(p.pendingCount);
          const dateIso = typeof p.dateIso === 'string' ? p.dateIso : '';
          const dateAria = formatDateAria(dateIso);
          const tooltip = `${dateAria} — `
            + `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK} ${alimtalk}, `
            + `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS} ${sms}, `
            + `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_PUSH} ${push} | `
            + `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_TOOLTIP_SUCCESS} ${success}, `
            + `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_TOOLTIP_FAILURE} ${failure}, `
            + `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_TOOLTIP_SKIP} ${skip}, `
            + `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_TREND_TOOLTIP_PENDING} ${pending}`;
          return (
            <li
              key={`trend-${dateIso}`}
              className="mg-push-monitor__trend-chart__day"
              title={tooltip}
              aria-label={tooltip}
            >
              <div
                className="mg-push-monitor__trend-chart__bar"
                style={{
                  '--mg-trend-bar-height': `${Math.round((total / max) * 100)}%`
                }}
              >
                {push > 0 ? (
                  <span
                    className={`mg-push-monitor__trend-chart__segment mg-push-monitor__trend-chart__segment--push${isChannelDimmed('PUSH') ? ' mg-push-monitor__trend-chart__segment--dimmed' : ''}`}
                    style={{ flexBasis: `${(push / Math.max(total, 1)) * 100}%` }}
                  />
                ) : null}
                {sms > 0 ? (
                  <span
                    className={`mg-push-monitor__trend-chart__segment mg-push-monitor__trend-chart__segment--sms${isChannelDimmed('SMS') ? ' mg-push-monitor__trend-chart__segment--dimmed' : ''}`}
                    style={{ flexBasis: `${(sms / Math.max(total, 1)) * 100}%` }}
                  />
                ) : null}
                {alimtalk > 0 ? (
                  <span
                    className={`mg-push-monitor__trend-chart__segment mg-push-monitor__trend-chart__segment--alimtalk${isChannelDimmed('ALIMTALK') ? ' mg-push-monitor__trend-chart__segment--dimmed' : ''}`}
                    style={{ flexBasis: `${(alimtalk / Math.max(total, 1)) * 100}%` }}
                  />
                ) : null}
              </div>
              <div className="mg-push-monitor__trend-chart__date">{formatDateShort(dateIso)}</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

PushMonitorTrendChart.propTypes = {
  points: PropTypes.arrayOf(PropTypes.shape({
    dateIso: PropTypes.string,
    alimtalkCount: PropTypes.number,
    smsCount: PropTypes.number,
    pushCount: PropTypes.number,
    successCount: PropTypes.number,
    failureCount: PropTypes.number,
    skipCount: PropTypes.number,
    pendingCount: PropTypes.number
  })),
  channel: PropTypes.string
};

PushMonitorTrendChart.defaultProps = {
  points: [],
  channel: PUSH_MONITORING_CHANNEL.ALL
};

export default PushMonitorTrendChart;
