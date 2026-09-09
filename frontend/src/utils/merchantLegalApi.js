/**
 * 테넌트 사업자·약관 API 헬퍼
 */

import StandardizedApi from './standardizedApi';

/**
 * @param {string} tenantId
 * @returns {Promise<object>}
 */
export async function getMerchantLegal(tenantId) {
  return StandardizedApi.get(`/api/v1/tenants/${encodeURIComponent(tenantId)}/merchant-legal`);
}

/**
 * @param {string} tenantId
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function saveMerchantLegal(tenantId, payload) {
  return StandardizedApi.put(`/api/v1/tenants/${encodeURIComponent(tenantId)}/merchant-legal`, payload);
}

/**
 * 공개 by-subdomain 응답에서 merchantLegal 추출
 * @param {object|null} tenantPayload
 * @returns {object}
 */
export function extractMerchantLegalFromTenantPayload(tenantPayload) {
  const ml = tenantPayload?.merchantLegal || {};
  return {
    businessRegistrationNumber: ml.businessRegistrationNumber || '',
    representativeName: ml.representativeName || '',
    businessLandline: ml.businessLandline || '',
    businessAddress: ml.businessAddress || '',
    mailOrderReportNumber: ml.mailOrderReportNumber || '',
    refundPolicyText: ml.refundPolicyText || '',
    productPriceGuideText: ml.productPriceGuideText || ''
  };
}

/**
 * 상태 라벨 파생 (BE와 동일 규칙, 미리보기용)
 * @param {object} fields
 * @returns {{registrationStatusLabel:string,mailOrderStatusLabel:string,sitePublicStatusLabel:string}}
 */
export function deriveMerchantLegalStatusLabels(fields = {}) {
  const filled = [
    fields.businessRegistrationNumber,
    fields.representativeName,
    fields.businessLandline,
    fields.businessAddress
  ].filter((v) => v && String(v).trim()).length;

  let registrationStatusLabel = '미등록';
  if (filled === 4) registrationStatusLabel = '등록';
  else if (filled > 0) registrationStatusLabel = '작성중';

  const mailOrderStatusLabel =
    fields.mailOrderReportNumber && String(fields.mailOrderReportNumber).trim()
      ? '등록'
      : '미등록';
  const sitePublicStatusLabel = filled === 4 ? '공개' : '비공개';

  return { registrationStatusLabel, mailOrderStatusLabel, sitePublicStatusLabel };
}
