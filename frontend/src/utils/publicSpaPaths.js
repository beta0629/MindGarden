/**
 * SPA 공개 경로 판별 — SessionGuard·ajax·sessionManager 공통.
 * /client/shop(목록)·/client/shop/sku/* 만 공개. cart/checkout/orders/points 는 비공개.
 *
 * @author MindGarden
 * @since 2026-09-16
 */

/**
 * @param {string} pathname location.pathname
 * @returns {boolean}
 */
export function isPublicClientShopPath(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return false;
  }
  if (pathname === '/client/shop') {
    return true;
  }
  return pathname.startsWith('/client/shop/sku/');
}

/**
 * 로그인 없이 접근 가능한 SPA 경로 (401 리다이렉트·SessionGuard 스킵).
 *
 * @param {string} pathname location.pathname
 * @returns {boolean}
 */
export function isPublicSpaPath(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return false;
  }
  if (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/landing' ||
    pathname === '/' ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/tablet/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/oauth2/callback') ||
    pathname.startsWith('/oauth2/callback') ||
    pathname.startsWith('/legal/') ||
    pathname.startsWith('/test/notifications') ||
    pathname.startsWith('/test/payment') ||
    pathname.startsWith('/test/integration')
  ) {
    return true;
  }
  return isPublicClientShopPath(pathname);
}
