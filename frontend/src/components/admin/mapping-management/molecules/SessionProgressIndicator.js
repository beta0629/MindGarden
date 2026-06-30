import React from 'react';
import './SessionProgressIndicator.css';

const SessionProgressIndicator = ({ used = 0, total = 0 }) => {
  const safeUsed = Math.max(0, used);
  const safeTotal = Math.max(0, total);
  
  const isInfinite = safeTotal === 0;
  const percent = isInfinite ? 0 : Math.min(100, Math.round((safeUsed / safeTotal) * 100));

  let statusClass = 'mg-v2-session-progress--active';
  if (!isInfinite && safeUsed >= safeTotal) {
    statusClass = 'mg-v2-session-progress--completed';
  } else if (safeUsed === 0) {
    statusClass = 'mg-v2-session-progress--pending';
  }

  return (
    <div className={`mg-v2-session-progress ${statusClass}`}>
      <div className="mg-v2-session-progress__bar-bg">
        <div 
          className="mg-v2-session-progress__bar-fill" 
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="mg-v2-session-progress__text">
        {used}/{total}회
      </span>
    </div>
  );
};

export default SessionProgressIndicator;
