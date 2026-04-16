/**
 * apiGet은 ApiResponse({ success, data }) 형태면 data만 반환한다.
 * 호출부에서 success/data를 가정하면 빈 화면·예외가 날 수 있어 배열·목록을 안전히 정규화한다.
 *
 * @author CoreSolution
 * @since 2026-04-17
 */

/**
 * @param {*} payload — apiGet 결과 또는 원시 배열
 * @returns {unknown[]}
 */
export function normalizeApiListPayload(payload) {
  if (payload == null) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (typeof payload === 'object') {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }
    if (Array.isArray(payload.content)) {
      return payload.content;
    }
  }
  return [];
}

/**
 * 일정·스케줄 API가 배열 외 schedules/items 등을 쓰는 경우
 * @param {*} payload
 * @returns {unknown[]}
 */
export function normalizeScheduleListPayload(payload) {
  const direct = normalizeApiListPayload(payload);
  if (direct.length > 0) {
    return direct;
  }
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.schedules)) {
      return payload.schedules;
    }
    if (Array.isArray(payload.items)) {
      return payload.items;
    }
  }
  return [];
}

/**
 * 힐링 등 단일 객체 페이로드 (래핑 해제 여부 혼용)
 * @param {*} payload
 * @returns {object|null}
 */
export function normalizeApiObjectPayload(payload) {
  if (payload == null) {
    return null;
  }
  if (typeof payload !== 'object') {
    return null;
  }
  if (!Array.isArray(payload) && 'success' in payload && 'data' in payload) {
    const inner = payload.data;
    if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
      return inner;
    }
    return null;
  }
  if (Array.isArray(payload)) {
    return null;
  }
  return payload;
}
