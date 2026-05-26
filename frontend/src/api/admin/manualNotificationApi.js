/**
 * 어드민 SMS·카카오 알림톡 수동 일괄 발송 도구 API 클라이언트.
 *
 * - 백엔드 컨트롤러: AdminManualNotificationController (P1.2)
 * - Base: /api/v1/admin/manual-notifications
 * - 권한: USER_ROLES.ADMIN / USER_ROLES.STAFF (그 외 403)
 * - 모든 호출은 StandardizedApi 를 통해 수행되며, tenantId 헤더 및
 *   에러 핸들링은 표준 래퍼가 처리한다.
 *
 * 핵심 응답 형태(BulkNotificationResponse):
 *  {
 *    batchId, channel, startedAt, totalCount, successCount, failureCount,
 *    batchErrorCode, batchErrorMessage,
 *    results: [{ userId, name, phoneMasked, success, errorCode, errorMessage,
 *                solapiGroupId, solapiMessageId, logId }]
 *  }
 *
 * 차단(전체) 에러는 HTTP 200 + `success=false` + `errorCode` 로 전달된다.
 *  - RATE_LIMIT_EXCEEDED_BULK : 잔여 한도 < 수신자 수
 *  - TEMPLATE_NOT_MAPPED      : 알림톡 templateId 매핑 누락
 *
 * 단일 rate-limit 초과는 HTTP 429 (`Retry-After` 헤더). 본 클라이언트는
 * 표준화된 `Error.code = MANUAL_NOTIFICATION_ERROR_CODES.RATE_LIMIT_EXCEEDED`
 * 로 throw 하여 호출부에서 일관 처리한다.
 *
 * 참조:
 *  - docs/project-management/2026-05-23/MANUAL_NOTIFICATION_DESIGN_HANDOFF.md
 *  - frontend/src/api/admin/testNotificationApi.js (테스트 발송 패턴 차용)
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import StandardizedApi from '../../utils/standardizedApi';
import { normalizeApiListPayload, normalizeApiRecordPayload } from '../../constants/adminWebScaffold';
import i18n from '../../i18n';

/** 기준 경로 — 백엔드 컨트롤러 매핑과 1:1 일치. */
const BASE_PATH = '/api/v1/admin/manual-notifications';

/** 엔드포인트 모음(읽기 전용). */
export const MANUAL_NOTIFICATION_ENDPOINTS = Object.freeze({
  RECIPIENTS: `${BASE_PATH}/recipients`,
  ALIMTALK_TEMPLATES: `${BASE_PATH}/alimtalk-templates`,
  ALIMTALK_TEMPLATES_LIVE: `${BASE_PATH}/alimtalk-templates/live`,
  SEND_SMS: `${BASE_PATH}/sms`,
  SEND_ALIMTALK: `${BASE_PATH}/alimtalk`,
  SEND_PUSH: `${BASE_PATH}/push`,
  /**
   * @param {string} batchId
   * @returns {string}
   */
  BATCH_DETAIL: (batchId) => `${BASE_PATH}/batches/${encodeURIComponent(String(batchId ?? ''))}`,
  HISTORY: `${BASE_PATH}/history`
});

/** 채널 enum (백엔드 BulkNotificationResponse.channel 과 동일 문자열). */
export const MANUAL_NOTIFICATION_CHANNEL = Object.freeze({
  SMS: 'SMS',
  ALIMTALK: 'ALIMTALK',
  PUSH: 'PUSH'
});

/** 템플릿 출처 enum (BulkAlimtalkManualRequest.templateSource). */
export const MANUAL_NOTIFICATION_TEMPLATE_SOURCE = Object.freeze({
  COMMON_CODE: 'COMMON_CODE',
  SOLAPI: 'SOLAPI'
});

/** 백엔드 표준 errorCode 식별자. UI 에러 메시지 매핑·게이트에 사용. */
export const MANUAL_NOTIFICATION_ERROR_CODES = Object.freeze({
  RATE_LIMIT_EXCEEDED_BULK: 'RATE_LIMIT_EXCEEDED_BULK',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TEMPLATE_NOT_MAPPED: 'TEMPLATE_NOT_MAPPED',
  RECIPIENT_NOT_FOUND: 'RECIPIENT_NOT_FOUND',
  RECIPIENT_PHONE_MISSING: 'RECIPIENT_PHONE_MISSING',
  SEND_FAILED: 'SEND_FAILED',
  PUSH_NO_TOKEN: 'PUSH_NO_TOKEN',
  PUSH_OPTED_OUT: 'PUSH_OPTED_OUT',
  PUSH_DUPLICATE: 'PUSH_DUPLICATE',
  PUSH_EXPO_FAILED: 'PUSH_EXPO_FAILED'
});

/** 수신자 최대 선택 인원 (백엔드 검증과 동일하게 유지: 1~50). */
export const MANUAL_NOTIFICATION_MAX_RECIPIENTS = 50;

