import React from 'react';
import PropTypes from 'prop-types';
import { Info } from 'lucide-react';
import {
  formatSessionUsageAriaLabel,
  SESSION_CANCEL_RESTORE_HINT,
  SESSION_CANCEL_RESTORE_HINT_ARIA
} from '../../../../constants/schedule';
import './SessionProgressIndicator.css';

/**
 * 매핑 회기 진행 표시 — `사용 n / 총 m · 잔여 r` (SSOT: formatSessionUsageSummary).
 * 공간 부족 시 취소·재예약 안내는 Info 툴팁으로 노출.
 *
 * @author MindGarden
 */
const SessionProgressIndicator = ({
  used = 0,
  total = 0,
  remaining,
  hasCancelHistory = false,
  className = ''
}) => {
  const safeUsed = Math.max(0, Number(used) || 0);
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeRemaining = remaining == null
    ? Math.max(0, safeTotal - safeUsed)
    : Math.max(0, Number(remaining) || 0);

  const isInfinite = safeTotal === 0;
  const percent = isInfinite ? 0 : Math.min(100, Math.round((safeUsed / safeTotal) * 100));

  let statusClass = 'mg-v2-session-progress--active';
  if (!isInfinite && safeUsed >= safeTotal) {
    statusClass = 'mg-v2-session-progress--completed';
  } else if (safeUsed === 0) {
    statusClass = 'mg-v2-session-progress--pending';
  }

  const progressAria = formatSessionUsageAriaLabel(safeUsed, safeTotal, safeRemaining);
  const rootClassName = ['mg-v2-session-progress', statusClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClassName}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={progressAria}
      data-testid="session-progress-indicator"
    >
      <div className="mg-v2-session-progress__bar-bg">
        <div
          className="mg-v2-session-progress__bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="mg-v2-session-progress__text">
        {'사용 '}
        <span className="mg-v2-session-progress__used">{safeUsed}</span>
        {` / 총 ${safeTotal} · 잔여 `}
        <span className="mg-v2-session-progress__remaining">{safeRemaining}</span>
      </span>
      {hasCancelHistory && (
        <span
          className="mg-v2-session-progress__hint"
          title={SESSION_CANCEL_RESTORE_HINT}
          aria-label={SESSION_CANCEL_RESTORE_HINT_ARIA}
          data-testid="session-progress-cancel-hint"
        >
          <Info size={14} aria-hidden="true" className="mg-v2-session-progress__hint-icon" />
        </span>
      )}
    </div>
  );
};

SessionProgressIndicator.propTypes = {
  used: PropTypes.number,
  total: PropTypes.number,
  remaining: PropTypes.number,
  hasCancelHistory: PropTypes.bool,
  className: PropTypes.string
};

SessionProgressIndicator.defaultProps = {
  used: 0,
  total: 0,
  remaining: undefined,
  hasCancelHistory: false,
  className: ''
};

export default SessionProgressIndicator;
