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
  RESEND: (logId) => `${BASE_PATH}/resend/${encodeURIComponent(String(logId))}`
});

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

const pushMonitoringApi = {
  getPushMonitoringSnapshot,
  resendPushMonitoringFailure,
  PUSH_MONITORING_ENDPOINTS,
  PUSH_MONITORING_RANGE,
  PUSH_MONITORING_CHANNEL,
  PUSH_MONITORING_RESEND_SOURCE
};

export default pushMonitoringApi;
