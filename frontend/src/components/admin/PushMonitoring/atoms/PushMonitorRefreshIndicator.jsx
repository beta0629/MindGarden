/**
 * PushMonitorRefreshIndicator — 폴링 상태 표시 atom.
 *
 * 디자이너 핸드오프 §4.9 atoms / §5.1 BEM `mg-push-monitor__refresh-indicator`.
 * `aria-live="polite"` 로 갱신 시각·재갱신 카운트다운을 보조기술에 알린다.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorRefreshIndicator.css';

const DEFAULT_INTERVAL_MS = 60000;
const MS_PER_SECOND = 1000;

const formatTime = (iso) => {
  if (!iso) {
    return '';
  }
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch (err) {
    return '';
  }
};

const PushMonitorRefreshIndicator = ({
  lastRefreshedAtIso = null,
  intervalMs = DEFAULT_INTERVAL_MS,
  isPolling = false,
  hasError = false
}) => {
  const dotClass = [
    'mg-push-monitor__refresh-indicator__dot',
    isPolling ? 'mg-push-monitor__refresh-indicator__dot--active' : '',
    hasError ? 'mg-push-monitor__refresh-indicator__dot--error' : ''
  ].filter(Boolean).join(' ');

  const intervalSec = Math.max(1, Math.round((intervalMs || DEFAULT_INTERVAL_MS) / MS_PER_SECOND));
  const formatted = formatTime(lastRefreshedAtIso);
  let liveText;
  if (hasError) {
    liveText = ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_REFRESH_RETRY;
  } else if (formatted) {
    liveText = `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_REFRESH_PREFIX}${formatted} (${intervalSec}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_REFRESH_INTERVAL_SUFFIX})`;
  } else {
    liveText = ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_REFRESH_PENDING;
  }

  return (
    <div
      className="mg-push-monitor__refresh-indicator"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="push-monitor-refresh-indicator"
    >
      <span className={dotClass} aria-hidden="true" />
      <span className="mg-push-monitor__refresh-indicator__text">{liveText}</span>
    </div>
  );
};

PushMonitorRefreshIndicator.propTypes = {
  lastRefreshedAtIso: PropTypes.string,
  intervalMs: PropTypes.number,
  isPolling: PropTypes.bool,
  hasError: PropTypes.bool
};

export default PushMonitorRefreshIndicator;
