/**
 * PushMonitorFilters — 범위·채널 SegmentedTabs + 갱신 인디케이터.
 *
 * 디자이너 핸드오프 §4.2 / §5.1 `mg-push-monitor__filters`. 기존 SegmentedTabs 공통 모듈을
 * 재사용해 CSS 일관성을 유지한다(D11). `aria-label` 은 한국어 리터럴을 SCAFFOLD_COPY 로
 * 모두 외부화.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import SegmentedTabs from '../../../common/SegmentedTabs';
import PushMonitorRefreshIndicator from '../atoms/PushMonitorRefreshIndicator';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import {
  PUSH_MONITORING_RANGE,
  PUSH_MONITORING_CHANNEL
} from '../../../../api/admin/pushMonitoringApi';
import './PushMonitorFilters.css';

const PushMonitorFilters = ({
  range,
  channel,
  onRangeChange,
  onChannelChange,
  lastRefreshedAtIso,
  intervalMs,
  isPolling,
  hasError
}) => {
  const rangeItems = useMemo(() => ([
    { value: PUSH_MONITORING_RANGE.H24, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_24H },
    { value: PUSH_MONITORING_RANGE.D7, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_7D },
    { value: PUSH_MONITORING_RANGE.D30, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_30D }
  ]), []);

  const channelItems = useMemo(() => ([
    { value: PUSH_MONITORING_CHANNEL.ALL, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALL },
    { value: PUSH_MONITORING_CHANNEL.ALIMTALK, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK },
    { value: PUSH_MONITORING_CHANNEL.SMS, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS },
    { value: PUSH_MONITORING_CHANNEL.PUSH, label: ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_PUSH }
  ]), []);

  return (
    <section
      className="mg-push-monitor__filters"
      aria-label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_LABEL}
      data-testid="push-monitor-filters"
    >
      <div className="mg-push-monitor__filters-group">
        <SegmentedTabs
          items={rangeItems}
          activeValue={range}
          onChange={onRangeChange}
          ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_RANGE_LABEL}
          size="sm"
        />
        <SegmentedTabs
          items={channelItems}
          activeValue={channel}
          onChange={onChannelChange}
          ariaLabel={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_LABEL}
          size="sm"
        />
      </div>
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

PushMonitorFilters.defaultProps = {
  lastRefreshedAtIso: null,
  intervalMs: 60000,
  isPolling: false,
  hasError: false
};

export default PushMonitorFilters;
