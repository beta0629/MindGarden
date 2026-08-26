/**
 * 스케줄 상세 ActionBar — 가예약(TENTATIVE_PENDING_PAYMENT) 과거 슬롯의
 * 「당일 결제 + 활성화」 enablement SSOT.
 *
 * 정책:
 * - 가예약 + 세션 종료 시각 지남 → 당일결제 CTA 활성, 확정(schedule confirm) 비노출, 예약변경 비활성, 취소 유지
 * - 가예약 + 세션 전 → 기존 확정+취소+예약변경 (당일결제 CTA 없음)
 * - 확정/결제완료(과거 포함) → 당일결제 CTA 없음
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import {
  combineDateAndTimeHm,
  isScheduleSlotInPast
} from './scheduleRescheduleUtils';
import { normalizeCalendarSessionStatusCode, STATUS } from '../constants/schedule';

/** @type {string} */
export const TENTATIVE_PENDING_PAYMENT_STATUS = 'TENTATIVE_PENDING_PAYMENT';

/**
 * 가예약 상태 여부 — statusCode / status / 한글 라벨 모두 허용.
 * normalizeCalendarSessionStatusCode 는 "가예약"을 BOOKED 로 오분류할 수 있어 선행 분기한다.
 *
 * @param {*} statusLike
 * @returns {boolean}
 */
export function isTentativePendingPaymentStatus(statusLike) {
  if (statusLike == null || statusLike === '') {
    return false;
  }
  const raw = String(statusLike).trim();
  if (raw.toUpperCase() === TENTATIVE_PENDING_PAYMENT_STATUS) {
    return true;
  }
  return /가예약|TENTATIVE_PENDING_PAYMENT|결제\s*대기\s*\(가예약\)/.test(raw);
}

/**
 * scheduleLike 에서 상태 후보를 모아 가예약 여부를 판정한다.
 *
 * @param {object|null|undefined} scheduleLike
 * @returns {boolean}
 */
export function isScheduleTentativePendingPayment(scheduleLike) {
  if (!scheduleLike || typeof scheduleLike !== 'object') {
    return false;
  }
  const candidates = [
    scheduleLike.statusCode,
    scheduleLike.status,
    scheduleLike.extendedProps?.status,
    scheduleLike.extendedProps?.statusCode
  ];
  return candidates.some((c) => isTentativePendingPaymentStatus(c));
}

/**
 * HH:mm 형태인지 (한글 locale 시간 문자열 제외).
 *
 * @param {*} timeLike
 * @returns {boolean}
 */
function isHmTimeString(timeLike) {
  if (timeLike == null) {
    return false;
  }
  return /^\d{1,2}:\d{2}/.test(String(timeLike).trim());
}

/**
 * scheduleLike 에서 슬롯 start/end Date 를 해석한다.
 * ISO start/end 우선, 없으면 date/sessionDate/apiDate + apiStartTime/apiEndTime(또는 HH:mm startTime/endTime).
 *
 * @param {object|null|undefined} scheduleLike
 * @returns {{ start: Date|null, end: Date|null }}
 */
export function resolveScheduleSlotBounds(scheduleLike) {
  if (!scheduleLike || typeof scheduleLike !== 'object') {
    return { start: null, end: null };
  }

  const rawStart = scheduleLike.start ?? scheduleLike.startAt ?? null;
  const rawEnd = scheduleLike.end ?? scheduleLike.endAt ?? null;
  if (rawStart != null) {
    const start = rawStart instanceof Date ? rawStart : new Date(rawStart);
    const end = rawEnd != null
      ? (rawEnd instanceof Date ? rawEnd : new Date(rawEnd))
      : null;
    if (!Number.isNaN(start.getTime())) {
      return {
        start,
        end: end != null && !Number.isNaN(end.getTime()) ? end : null
      };
    }
  }

  const dateStr = scheduleLike.date
    || scheduleLike.sessionDate
    || scheduleLike.apiDate
    || null;
  if (!dateStr) {
    return { start: null, end: null };
  }

  const startHm = isHmTimeString(scheduleLike.apiStartTime)
    ? scheduleLike.apiStartTime
    : (isHmTimeString(scheduleLike.startTime) ? scheduleLike.startTime : null);
  const endHm = isHmTimeString(scheduleLike.apiEndTime)
    ? scheduleLike.apiEndTime
    : (isHmTimeString(scheduleLike.endTime) ? scheduleLike.endTime : null);

  if (!startHm) {
    return { start: null, end: null };
  }

  const start = combineDateAndTimeHm(String(dateStr).slice(0, 10), String(startHm).slice(0, 5));
  const end = endHm
    ? combineDateAndTimeHm(String(dateStr).slice(0, 10), String(endHm).slice(0, 5))
    : null;
  return { start, end };
}

