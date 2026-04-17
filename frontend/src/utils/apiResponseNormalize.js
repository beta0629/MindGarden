/**
 * apiGet은 ApiResponse({ success, data }) 형태면 data만 반환한다.
 * 호출부에서 success/data를 가정하면 빈 화면·예외가 날 수 있어 배열·목록을 안전히 정규화한다.
 *
 * @author CoreSolution
 * @since 2026-04-17
 */

/** apiGet unwrap 후 객체에 자주 쓰이는 배열 필드 (우선순위 순) */
const LIST_ARRAY_KEYS = ['data', 'content', 'mappings', 'items'];

/**
 * @param {object} obj
 * @returns {unknown[]|null}
 */
function extractListArrayFromObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return null;
  }
  for (let i = 0; i < LIST_ARRAY_KEYS.length; i += 1) {
    const key = LIST_ARRAY_KEYS[i];
    if (Array.isArray(obj[key])) {
      return obj[key];
    }
  }
  return null;
}

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
    const fromKeys = extractListArrayFromObject(payload);
    if (fromKeys) {
      return fromKeys;
    }
    /* data가 배열이 아닌 객체인 경우 한 번 더 펼침 (예: data: { mappings: [] }) */
    if (payload.data != null && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return normalizeApiListPayload(payload.data);
    }
  }
  return [];
}

/**
 * 일정·스케줄 API가 schedules 래핑만 쓰는 경우 (items는 normalizeApiListPayload에서 처리)
 * @param {*} payload
 * @returns {unknown[]}
 */
export function normalizeScheduleListPayload(payload) {
  const direct = normalizeApiListPayload(payload);
  if (direct.length > 0) {
    return direct;
  }
  if (payload && typeof payload === 'object' && Array.isArray(payload.schedules)) {
    return payload.schedules;
  }
  return [];
}

/**
 * 매핑 API: unwrap 후 `{ mappings: [], count }` 등 — normalizeApiListPayload와 동일 로직
 * @param {*} payload
 * @returns {unknown[]}
 */
export function normalizeMappingsListPayload(payload) {
  return normalizeApiListPayload(payload);
}

/**
 * ajax `apiGet`은 401/404 등에서 null을 반환할 수 있음.
 * 정규화 전에 호출부에서 실패와 진짜 빈 목록을 구분할 때 사용한다.
 *
 * @param {*} raw — apiGet 원시 반환
 * @returns {boolean}
 */
export function isApiGetNullFailure(raw) {
  return raw === null;
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
