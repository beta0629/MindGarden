/**
 * Clinic-OS Cover+Chapter — 데이터 → 표시 모델 매퍼 (safeDisplay 경계)
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import { getNow } from '../../../utils/serverClock';
import { CONSULTANT_SCHEDULE_STATUS_LABELS } from '../../../constants/consultantDashboardConstants';
import {
  COVER_CHAPTER_KICKER_PREFIX,
  COVER_CHAPTER_CONSULTANT_SUFFIX,
  COVER_CHAPTER_ZERO_COVER_SUB,
  COVER_CHAPTER_BADGE_CONFIRMED,
  COVER_CHAPTER_PILL_DONE,
  COVER_CHAPTER_PILL_WAIT,
  COVER_CHAPTER_MODE_FACE,
  COVER_CHAPTER_MODE_VIDEO,
  COVER_CHAPTER_INCOMPLETE_HINT,
  COVER_CHAPTER_GUIDE_DEFAULT_TITLE,
  COVER_CHAPTER_GUIDE_EMPTY,
  COVER_CHAPTER_NEXT_WAITING_STATUSES
} from './consultantCoverChapterConstants';

const NEXT_WAITING_STATUS_SET = new Set(COVER_CHAPTER_NEXT_WAITING_STATUSES);

/** 칩 remaining 제외 — 서버 status 그대로 (시간 heal 금지) */
const TERMINAL_STATUS_SET = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW', 'CANCELED']);

/**
 * 시트 배지·행 pill 공통 — 서버 status → CONSULTANT_SCHEDULE_STATUS_LABELS
 *
 * @param {string|null|undefined} status
 * @returns {string}
 */
const resolveStatusLabel = (status) => {
  const statusKey = toDisplayString(status, '').toUpperCase();
  if (!statusKey) {
    return COVER_CHAPTER_PILL_WAIT;
  }
  return CONSULTANT_SCHEDULE_STATUS_LABELS[statusKey] || COVER_CHAPTER_PILL_WAIT;
};

/**
 * @param {Date} [date]
 * @returns {string}
 */
