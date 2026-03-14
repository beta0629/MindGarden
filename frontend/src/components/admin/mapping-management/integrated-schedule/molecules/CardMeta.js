/**
 * CardMeta - StatusBadge + RemainingSessionsBadge
 * @param {string} status - 매칭 상태
 * @param {number} remainingSessions - 남은 회기 수
 */

import React from 'react';
import PropTypes from 'prop-types';
import StatusBadge from '../atoms/StatusBadge';
import RemainingSessionsBadge from '../atoms/RemainingSessionsBadge';
import './CardMeta.css';

const CardMeta = ({ status, remainingSessions }) => (
  <div className="integrated-schedule__card-meta">
    <StatusBadge status={status} />
    <RemainingSessionsBadge remainingSessions={remainingSessions} />
  </div>
);

CardMeta.propTypes = {
  status: PropTypes.string,
  remainingSessions: PropTypes.number
};

CardMeta.defaultProps = {
  status: '',
  remainingSessions: null
};

export default CardMeta;
