/**
 * 일정 일시 이동(캘린더 드래그·리사이즈·예약 변경 모달) 허용 판정 SSOT.
 *
 * - 원래 일정: 완료·취소 상태만 잠근다. 원래 시각이 지났다는 이유로는 잠그지 않는다
 *   (잘못 지난 시각으로 옮겨진 일정도 화면에서 미래로 다시 옮길 수 있어야 한다).
 * - 이동 후 시각: 운영 타임존(서버 ScheduleMoveTargetGate 와 동일) 현재 시각보다 이전이면 거부.
 *   PUT 본문(buildScheduleDatetimeUpdateBody)과 같은 벽시계 값으로 판정한다.
 * 최종 판정은 서버(400 SCHEDULE_MOVE_TO_PAST)가 한다.
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

/** 서버 과거 이동 거부 오류 코드 (ScheduleMoveTargetGate.MOVE_TO_PAST_ERROR_CODE). */
export const SCHEDULE_MOVE_TO_PAST_ERROR_CODE = 'SCHEDULE_MOVE_TO_PAST';

/** 과거 시각 이동 거부 안내 문구 i18n 키 */
export const SCHEDULE_MOVE_TO_PAST_I18N_KEY = 'schedule:constants.scheduleMove.toPast';

const HTTP_BAD_REQUEST = 400;

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

/**
 * 'YYYY-MM-DD' + 'HH:mm' 이동 대상이 현재(운영 타임존)보다 이전인지.
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
 * 이동 후 시작 시각(로컬 Date, FullCalendar·모달 값)이 현재보다 이전인지.
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
 * 판정할 이동 대상 시각 (서버 ScheduleMoveTargetGate.resolveMoveTarget 과 동일 규칙).
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
 * 원래 일정 상태로 이동이 잠겼는지 (완료·취소만).
 *
 * @param {{ status?: * }} params
 * @returns {boolean}
 */
export const isScheduleMoveSourceLocked = ({ status } = {}) => isScheduleStatusSlotLocked(status);

/**
 * 원래 일정 상태 잠금 안내 문구 (완료·취소), 없으면 null.
 *
 * @param {{ status?: * }} params
 * @returns {string|null}
 */
export const getScheduleMoveSourceLockedMessage = ({ status } = {}) =>
  getScheduleCalendarDragLockedMessage({ status });

/**
 * 과거 시각 이동 거부 안내 문구.
 *
 * @returns {string}
 */
export const getScheduleMoveToPastMessage = () => i18n.t(SCHEDULE_MOVE_TO_PAST_I18N_KEY);

/**
 * 서버가 과거 이동을 거부한 응답인지.
 *
 * @param {*} error StandardizedApi 오류
 * @returns {boolean}
 */
export const isScheduleMoveToPastError = (error) =>
  error?.status === HTTP_BAD_REQUEST
  && error?.response?.data?.errorCode === SCHEDULE_MOVE_TO_PAST_ERROR_CODE;

/**
 * 이동 실패 토스트 문구 — 과거 이동은 안내 문구, 그 외 400 은 서버 사유, 없으면 fallback.
 *
 * @param {*} error StandardizedApi 오류
 * @param {string} fallback 사유 없는 실패 문구
 * @returns {string}
 */
export const resolveScheduleMoveFailureMessage = (error, fallback) => {
  if (isScheduleMoveToPastError(error)) {
    return getScheduleMoveToPastMessage();
  }
  if (error?.status === HTTP_BAD_REQUEST) {
    const serverMessage = extractServerErrorMessageFromError(error);
    if (serverMessage) {
      return serverMessage;
    }
  }
  return fallback;
};
