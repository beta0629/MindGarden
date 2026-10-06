/**
 * 일정 생성·일시 이동(캘린더 드래그·리사이즈·예약 변경 모달) 과거 시각 판정 SSOT.
 *
 * - 원래 일정: 완료·취소 상태이거나 시작 시각이 지났으면 이동 잠금(드래그 핸들 비활성).
 * - 이동 후 시각: 운영 타임존 현재 시각보다 이전이면 거부.
 * - 생성: 시작이 현재보다 이전이면 칸 선택 불가.
 * PUT 본문(buildScheduleDatetimeUpdateBody)과 같은 벽시계 값으로 판정한다.
 * 최종 판정은 서버(400 SCHEDULE_MOVE_FROM_PAST / SCHEDULE_MOVE_TO_PAST / SCHEDULE_CREATE_IN_PAST)가 한다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
import i18n from '../i18n';
import { extractServerErrorMessageFromError } from './ajax';
import { formatNowInSessionZone } from './scheduleSessionStart';
import {
  buildScheduleDatetimeUpdateBody,
  getScheduleCalendarDragLockedMessage,
  isScheduleStatusSlotLocked
} from './scheduleRescheduleUtils';

/** 서버 과거 이동·생성 거부 오류 코드 (ScheduleSlotGuard.Denial). */
export const SCHEDULE_MOVE_FROM_PAST_ERROR_CODE = 'SCHEDULE_MOVE_FROM_PAST';
export const SCHEDULE_MOVE_TO_PAST_ERROR_CODE = 'SCHEDULE_MOVE_TO_PAST';
export const SCHEDULE_CREATE_IN_PAST_ERROR_CODE = 'SCHEDULE_CREATE_IN_PAST';

export const SCHEDULE_PAST_TIME_ERROR_CODES = [
  SCHEDULE_MOVE_FROM_PAST_ERROR_CODE,
  SCHEDULE_MOVE_TO_PAST_ERROR_CODE,
  SCHEDULE_CREATE_IN_PAST_ERROR_CODE
];

/** 과거 시각 거부 안내 문구 i18n 키 */
export const SCHEDULE_MOVE_FROM_PAST_I18N_KEY = 'schedule:constants.scheduleMove.fromPast';
export const SCHEDULE_MOVE_TO_PAST_I18N_KEY = 'schedule:constants.scheduleMove.toPast';
export const SCHEDULE_CREATE_IN_PAST_I18N_KEY = 'schedule:constants.scheduleMove.createInPast';

const HTTP_BAD_REQUEST = 400;

const PAST_TIME_I18N_BY_CODE = {
  [SCHEDULE_MOVE_FROM_PAST_ERROR_CODE]: SCHEDULE_MOVE_FROM_PAST_I18N_KEY,
  [SCHEDULE_MOVE_TO_PAST_ERROR_CODE]: SCHEDULE_MOVE_TO_PAST_I18N_KEY,
  [SCHEDULE_CREATE_IN_PAST_ERROR_CODE]: SCHEDULE_CREATE_IN_PAST_I18N_KEY
};

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

/**
 * 로컬 달력일 00:00. 카드 «일정 등록»처럼 시각이 없는 기본 날짜에 쓴다.
 * 날짜만 있는 값(자정)은 당일 허용·전날 거부 판정과 짝을 이룬다.
 *
 * @param {Date} [from]
 * @returns {Date}
 */
export const startOfLocalCalendarDay = (from = new Date()) => {
  const day = from instanceof Date ? new Date(from.getTime()) : new Date();
  if (Number.isNaN(day.getTime())) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  day.setHours(0, 0, 0, 0);
  return day;
};

/**
 * 'YYYY-MM-DD' + 'HH:mm' 대상이 현재(운영 타임존)보다 이전인지.
 *
 * @param {string} dateKey YYYY-MM-DD
 * @param {string} timeKey HH:mm
 * @param {Date} [now]
 * @returns {boolean} 판정 불가(빈 값)면 false — 서버가 최종 판정
 */
export const isScheduleMoveTargetKeyInPast = (dateKey, timeKey, now = new Date()) => {
  if (!dateKey || !timeKey) {
    return false;
  }
  const targetKey = `${dateKey}T${timeKey}`;
  const nowKey = formatNowInSessionZone(now);
  // 대상은 HH:mm:00 — 같은 분이라도 현재가 초 이상 지났으면 서버(초 단위 비교)와 같이 과거
  const nowHasSeconds = now.getSeconds() > 0 || now.getMilliseconds() > 0;
  return targetKey < nowKey || (targetKey === nowKey && nowHasSeconds);
};

/**
 * 시작 시각(로컬 Date, FullCalendar·모달 값)이 현재보다 이전인지.
 *
 * @param {Date|string|number|null|undefined} targetStart
 * @param {Date} [now]
 * @returns {boolean}
 */
export const isScheduleMoveTargetInPast = (targetStart, now = new Date()) => {
  if (targetStart == null) {
    return false;
  }
  const start = targetStart instanceof Date ? targetStart : new Date(targetStart);
  if (!isValidDate(start)) {
    return false;
  }
  const { date, startTime } = buildScheduleDatetimeUpdateBody(start, start);
  return isScheduleMoveTargetKeyInPast(date, startTime, now);
};

