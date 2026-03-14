/**
 * RemainingSessionsBadge - 남은 회기 배지 ("N회 남음")
 * @param {number} remainingSessions - 남은 회기 수
 */

import React from 'react';
import PropTypes from 'prop-types';
import './RemainingSessionsBadge.css';

const RemainingSessionsBadge = ({ remainingSessions }) => {
  if (remainingSessions == null || remainingSessions < 0) return null;
  return (
    <span className="integrated-schedule__card-remaining integrated-schedule__card-remaining-badge">
      {remainingSessions}회 남음
    </span>
  );
};

RemainingSessionsBadge.propTypes = {
  remainingSessions: PropTypes.number
};

RemainingSessionsBadge.defaultProps = {
  remainingSessions: null
};

export default RemainingSessionsBadge;