export const formatCoverDateLabel = (date = getNow()) => {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : getNow();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${COVER_CHAPTER_KICKER_PREFIX} · 오늘 ${month}월 ${day}일`;
};

/**
 * @param {string|null|undefined} status
 * @returns {boolean}
 */
export const isNextWaitingStatus = (status) => {
  const key = toDisplayString(status, '').toUpperCase();
  return NEXT_WAITING_STATUS_SET.has(key);
};

/**
 * 오늘(서버일) 일정 중 지금 이후 첫 대기/예정 건.
 * 01 일정 챕터와 동일 스케줄 배열 SSOT — preparation API 단독 판정 금지.
 *
 * @param {Array} schedules - 오늘 일정(이미 today 필터된 배열 권장)
 * @param {Date} [now]
 * @returns {object|null}
 */
export const selectNextWaitingSchedule = (schedules, now = getNow()) => {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return null;
  }
  const nowDate = now instanceof Date ? now : new Date(now);
  const nowTs = nowDate.getTime();
  if (Number.isNaN(nowTs)) {
    return null;
  }

  const candidates = schedules
    .filter((schedule) => {
      if (!schedule || schedule.startTime == null || schedule.startTime === '') {
        return false;
      }
      if (!isNextWaitingStatus(schedule.status)) {
        return false;
      }
      const start = new Date(schedule.startTime);
      if (Number.isNaN(start.getTime())) {
        return false;
      }
      return start.getTime() >= nowTs;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return candidates[0] ?? null;
};

/**
 * @param {string|null|undefined} name
 * @returns {string}
 */
export const formatConsultantDisplayName = (name) => {
  const base = toDisplayString(name, '상담사').trim();
  if (!base) {
    return `상담사 ${COVER_CHAPTER_CONSULTANT_SUFFIX}`.replace(/\s+/g, ' ').trim();
  }
  if (base.endsWith(COVER_CHAPTER_CONSULTANT_SUFFIX)) {
    return base;
  }
  return `${base} ${COVER_CHAPTER_CONSULTANT_SUFFIX}`;
};

/**
 * @param {*} timeValue
 * @returns {string} HH:mm
 */
export const formatClockHm = (timeValue) => {
  if (timeValue == null || timeValue === '') {
    return '';
  }
  if (Array.isArray(timeValue)) {
    const h = String(timeValue[0] || 0).padStart(2, '0');
    const m = String(timeValue[1] || 0).padStart(2, '0');
    return `${h}:${m}`;
  }
  if (typeof timeValue === 'string') {
    if (timeValue.includes('T')) {
      const part = timeValue.split('T')[1] || '';
      return part.substring(0, 5);
    }
    if (/^\d{1,2}:\d{2}/.test(timeValue)) {
      return timeValue.substring(0, 5);
    }
    const parsed = new Date(timeValue);
    if (!Number.isNaN(parsed.getTime())) {
      return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
    }
  }
  if (timeValue instanceof Date && !Number.isNaN(timeValue.getTime())) {
    return `${String(timeValue.getHours()).padStart(2, '0')}:${String(timeValue.getMinutes()).padStart(2, '0')}`;
  }
  return '';
};

/**
 * @param {*} start
 * @param {*} end
 * @returns {number|null}
 */
export const computeDurationMinutes = (start, end) => {
  const toDate = (v) => {
    if (v == null || v === '') return null;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
    if (Array.isArray(v)) {
      const today = new Date();
      return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        v[0] || 0,
        v[1] || 0,
        v[2] || 0
      );
    }
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return null;
  const mins = Math.round((e.getTime() - s.getTime()) / 60000);
  return mins > 0 ? mins : null;
};

/**
 * @param {object|null|undefined} schedule
 * @returns {string}
 */
export const resolveConsultationMode = (schedule) => {
  if (!schedule || typeof schedule !== 'object') {
    return COVER_CHAPTER_MODE_FACE;
  }
  const raw = toDisplayString(
    schedule.consultationType
      ?? schedule.sessionType
      ?? schedule.meetingType
      ?? schedule.type
      ?? '',
    ''
  ).toUpperCase();
  if (
    schedule.isOnline === true
    || schedule.video === true
    || /VIDEO|ONLINE|ZOOM|화상|비대면/.test(raw)
  ) {
    return COVER_CHAPTER_MODE_VIDEO;
  }
  return COVER_CHAPTER_MODE_FACE;
};

/**
 * @param {object|null|undefined} schedule
 * @returns {string}
 */
export const resolveLocationLabel = (schedule) => {
  if (!schedule || typeof schedule !== 'object') {
    return '';
  }
  return toDisplayString(
    schedule.roomName
      ?? schedule.location
      ?? schedule.venue
      ?? schedule.placeName
      ?? '',
    ''
  );
};

/**
 * @param {object|null|undefined} schedule
 * @returns {string}
 */
export const resolvePackageOrTypeLabel = (schedule) => {
  if (!schedule || typeof schedule !== 'object') {
    return '';
  }
  return toDisplayString(
    schedule.packageName
      ?? schedule.consultationCategory
      ?? schedule.categoryName
      ?? '',
    ''
  );
};

/**
 * @param {object|null|undefined} nextConsultation
 * @param {number} todayCount
 * @returns {string}
 */
export const buildCoverSubtitle = (nextConsultation, todayCount) => {
  const count = toSafeNumber(todayCount, 0);
  if (!nextConsultation || count <= 0) {
    if (count <= 0) {
      return COVER_CHAPTER_ZERO_COVER_SUB;
    }
  }
  if (!nextConsultation) {
    return `오늘 상담 ${count}건`;
  }
  const hm = formatClockHm(nextConsultation.startTime);
  if (hm) {
    return `오늘 상담 ${count}건 · 다음 ${hm}`;
  }
  return `오늘 상담 ${count}건`;
};

/**
 * @param {object|null|undefined} consultation
 * @returns {object|null}
 */
export const mapNextConsultationSheet = (consultation) => {
  if (!consultation || typeof consultation !== 'object') {
    return null;
  }
  const hm = formatClockHm(consultation.startTime);
  const dayPrefix = consultation.isToday === false ? '내일' : '오늘';
  const timeLabel = hm ? `${dayPrefix} ${hm}` : dayPrefix;
  const clientName = toDisplayString(consultation.clientName, '내담자');
  const mode = resolveConsultationMode(consultation);
  const duration = computeDurationMinutes(consultation.startTime, consultation.endTime);
  const durationPart = duration != null ? ` ${duration}분` : '';
  const bodyLabel = `${clientName} · ${mode}${durationPart}`.trim();
  const location = resolveLocationLabel(consultation);
  const packageLabel = resolvePackageOrTypeLabel(consultation);
  const metaParts = [location, packageLabel].filter(Boolean);
  const statusKey = toDisplayString(consultation.status, 'CONFIRMED').toUpperCase();
  const badgeLabel = statusKey
    ? resolveStatusLabel(consultation.status)
    : COVER_CHAPTER_BADGE_CONFIRMED;

  return {
    scheduleId: consultation.scheduleId ?? consultation.id ?? null,
    clientId: consultation.clientId ?? null,
    timeLabel,
    bodyLabel,
    metaLabel: metaParts.join(' · '),
    badgeLabel
  };
};

/**
 * 행 pill = 서버 status 라벨 SSOT. isNext 로 「다음」 덮어쓰기 금지.
 * nextConsultation 은 셀렉터 강조용으로만 받으며 pill/sub 에 주입하지 않음.
 *
 * @param {Array} schedules - today's schedules
 * @param {object|null} [_nextConsultation]
 * @returns {Array}
 */
export const mapTodayScheduleRows = (schedules, _nextConsultation = null) => {
  if (!Array.isArray(schedules)) {
    return [];
  }
  void _nextConsultation;

  return schedules.map((schedule, idx) => {
    const id = schedule.id ?? schedule.scheduleId ?? `row-${idx}`;
    const idStr = String(id);
    const statusKey = toDisplayString(schedule.status, '').toUpperCase();
    const isCompleted = statusKey === 'COMPLETED';
    const isWait = statusKey === 'PENDING'
      || statusKey === 'WAITING'
      || statusKey === 'IN_PROGRESS';

    const pillLabel = resolveStatusLabel(schedule.status);
    const pillVariant = isWait ? 'wait' : 'default';

    const mode = resolveConsultationMode(schedule);
    const duration = computeDurationMinutes(schedule.startTime, schedule.endTime);
    const packageLabel = resolvePackageOrTypeLabel(schedule);
    const subParts = [mode];
    if (packageLabel) {
      subParts.push(packageLabel);
    }
    if (isCompleted) {
      subParts.push(COVER_CHAPTER_PILL_DONE);
    } else if (duration != null) {
      subParts.push(`${duration}분`);
    } else if (isWait) {
      subParts.push(resolveStatusLabel(schedule.status));
    }

    return {
      id: idStr,
      scheduleId: schedule.id ?? schedule.scheduleId ?? null,
      timeLabel: formatClockHm(schedule.startTime),
      clientName: toDisplayString(schedule.clientName, '내담자'),
      subLabel: subParts.join(' · '),
      pillLabel,
      pillVariant
    };
  });
};

/**
 * 칩 today/completed/remaining — 오늘 스케줄 배열 + 서버 now SSOT.
 * remaining/completed 를 stats.inProgressToday 에 종속시키지 않음.
 *
 * @param {Array} schedules
 * @param {Date} [now]
 * @param {object} [stats] today 보조(선택)
 * @returns {{ today: number, completed: number, remaining: number }}
 */
export const mapScheduleChips = (schedules, now = getNow(), stats = null) => {
  const list = Array.isArray(schedules) ? schedules : [];
  const todayFromSchedules = list.length;
  const today = todayFromSchedules > 0
    ? todayFromSchedules
    : toSafeNumber(stats?.totalToday ?? stats?.todaySchedules, 0);

  const completed = list.reduce((count, schedule) => {
    const statusKey = toDisplayString(schedule?.status, '').toUpperCase();
    return statusKey === 'COMPLETED' ? count + 1 : count;
  }, 0);

  const nowDate = now instanceof Date ? now : new Date(now);
  const nowTs = nowDate.getTime();
  const remaining = Number.isNaN(nowTs)
    ? 0
    : list.reduce((count, schedule) => {
      if (!schedule || schedule.startTime == null || schedule.startTime === '') {
        return count;
      }
      const statusKey = toDisplayString(schedule.status, '').toUpperCase();
      if (TERMINAL_STATUS_SET.has(statusKey) || !isNextWaitingStatus(statusKey)) {
        return count;
      }
      const start = new Date(schedule.startTime);
      if (Number.isNaN(start.getTime()) || start.getTime() < nowTs) {
        return count;
      }
      return count + 1;
    }, 0);

  return { today, completed, remaining };
};

/**
 * @param {Array} notifications
 * @param {number} incompleteCount
 * @returns {{ title: string, body: string }}
 */
export const mapGuideContent = (notifications, incompleteCount) => {
  const first = Array.isArray(notifications) && notifications.length > 0
    ? notifications[0]
    : null;
  const incomplete = toSafeNumber(incompleteCount, 0);

  if (first) {
    const title = toDisplayString(first.text ?? first.title, COVER_CHAPTER_GUIDE_DEFAULT_TITLE);
    const bodyFromNoti = toDisplayString(first.body ?? first.message ?? first.time, '');
    if (incomplete > 0) {
      return {
        title: title || COVER_CHAPTER_GUIDE_DEFAULT_TITLE,
        body: bodyFromNoti
          ? `${bodyFromNoti} · ${COVER_CHAPTER_INCOMPLETE_HINT(incomplete)}`
          : COVER_CHAPTER_INCOMPLETE_HINT(incomplete)
      };
    }
    return {
      title: title || COVER_CHAPTER_GUIDE_DEFAULT_TITLE,
      body: bodyFromNoti || COVER_CHAPTER_GUIDE_EMPTY
    };
  }

  if (incomplete > 0) {
    return {
      title: COVER_CHAPTER_GUIDE_DEFAULT_TITLE,
      body: COVER_CHAPTER_INCOMPLETE_HINT(incomplete)
    };
  }

  return {
    title: COVER_CHAPTER_GUIDE_DEFAULT_TITLE,
    body: COVER_CHAPTER_GUIDE_EMPTY
  };
};

/**
 * 오늘(서버 시각 SSOT) 자정 기준 일정만 필터
 * @param {Array} schedules
 * @param {Date} [todayMidnight]
 * @returns {Array}
 */
export const filterTodayOnlySchedules = (schedules, todayMidnight = getNow()) => {
  if (!Array.isArray(schedules)) {
    return [];
  }
  const base = new Date(todayMidnight);
  base.setHours(0, 0, 0, 0);
  const baseTs = base.getTime();

  return schedules.filter((schedule) => {
    if (!schedule?.startTime) return false;
    const d = new Date(schedule.startTime);
    if (Number.isNaN(d.getTime())) return false;
    d.setHours(0, 0, 0, 0);
    return d.getTime() === baseTs;
  });
};
