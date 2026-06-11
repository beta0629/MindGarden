/**
 * 상담 메시지 목록 API 경로 + 호출 wrapper.
 *
 * 경로 계산은 역할·테넌트 스코프에 따라 분기한다. 관리자 계열은 /all (MESSAGE_MANAGE),
 * 그 외는 상담사/내담자별 엔드포인트를 사용한다.
 *
 * P0 hotfix 2026-06-12 (B6 묶음 A): 동시 호출 dedup wrapper {@link getConsultationMessagesList}
 * 신설. NotificationContext / NotificationDropdown / UnifiedNotifications / MessageWidget /
 * ClientMessageSection / ClientMessageWidget / AdminMessageListBlock 등이 거의 동시에 같은
 * 엔드포인트를 fetch 하던 패턴을 endpointKey 별 in-flight Promise 공유로 1회 호출로 합친다.
 *
 * @see frontend/src/utils/menuApi.js getLnbMenus — 동일 in-flight dedup 패턴 모델
 */
import { USER_ROLES, LEGACY_USER_ROLES } from '../constants/roles';
import { apiGet } from './ajax';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_CONSULTATION_MESSAGES_ALL = '/api/v1/consultation-messages/all';

/**
 * 역할별 상담 메시지 목록 경로를 계산한다. id 누락 시 null 반환.
 *
 * @param {{ id?: number|string, role?: string }|null|undefined} user
 * @returns {string|null} 쿼리스트링 없는 경로
 */
export function getConsultationMessagesListPath(user) {
  if (user == null || user.id == null || user.id === '') {
    return null;
  }
  const role = String(user.role || '');
  if (role === USER_ROLES.CONSULTANT || role === LEGACY_USER_ROLES.ROLE_CONSULTANT) {
    return `/api/v1/consultation-messages/consultant/${user.id}`;
  }
  if (role === USER_ROLES.CLIENT || role === LEGACY_USER_ROLES.ROLE_CLIENT) {
    return `/api/v1/consultation-messages/client/${user.id}`;
  }
  if (role === USER_ROLES.ADMIN || role.includes(USER_ROLES.ADMIN)) {
    return API_CONSULTATION_MESSAGES_ALL;
  }
  return `/api/v1/consultation-messages/client/${user.id}`;
}

/**
 * params 객체를 안정 정렬 + URLSearchParams 직렬화. dedup 키 생성용.
 * undefined / null 값은 키 자체를 제외해 의미적 동일성을 유지한다.
 *
 * @param {Record<string, unknown>|null|undefined} params
 * @returns {string}
 */
function serializeParamsForDedupKey(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }
  const keys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .sort();
  if (keys.length === 0) {
    return '';
  }
  return keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
    .join('&');
}

// 동시 호출 dedup: 같은 endpoint + params 조합은 in-flight Promise 공유.
// finally 에서 키 정리 — 다음 호출은 신규 요청.
const inflightConsultationMessagesListMap = new Map();

/**
 * 상담 메시지 목록 wrapper. 같은 endpoint + params 조합의 동시 호출은 단일 fetch 로 합쳐진다.
 *
 * @param {{ id?: number|string, role?: string }|null|undefined} user 세션 사용자
 * @param {Record<string, unknown>} [params] page/size/sort/view 등 쿼리 파라미터
 * @returns {Promise<unknown|null>} apiGet 결과(ApiResponse data) 또는 path 없음 시 null
 */
export async function getConsultationMessagesList(user, params = {}) {
  const path = getConsultationMessagesListPath(user);
  if (!path) {
    return null;
  }
  const qs = serializeParamsForDedupKey(params);
  const key = qs ? `${path}?${qs}` : path;
  const existing = inflightConsultationMessagesListMap.get(key);
  if (existing) {
    return existing;
  }
  const promise = apiGet(path, params).finally(() => {
    inflightConsultationMessagesListMap.delete(key);
  });
  inflightConsultationMessagesListMap.set(key, promise);
  return promise;
}

/**
 * 테스트 전용: in-flight 캐시 강제 초기화.
 * @internal
 */
export function _resetConsultationMessagesListInflightForTest() {
  inflightConsultationMessagesListMap.clear();
}
