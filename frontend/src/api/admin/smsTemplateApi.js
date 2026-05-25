/**
 * 어드민 SMS 템플릿 관리 API 클라이언트.
 *
 * 모든 호출은 StandardizedApi 를 통해 수행되며, tenantId 헤더 및
 * 에러 핸들링은 표준 래퍼가 자동으로 처리한다.
 *
 * 백엔드 컨트롤러: AdminSmsTemplateController
 * 권한: GET/preview 는 ADMIN/STAFF, PUT/DELETE 는 ADMIN 만.
 *
 * @author MindGarden
 * @since 2026-05-29
 */

import StandardizedApi from '../../utils/standardizedApi';

const BASE_PATH = '/api/v1/admin/sms-templates';

const SMS_TEMPLATE_ENDPOINTS = Object.freeze({
  LIST: BASE_PATH,
  ITEM: (key) => `${BASE_PATH}/${encodeURIComponent(key)}`,
  TENANT_OVERRIDE: (key) => `${BASE_PATH}/${encodeURIComponent(key)}/tenant-override`,
  PREVIEW: (key) => `${BASE_PATH}/${encodeURIComponent(key)}/preview`
});

/**
 * SMS 템플릿 목록 조회 (현재 테넌트 글로벌 + override 병합).
 * @returns {Promise<any>}
 */
export const getSmsTemplates = () =>
  StandardizedApi.get(SMS_TEMPLATE_ENDPOINTS.LIST);

/**
 * 테넌트 override 본문 저장 (upsert).
 * @param {string} key SMS_TEMPLATE 키 (예: PAYMENT_COMPLETED)
 * @param {{ content: string }} payload
 * @returns {Promise<any>}
 */
export const updateSmsTemplateTenantOverride = (key, payload) =>
  StandardizedApi.put(SMS_TEMPLATE_ENDPOINTS.ITEM(key), payload);

/**
 * 테넌트 override 삭제 (글로벌 본문으로 회귀).
 * @param {string} key SMS_TEMPLATE 키
 * @returns {Promise<any>}
 */
export const deleteSmsTemplateTenantOverride = (key) =>
  StandardizedApi.delete(SMS_TEMPLATE_ENDPOINTS.TENANT_OVERRIDE(key));

/**
 * 변수 치환 미리보기.
 * @param {string} key SMS_TEMPLATE 키
 * @param {{ variables: Record<string, string>, preferTenantOverride?: boolean }} payload
 * @returns {Promise<any>}
 */
export const previewSmsTemplate = (key, payload) =>
  StandardizedApi.post(SMS_TEMPLATE_ENDPOINTS.PREVIEW(key), payload || {});

const smsTemplateApi = {
  getSmsTemplates,
  updateSmsTemplateTenantOverride,
  deleteSmsTemplateTenantOverride,
  previewSmsTemplate,
  SMS_TEMPLATE_ENDPOINTS
};

export default smsTemplateApi;
