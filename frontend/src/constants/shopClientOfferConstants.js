/**
 * 내담자별 지정 상품·할인가 — 라우트·API·상수 (BE ShopClientOfferConstants 와 같은 값)
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import { ADMIN_ROUTES } from './adminRoutes';

export const SHOP_CLIENT_OFFER_I18N_NS = 'shopClientOffers';

export const CLIENT_OFFER_ROUTES = Object.freeze({
  OFFERS: '/client/offers'
});

export const ADMIN_SHOP_CLIENT_OFFER_ROUTE = ADMIN_ROUTES.SHOP_CLIENT_OFFERS;

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

export const SHOP_CLIENT_OFFER_TEST_IDS = Object.freeze({
  ADMIN_PAGE: 'admin-shop-client-offers',
  ADMIN_SAVE: 'admin-shop-client-offers-save',
  CLIENT_PAGE: 'client-offers',
  CLIENT_PAY: 'client-offers-pay'
});

/** 결제 취소·실패 후 되돌아갈 경로 */
export const buildClientOfferPayPath = () => CLIENT_OFFER_ROUTES.OFFERS;
