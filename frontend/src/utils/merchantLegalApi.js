/**
 * 테넌트 사업자·약관 API 헬퍼
 */

import StandardizedApi from './standardizedApi';

/** 미기입 회기 시간 자리표시자 → 읽기 쉬운 문구 */
const SESSION_MINUTES_PLACEHOLDER = '회기당 시간(분 단위)';

/**
 * 안내 문구의 미기입 회기 시간 자리표시자(`[분]` / `［분］`)만 치환한다.
 * 상품·가격의 `[50,000원]`, `[기본상담]`, `[10회 패키지]` 등 임의 대괄호 토큰은 절대 제거하지 않는다.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function sanitizeMerchantLegalGuideText(text) {
  if (text == null) {
    return '';
  }
  let next = String(text);

  // "시간: [분] 분" / "시간: ［분］ 분" → 자연스러운 한국어
  next = next.replace(
    /:\s*[\[［]\s*분\s*[\]］]\s*분/g,
    `: ${SESSION_MINUTES_PLACEHOLDER}`
  );
  // 단독 "[분]" / "［분］" 만 치환 (그 외 [토큰] 은 보존)
  next = next.replace(/[\[［]\s*분\s*[\]］]/g, SESSION_MINUTES_PLACEHOLDER);

  return next;
}

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
    refundPolicyText: sanitizeMerchantLegalGuideText(ml.refundPolicyText ?? ''),
    productPriceGuideText: sanitizeMerchantLegalGuideText(ml.productPriceGuideText ?? '')
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