/** 발송 사유 최대 길이 (백엔드 @Size 와 동일). */
export const MANUAL_NOTIFICATION_REASON_MAX_LENGTH = 500;

/** 발송 사유 권장 최소 길이 (감사로그 가독성). 미만 시 warning(하드리밋 X). */
export const MANUAL_NOTIFICATION_REASON_RECOMMENDED_MIN_LENGTH = 30;

/** SMS 본문 최대 길이 (백엔드 @Size 와 동일). */
export const MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH = 1000;

/** 푸시 제목 최대 길이 (백엔드 @Size 와 동일). */
export const MANUAL_NOTIFICATION_PUSH_TITLE_MAX_LENGTH = 50;

/** 푸시 본문 최대 길이 (백엔드 @Size 와 동일, Expo 디스패치 단계에서 추가 truncate 가능). */
export const MANUAL_NOTIFICATION_PUSH_BODY_MAX_LENGTH = 1000;

/** 히스토리 기본 페이지 크기. */
export const MANUAL_NOTIFICATION_HISTORY_DEFAULT_SIZE = 20;

/**
 * HTTP 429 단일 rate-limit 응답을 표준화된 에러로 변환.
 * @param {*} err
 * @param {string} fallbackMessage
 * @returns {Error}
 */
const wrapError = (err, fallbackMessage) => {
  const status = err?.status ?? err?.response?.status;
  const retryAfterHeader = err?.response?.headers?.['retry-after']
    ?? err?.response?.headers?.['Retry-After']
    ?? null;
  if (status === 429) {
    const wrapped = new Error(
      err?.message
        || fallbackMessage
        || '잠시 후 다시 시도해 주세요.'
    );
    wrapped.code = MANUAL_NOTIFICATION_ERROR_CODES.RATE_LIMIT_EXCEEDED;
    wrapped.status = 429;
    if (retryAfterHeader != null) {
      wrapped.retryAfter = retryAfterHeader;
    }
    return wrapped;
  }
  return err;
};

/**
 * 수신자 검색 (이름·이메일·전화 부분 일치). 백엔드 위임.
 * @param {{ query?: string, page?: number, size?: number }} [params]
 * @returns {Promise<any>}
 */
export const searchRecipients = async(params = {}) => {
  try {
    const raw = await StandardizedApi.get(MANUAL_NOTIFICATION_ENDPOINTS.RECIPIENTS, params);
    return raw;
  } catch (err) {
    throw wrapError(err, '수신자 검색에 실패했습니다.');
  }
};

/**
 * 공통코드(`ALIMTALK_BIZ_TEMPLATE_CODE`) 기반 알림톡 템플릿 목록.
 * @returns {Promise<any>}
 */
export const fetchCommonCodeTemplates = async() => {
  try {
    return await StandardizedApi.get(MANUAL_NOTIFICATION_ENDPOINTS.ALIMTALK_TEMPLATES);
  } catch (err) {
    throw wrapError(err, '알림톡 템플릿을 불러오지 못했습니다.');
  }
};

/**
 * Solapi 실시간 알림톡 템플릿 목록 (검수 승인 한정).
 * @returns {Promise<any>}
 */
export const fetchLiveTemplates = async() => {
  try {
    return await StandardizedApi.get(MANUAL_NOTIFICATION_ENDPOINTS.ALIMTALK_TEMPLATES_LIVE);
  } catch (err) {
    throw wrapError(err, '솔라피 실시간 템플릿을 불러오지 못했습니다.');
  }
};

/**
 * SMS 일괄 발송 (BulkSmsManualRequest).
 * @param {{ userIds: number[], content: string, reason: string }} payload
 * @returns {Promise<any>}
 */
export const sendSmsBatch = async(payload) => {
  try {
    return await StandardizedApi.post(MANUAL_NOTIFICATION_ENDPOINTS.SEND_SMS, payload);
  } catch (err) {
    throw wrapError(err, 'SMS 일괄 발송에 실패했습니다.');
  }
};

/**
 * 카카오 알림톡 일괄 발송 (BulkAlimtalkManualRequest).
 * @param {{
 *   userIds: number[],
 *   templateCode: string,
 *   templateSource: ('COMMON_CODE'|'SOLAPI'),
 *   templateParams: Record<string, string>,
 *   reason: string
 * }} payload
 * @returns {Promise<any>}
 */
export const sendAlimtalkBatch = async(payload) => {
  try {
    return await StandardizedApi.post(MANUAL_NOTIFICATION_ENDPOINTS.SEND_ALIMTALK, payload);
  } catch (err) {
    throw wrapError(err, '카카오 알림톡 일괄 발송에 실패했습니다.');
  }
};

