/**
 * adminMappingsListGetAll 응답을 회기 소진율 집계 입력으로 푼다.
 * drain된 mappings 전체를 반환한다. 대시보드 목록 page size로 자르지 않는다.
 *
 * @param {*} payload
 * @returns {Array<object>}
 * @author CoreSolution
 * @since 2026-09-28
 */
export function resolveSessionBurnMappingList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload == null || typeof payload !== 'object') {
    return [];
  }
  if (Array.isArray(payload.mappings)) {
    return payload.mappings;
  }
  const nested = payload.data;
  if (Array.isArray(nested)) {
    return nested;
  }
  if (nested != null && typeof nested === 'object' && Array.isArray(nested.mappings)) {
    return nested.mappings;
  }
  return [];
}
