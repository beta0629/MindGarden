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
 * — 전상법·상품정보고시·PG 심사는 「기간 명시」가 핵심. 90일 고정 의무 없음.
 * 제품 SSOT: 잔여 회기 소진 시까지 (허위 90일 금지).
 */
export const CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE =
  '이용기간 — 구입한 상담 패키지는 잔여 회기를 모두 소진할 때까지 이용할 수 있습니다(달력상 일수 제한 없음). 센터가 별도 기간을 고지한 경우 그 안내가 우선합니다.';
