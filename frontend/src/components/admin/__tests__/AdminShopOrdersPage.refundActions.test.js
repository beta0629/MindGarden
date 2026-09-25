/**
 * AdminShopOrdersPage — 환불 모달 actions·paymentId 카피 고정
 */
import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'AdminShopOrdersPage.js'),
  'utf8'
);

const MODAL = fs.readFileSync(
  path.join(__dirname, '..', 'shop', 'AdminShopOrderDetailModal.js'),
  'utf8'
);

describe('AdminShopOrdersPage refund UX', () => {
  test('uses UnifiedModal actions with ModalFormActions (not footer)', () => {
    expect(SOURCE).toMatch(/actions=\{\(/);
    expect(SOURCE).toMatch(/ModalFormActions/);
    expect(SOURCE).not.toMatch(/footer=\{\(/);
  });

  test('exposes paymentId in detail and refund body', () => {
    expect(MODAL).toMatch(/admin-shop-order-payment-id|ADMIN_SHOP_ORDER_DETAIL_TEST_IDS\.PAYMENT_ID/);
    expect(SOURCE).toMatch(/admin-shop-refund-payment-id/);
    expect(SOURCE).toMatch(/ADMIN_SHOP_ORDER_PAYMENT_ID_LABEL/);
    expect(MODAL).toMatch(/ADMIN_SHOP_ORDER_DETAIL_COPY\.PAYMENT_ID/);
  });

  test('does not claim PG refund is MVP-unwired', () => {
    expect(SOURCE).not.toMatch(/PG 실환불은 연동되지 않았습니다/);
    expect(SOURCE).toMatch(/ADMIN_SHOP_REFUND_PG_HINT/);
    expect(MODAL).toMatch(/ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT|ADMIN_SHOP_REFUND_PG_HINT/);
  });
});
