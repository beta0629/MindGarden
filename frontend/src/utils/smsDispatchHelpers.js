/**
 * SMS 템플릿 발송 게이트(dispatch_enabled) 파싱·조회 헬퍼.
 * SystemConfig · SmsTemplateManagement 공용.
 *
 * @author MindGarden
 * @since 2026-09-26
 */

/**
 * StandardizedApi / BaseApi 응답에서 데이터 본문을 추출한다.
 *
 * @param {*} response
 * @returns {*}
 */
export const unwrapSmsTemplateResponse = (response) => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
};

/**
 * 목록 응답을 배열로 정규화한다.
 *
 * @param {*} response
 * @returns {Array<object>}
 */
export const normalizeSmsTemplateList = (response) => {
  const data = unwrapSmsTemplateResponse(response);
  return Array.isArray(data) ? data : [];
};

/**
 * 종목별 발송 게이트(SSOT: extra_data.dispatch_enabled → tenantDispatchEnabled).
 *
 * @param {object|null|undefined} item SmsTemplateAdminItem
 * @returns {boolean}
 */
export const getTemplateDispatchEnabled = (item) => {
  if (!item || typeof item !== 'object') {
    return false;
  }
  if (typeof item.tenantDispatchEnabled === 'boolean') {
    return item.tenantDispatchEnabled;
  }
  return Boolean(item.effectiveDispatchEnabled);
};

/**
 * @param {Array<object>} items
 * @param {string} templateKey
 * @returns {object|undefined}
 */
export const findSmsTemplateByKey = (items, templateKey) => {
  if (!Array.isArray(items) || !templateKey) {
    return undefined;
  }
  return items.find((item) => item && item.key === templateKey);
};
