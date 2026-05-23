/**
 * 어드민 AI 프로바이더 헬스체크 API 클라이언트.
 *
 * 모든 호출은 StandardizedApi 를 통해 수행되며, X-Tenant-Id 헤더는
 * 표준 래퍼가 세션 기반으로 자동 추가한다.
 *
 * 백엔드 컨트롤러: AdminAiHealthController
 * 권한: USER_ROLES.ADMIN / USER_ROLES.STAFF (그 외 401/403)
 *
 * 응답 형태 (AiProviderHealth DTO):
 *   {
 *     tenantId: string,
 *     activeProvider: 'openai' | 'gemini' | 'claude' | 'replicate',
 *     openaiKeyRegistered: boolean,
 *     geminiKeyRegistered: boolean,
 *     checkedAt: string (Instant ISO-8601)
 *   }
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import StandardizedApi from '../../utils/standardizedApi';

const BASE_PATH = '/api/v1/admin/ai';

export const AI_HEALTH_ENDPOINTS = Object.freeze({
  HEALTH: `${BASE_PATH}/health`
});

/**
 * 테넌트의 AI 프로바이더 헬스 상태를 조회한다.
 * 키 값은 노출되지 않으며, OpenAI/Gemini 키 등록 여부와 활성 프로바이더만 반환된다.
 *
 * @returns {Promise<{ tenantId: string, activeProvider: string,
 *   openaiKeyRegistered: boolean, geminiKeyRegistered: boolean, checkedAt: string }>}
 */
export const getAiProviderHealth = () =>
  StandardizedApi.get(AI_HEALTH_ENDPOINTS.HEALTH);

export default {
  getAiProviderHealth,
  AI_HEALTH_ENDPOINTS
};
