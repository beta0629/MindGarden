/**
 * 내담자별 지정 상품·할인가 — API·상수 (BE ShopClientOfferConstants 와 같은 값)
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

export const ADMIN_CLIENT_OFFERS_I18N_NS = 'adminClientOffers';
export const CLIENT_OFFERS_I18N_NS = 'clientOffers';

export const CLIENT_OFFER_ROUTES = Object.freeze({
  OFFERS: '/client/offers'
});

/** 휴대폰 인증하러 설정에 다녀오는 동안 선택·동의를 유지하는 sessionStorage 키 (사용자 id 접미) */
export const CLIENT_OFFERS_DRAFT_STORAGE_KEY = 'mg.clientOffers.draft';

/** BE ShopClientOfferConstants.SKU_CODE_PREFIX — 지정 상품 주문(결제 출처 /client/offers) 판별 */
export const SHOP_CLIENT_OFFER_SKU_CODE_PREFIX = 'OFFER_';

/** 모바일 결제 복귀 실패 시 /client/offers 로 넘기는 router state 키 (실패 사유) */
export const CLIENT_OFFERS_PAY_FAILURE_STATE_KEY = 'clientOffersPayFailureReason';

export const SHOP_CLIENT_OFFER_API = Object.freeze({
  ADMIN: '/api/v1/admin/shop/client-offers',
  ADMIN_SOURCE_OPTIONS: '/api/v1/admin/shop/client-offers/source-options',
  CLIENT: '/api/v1/clients/me/shop-offers'
});

export const SHOP_CLIENT_OFFER_DISCOUNT_TYPE = Object.freeze({
  AMOUNT: 'AMOUNT',
  RATE: 'RATE'
});

/** BE ShopClientOfferConstants.RATE_MAX_PERCENT */
export const SHOP_CLIENT_OFFER_RATE_MAX_PERCENT = 99;

export const SHOP_CLIENT_OFFER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  CANCELED: 'CANCELED'
});

/** 연락처 뒷자리 검색에 쓰는 자릿수 하한 */
export const CLIENT_SEARCH_PHONE_TAIL_LENGTH = 4;

export const ADMIN_CLIENT_OFFERS_TEST_IDS = Object.freeze({
  PAGE: 'admin-client-offers',
  SAVE: 'admin-client-offers-save',
  CLIENT_COMBO: 'admin-client-offers-client',
  CANCEL_BACK: 'admin-client-offers-cancel-back'
});

export const CLIENT_OFFERS_TEST_IDS = Object.freeze({
  PAGE: 'client-offers',
  CARD: 'client-offers-card',
  PAY: 'client-offers-pay'
});