/**
 * 푸시(Expo Push API) 일괄 broadcast (BulkPushManualRequest).
 *
 * <p>토큰이 없거나 SYSTEM 카테고리를 OFF 한 사용자는 SKIPPED 로 결과에 포함되며 실패 카운트에는
 * 합산되지 않는다(백엔드 정책과 동일).
 *
 * @param {{ userIds: number[], title: string, body: string, reason: string }} payload
 * @returns {Promise<any>}
 */
export const sendPushBatch = async(payload) => {
  try {
    return await StandardizedApi.post(MANUAL_NOTIFICATION_ENDPOINTS.SEND_PUSH, payload);
  } catch (err) {
    throw wrapError(err, '푸시 일괄 발송에 실패했습니다.');
  }
};

/**
 * 배치 상세 — 수신자별 결과 행 포함.
 * @param {string} batchId
 * @returns {Promise<any>}
 */
export const fetchBatchDetail = async(batchId) => {
  if (!batchId) {
    throw new Error(i18n.t('error:api.manualNotificationApi.t_74e03420'));
  }
  try {
    return await StandardizedApi.get(MANUAL_NOTIFICATION_ENDPOINTS.BATCH_DETAIL(batchId));
  } catch (err) {
    throw wrapError(err, '배치 상세를 불러오지 못했습니다.');
  }
};

/**
 * 배치 히스토리 — 페이지네이션.
 * @param {{ page?: number, size?: number }} [params]
 * @returns {Promise<any>}
 */
export const fetchHistory = async(params = {}) => {
  const normalized = {
    page: 0,
    size: MANUAL_NOTIFICATION_HISTORY_DEFAULT_SIZE,
    ...params
  };
  try {
    return await StandardizedApi.get(MANUAL_NOTIFICATION_ENDPOINTS.HISTORY, normalized);
  } catch (err) {
    throw wrapError(err, '발송 이력을 불러오지 못했습니다.');
  }
};

/**
 * BulkNotificationResponse 정규화 헬퍼. 표준 envelope/raw 모두 수용.
 * @param {*} response
 * @returns {{
 *   batchId: string,
 *   channel: string,
 *   startedAt: string,
 *   totalCount: number,
 *   successCount: number,
 *   failureCount: number,
 *   batchErrorCode: (string|null),
 *   batchErrorMessage: (string|null),
 *   results: Array<Object>,
 *   raw: *
 * }}
 */
export const normalizeBulkResponse = (response) => {
  const record = normalizeApiRecordPayload(response) ?? {};
  const results = Array.isArray(record.results)
    ? record.results
    : normalizeApiListPayload(record.results);
  return {
    batchId: record.batchId != null ? String(record.batchId) : '',
    channel: record.channel != null ? String(record.channel) : '',
    startedAt: record.startedAt != null ? String(record.startedAt) : '',
    totalCount: Number(record.totalCount ?? 0),
    successCount: Number(record.successCount ?? 0),
    failureCount: Number(record.failureCount ?? 0),
    /*
     * 백엔드가 차단 응답을 ApiResponse 표준 실패(`{success:false, errorCode, message}`)로
     * 내려주면 ajax.js 가 envelope 전체를 반환하므로 `errorCode`·`message` 가 최상위에 위치한다.
     * 정상 응답(`BulkNotificationResponse`)에서는 `batchErrorCode`·`batchErrorMessage` 가 최상위에
     * 위치하므로 양쪽 모두를 동일 필드로 흡수한다.
     */
    batchErrorCode: record.batchErrorCode != null
      ? String(record.batchErrorCode)
      : (record.errorCode != null ? String(record.errorCode) : null),
    batchErrorMessage: record.batchErrorMessage != null
      ? String(record.batchErrorMessage)
      : (record.message != null && record.success === false ? String(record.message) : null),
    results,
    raw: record
  };
};

export default {
  MANUAL_NOTIFICATION_ENDPOINTS,
  MANUAL_NOTIFICATION_CHANNEL,
  MANUAL_NOTIFICATION_TEMPLATE_SOURCE,
  MANUAL_NOTIFICATION_ERROR_CODES,
  MANUAL_NOTIFICATION_MAX_RECIPIENTS,
  MANUAL_NOTIFICATION_REASON_MAX_LENGTH,
  MANUAL_NOTIFICATION_REASON_RECOMMENDED_MIN_LENGTH,
  MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH,
  MANUAL_NOTIFICATION_PUSH_TITLE_MAX_LENGTH,
  MANUAL_NOTIFICATION_PUSH_BODY_MAX_LENGTH,
  MANUAL_NOTIFICATION_HISTORY_DEFAULT_SIZE,
  searchRecipients,
  fetchCommonCodeTemplates,
  fetchLiveTemplates,
  sendSmsBatch,
  sendAlimtalkBatch,
  sendPushBatch,
  fetchBatchDetail,
  fetchHistory,
  normalizeBulkResponse
};
