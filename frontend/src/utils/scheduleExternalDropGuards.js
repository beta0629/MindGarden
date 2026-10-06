/**
 * 통합 스케줄 캘린더 외부(사이드바) 드롭 사전 검증 — SSOT
 *
 * @author CoreSolution
 * @since 2026-05-06
 */

import {
  canScheduleForMapping,
  isPaymentConfirmed,
  isSameDayCardPending,
  normalizedRemainingSessions
} from '../components/admin/mapping-management/constants/integratedScheduleSidebarFilterConstants';

export const EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE = '배정 정보가 올바르지 않습니다.';

export const EXTERNAL_DROP_PAYMENT_NOT_CONFIRMED_MESSAGE =
  '결제 확인이 완료된 배정만 일정을 등록할 수 있습니다. 결제 확인 후 다시 시도해 주세요.';

export const EXTERNAL_DROP_NO_REMAINING_SESSIONS_MESSAGE =
  '남은 회기가 없어 일정을 등록할 수 없습니다. 회기를 추가한 후 다시 시도해 주세요.';

export const EXTERNAL_DROP_NOT_SCHEDULEABLE_MESSAGE =
  '활성(ACTIVE) 배정만 스케줄 등록이 가능합니다. 승인 대기 배정은 승인 후 이용하세요.';

export const EXTERNAL_DROP_PAST_DATE_MESSAGE = '과거 날짜에는 예약할 수 없습니다.';

export const EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE =
  '이미 등록된 가예약(또는 상담) 일정이 있어 다시 등록할 수 없습니다.';

/**
 * BE {@code ScheduleStatus#occupyingStatusesForProvisionalMapping} 미러 — OPEN 점유만.
 * 가예약 rem=0 일정등록 차단 (COMPLETED 이력 제외, CANCELLED 제외).
 */
export const PROVISIONAL_OCCUPYING_SCHEDULE_STATUSES = Object.freeze([
  'BOOKED',
  'TENTATIVE_PENDING_PAYMENT',
  'CONFIRMED',
  'IN_PROGRESS'
]);

const PROVISIONAL_OCCUPYING_STATUS_SET = new Set(PROVISIONAL_OCCUPYING_SCHEDULE_STATUSES);

/** 명시적으로 비점유인 상태 — COMPLETED는 이력, 그 외 미지/누락은 fail-closed 점유 취급 */
const PROVISIONAL_NON_OCCUPYING_STATUS_SET = new Set([
  'CANCELLED',
  'AVAILABLE',
  'VACATION',
  'COMPLETED'
]);

