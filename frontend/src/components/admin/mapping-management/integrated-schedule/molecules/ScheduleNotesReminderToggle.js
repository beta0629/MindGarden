/**
 * ScheduleNotesReminderToggle — 통합 스케줄 특이사항 시작 알림 스위치
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ScheduleNotesReminderToggle.css';

const LABEL = '시작 전 특이사항 알림';

const ScheduleNotesReminderToggle = ({
  enabled = false,
  onChange,
  disabled = false
}) => {
  const handleClick = () => {
    if (disabled) return;
    onChange(!enabled);
  };

  return (
    <div className="integrated-schedule__notes-reminder-toggle">
      <span className="integrated-schedule__notes-reminder-toggle-label">
        {LABEL}
      </span>
      <button
        type="button"
        role="switch"
        className={`integrated-schedule__notes-reminder-switch${
          enabled ? ' integrated-schedule__notes-reminder-switch--on' : ''
        }`}
        aria-checked={enabled}
        aria-label={enabled ? `${LABEL} 끄기` : `${LABEL} 켜기`}
        title={enabled ? `${LABEL} 끄기` : `${LABEL} 켜기`}
        onClick={handleClick}
        disabled={disabled}
      >
        <span className="integrated-schedule__notes-reminder-switch-thumb" aria-hidden="true" />
      </button>
    </div>
  );
};

ScheduleNotesReminderToggle.propTypes = {
  enabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default ScheduleNotesReminderToggle;
