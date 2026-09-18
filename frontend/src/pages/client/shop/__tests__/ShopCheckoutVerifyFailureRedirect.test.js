/**
 * ShopCheckoutPage — verify 최종 실패 시 주문 상세 replace 계약
 *
 * @author MindGarden
 * @since 2026-09-18
 */

const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'ShopCheckoutPage.js'),
  'utf8'
);

describe('ShopCheckoutPage verify failure → order detail', () => {
  test('VERIFY_AFTER_PORTONE + orderPublicId 이면 replace navigate to order detail', () => {
    expect(SOURCE).toContain('SHOP_PAYMENT_VERIFY_ERROR_PHASE');
    expect(SOURCE).toContain('VERIFY_FAILED_USE_ORDER_CONFIRM');
    expect(SOURCE).toContain('shopPaymentPhase');
    expect(SOURCE).toMatch(/buildShopOrderDetailPath\(verifyOrderId\)/);
    expect(SOURCE).toMatch(/replace:\s*true/);
  });

  test('PAYMENT_VERIFIED 성공 시 navigate 유지', () => {
    expect(SOURCE).toContain("flow.status === 'PAYMENT_VERIFIED'");
    expect(SOURCE).toMatch(/navigate\(buildShopOrderDetailPath\(orderId\),\s*\{\s*replace:\s*true\s*\}\)/);
  });
});
