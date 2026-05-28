/**
 * 옵션 B (예약 우선 매칭) — 캘린더 이벤트 시각 구분 SSOT.
 *
 * 매핑이 SAME_DAY_CARD 결제 방식이고 일정이 가예약(TENTATIVE_PENDING_PAYMENT) 상태인 경우,
 * 캘린더 이벤트에 별도 클래스(`integrated-schedule__event--same-day-pending`)를 부여하고
 * 제목 앞에 `[당일결제] ` prefix 를 붙인다. 결제 완료 후 BOOKED/CONFIRMED 로 전환되면
 * 자동으로 일반 표기로 복귀한다.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * @author MindGarden
 * @since 2026-05-28
 */

export const SAME_DAY_PENDING_EVENT_CLASS = 'integrated-schedule__event--same-day-pending';
export const SAME_DAY_PENDING_TITLE_PREFIX = '[당일결제] ';
const TENTATIVE_PENDING_PAYMENT_STATUS = 'TENTATIVE_PENDING_PAYMENT';
const SAME_DAY_CARD_TIMING = 'SAME_DAY_CARD';

const ensureLookup = (input) => {
  if (input == null) {
    return null;
  }
  if (input instanceof Map) {
    return input;
  }
  if (typeof input === 'object') {
    const entries = Object.entries(input);
    return new Map(entries.map(([k, v]) => [String(k), v]));
  }
  return null;
};

const resolvePaymentTiming = (lookup, mappingId) => {
  if (!lookup || mappingId == null) {
    return null;
  }
  const direct = lookup.get(mappingId);
  if (direct !== undefined) {
    return direct;
  }
  return lookup.get(String(mappingId)) ?? null;
};

const resolveMappingIdFromEvent = (event) => {
  if (!event) {
    return null;
  }
  const ext = event.extendedProps || {};
  return (
    ext.mappingId
    ?? ext.scheduleMappingId
    ?? ext.mapping_id
    ?? null
  );
};

const resolveStatusFromEvent = (event) => {
  if (!event) return null;
  const ext = event.extendedProps || {};
  return ext.status ?? null;
};

/**
 * 단일 이벤트가 옵션 B 당일결제 가예약인지 판별.
 *
 * @param {object} event - FullCalendar event def (className/extendedProps 포함)
 * @param {Map|object} mappingPaymentTimingByMappingId - mappingId → paymentTiming 룩업
 * @returns {boolean}
 */
export function isSameDayPendingEvent(event, mappingPaymentTimingByMappingId) {
  const status = resolveStatusFromEvent(event);
  if (status !== TENTATIVE_PENDING_PAYMENT_STATUS) {
    return false;
  }
  const mappingId = resolveMappingIdFromEvent(event);
  const timing = resolvePaymentTiming(
    ensureLookup(mappingPaymentTimingByMappingId),
    mappingId
  );
  return timing === SAME_DAY_CARD_TIMING;
}

/**
 * 캘린더 이벤트 배열을 받아 옵션 B 당일결제 가예약 이벤트에 클래스/타이틀 prefix 를 적용한 새 배열을 반환.
 *
 * - 입력 events 는 변경하지 않는다 (immutable).
 * - className 은 문자열/배열 모두 지원하며, 항상 배열로 정규화하여 반환한다.
 * - title prefix 는 중복 prepend 를 방지한다 (이미 시작하면 그대로 둔다).
 *
 * @param {Array<object>} events
 * @param {Map|object} mappingPaymentTimingByMappingId - mappingId → paymentTiming 룩업
 * @returns {Array<object>}
 */
export function decorateScheduleEventsForSameDayPending(events, mappingPaymentTimingByMappingId) {
  if (!Array.isArray(events) || events.length === 0) {
    return Array.isArray(events) ? events : [];
  }
  const lookup = ensureLookup(mappingPaymentTimingByMappingId);
  if (!lookup || lookup.size === 0) {
    return events;
  }
  return events.map((event) => {
    if (!isSameDayPendingEvent(event, lookup)) {
      return event;
    }
    const existingClassName = event.className;
    let mergedClassNames;
    if (Array.isArray(existingClassName)) {
      mergedClassNames = existingClassName.includes(SAME_DAY_PENDING_EVENT_CLASS)
        ? existingClassName
        : [...existingClassName, SAME_DAY_PENDING_EVENT_CLASS];
    } else if (typeof existingClassName === 'string' && existingClassName.length > 0) {
      const tokens = existingClassName.split(/\s+/).filter(Boolean);
      mergedClassNames = tokens.includes(SAME_DAY_PENDING_EVENT_CLASS)
        ? tokens
        : [...tokens, SAME_DAY_PENDING_EVENT_CLASS];
    } else {
      mergedClassNames = [SAME_DAY_PENDING_EVENT_CLASS];
    }

    const title = typeof event.title === 'string' ? event.title : '';
    const prefixedTitle = title.startsWith(SAME_DAY_PENDING_TITLE_PREFIX)
      ? title
      : `${SAME_DAY_PENDING_TITLE_PREFIX}${title}`;

    return {
      ...event,
      className: mergedClassNames,
      title: prefixedTitle,
      extendedProps: {
        ...(event.extendedProps || {}),
        mappingPaymentTiming: SAME_DAY_CARD_TIMING,
        isSameDayPending: true
      }
    };
  });
}

/**
 * `mappings` 배열에서 mappingId → paymentTiming 룩업을 만든다.
 * paymentTiming 이 null/undefined 인 매핑은 ADVANCE 동등(레거시)으로 간주하여 제외한다.
 *
 * @param {Array<{id: number|string, paymentTiming?: string}>} mappings
 * @returns {Map<string, string>}
 */
export function buildMappingPaymentTimingLookup(mappings) {
  const map = new Map();
  if (!Array.isArray(mappings)) {
    return map;
  }
  mappings.forEach((m) => {
    if (!m || m.id == null) {
      return;
    }
    if (m.paymentTiming == null) {
      return;
    }
    map.set(String(m.id), m.paymentTiming);
  });
  return map;
}
