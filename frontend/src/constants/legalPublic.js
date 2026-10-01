/**
 * PG 공개 법적 페이지 경로·라벨 SSOT
 *
 * @author CoreSolution
 * @since 2026-09-10
 */

export const LEGAL_PUBLIC_PATHS = Object.freeze({
  TERMS: '/legal/terms',
  PRIVACY: '/legal/privacy',
  PRODUCTS: '/legal/products',
  REFUND: '/legal/refund'
});

export const LEGAL_PUBLIC_LABELS = Object.freeze({
  TERMS: '이용약관',
  PRIVACY: '개인정보처리방침',
  PRODUCTS: '상품·가격',
  REFUND: '환불·취소·청약철회'
});

export const PLATFORM_LEGAL_COPY_PUBLIC_URL = '/legal/clinic-os-platform-legal-copy.md';

export const PLATFORM_LEGAL_SECTIONS = Object.freeze({
  TERMS: 'terms',
  PRIVACY: 'privacy',
  REFUND: 'refund'
});

export const CONSULTATION_PACKAGE_EMPTY_MESSAGE = '미등록 / 확인 필요';

/**
 * 공개 상품·가격 이용기간 고지 (quiet note)
 * 근거: docs/project-management/PACKAGE_USAGE_PERIOD_DISCLOSURE_RESEARCH.md
 * — 전상법·상품정보고시·PG 심사는 「기간 명시」가 핵심. 허위 90일 고정 금지.
 * 단회기 결제일부터 2개월 · 10회기 결제일부터 3개월 · 20회기 결제일부터 6개월 내 소진.
 * 무제한 유효기간 없음.
 */
export const CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE =
  '이용기간 — 단회기: 결제일부터 2개월 내 소진. 10회기: 결제일부터 3개월 내 소진. 20회기: 결제일부터 6개월 내 소진. 무제한 유효기간은 없습니다.';

/**
 * 공개 상품·결제 유형 고지 (quiet note)
 * 카드 결제. 5만 원 이상은 할부. 정기결제·구독 없음.
 */
export const CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE =
  '카드 결제이며, 5만 원 이상은 할부가 가능합니다. 정기결제·구독은 없습니다.';
