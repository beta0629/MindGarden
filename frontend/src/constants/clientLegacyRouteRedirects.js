/**
 * Client v4 — legacy path → canonical redirect map (SSOT)
 * App.js Navigate 등록 전용. 화면별 하드코드 금지.
 *
 * @author CoreSolution
 * @since 2026-09-25
 */

import { CLIENT_DASHBOARD_ROUTES } from './clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from './clientShopConstants';

/** Absolute pathname → canonical absolute pathname */
export const CLIENT_LEGACY_ROUTE_REDIRECTS = Object.freeze({
  '/client/sessions': CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
  '/client/payments': CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY,
  '/client/orders': CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY,
  '/client/profile': CLIENT_DASHBOARD_ROUTES.SETTINGS,
  '/client/notifications': '/notifications',
  '/shop': CLIENT_SHOP_ROUTES.CATALOG
});

/**
 * Nested under App.js `path="/client"` (relative segment → absolute `to`)
 * @type {ReadonlyArray<{ path: string, to: string }>}
 */
export const CLIENT_LEGACY_NESTED_REDIRECTS = Object.freeze([
  { path: 'sessions', to: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT },
  { path: 'payments', to: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY },
  { path: 'orders', to: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY },
  { path: 'profile', to: CLIENT_DASHBOARD_ROUTES.SETTINGS },
  { path: 'notifications', to: '/notifications' }
]);

/** Root-level absolute redirects (not under `/client` layout) */
export const CLIENT_LEGACY_ROOT_REDIRECTS = Object.freeze([
  { path: '/shop', to: CLIENT_SHOP_ROUTES.CATALOG }
]);

/**
 * @param {string} pathname
 * @returns {string|null}
 */
export const resolveClientLegacyRedirect = (pathname) => {
  if (typeof pathname !== 'string' || !pathname) {
    return null;
  }
  const key = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
  return CLIENT_LEGACY_ROUTE_REDIRECTS[key] || null;
};

/** /client/* 미등록 catch-all copy · test ids */
export const CLIENT_UNKNOWN_ROUTE_COPY = Object.freeze({
  TITLE: '페이지를 찾을 수 없습니다',
  LEAD: '요청하신 주소는 더 이상 사용되지 않거나 존재하지 않습니다.',
  HOME_CTA: '홈으로 돌아가기'
});

export const CLIENT_UNKNOWN_ROUTE_TEST_IDS = Object.freeze({
  PAGE: 'client-unknown-route-page',
  BODY: 'client-unknown-route-body',
  PATH: 'client-unknown-route-path',
  HOME_CTA: 'client-unknown-route-home-cta'
});
