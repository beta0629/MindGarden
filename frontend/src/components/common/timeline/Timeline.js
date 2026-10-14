/**
 * 공통 타임라인. 레일과 노드는 스타일만 그리고, 카드는 자식으로 받는다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Timeline.css';

const TimelineItem = ({ label, labelMissing, children }) => (
  <li className="mg-v2-timeline__item">
    {label ? (
      <p className="mg-v2-timeline__label">
        <span className={labelMissing ? 'mg-v2-timeline__label-text mg-v2-timeline__label-text--missing' : 'mg-v2-timeline__label-text'}>
          {label}
        </span>
      </p>
    ) : null}
    <div className="mg-v2-timeline__row">
      {children}
    </div>
  </li>
);

TimelineItem.propTypes = {
  label: PropTypes.string,
  labelMissing: PropTypes.bool,
  children: PropTypes.node
};

TimelineItem.defaultProps = {
  label: '',
  labelMissing: false,
  children: null
};

const Timeline = ({ ariaLabel, children }) => (
  <ol className="mg-v2-timeline" aria-label={ariaLabel}>
    {children}
  </ol>
);

Timeline.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  children: PropTypes.node
};

Timeline.defaultProps = {
  children: null
};

Timeline.Item = TimelineItem;

export default Timeline;
