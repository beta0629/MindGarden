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
import {
  formatDateTimeKeyInZone,
  parseScheduleDateKey,
  parseScheduleTimeKey
} from './zonedDateTime';
import logger from './logger';

/** 시작 시각 해석 실패 경고 — 화면은 버튼을 켜 두고 서버가 최종 판정한다. */
export const SCHEDULE_START_PARSE_FAILED_WARNING =
  '[scheduleSessionStart] 일정 시작 시각을 읽지 못해 화면 판정을 건너뜁니다(서버가 최종 판정)';

/**
 * 판정 타임존 기준 현재 시각 'YYYY-MM-DDTHH:mm'.
 *
 * @param {Date} now
 * @returns {string}
 */
export const formatNowInSessionZone = (now = new Date()) =>
  formatDateTimeKeyInZone(now, CONSULTATION_LOG_SESSION_START_TIME_ZONE);

/** 값이 있는 첫 후보 (null·undefined·'' 는 건너뜀). */
const pickPresent = (...values) => values.find((value) => value != null && value !== '');

/**
 * 일정이 시작됐는지 (date + startTime, startTime 없으면 그날 00:00).
 * API 원본 필드(apiDate·apiStartTime)를 표시용 필드(date·startTime)보다 먼저 읽는다.
 * 시각은 zonedDateTime.parseScheduleTimeKey 로만 읽는다('오후 07:00', 'HH:mm[:ss]', ISO).
 * startTime 이 오프셋 ISO 이고 date 가 없으면 startTime 의 운영 타임존 날짜를 쓴다.
 * 날짜·시각을 읽을 수 없으면 경고를 남기고 true — 최종 판정은 서버(SCHEDULE_SESSION_NOT_STARTED).
 *
 * @param {{ apiDate?: *, date?: *, sessionDate?: *, apiStartTime?: *, startTime?: * }|null|undefined} schedule
 * @param {Date} [now]
 * @returns {boolean}
 */
export const hasScheduleSessionStarted = (schedule, now = new Date()) => {
  if (schedule == null) {
    return true;
  }
  const zone = CONSULTATION_LOG_SESSION_START_TIME_ZONE;
  const rawStart = pickPresent(schedule.apiStartTime, schedule.startTime);
  const rawDate = pickPresent(schedule.apiDate, schedule.date, schedule.sessionDate);
  const dateKey = parseScheduleDateKey(rawDate, zone)
    ?? (typeof rawStart === 'string' && rawStart.includes('T') ? parseScheduleDateKey(rawStart, zone) : null);
  const timeKey = rawStart == null ? '00:00' : parseScheduleTimeKey(rawStart, zone);
  if (!dateKey || !timeKey) {
    logger.warn(SCHEDULE_START_PARSE_FAILED_WARNING, { date: rawDate ?? null, startTime: rawStart ?? null });
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
