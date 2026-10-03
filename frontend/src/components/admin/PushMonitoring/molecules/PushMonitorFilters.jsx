/**
 * PushMonitorFilters — 범위·채널 TabChipRow + 갱신 인디케이터.
 *
 * settings-shell 툴바(`mg-v2-settings-toolbar`)와 공통 TabChipRow 를 사용한다.
 * `aria-label` 은 한국어 리터럴을 SCAFFOLD_COPY 로 모두 외부화.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 * @updated 2026-10-03 — 세그먼트 탭·필터 표면 카드 → TabChipRow + settings 툴바
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import TabChipRow from '../../../common/TabChipRow';
import PushMonitorRefreshIndicator from '../atoms/PushMonitorRefreshIndicator';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import {
  PUSH_MONITORING_RANGE,
  PUSH_MONITORING_CHANNEL
} from '../../../../api/admin/pushMonitoringApi';
import './PushMonitorFilters.css';

const DEFAULT_INTERVAL_MS = 60000;

const PushMonitorFilters = ({
  range,
  channel,
  onRangeChange,
  onChannelChange,
  lastRefreshedAtIso = null,
  intervalMs = DEFAULT_INTERVAL_MS,
  isPolling = false,
  hasError = false
}) => {
  const rangeItems = useMemo(() => ([
    { key: PUSH_MONITORING_RANGE.H24, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_24H },
    { key: PUSH_MONITORING_RANGE.D7, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_7D },
    { key: PUSH_MONITORING_RANGE.D30, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_30D }
  ]), []);

  const channelItems = useMemo(() => ([
    { key: PUSH_MONITORING_CHANNEL.ALL, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALL },
    { key: PUSH_MONITORING_CHANNEL.ALIMTALK, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK },
    { key: PUSH_MONITORING_CHANNEL.SMS, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS },
    { key: PUSH_MONITORING_CHANNEL.PUSH, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_PUSH }
  ]), []);

  return (
    <section
      className="mg-v2-settings-toolbar mg-push-monitor__filters"
      aria-label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_LABEL}
      data-testid="push-monitor-filters"
    >
      <div className="mg-push-monitor__filters-group">
        <TabChipRow
          items={rangeItems}
          activeKey={range}
          onChange={onRangeChange}
          ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_LABEL}
        />
        <TabChipRow
          items={channelItems}
          activeKey={channel}
          onChange={onChannelChange}
          ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_LABEL}
        />
      </div>
      <span className="mg-v2-settings-toolbar__spacer" aria-hidden="true" />
      <PushMonitorRefreshIndicator
        lastRefreshedAtIso={lastRefreshedAtIso}
        intervalMs={intervalMs}
        isPolling={isPolling}
        hasError={hasError}
      />
    </section>
  );
};

PushMonitorFilters.propTypes = {
  range: PropTypes.string.isRequired,
  channel: PropTypes.string.isRequired,
  onRangeChange: PropTypes.func.isRequired,
  onChannelChange: PropTypes.func.isRequired,
  lastRefreshedAtIso: PropTypes.string,
  intervalMs: PropTypes.number,
  isPolling: PropTypes.bool,
  hasError: PropTypes.bool
};

export default PushMonitorFilters;
