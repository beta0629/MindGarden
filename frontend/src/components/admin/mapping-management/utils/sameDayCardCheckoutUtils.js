/**
 * 옵션 B (예약 우선 매칭) — 사이드바 카드/드래그 흐름의 SAME_DAY_CARD 분기 유틸 SSOT.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * - `shouldAutoOpenCheckoutSameDayAfterSchedule`: ScheduleModal 일정 생성 직후
 *   `CheckoutSameDayModal` 자동 진입 가능 여부.
 * - `buildSameDayCardCheckoutMapping`: prefill·createdSchedule 정보를 바탕으로
 *   `CheckoutSameDayModal` 에 전달할 매핑 페이로드를 조립.
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import {
  MAPPING_STATUS_PENDING_PAYMENT,
  PAYMENT_TIMING_SAME_DAY_CARD
} from '../constants/integratedScheduleSidebarFilterConstants';

/**
 * ScheduleModal 일정 생성 직후 CheckoutSameDayModal 을 자동으로 열어야 하는지 판단.
 *
 * 조건:
 *  - prefill 매핑이 PENDING_PAYMENT 상태이며 paymentTiming === SAME_DAY_CARD 이고,
 *  - mappingId / consultantId / packageName 이 누락되지 않은 경우.
 *
 * @param {object|null|undefined} prefill - IntegratedMatchingSchedule 의 preFilledMapping 상태
 * @returns {boolean}
 */
export function shouldAutoOpenCheckoutSameDayAfterSchedule(prefill) {
  if (!prefill || typeof prefill !== 'object') {
    return false;
  }
  if (prefill.mappingStatus !== MAPPING_STATUS_PENDING_PAYMENT) {
    return false;
  }
  if (prefill.paymentTiming !== PAYMENT_TIMING_SAME_DAY_CARD) {
    return false;
  }
  return Boolean(prefill.mappingId) && Boolean(prefill.consultantId) && Boolean(prefill.packageName);
}

/**
 * `CheckoutSameDayModal` 에 전달할 매핑 페이로드를 조립한다.
 *
 * @param {object} prefill - IntegratedMatchingSchedule 의 preFilledMapping 상태
 * @param {object|null} [createdSchedule] - ScheduleModal 가 onScheduleCreated 콜백에 전달한 응답
 * @returns {object} CheckoutSameDayModal 의 mapping prop
 */
export function buildSameDayCardCheckoutMapping(prefill, createdSchedule = null) {
  const sameDaySessionScheduleId =
    createdSchedule?.id
    ?? createdSchedule?.scheduleId
    ?? createdSchedule?.data?.id
    ?? null;
  return {
    id: prefill.mappingId,
    consultantId: prefill.consultantId,
    consultantName: prefill.consultantName,
    clientId: prefill.clientId,
    clientName: prefill.clientName,
    packageName: prefill.packageName,
    packagePrice: prefill.packagePrice ?? null,
    totalSessions: prefill.totalSessions ?? null,
    sameDaySessionScheduleId
  };
}
