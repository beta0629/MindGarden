/**
 * RemainingSessionsBadge - 남은 회기 수 배지
 * remainingSessions가 null 또는 < 0이면 렌더링하지 않음
 *
 * @author MindGarden
 * @since 2025-03-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import './RemainingSessionsBadge.css';

function RemainingSessionsBadge({ remainingSessions }) {
  if (remainingSessions == null || remainingSessions < 0) {
    return null;
  }

  return (
    <span className="mg-v2-count-badge">
      {remainingSessions}회 남음
    </span>
  );
}

RemainingSessionsBadge.propTypes = {
  remainingSessions: PropTypes.number
};

RemainingSessionsBadge.defaultProps = {
  remainingSessions: null
};

export default RemainingSessionsBadge;