const normalizeId = (raw) => {
  if (raw == null || raw === '') {
    return null;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  const s = String(raw).trim();
  return s === '' ? null : s;
};

const resolveEventProps = (event) => {
  if (!event || typeof event !== 'object') {
    return {};
  }
  const props = event.extendedProps && typeof event.extendedProps === 'object'
    ? event.extendedProps
    : {};
  // UnifiedScheduleComponent 캘린더 이벤트는 scheduleType 대신 `type` 에 저장한다.
  const scheduleType = props.scheduleType
    ?? props.type
    ?? event.scheduleType
    ?? event.type
    ?? null;
  return {
    mappingId: props.mappingId ?? event.mappingId ?? null,
    consultantId: props.consultantId ?? event.consultantId ?? null,
    clientId: props.clientId ?? event.clientId ?? null,
    status: props.status ?? event.status ?? null,
    scheduleType
  };
};

/** 리더 SSOT — 가예약 중복 등록 차단 토스트 표시 시간 (기본 warning 1.5s는 DnD 중 누락되기 쉬움) */
export const EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS = 4500;

/**
 * assertExternalMappingDropAllowed 실패 결과를 notificationManager 로 표시.
 * 모든 block path 에서 toast 누락(silent return) 금지.
 *
 * @param {{ ok?: boolean, kind?: string, userMessage?: string }} guardResult
 * @param {{ error: Function, warning: Function }} notifier - notificationManager
 */
export function notifyExternalMappingDropBlocked(guardResult, notifier) {
  if (!guardResult || guardResult.ok !== false || !notifier) {
    return;
  }
  const message = guardResult.userMessage
    || (guardResult.kind === 'provisional_already_has_schedule'
      ? EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE
      : EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE);
  if (guardResult.kind === 'invalid_payload') {
    notifier.error(message);
    return;
  }
  if (guardResult.kind === 'provisional_already_has_schedule') {
    notifier.warning(message, EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS);
    return;
  }
  notifier.warning(message);
}

/**
 * 캘린더 이벤트 상태가 가예약 OPEN 점유인지 여부.
 * CANCELLED·AVAILABLE·VACATION·COMPLETED → false.
 * BOOKED/TENTATIVE/CONFIRMED/IN_PROGRESS → true.
 * 그 외 미지/누락 → fail-closed true (상담 이벤트로 간주될 때).
 *
 * @param {string|null|undefined} status
 * @returns {boolean}
 */
export function isOccupyingStatusForProvisionalGuard(status) {
  if (status == null || status === '') {
    return true;
  }
  const normalized = String(status).trim().toUpperCase();
  if (PROVISIONAL_NON_OCCUPYING_STATUS_SET.has(normalized)) {
    return false;
  }
  if (PROVISIONAL_OCCUPYING_STATUS_SET.has(normalized)) {
    return true;
  }
  return true;
}

/**
 * 로드된 캘린더에서 현재 mappingId 의 OPEN 점유 상담 여부.
 * 과거 COMPLETED·다른 mappingId 쌍 이력은 차단하지 않는다.
 *
 * @param {Array<object>|null|undefined} events
 * @param {object} mappingPayload
 * @returns {boolean}
 */
export function calendarHasOccupyingConsultationForMapping(events, mappingPayload) {
  if (!Array.isArray(events) || events.length === 0 || !mappingPayload) {
    return false;
  }
  const targetMappingId = normalizeId(
    mappingPayload.mappingId ?? mappingPayload.id ?? null
  );
  if (!targetMappingId) {
    return false;
  }

  return events.some((event) => {
    const props = resolveEventProps(event);
    const scheduleType = props.scheduleType != null
      ? String(props.scheduleType).trim().toUpperCase()
      : null;
    if (scheduleType && scheduleType !== 'CONSULTATION') {
      return false;
    }
    if (!isOccupyingStatusForProvisionalGuard(props.status)) {
      return false;
    }
    const eventMappingId = normalizeId(props.mappingId);
    return eventMappingId != null && eventMappingId === targetMappingId;
  });
}

/**
 * 사이드바 매칭 카드 → 캘린더 드롭 시 매칭 페이로드 허용 여부.
 * 실패 시 kind 로 원인을 세분화하여 UI 알림 메시지를 다르게 표시한다.
 *
 * @param {object} [mappingPayload] - consultantId, clientId, status, remainingSessions 등
 * @param {object} [options]
 * @param {boolean} [options.existingCalendarHasOccupyingSchedule]
 * @param {Array<object>} [options.calendarEvents] - 있으면 시 캘린더 교차 검증
 * @returns {{ ok: true } | { ok: false, kind: string, userMessage: string }}
 */
export function assertExternalMappingDropAllowed(mappingPayload, options = {}) {
  if (!mappingPayload?.consultantId || !mappingPayload?.clientId) {
    return {
      ok: false,
      kind: 'invalid_payload',
      userMessage: EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE
    };
  }
  // 옵션 B 사후 카드 결제(SAME_DAY_CARD) + PENDING_PAYMENT 는 결제/회기 가드를 건너뛴다.
  // 드롭 직후 CheckoutSameDayModal 에서 결제 + 활성화 + 회기 부여를 한 번에 처리한다.
  // rem<=0 차단은 현재 mappingId OPEN 점유만. hasConsultationSchedule(COMPLETED 이력)으로는 막지 않음.
  if (isSameDayCardPending(mappingPayload)) {
    const rem = normalizedRemainingSessions(mappingPayload);
    if (rem <= 0) {
      const fromApi = mappingPayload.hasOpenOccupyingConsultationSchedule === true;
      const fromOption = options?.existingCalendarHasOccupyingSchedule === true;
      const fromCalendarScan = calendarHasOccupyingConsultationForMapping(
        options?.calendarEvents,
        mappingPayload
      );
      if (fromApi || fromOption || fromCalendarScan) {
        return {
          ok: false,
          kind: 'provisional_already_has_schedule',
          userMessage: EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE
        };
      }
    }
    return { ok: true };
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
