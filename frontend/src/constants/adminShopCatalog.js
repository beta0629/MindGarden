/**
 * 테넌트 어드민 — 온라인 카탈로그 SKU UI 상수
 *
 * @author CoreSolution
 * @since 2026-05-20
 */

/** @type {Readonly<{ changedAt: string, unitPrice: string, currency: string, changedBy: string }>} */
export const ADMIN_SHOP_PRICE_HISTORY_COLUMN_LABELS = {
  changedAt: '변경 일시',
  unitPrice: '단가',
  currency: '통화',
  changedBy: '변경자'
};

export const ADMIN_SHOP_PRICE_HISTORY_MODAL_TITLE = '가격 이력';
export const ADMIN_SHOP_PRICE_HISTORY_EMPTY_MESSAGE = '가격 변경 이력이 없습니다.';
export const ADMIN_SHOP_PRICE_HISTORY_ACTION_LABEL = '가격 이력';