/**
 * isScheduleSlotInPast 와 동일 규칙이지만 now 주입 가능.
 *
 * @param {Date|string|number|null|undefined} start
 * @param {Date|string|number|null|undefined} end
 * @param {Date} now
 * @returns {boolean}
 */
function isScheduleSlotInPastWithNow(start, end, now) {
  if (start == null) {
    return false;
  }
  const startDate = start instanceof Date ? start : new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return false;
  }
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  if (startDay.getTime() < today.getTime()) {
    return true;
  }
  if (end == null) {
    return false;
  }
  const endDate = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(endDate.getTime())) {
    return false;
  }
  return endDate.getTime() < now.getTime();
}

/**
 * 세션 종료(과거 슬롯) 여부.
 *
 * @param {object|null|undefined} scheduleLike
 * @param {{ now?: Date }} [opts]
 * @returns {boolean}
 */
export function isScheduleSessionEnded(scheduleLike, opts = {}) {
  const { start, end } = resolveScheduleSlotBounds(scheduleLike);
  if (opts.now instanceof Date && !Number.isNaN(opts.now.getTime())) {
    return isScheduleSlotInPastWithNow(start, end, opts.now);
  }
  return isScheduleSlotInPast(start, end);
}

/**
 * 비-가예약 상태 코드 정규화 (가예약은 선행 분기됨).
 *
 * @param {object|null|undefined} scheduleLike
 * @returns {string}
 */
function resolveNonTentativeStatusCode(scheduleLike) {
  if (!scheduleLike || typeof scheduleLike !== 'object') {
    return '';
  }
  const raw = scheduleLike.statusCode
    ?? scheduleLike.status
    ?? scheduleLike.extendedProps?.status
    ?? '';
  return normalizeCalendarSessionStatusCode(raw);
}

/**
 * 스케줄 상세 결제·상태 ActionBar enablement.
 *
 * @param {{
 *   status?: *,
 *   statusCode?: *,
 *   start?: *,
 *   end?: *,
 *   date?: *,
 *   sessionDate?: *,
 *   apiDate?: *,
 *   startTime?: *,
 *   endTime?: *,
 *   apiStartTime?: *,
 *   apiEndTime?: *,
 *   mappingId?: *,
 *   mappingPaymentTiming?: *,
 *   paymentTiming?: *,
 *   extendedProps?: object
 * }} scheduleLike
 * @param {{ now?: Date }} [opts]
 * @returns {{
 *   isTentativePendingPayment: boolean,
 *   isSessionEnded: boolean,
 *   showSameDayPaymentActivation: boolean,
 *   showScheduleConfirm: boolean,
 *   showCancel: boolean,
 *   showReschedule: boolean
 * }}
 */
export function resolveScheduleDetailPaymentActions(scheduleLike, opts = {}) {
  const isTentativePendingPayment = isScheduleTentativePendingPayment(scheduleLike);
  const isSessionEnded = isScheduleSessionEnded(scheduleLike, opts);

  if (isTentativePendingPayment && isSessionEnded) {
    return {
      isTentativePendingPayment: true,
      isSessionEnded: true,
      showSameDayPaymentActivation: true,
      showScheduleConfirm: false,
      showCancel: true,
      showReschedule: false
    };
  }

  if (isTentativePendingPayment) {
    return {
      isTentativePendingPayment: true,
      isSessionEnded: false,
      showSameDayPaymentActivation: false,
      showScheduleConfirm: true,
      showCancel: true,
      showReschedule: true
    };
  }

  const statusCode = resolveNonTentativeStatusCode(scheduleLike);
  const isBooked = statusCode === STATUS.BOOKED;
  const isConfirmedOrInProgress = statusCode === STATUS.CONFIRMED
    || statusCode === 'IN_PROGRESS';

  return {
    isTentativePendingPayment: false,
    isSessionEnded,
    showSameDayPaymentActivation: false,
    showScheduleConfirm: isBooked,
    showCancel: isBooked || isConfirmedOrInProgress,
    showReschedule: (isBooked || isConfirmedOrInProgress) && !isSessionEnded
  };
}
