/**
 * 어드민 SMS·카카오 알림톡 테스트 발송 도구 API 클라이언트.
 *
 * 모든 호출은 StandardizedApi를 통해 수행되며, tenantId 헤더 및
 * 에러 핸들링은 표준 래퍼가 자동으로 처리한다.
 *
 * 백엔드 컨트롤러: AdminTestNotificationController
 * 권한: USER_ROLES.ADMIN / USER_ROLES.STAFF (그 외 403)
 *
 * @author MindGarden
 * @since 2026-05-22
 */

import StandardizedApi from '../../utils/standardizedApi';

const BASE_PATH = '/api/v1/admin/test-notifications';

const TEST_NOTIFICATION_ENDPOINTS = Object.freeze({
  RECIPIENTS: `${BASE_PATH}/recipients`,
  ALIMTALK_TEMPLATES: `${BASE_PATH}/alimtalk-templates`,
  ALIMTALK_TEMPLATES_LIVE: `${BASE_PATH}/alimtalk-templates/live`,
  SEND_SMS: `${BASE_PATH}/sms`,
  SEND_ALIMTALK: `${BASE_PATH}/alimtalk`,
  HISTORY: `${BASE_PATH}/history`
});

export const TEST_NOTIFICATION_HISTORY_DEFAULT_SIZE = 30;

/**
 * 수신자(DB 사용자) 검색.
 * @param {{ search?: string, role?: string, hasPhone?: boolean }} params
 * @returns {Promise<any>}
 */
export const getRecipients = (params = {}) =>
  StandardizedApi.get(TEST_NOTIFICATION_ENDPOINTS.RECIPIENTS, params);

/**
 * 코드 enum 기반 알림톡 템플릿 목록.
 * @returns {Promise<any>}
 */
export const getAlimtalkTemplates = () =>
  StandardizedApi.get(TEST_NOTIFICATION_ENDPOINTS.ALIMTALK_TEMPLATES);

/**
 * 솔라피 실시간 알림톡 템플릿 목록 (검수 승인 한정).
 * @returns {Promise<any>}
 */
export const getAlimtalkTemplatesLive = () =>
  StandardizedApi.get(TEST_NOTIFICATION_ENDPOINTS.ALIMTALK_TEMPLATES_LIVE);

/**
 * SMS 테스트 발송.
 * @param {{ recipientMode: 'SELF'|'USER', userId?: number|null, message: string, reason: string }} payload
 * @returns {Promise<any>}
 */
export const sendTestSms = (payload) =>
  StandardizedApi.post(TEST_NOTIFICATION_ENDPOINTS.SEND_SMS, payload);

/**
 * 카카오 알림톡 테스트 발송.
 * @param {{
 *   recipientMode: 'SELF'|'USER',
 *   userId?: number|null,
 *   templateCode: string,
 *   templateParams: Record<string, string>,
 *   reason: string,
 *   fallbackToSms?: boolean
 * }} payload
 * @returns {Promise<any>}
 */
export const sendTestAlimtalk = (payload) =>
  StandardizedApi.post(TEST_NOTIFICATION_ENDPOINTS.SEND_ALIMTALK, payload);

/**
 * 발송 이력 조회 (감사로그).
 * @param {{ page?: number, size?: number, channel?: string, result?: string }} params
 * @returns {Promise<any>}
 */
export const getTestNotificationHistory = (params = {}) => {
  const normalized = {
    page: 0,
    size: TEST_NOTIFICATION_HISTORY_DEFAULT_SIZE,
    ...params
  };
  return StandardizedApi.get(TEST_NOTIFICATION_ENDPOINTS.HISTORY, normalized);
};

export default {
  getRecipients,
  getAlimtalkTemplates,
  getAlimtalkTemplatesLive,
  sendTestSms,
  sendTestAlimtalk,
  getTestNotificationHistory,
  TEST_NOTIFICATION_HISTORY_DEFAULT_SIZE,
  TEST_NOTIFICATION_ENDPOINTS
};
