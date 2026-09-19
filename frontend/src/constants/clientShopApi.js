/**
 * 내담자 온라인 쇼핑(카탈로그·장바구니·체크아웃) API 경로.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
export const CLIENT_SHOP_API = {
  /** 공개 PLP (로그인 불필요) */
  PUBLIC_CATALOG: '/api/v1/shop/catalog',
  /** 공개 PDP */
  publicCatalogSku: (skuCode) => `/api/v1/shop/catalog/${encodeURIComponent(skuCode)}`,
  /** 인증 카탈로그(레거시·호환) — FE 목록/상세는 PUBLIC_* 사용 */
  CATALOG: '/api/v1/clients/me/shop/catalog',
  CART: '/api/v1/clients/me/shop/cart',
  POINTS_BALANCE: '/api/v1/clients/me/shop/points/balance',
  POINTS_LEDGER: '/api/v1/clients/me/shop/points/ledger',
  CONSULTANT_MAPPINGS: '/api/v1/clients/me/shop/consultant-mappings',
  CHECKOUT: '/api/v1/clients/me/shop/checkout',
  ORDERS: '/api/v1/clients/me/shop/orders',
  orderDetail: (orderPublicId) => `/api/v1/clients/me/shop/orders/${orderPublicId}`,
  preparePayment: (orderPublicId) => `/api/v1/clients/me/shop/orders/${orderPublicId}/prepare-payment`,
  /** 결제 전 CREATED/PENDING_PAYMENT 주문 취소 (고아 미결제 방지) */
  cancelOrder: (orderPublicId) =>
    `/api/v1/clients/me/shop/orders/${encodeURIComponent(orderPublicId)}/cancel`,
  /** PAID 주문 이행 재시도 (FAILED·retryable) */
  fulfillRetry: (orderPublicId) =>
    `/api/v1/clients/me/shop/orders/${encodeURIComponent(orderPublicId)}/fulfill-retry`,
  /**
   * PortOne SDK 성공 후 BE REST 검증 (amount 쿼리 필수).
   *
   * @param {string} paymentId
   * @param {number|string} amount prepare에서 검증된 cashAmount
   * @returns {string}
   */
  verifyPayment: (paymentId, amount) =>
    `/api/v1/payments/${encodeURIComponent(paymentId)}/verify?amount=${encodeURIComponent(amount)}`
};
