/**
 * 옵션 B (예약 우선 매칭) — 캘린더 이벤트 시각 구분 SSOT.
 *
 * 일정이 가예약(TENTATIVE_PENDING_PAYMENT) 상태이면 캘린더 이벤트에 별도 클래스
 * (`integrated-schedule__event--same-day-pending`)를 부여하고 제목 앞에 `[당일결제] ` prefix 를 붙인다.
 * 결제 완료 후 BOOKED/CONFIRMED 로 전환되면 자동으로 일반 표기로 복귀한다.
 *
 * v2.0 (결함 B fix 보강, 2026-05-28):
 * - 백엔드 `validateMappingForTentativeBeforeDepositSchedule` 정책상
 *   TENTATIVE_PENDING_PAYMENT 상태는 SAME_DAY_CARD 흐름에서만 생성된다.
 * - 따라서 status 단독 분기로 점선/prefix 를 적용하며,
 *   `mapping_id` lookup 이 명시적으로 ADVANCE 를 반환하는 경우만 데이터 이상으로
 *   간주하여 차단한다 (회귀 0 안전 가드).
 * - 백엔드 `ScheduleServiceImpl.resolveMappingIdForTentativeBeforeDeposit` 가
 *   mapping_id 를 정착시키므로 정상 케이스에서는 lookup 이 SAME_DAY_CARD 를 반환한다.
 *
 * v2.0 P0 정정 (2026-05-28 15:17 KST 사용자 dev DOM 분석 결과 반영):
 * - 클래스 부여 (이 데코레이터의 역할) 는 정상이었으나, CSS cascade 에서 outer
 *   `<a.fc-event>` 점선이 inner `<div.mg-v2-ad-calendar-event--compact>` 자체
 *   background/border 로 가려져 시각 미노출 회귀가 있었다.
 * - cascade 보강은 `IntegratedMatchingSchedule.css` 에서 descendant selector
 *   + `::before` prefix icon + `--mg-color-warning-*` 다크 토큰으로 정착.
 * - 본 데코레이터는 클래스명 SSOT (`SAME_DAY_PENDING_EVENT_CLASS`) 만 유지하며
 *   변경 없음 (책임 분리: JS=클래스 부여, CSS=시각 cascade).
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md §5.
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
 * v2.0 분기 정책:
 * - status === TENTATIVE_PENDING_PAYMENT 가 1순위 SSOT (백엔드 정책상 SAME_DAY_CARD 흐름에서만 발생).
 * - mapping_id 가 있고 lookup 이 ADVANCE 를 명시적으로 반환하는 경우만 false 로 차단 (데이터 이상 안전 가드).
 * - mapping_id 누락 / lookup 미존재 / lookup 에 매핑 미등록 → status 단독으로 true (결함 B fix 보강).
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
  if (mappingId == null) {
    return true;
  }
  const lookup = ensureLookup(mappingPaymentTimingByMappingId);
  if (!lookup) {
    return true;
  }
  const timing = resolvePaymentTiming(lookup, mappingId);
  if (timing == null) {
    return true;
  }
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
  // v2.0 (결함 B fix 보강): lookup 비어있어도 status 단독 분기로 데코 가능.
  // isSameDayPendingEvent 가 TENTATIVE_PENDING_PAYMENT 가 아닐 때 즉시 false 를 반환하므로
  // 일반 일정만 있는 경우 성능 영향 미미.
  const lookup = ensureLookup(mappingPaymentTimingByMappingId);
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
