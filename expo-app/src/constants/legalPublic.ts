/**
 * PG 공개 법적 페이지 경로·라벨 SSOT (웹 `frontend/src/constants/legalPublic.js` 패리티)
 *
 * @author MindGarden
 * @since 2026-09-11
 */

export const LEGAL_PUBLIC_PATHS = Object.freeze({
  TERMS: '/legal/terms',
  PRIVACY: '/legal/privacy',
  PRODUCTS: '/legal/products',
  REFUND: '/legal/refund',
} as const);

export type LegalPublicPathKey = keyof typeof LEGAL_PUBLIC_PATHS;

export const LEGAL_PUBLIC_LABELS = Object.freeze({
  TERMS: '이용약관',
  PRIVACY: '개인정보처리방침',
  PRODUCTS: '상품·가격',
  REFUND: '환불·취소·청약철회',
} as const);

/** 웹 `frontend/public/legal/clinic-os-platform-legal-copy.md` */
export const PLATFORM_LEGAL_COPY_PUBLIC_URL =
  '/legal/clinic-os-platform-legal-copy.md';

export const PLATFORM_LEGAL_SECTIONS = Object.freeze({
  TERMS: 'terms',
  PRIVACY: 'privacy',
  REFUND: 'refund',
} as const);

export type PlatformLegalSectionKey =
  (typeof PLATFORM_LEGAL_SECTIONS)[keyof typeof PLATFORM_LEGAL_SECTIONS];

/** 푸터 안내 컬럼 — 웹 MerchantLegalFooterPreview 와 동일 순서 */
export const LEGAL_PUBLIC_FOOTER_LINKS = Object.freeze([
  {
    key: 'terms' as const,
    path: LEGAL_PUBLIC_PATHS.TERMS,
    label: LEGAL_PUBLIC_LABELS.TERMS,
    testID: 'legal-public-link-terms',
    openNativeRefund: false,
  },
  {
    key: 'privacy' as const,
    path: LEGAL_PUBLIC_PATHS.PRIVACY,
    label: LEGAL_PUBLIC_LABELS.PRIVACY,
    testID: 'legal-public-link-privacy',
    openNativeRefund: false,
  },
  {
    key: 'products' as const,
    path: LEGAL_PUBLIC_PATHS.PRODUCTS,
    label: LEGAL_PUBLIC_LABELS.PRODUCTS,
    testID: 'legal-public-link-products',
    openNativeRefund: false,
  },
  {
    key: 'refund' as const,
    path: LEGAL_PUBLIC_PATHS.REFUND,
    label: LEGAL_PUBLIC_LABELS.REFUND,
    testID: 'legal-public-link-refund',
    openNativeRefund: true,
  },
]);
