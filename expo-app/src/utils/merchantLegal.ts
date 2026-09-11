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

/** 동의 「보기」 모달용 사업자·약관 라벨 (푸터 i18n 과 동일 한국어) */
const DISCLOSURE_LABELS = Object.freeze({
  biz: '사업자등록번호',
  rep: '대표',
  phone: '유선',
  address: '주소',
  mailOrder: '통신판매업 신고번호',
  refund: '환불·취소·청약철회',
  price: '상품·가격 안내',
});

/**
 * 센터명·사업자 필드·환불/상품 안내를 읽기 쉬운 한국어 평문으로 만든다.
 * 빈 필드는 생략하고, 안내 문구는 sanitize 를 적용한다.
 * 사업자 줄·안내가 모두 없으면 센터명만 있어도 빈 문자열(플랫폼 폴백 금지).
 *
 * @param centerName 테넌트/센터 표시명
 * @param legal merchantLegal 필드
 * @returns 표시용 평문(내용이 없으면 빈 문자열)
 */
export function formatMerchantLegalDisclosureText(
  centerName: string | null | undefined,
  legal: MerchantLegalFields,
): string {
  const bizLines: string[] = [];

  const appendLabeled = (label: string, value: string | null | undefined) => {
    const trimmed = value != null ? String(value).trim() : '';
    if (!trimmed) {
      return;
    }
    bizLines.push(`${label}: ${trimmed}`);
  };

  appendLabeled(DISCLOSURE_LABELS.biz, legal.businessRegistrationNumber);
  appendLabeled(DISCLOSURE_LABELS.rep, legal.representativeName);
  appendLabeled(DISCLOSURE_LABELS.phone, legal.businessLandline);
  appendLabeled(DISCLOSURE_LABELS.address, legal.businessAddress);
  appendLabeled(DISCLOSURE_LABELS.mailOrder, legal.mailOrderReportNumber);

  const guides = listVisibleMerchantLegalGuides(legal);
  if (bizLines.length === 0 && guides.length === 0) {
    return '';
  }

  const lines: string[] = [];
  const name = centerName != null ? String(centerName).trim() : '';
  if (name) {
    lines.push(name);
  }
  lines.push(...bizLines);

  for (const guide of guides) {
    let sectionLabel: string;
    switch (guide.kind) {
      case 'refund':
        sectionLabel = DISCLOSURE_LABELS.refund;
        break;
      case 'price':
        sectionLabel = DISCLOSURE_LABELS.price;
        break;
      default: {
        const _exhaustive: never = guide.kind;
        sectionLabel = _exhaustive;
        break;
      }
    }
    if (lines.length > 0) {
      lines.push('');
    }
    lines.push(`[${sectionLabel}]`);
    lines.push(guide.body);
  }

  return lines.join('\n').trim();
}

/**
 * 동의 「보기」에 쓸 수 있는 테넌트 사업자·약관 문구가 있는지 판별한다.
 *
 * @param centerName 센터명
 * @param legal merchantLegal
 * @returns 평문이 비어 있지 않으면 true
 */
export function hasMerchantLegalDisclosureText(
  centerName: string | null | undefined,
  legal: MerchantLegalFields,
): boolean {
  return hasMerchantLegalGuideText(
    formatMerchantLegalDisclosureText(centerName, legal),
  );
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