/**
 * 판정할 이동 대상 시각 (서버 SchedulePastTimeGate.resolveMoveTarget 과 동일 규칙).
 * 시작이 바뀌면 새 시작, 시작은 그대로이고 종료만 바뀌면(리사이즈) 새 종료.
 *
 * @param {Date|null|undefined} originalStart 이동 전 시작
 * @param {Date|null|undefined} newStart 이동 후 시작
 * @param {Date|null|undefined} newEnd 이동 후 종료
 * @returns {Date|null|undefined}
 */
export const resolveScheduleMoveTarget = (originalStart, newStart, newEnd) => {
  const startUnchanged = isValidDate(originalStart) && isValidDate(newStart)
    && originalStart.getTime() === newStart.getTime();
  return startUnchanged && isValidDate(newEnd) ? newEnd : newStart;
};

/**
 * FullCalendar eventAllow 의 드롭 대상 시작 시각.
 * 월간(종일 칸)에 시간 일정을 놓으면 날짜만 바뀌고 시각은 유지되므로 원래 시각을 붙인다.
 *
 * @param {{ start?: Date, allDay?: boolean }|null|undefined} dropInfo
 * @param {{ start?: Date|null, allDay?: boolean }|null|undefined} draggedEvent
 * @returns {Date|null}
 */
export const resolveCalendarDropTargetStart = (dropInfo, draggedEvent) => {
  const dropStart = dropInfo?.start;
  if (!isValidDate(dropStart)) {
    return null;
  }
  const original = draggedEvent?.start;
  if (dropInfo.allDay === true && draggedEvent?.allDay !== true && isValidDate(original)) {
    const target = new Date(dropStart.getTime());
    target.setHours(original.getHours(), original.getMinutes(), 0, 0);
    return target;
  }
  return dropStart;
};

/**
 * 원래 일정 이동이 잠겼는지 (완료·취소 또는 시작 시각이 지남).
 *
 * @param {{ status?: *, start?: * }} params
 * @param {Date} [now]
 * @returns {boolean}
 */
export const isScheduleMoveSourceLocked = ({ status, start } = {}, now = new Date()) =>
  isScheduleStatusSlotLocked(status) || isScheduleMoveTargetInPast(start, now);

/**
 * 원래 일정 이동 잠금 안내 문구. 없으면 null.
 *
 * @param {{ status?: *, start?: * }} params
 * @param {Date} [now]
 * @returns {string|null}
 */
export const getScheduleMoveSourceLockedMessage = ({ status, start } = {}, now = new Date()) => {
  const statusMessage = getScheduleCalendarDragLockedMessage({ status });
  if (statusMessage) {
    return statusMessage;
  }
  if (isScheduleMoveTargetInPast(start, now)) {
    return getScheduleMoveFromPastMessage();
  }
  return null;
};

/**
 * 기존 title 에 이동 잠금 사유를 붙인다 (캘린더 tooltip).
 *
 * @param {string} title
 * @param {string|null|undefined} lockMessage
 * @returns {string}
 */
export const appendScheduleMoveLockTooltip = (title, lockMessage) => {
  if (!lockMessage) {
    return title || '';
  }
  if (!title) {
    return lockMessage;
  }
  return `${title} — ${lockMessage}`;
};

export const getScheduleMoveFromPastMessage = () => i18n.t(SCHEDULE_MOVE_FROM_PAST_I18N_KEY);

export const getScheduleMoveToPastMessage = () => i18n.t(SCHEDULE_MOVE_TO_PAST_I18N_KEY);

export const getScheduleCreateInPastMessage = () => i18n.t(SCHEDULE_CREATE_IN_PAST_I18N_KEY);

const errorCodeOf = (error) => error?.response?.data?.errorCode;

/**
 * 서버가 과거 시각 이동·생성을 거부한 응답인지.
 *
 * @param {*} error StandardizedApi 오류
 * @returns {boolean}
 */
export const isSchedulePastTimeError = (error) =>
  error?.status === HTTP_BAD_REQUEST
  && SCHEDULE_PAST_TIME_ERROR_CODES.includes(errorCodeOf(error));

/** @deprecated isSchedulePastTimeError 사용 */
export const isScheduleMoveToPastError = (error) =>
  error?.status === HTTP_BAD_REQUEST
  && errorCodeOf(error) === SCHEDULE_MOVE_TO_PAST_ERROR_CODE;

/**
 * 이동·생성 실패 토스트 문구 — 3 errorCode 는 i18n, 그 외 400 은 서버 사유, 없으면 fallback.
 *
 * @param {*} error StandardizedApi 오류
 * @param {string} fallback 사유 없는 실패 문구
 * @returns {string}
 */
export const resolveScheduleMoveFailureMessage = (error, fallback) => {
  const i18nKey = PAST_TIME_I18N_BY_CODE[errorCodeOf(error)];
  if (error?.status === HTTP_BAD_REQUEST && i18nKey) {
    return i18n.t(i18nKey);
  }
  if (error?.status === HTTP_BAD_REQUEST) {
    const serverMessage = extractServerErrorMessageFromError(error);
    if (serverMessage) {
      return serverMessage;
    }
  }
  return fallback;
};
