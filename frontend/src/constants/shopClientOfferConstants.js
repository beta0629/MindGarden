/**
 * 내담자별 지정 상품·할인가 — API·상수 (BE ShopClientOfferConstants 와 같은 값)
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

export const ADMIN_CLIENT_OFFERS_I18N_NS = 'adminClientOffers';

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
