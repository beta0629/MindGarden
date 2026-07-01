import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../../utils/safeDisplay';
import './SessionProgressIndicator.css';

const SessionProgressIndicator = ({ used = 0, total = 0, className = '' }) => {
  const safeUsed = Math.max(0, Number(used) || 0);
  const safeTotal = Math.max(0, Number(total) || 0);

  const isInfinite = safeTotal === 0;
  const percent = isInfinite ? 0 : Math.min(100, Math.round((safeUsed / safeTotal) * 100));

  let statusClass = 'mg-v2-session-progress--active';
  if (!isInfinite && safeUsed >= safeTotal) {
    statusClass = 'mg-v2-session-progress--completed';
  } else if (safeUsed === 0) {
    statusClass = 'mg-v2-session-progress--pending';
  }

  const progressLabel = `${toDisplayString(safeUsed, '0')}/${toDisplayString(safeTotal, '0')}회`;
  const rootClassName = ['mg-v2-session-progress', statusClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClassName}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`회기 진행 ${progressLabel}`}
      data-testid="session-progress-indicator"
    >
      <div className="mg-v2-session-progress__bar-bg">
        <div
          className="mg-v2-session-progress__bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="mg-v2-session-progress__text">
        {progressLabel}
      </span>
    </div>
  );
};

SessionProgressIndicator.propTypes = {
  used: PropTypes.number,
  total: PropTypes.number,
  className: PropTypes.string
};

SessionProgressIndicator.defaultProps = {
  used: 0,
  total: 0,
  className: ''
};

export default SessionProgressIndicator;
