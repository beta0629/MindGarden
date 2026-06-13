/**
 * BW-1 「푸시 설정 모니터링」 API 클라이언트.
 *
 * <p>모든 호출은 StandardizedApi 를 통해 수행되며 tenantId 헤더·세션 갱신·에러 핸들링이
 * 표준 래퍼에서 자동 처리된다. 백엔드 컨트롤러: AdminPushMonitoringController
 * (`/api/v1/admin/notifications/monitoring`).
 *
 * <p>권한: ADMIN/STAFF 본인 테넌트 한정 (그 외 403).
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import StandardizedApi from '../../utils/standardizedApi';

const BASE_PATH = '/api/v1/admin/notifications/monitoring';

export const PUSH_MONITORING_RANGE = Object.freeze({
  H24: 'H24',
  D7: 'D7',
  D30: 'D30'
});

export const PUSH_MONITORING_CHANNEL = Object.freeze({
  ALL: 'ALL',
  ALIMTALK: 'ALIMTALK',
  SMS: 'SMS',
  PUSH: 'PUSH'
});

export const PUSH_MONITORING_RESEND_SOURCE = Object.freeze({
  BATCH: 'BATCH',
  ADMIN_TEST: 'ADMIN_TEST'
});

const PUSH_MONITORING_ENDPOINTS = Object.freeze({
  SNAPSHOT: `${BASE_PATH}/snapshot`,
  RESEND: (logId) => `${BASE_PATH}/resend/${encodeURIComponent(String(logId))}`,
  SMS_LOGS: `${BASE_PATH}/sms-logs`
});

export const SMS_LOGS_DEFAULT_LIMIT = 20;
export const SMS_LOGS_MAX_LIMIT = 100;

/**
 * 60s 폴링 단일 응답.
 *
 * @param {{ range?: string, channel?: string }} params
 * @returns {Promise<any>}
 */
export const getPushMonitoringSnapshot = (params = {}) => {
  const normalized = {
    range: params.range || PUSH_MONITORING_RANGE.D7,
    channel: params.channel || PUSH_MONITORING_CHANNEL.ALL
  };
  return StandardizedApi.get(PUSH_MONITORING_ENDPOINTS.SNAPSHOT, normalized);
};

/**
 * 어드민 수동 재발송. logId + source 로 분기.
 *
 * @param {number|string} logId
 * @param {'BATCH'|'ADMIN_TEST'} source
 * @returns {Promise<any>}
 */
export const resendPushMonitoringFailure = (logId, source) =>
  StandardizedApi.post(
    `${PUSH_MONITORING_ENDPOINTS.RESEND(logId)}?source=${encodeURIComponent(String(source))}`,
    {}
  );

/**
 * 최근 SMS/알림톡 발송 이력 조회.
 *
 * 「푸시 설정 모니터링」 페이지의 「최근 SMS/알림톡 발송」 카드 전용. 본인 테넌트 한정으로
 * `channel_used IN ('SMS', 'ALIMTALK')` 행을 `created_at` 내림차순 limit 만큼 받는다.
 *
 * @param {{ limit?: number }} params
 * @returns {Promise<any>}
 */
export const getRecentSmsLogs = (params = {}) => {
  const normalized = {};
  if (Number.isFinite(params.limit) && params.limit > 0) {
    normalized.limit = Math.min(Math.floor(params.limit), SMS_LOGS_MAX_LIMIT);
  }
  return StandardizedApi.get(PUSH_MONITORING_ENDPOINTS.SMS_LOGS, normalized);
};

const pushMonitoringApi = {
  getPushMonitoringSnapshot,
  resendPushMonitoringFailure,
  getRecentSmsLogs,
  PUSH_MONITORING_ENDPOINTS,
  PUSH_MONITORING_RANGE,
  PUSH_MONITORING_CHANNEL,
  PUSH_MONITORING_RESEND_SOURCE,
  SMS_LOGS_DEFAULT_LIMIT,
  SMS_LOGS_MAX_LIMIT
};

export default pushMonitoringApi;
