/**
 * CurrentTimeChip — 공통 GNB 가운데 Asia/Seoul 현재 시각 칩 (atom)
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import { useServerClock } from '../../../hooks/useServerClock';
import { DEFAULT_ZONE, formatDateTimeKeyInZone } from '../../../utils/zonedDateTime';
import './CurrentTimeChip.css';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
const TITLE_KST = 'KST';

const ClockIcon = ICONS.CLOCK;

/**
 * Asia/Seoul 기준 시각 parts.
 *
 * @param {Date} date
 * @param {string} [timeZone]
 * @returns {{ year: number, month: number, day: number, weekday: number, hour23: number, minute: number, hour12: number, isPm: boolean }}
 */
export const getZonedClockParts = (date, timeZone = DEFAULT_ZONE) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour23 = Number(get('hour'));
  const isPm = hour23 >= 12;
  const hour12 = hour23 % 12 === 0 ? 12 : hour23 % 12;

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: weekdayMap[get('weekday')] ?? 0,
    hour23,
    minute: Number(get('minute')),
    hour12,
    isPm
  };
};

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * 현재 시각 칩 표시 문자열 (full / medium / compact).
 *
 * @param {Date} [date]
 * @param {string} [timeZone]
 * @returns {{ full: string, medium: string, compact: string, ariaLabel: string, dateTime: string }}
 */
export const formatCurrentTimeChipLabels = (date = new Date(), timeZone = DEFAULT_ZONE) => {
  const p = getZonedClockParts(date, timeZone);
  const weekday = WEEKDAY_KO[p.weekday] ?? '';
  const meridiem = p.isPm ? '오후' : '오전';
  const timePart = `${meridiem} ${p.hour12}:${pad2(p.minute)}`;
  const full = `${p.month}월 ${p.day}일 (${weekday}) ${timePart}`;
  const medium = `${p.month}/${p.day} (${weekday}) ${timePart}`;
  const compact = timePart;
  const dateTimeKey = formatDateTimeKeyInZone(date, timeZone);

  return {
    full,
    medium,
    compact,
    ariaLabel: full,
    dateTime: `${dateTimeKey}:00`
  };
};

const msUntilNextMinute = (date = new Date()) => {
  const elapsed = (date.getSeconds() * MS_PER_SECOND) + date.getMilliseconds();
  const remaining = MS_PER_MINUTE - elapsed;
  return remaining <= 0 ? MS_PER_MINUTE : remaining;
};

/**
 * @param {{ timeZone?: string, className?: string }} props
 */
const CurrentTimeChip = ({ timeZone = DEFAULT_ZONE, className = '' }) => {
  const { getNow } = useServerClock();
  const [now, setNow] = useState(() => getNow());

  useEffect(() => {
    let timeoutId;
    let intervalId;

    const clearTimers = () => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const tick = () => {
      setNow(getNow());
    };

    const arm = () => {
      clearTimers();
      timeoutId = setTimeout(() => {
        tick();
        intervalId = setInterval(tick, MS_PER_MINUTE);
      }, msUntilNextMinute(getNow()));
    };

    tick();
    arm();

    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        tick();
        arm();
      }
    };

    const onFocus = () => {
      tick();
      arm();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      clearTimers();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [getNow]);

  const labels = formatCurrentTimeChipLabels(now, timeZone);
  const rootClass = ['mg-v2-current-time-chip', className].filter(Boolean).join(' ');

  return (
    <time
      className={rootClass}
      dateTime={labels.dateTime}
      aria-label={labels.ariaLabel}
      title={TITLE_KST}
    >
      {ClockIcon ? (
        <span className="mg-v2-current-time-chip__icon" aria-hidden="true">
          <ClockIcon size={ICON_SIZES.MD} strokeWidth={2} className="mg-v2-current-time-chip__lucide" />
        </span>
      ) : null}
      <span className="mg-v2-current-time-chip__text">
        <span className="mg-v2-current-time-chip__label mg-v2-current-time-chip__label--full">
          {labels.full}
        </span>
        <span className="mg-v2-current-time-chip__label mg-v2-current-time-chip__label--medium">
          {labels.medium}
        </span>
        <span className="mg-v2-current-time-chip__label mg-v2-current-time-chip__label--compact">
          {labels.compact}
        </span>
      </span>
    </time>
  );
};

CurrentTimeChip.propTypes = {
  timeZone: PropTypes.string,
  className: PropTypes.string
};

export default CurrentTimeChip;
