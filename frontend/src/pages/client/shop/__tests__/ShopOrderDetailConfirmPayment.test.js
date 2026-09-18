/**
 * ShopOrderDetailPage — PENDING_PAYMENT + paymentId 결제 확인 CTA
 *
 * @author MindGarden
 * @since 2026-09-18
 */

const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'ShopOrderDetailPage.js'),
  'utf8'
);

describe('ShopOrderDetailPage confirm pending payment CTA', () => {
  test('wires verifyShopPayment for PENDING_PAYMENT + paymentId', () => {
    expect(SOURCE).toContain('verifyShopPayment');
    expect(SOURCE).toContain("order.status === 'PENDING_PAYMENT'");
    expect(SOURCE).toContain('order.paymentId');
    expect(SOURCE).toContain('ORDER_DETAIL_CONFIRM_PAYMENT');
    expect(SOURCE).toContain('CONFIRM_PENDING_PAYMENT');
    expect(SOURCE).toContain('handleConfirmPendingPayment');
    expect(SOURCE).toMatch(/verifyShopPayment\(paymentId,\s*Number\(cashDue\)\)/);
  });

  test('fail-closed: verify failure surfaces error message (no soft-fail)', () => {
    expect(SOURCE).toContain('SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED');
    expect(SOURCE).toContain('SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT');
    expect(SOURCE).not.toMatch(/isValid\s*!==\s*true[\s\S]{0,40}setMessage\(['"]결제가 완료/);
  });
});
