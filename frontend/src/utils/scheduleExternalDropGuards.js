/**
 * 통합 스케줄 캘린더 외부(사이드바) 드롭 사전 검증 — SSOT
 *
 * @author CoreSolution
 * @since 2026-05-06
 */

import {
  canScheduleForMapping,
  isPaymentConfirmed,
  normalizedRemainingSessions
} from '../components/admin/mapping-management/constants/integratedScheduleSidebarFilterConstants';

export const EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE = '매칭 정보가 올바르지 않습니다.';

export const EXTERNAL_DROP_PAYMENT_NOT_CONFIRMED_MESSAGE =
  '결제 확인이 완료된 매칭만 일정을 등록할 수 있습니다. 결제 확인 후 다시 시도해 주세요.';

export const EXTERNAL_DROP_NO_REMAINING_SESSIONS_MESSAGE =
  '남은 회기가 없어 일정을 등록할 수 없습니다. 회기를 추가한 후 다시 시도해 주세요.';

export const EXTERNAL_DROP_NOT_SCHEDULEABLE_MESSAGE =
  '활성(ACTIVE) 매칭만 스케줄 등록이 가능합니다. 승인 대기 매칭은 승인 후 이용하세요.';

export const EXTERNAL_DROP_PAST_DATE_MESSAGE = '과거 날짜에는 예약할 수 없습니다.';

/**
 * 사이드바 매칭 카드 → 캘린더 드롭 시 매칭 페이로드 허용 여부.
 * 실패 시 kind 로 원인을 세분화하여 UI 알림 메시지를 다르게 표시한다.
 *
 * @param {object} [mappingPayload] - consultantId, clientId, status, remainingSessions 등
 * @returns {{ ok: true } | { ok: false, kind: string, userMessage: string }}
 */
export function assertExternalMappingDropAllowed(mappingPayload) {
  if (!mappingPayload?.consultantId || !mappingPayload?.clientId) {
    return {
      ok: false,
      kind: 'invalid_payload',
      userMessage: EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE
    };
  }
  if (!isPaymentConfirmed(mappingPayload)) {
    return {
      ok: false,
      kind: 'payment_not_confirmed',
      userMessage: EXTERNAL_DROP_PAYMENT_NOT_CONFIRMED_MESSAGE
    };
  }
  if (normalizedRemainingSessions(mappingPayload) <= 0) {
    return {
      ok: false,
      kind: 'no_remaining_sessions',
      userMessage: EXTERNAL_DROP_NO_REMAINING_SESSIONS_MESSAGE
    };
  }
  if (!canScheduleForMapping(mappingPayload)) {
    return {
      ok: false,
      kind: 'not_scheduleable',
      userMessage: EXTERNAL_DROP_NOT_SCHEDULEABLE_MESSAGE
    };
  }
  return { ok: true };
}

/**
 * 드롭 날짜가 오늘(자정 기준) 이전이면 차단
 *
 * @param {Date|string|number} dropDate
 * @returns {{ ok: true } | { ok: false, kind: 'past_date', userMessage: string }}
 */
export function assertDropDateNotPast(dropDate) {
  const drop = dropDate instanceof Date ? dropDate : new Date(dropDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dropDateOnly = new Date(drop);
  dropDateOnly.setHours(0, 0, 0, 0);
  if (dropDateOnly.getTime() < today.getTime()) {
    return {
      ok: false,
      kind: 'past_date',
      userMessage: EXTERNAL_DROP_PAST_DATE_MESSAGE
    };
  }
  return { ok: true };
}
