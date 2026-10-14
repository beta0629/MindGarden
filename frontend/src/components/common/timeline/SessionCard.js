/**
 * 타임라인의 한 줄 회기 카드. 누르면 상세를 연다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

import React from 'react';
import PropTypes from 'prop-types';
import './SessionCard.css';

const SessionCard = ({
  buttonId,
  dateText,
  sessionText,
  summary,
  selected,
  controlsId,
  onSelect,
  status,
  srText
}) => (
  <button
    type="button"
    id={buttonId}
    className="mg-v2-session-card"
    aria-current={selected ? 'true' : undefined}
    aria-controls={controlsId || undefined}
    onClick={onSelect}
  >
    <span className="mg-v2-session-card__date">{dateText}</span>
    {sessionText ? <span className="mg-v2-session-card__session">{sessionText}</span> : <span className="mg-v2-session-card__session" />}
    <span className="mg-v2-session-card__status">{status}</span>
    <span className="mg-v2-session-card__summary" title={summary}>{summary}</span>
    {srText ? <span className="sr-only">{srText}</span> : null}
  </button>
);

SessionCard.propTypes = {
  buttonId: PropTypes.string.isRequired,
  dateText: PropTypes.string.isRequired,
  sessionText: PropTypes.string,
  summary: PropTypes.string,
  selected: PropTypes.bool,
  controlsId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  status: PropTypes.node,
  srText: PropTypes.string
};

SessionCard.defaultProps = {
  sessionText: '',
  summary: '',
  selected: false,
  controlsId: '',
  status: null,
  srText: ''
};

export default SessionCard;
