/**
 * 상담일지 완료/미완료. 글자와 도형을 같이 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-10
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ConsultationLogStatusBadge.css';

const ConsultationLogStatusBadge = ({ done, doneLabel, pendingLabel }) => {
  const className = done
    ? 'mg-v2-consultation-log-status mg-v2-consultation-log-status--done'
    : 'mg-v2-consultation-log-status mg-v2-consultation-log-status--pending';
  return (
    <span className={className}>
      <span className="mg-v2-consultation-log-status__shape" aria-hidden="true" />
      <span>{done ? doneLabel : pendingLabel}</span>
    </span>
  );
};

ConsultationLogStatusBadge.propTypes = {
  done: PropTypes.bool,
  doneLabel: PropTypes.string.isRequired,
  pendingLabel: PropTypes.string.isRequired
};

ConsultationLogStatusBadge.defaultProps = {
  done: false
};

export default ConsultationLogStatusBadge;
