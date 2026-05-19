/**
 * 내담자 온라인 쇼핑(카탈로그·장바구니·체크아웃) API 경로.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
export const CLIENT_SHOP_API = {
  CATALOG: '/api/v1/clients/me/shop/catalog',
  CART: '/api/v1/clients/me/shop/cart',
  POINTS_BALANCE: '/api/v1/clients/me/shop/points/balance',
  POINTS_LEDGER: '/api/v1/clients/me/shop/points/ledger',
  CHECKOUT: '/api/v1/clients/me/shop/checkout',
  ORDERS: '/api/v1/clients/me/shop/orders',
  orderDetail: (orderPublicId) => `/api/v1/clients/me/shop/orders/${orderPublicId}`,
  preparePayment: (orderPublicId) => `/api/v1/clients/me/shop/orders/${orderPublicId}/prepare-payment`
};
