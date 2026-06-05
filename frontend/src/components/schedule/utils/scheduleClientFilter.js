/**
 * filterScheduleEventsBySelectedClientIds — 통합 스케줄 내담자 다중 필터 순수 함수.
 *
 * <p>UnifiedScheduleComponent.useMemo 에서 사용한다. 단위 테스트 가능 + 다른 통합 화면 재사용 대비.</p>
 *
 * <p>규칙:
 * - selectedClientIds 가 비어 있거나 배열이 아니면 events 를 그대로 반환 (참조 동일성 유지 → 데코레이션 캐시 보존).
 * - 그 외에는 다음을 합집합 통과:
 *   - extendedProps.type === KR 공휴일 (항상 통과)
 *   - extendedProps.type === 휴가 (항상 통과)
 *   - extendedProps.clientId 가 selectedClientIds 에 포함되는 일정.
 * - extendedProps.clientId 누락 일정은 선택 모드에서 차단(0건 표시 정합성).</p>
 *
 * @author Core Solution
 * @author MindGarden
 * @since 2026-06-09
 */

import {
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  CALENDAR_EXTENDED_TYPE_VACATION
} from '../../../constants/schedule';

/**
 * @param {Array} events FullCalendar events
 * @param {Array<string|number>} selectedClientIds 선택된 내담자 id 배열
 * @returns {Array} 필터링된 events
 */
export const filterScheduleEventsBySelectedClientIds = (events, selectedClientIds) => {
  if (!Array.isArray(events)) {
    return [];
  }
  if (!Array.isArray(selectedClientIds) || selectedClientIds.length === 0) {
    return events;
  }
  const allowedClientIds = new Set(selectedClientIds.map((id) => String(id)));
  return events.filter((event) => {
    const extType = event?.extendedProps?.type;
    if (extType === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
      return true;
    }
    if (extType === CALENDAR_EXTENDED_TYPE_VACATION) {
      return true;
    }
    const eventClientId = event?.extendedProps?.clientId;
    if (eventClientId == null) {
      return false;
    }
    return allowedClientIds.has(String(eventClientId));
  });
};

export default filterScheduleEventsBySelectedClientIds;
