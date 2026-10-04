/**
 * 일정 시작 여부 (상담일지 세션 완료 기본값용).
 *
 * 회기 차감·완료 판정 권한은 서버(ScheduleSessionStartGate)에 있다. 화면은 시작 전 일정의
 * 새 일지 기본값을 '완료'로 두지 않기 위해서만 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
import { CONSULTATION_LOG_SESSION_START_TIME_ZONE } from '../constants/consultationLogAutosaveConstants';

const pad2 = (n) => String(n).padStart(2, '0');

const toDateKey = (date) => {
  if (Array.isArray(date) && date.length >= 3) {
    return `${date[0]}-${pad2(date[1])}-${pad2(date[2])}`;
  }
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10);
  }
  return null;
};

const toTimeKey = (time) => {
  if (time == null || time === '') {
    return '00:00';
  }
  if (Array.isArray(time) && time.length >= 2) {
    return `${pad2(time[0])}:${pad2(time[1])}`;
  }
  const text = String(time);
  const hm = (text.includes('T') ? text.split('T')[1] : text).slice(0, 5);
  return /^\d{2}:\d{2}$/.test(hm) ? hm : null;
};

/**
 * 판정 타임존 기준 현재 시각 'YYYY-MM-DDTHH:mm'.
 *
 * @param {Date} now
 * @returns {string}
 */
export const formatNowInSessionZone = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CONSULTATION_LOG_SESSION_START_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
};

/**
 * 일정이 시작됐는지 (date + startTime, startTime 없으면 그날 00:00).
 * 날짜를 읽을 수 없으면 true — 서버 판정에 맡긴다.
 *
 * @param {{ date?: *, startTime?: * }|null|undefined} schedule
 * @param {Date} [now]
 * @returns {boolean}
 */
export const hasScheduleSessionStarted = (schedule, now = new Date()) => {
  const dateKey = toDateKey(schedule?.date);
  const timeKey = toTimeKey(schedule?.startTime);
  if (!dateKey || !timeKey) {
    return true;
  }
  return formatNowInSessionZone(now) >= `${dateKey}T${timeKey}`;
};

/** 서버 시작 전 완료 거부 오류 코드 (ScheduleSessionStartGate.COMPLETION_BEFORE_START_ERROR_CODE). */
export const SCHEDULE_SESSION_NOT_STARTED_ERROR_CODE = 'SCHEDULE_SESSION_NOT_STARTED';

/**
 * 관리자·수동 완료 버튼 활성 여부 — 시작 전 일정은 비활성(툴팁 안내).
 * 최종 판정은 서버가 한다(시작 전 완료 요청은 400).
 *
 * @param {{ date?: *, startTime?: * }|null|undefined} schedule
 * @param {Date} [now]
 * @returns {boolean}
 */
export const canCompleteScheduleNow = (schedule, now = new Date()) =>
  hasScheduleSessionStarted(schedule, now);

/**
 * 서버가 시작 전 완료를 거부한 응답인지.
 *
 * @param {*} error StandardizedApi 오류
 * @returns {boolean}
 */
export const isScheduleSessionNotStartedError = (error) =>
  error?.status === 400 && error?.response?.data?.errorCode === SCHEDULE_SESSION_NOT_STARTED_ERROR_CODE;
