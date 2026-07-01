/**
 * ScheduleDensityToggle — 통합일정 사이드바 카드 밀도 토글 (comfortable default)
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import PropTypes from 'prop-types';
import SegmentedTabs from '../../../../common/SegmentedTabs';
import {
  SCHEDULE_DENSITY_COMFORTABLE,
  SCHEDULE_DENSITY_COMPACT,
  SCHEDULE_DENSITY_OPTIONS
} from '../../constants/integratedScheduleDensityConstants';

const ScheduleDensityToggle = ({ value, onChange }) => (
  <div className="integrated-schedule__density-toggle">
    <span className="integrated-schedule__density-toggle-label" id="integrated-schedule-density-label">
      카드 밀도
    </span>
    <SegmentedTabs
      items={SCHEDULE_DENSITY_OPTIONS}
      activeValue={value}
      onChange={onChange}
      ariaLabel="매칭 카드 밀도"
      size="sm"
      className="integrated-schedule__density-toggle-tabs"
    />
  </div>
);

ScheduleDensityToggle.propTypes = {
  value: PropTypes.oneOf([SCHEDULE_DENSITY_COMFORTABLE, SCHEDULE_DENSITY_COMPACT]).isRequired,
  onChange: PropTypes.func.isRequired
};

export default ScheduleDensityToggle;
