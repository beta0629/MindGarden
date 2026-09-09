/**
 * 테넌트 사업자·약관 API 헬퍼
 */

import StandardizedApi from './standardizedApi';

/** 미기입 자리표시자 → 읽기 쉬운 회기 시간 문구 */
const SESSION_MINUTES_PLACEHOLDER = '회기당 시간(분 단위)';

/**
 * 안내 문구에 남은 템플릿 자리표시자(`[분]` 등)를 운영자·고객이 보지 않도록 치환한다.
 * 환불·상품 안내 필드 전용. 법적 본문의 대괄호 인용은 드물다는 전제하에 미기입 토큰만 제거한다.
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
  // 단독 "[분]" / "［분］"
  next = next.replace(/[\[［]\s*분\s*[\]］]/g, SESSION_MINUTES_PLACEHOLDER);
  // 그 외 미기입 자리표시자 [토큰] / ［토큰］ (한글·영문·숫자·공백··/-)
  next = next.replace(/[\[［]([^\n\]］]{1,40})[\]］]/g, '');
  // 치환 후 생긴 이중 공백·공백+조사 잔여 정리
  next = next.replace(/[ \t]{2,}/g, ' ');
  next = next.replace(/[ \t]+\n/g, '\n');
  next = next.replace(/\n[ \t]+/g, '\n');

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
    refundPolicyText: sanitizeMerchantLegalGuideText(ml.refundPolicyText || ''),
    productPriceGuideText: sanitizeMerchantLegalGuideText(ml.productPriceGuideText || '')
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
