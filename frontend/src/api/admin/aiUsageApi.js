/**
 * 어드민 AI 사용 통계·로그 API 클라이언트.
 *
 * 모든 호출은 StandardizedApi 를 통해 수행되며, X-Tenant-Id 헤더는
 * 표준 래퍼가 세션 기반으로 자동 추가한다.
 *
 * 백엔드 컨트롤러: AdminAiUsageController
 * 권한: USER_ROLES.ADMIN / USER_ROLES.STAFF (그 외 401/403)
 *
 * 응답 형태:
 *   GET /api/v1/admin/ai/usage-stats
 *     → AiUsageStatsResponse {
 *         tenantId, period,
 *         callsToday, callsThisWeek, callsThisMonth,
 *         callsByProvider, callsByCaller,
 *         successRate, failureRate, fallbackUsageRate,
 *         averageDurationMs, totalTokens,
 *         dailyCalls30d: [{ date, count }]
 *       }
 *
 *   GET /api/v1/admin/ai/usage-logs
 *     → Page<AiUsageLogResponse> {
 *         content: [{ id, aiProvider, requestType, model, status,
 *                     durationMs, tokenCount, errorMessage, createdAt }],
 *         totalElements, totalPages, number, size, ...
 *       }
 *
 *   GET /api/v1/admin/ai/usage-logs/{id}/detail
 *     → AiUsageLogDetailResponse (전체 본문 + 비용 + 토큰 + 에러)
 *
 * @author MindGarden
 * @since 2026-05-24
 */

import StandardizedApi from '../../utils/standardizedApi';

const BASE_PATH = '/api/v1/admin/ai';

export const AI_USAGE_ENDPOINTS = Object.freeze({
  STATS: `${BASE_PATH}/usage-stats`,
  LOGS: `${BASE_PATH}/usage-logs`,
  LOG_DETAIL: (id) => `${BASE_PATH}/usage-logs/${encodeURIComponent(id)}/detail`
});

/**
 * AI 사용 통계 조회.
 *
 * @param {('today'|'week'|'month')} [period] 요청 기간 라벨 (백엔드에 echo)
 * @returns {Promise<object>} 통계 응답
 */
export const getAiUsageStats = (period) =>
  StandardizedApi.get(AI_USAGE_ENDPOINTS.STATS, period ? { period } : {});

/**
 * AI 사용 로그 페이징 조회.
 *
 * @param {object} [params]
 * @param {string} [params.provider] OPENAI|GEMINI|CLAUDE|REPLICATE (대소문자 무관, 옵션)
 * @param {string} [params.caller]   wellness|healing|psych 등 (옵션)
 * @param {string} [params.status]   success|failed (옵션)
 * @param {number} [params.page]     0-base 페이지 (기본 0)
 * @param {number} [params.size]     페이지 크기 (1~200, 기본 50)
 * @returns {Promise<object>} Spring Data Page 응답
 */
export const getAiUsageLogs = (params = {}) =>
  StandardizedApi.get(AI_USAGE_ENDPOINTS.LOGS, params);

/**
 * 단일 AI 사용 로그 상세 조회.
 *
 * @param {number|string} id 로그 PK
 * @returns {Promise<object>} 로그 상세 본문 (에러 메시지 포함)
 */
export const getAiUsageLogDetail = (id) =>
  StandardizedApi.get(AI_USAGE_ENDPOINTS.LOG_DETAIL(id));

export default {
  AI_USAGE_ENDPOINTS,
  getAiUsageStats,
  getAiUsageLogs,
  getAiUsageLogDetail
};
