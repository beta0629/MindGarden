/**
 * ScheduleReminderSmsBadge — 내담자 예약 문자 발송 상태 molecule
 *
 * SENT/PENDING/FAILED 만 표시. N/A·SKIPPED·없음 → null.
 * Push SmsLogStatusBadge 직접 사용 금지 — 스케줄 정책(숨김·툴팁·라벨)은 본 molecule 책임.
 *
 * @author MindGarden
 * @since 2026-08-01
 */

import React from 'react';
import PropTypes from 'prop-types';
import Badge from '../../../../common/Badge';
import SafeText from '../../../../common/SafeText';
import { resolveScheduleReminderSmsDisplay } from '../utils/scheduleReminderSmsDisplay';
import './ScheduleReminderSmsBadge.css';

const BASE_CLASS = 'integrated-schedule__reminder-sms-badge';

/**
 * @param {object} props
 * @param {object|null} [props.sms] - clientReminderSms DTO
 * @param {boolean} [props.compact] - 색점(6px) + 툴팁
 * @param {boolean} [props.stopPropagation] - 캘린더 클릭 전파 차단
 * @param {string} [props.className]
 */
const ScheduleReminderSmsBadge = ({
  sms,
  compact,
  stopPropagation,
  className
}) => {
  const display = resolveScheduleReminderSmsDisplay(sms);
  if (!display) {
    return null;
  }

  const handleClick = (event) => {
    if (stopPropagation && event) {
      event.stopPropagation();
    }
  };

  const handleKeyDown = (event) => {
    if (stopPropagation && event) {
      event.stopPropagation();
    }
  };

  const rootClass = [
    BASE_CLASS,
    compact ? `${BASE_CLASS}--compact` : `${BASE_CLASS}--label`,
    display.status === 'FAILED' ? `${BASE_CLASS}--emphasis` : '',
    className
  ].filter(Boolean).join(' ');

  if (compact) {
    return (
      <span
        className={rootClass}
        title={display.tooltip}
        aria-label={display.ariaLabel}
        role="img"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span
          className={`${BASE_CLASS}__dot ${BASE_CLASS}__dot--${display.statusVariant}`}
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <span
      className={rootClass}
      title={display.tooltip}
      aria-label={display.ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <Badge
        variant="status"
        size="sm"
        statusVariant={display.statusVariant}
        className={`${BASE_CLASS}__pill`}
      >
        <SafeText>{display.label}</SafeText>
      </Badge>
    </span>
  );
};

ScheduleReminderSmsBadge.propTypes = {
  sms: PropTypes.shape({
    status: PropTypes.string,
    fireAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    sentAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    failureReason: PropTypes.string
  }),
  compact: PropTypes.bool,
  stopPropagation: PropTypes.bool,
  className: PropTypes.string
};

ScheduleReminderSmsBadge.defaultProps = {
  sms: null,
  compact: false,
  stopPropagation: false,
  className: ''
};

export default ScheduleReminderSmsBadge;
