/**
 * API 클라이언트·토큰 갱신·로그아웃 네트워크 timeout (ms).
 *
 * refresh 전용 axios.post 에 timeout 이 없으면 isRefreshing 동안
 * failedQueue 가 무한 대기해 홈/일정 스켈레톤·로그아웃이 멈춘다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

/** apiClient 기본 요청 timeout */
export const API_TIMEOUT_MS = 30_000;

/**
 * 401 refresh 전용 POST timeout.
 * apiClient 기본과 동일하되, hang 시 큐 해제를 보장한다.
 */
export const REFRESH_TOKEN_TIMEOUT_MS = API_TIMEOUT_MS;

/**
 * 로그아웃 시 서버 unregister / logout 호출 상한.
 * 초과해도 로컬 store clear 는 반드시 진행한다.
 */
export const SIGN_OUT_NETWORK_TIMEOUT_MS = 5_000;
