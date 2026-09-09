/**
 * 테넌트 사업자·약관(merchantLegal) 공개 페이로드 추출 — 웹 merchantLegalApi SSOT 정합
 *
 * @author MindGarden
 * @since 2026-09-09
 */

export type MerchantLegalFields = {
  readonly businessRegistrationNumber: string;
  readonly representativeName: string;
  readonly businessLandline: string;
  readonly businessAddress: string;
  readonly mailOrderReportNumber: string;
  readonly refundPolicyText: string;
  readonly productPriceGuideText: string;
};

export const EMPTY_MERCHANT_LEGAL: MerchantLegalFields = Object.freeze({
  businessRegistrationNumber: '',
  representativeName: '',
  businessLandline: '',
  businessAddress: '',
  mailOrderReportNumber: '',
  refundPolicyText: '',
  productPriceGuideText: '',
});

export type MerchantLegalGuideKind = 'refund' | 'price';

export type MerchantLegalGuideItem = {
  readonly kind: MerchantLegalGuideKind;
  readonly body: string;
};

/**
 * 등록 안내 문구가 있는지 판별한다 (공백만이면 비어 있음).
 *
 * @param text 원본 문자열
 * @returns trim 후 길이 > 0 이면 true
 */
export function hasMerchantLegalGuideText(text: string | null | undefined): boolean {
  return Boolean(text && String(text).trim());
}

/**
 * 안내 문구에 남은 템플릿 자리표시자(`[분]` 등)를 보이지 않게 치환한다.
 * 웹 `sanitizeMerchantLegalGuideText` 와 동일 규칙.
 *
 * @param text 원본
 * @returns 정리된 문자열
 */
export function sanitizeMerchantLegalGuideText(
  text: string | null | undefined,
): string {
  if (text == null) {
    return '';
  }
  let next = String(text);
  next = next.replace(/:\s*[\[［]\s*분\s*[\]］]\s*분/g, ': 회기당 시간(분 단위)');
  next = next.replace(/[\[［]\s*분\s*[\]］]/g, '회기당 시간(분 단위)');
  next = next.replace(/[\[［]([^\n\]］]{1,40})[\]］]/g, '');
  next = next.replace(/[ \t]{2,}/g, ' ');
  next = next.replace(/[ \t]+\n/g, '\n');
  next = next.replace(/\n[ \t]+/g, '\n');
  return next;
}

/**
 * 공개 by-subdomain(또는 동형) 테넌트 페이로드에서 merchantLegal 을 추출한다.
 *
 * @param tenantPayload tenant 객체(또는 null)
 * @returns 필드별 문자열(없으면 빈 문자열)
 */
export function extractMerchantLegalFromTenantPayload(
  tenantPayload: unknown,
): MerchantLegalFields {
  if (tenantPayload == null || typeof tenantPayload !== 'object') {
    return { ...EMPTY_MERCHANT_LEGAL };
  }
  const root = tenantPayload as Record<string, unknown>;
  const mlRaw = root.merchantLegal;
  const ml =
    mlRaw != null && typeof mlRaw === 'object'
      ? (mlRaw as Record<string, unknown>)
      : {};

  const pick = (key: string): string => {
    const v = ml[key];
    return typeof v === 'string' ? v : '';
  };

  return {
    businessRegistrationNumber: pick('businessRegistrationNumber'),
    representativeName: pick('representativeName'),
    businessLandline: pick('businessLandline'),
    businessAddress: pick('businessAddress'),
    mailOrderReportNumber: pick('mailOrderReportNumber'),
    refundPolicyText: sanitizeMerchantLegalGuideText(pick('refundPolicyText')),
    productPriceGuideText: sanitizeMerchantLegalGuideText(
      pick('productPriceGuideText'),
    ),
  };
}

/**
 * 비어 있지 않은 안내(환불·상품)만 반환한다. 빈 안내는 숨김.
 *
 * @param legal merchantLegal 필드
 * @returns 표시할 안내 목록
 */
export function listVisibleMerchantLegalGuides(
  legal: MerchantLegalFields,
): MerchantLegalGuideItem[] {
  const items: MerchantLegalGuideItem[] = [];
  const refund = sanitizeMerchantLegalGuideText(legal.refundPolicyText).trim();
  const price = sanitizeMerchantLegalGuideText(legal.productPriceGuideText).trim();
  if (hasMerchantLegalGuideText(refund)) {
    items.push({ kind: 'refund', body: refund });
  }
  if (hasMerchantLegalGuideText(price)) {
    items.push({ kind: 'price', body: price });
  }
  return items;
}

/**
 * by-subdomain API 응답 본문에서 tenant 객체를 꺼낸다.
 *
 * @param response apiGet 응답(인터셉터 후 data 래핑 가능)
 * @returns tenant 또는 null
 */
export function pickTenantFromBySubdomainResponse(response: unknown): unknown | null {
  if (response == null || typeof response !== 'object') {
    return null;
  }
  const root = response as Record<string, unknown>;
  const data =
    root.data != null && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;
  const found = data.found;
  const tenant = data.tenant;
  if (found === false || tenant == null) {
    return null;
  }
  return tenant;
}
