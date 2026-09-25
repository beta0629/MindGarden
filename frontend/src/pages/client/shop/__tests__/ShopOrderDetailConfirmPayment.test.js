/**
 * ShopOrderDetailPage — PENDING_PAYMENT|EXPIRED + paymentId 결제 확인 CTA
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

const CONSTANTS_SOURCE = fs.readFileSync(
  path.join(__dirname, '../../../../constants/clientShopConstants.js'),
  'utf8'
);

describe('ShopOrderDetailPage confirm pending payment CTA', () => {
  test('wires verifyShopPaymentWithRetry for PENDING_PAYMENT|EXPIRED + paymentId', () => {
    expect(SOURCE).toContain('verifyShopPaymentWithRetry');
    expect(SOURCE).not.toMatch(/await verifyShopPayment\(/);
    expect(SOURCE).toContain('canConfirmShopPayment');
    expect(SOURCE).toContain('order.paymentId');
    expect(SOURCE).toContain('ORDER_DETAIL_CONFIRM_PAYMENT');
    expect(SOURCE).toContain('CONFIRM_PENDING_PAYMENT');
    expect(SOURCE).toContain('handleConfirmPendingPayment');
    expect(SOURCE).toMatch(
      /verifyShopPaymentWithRetry\(paymentId,\s*Number\(cashDue\)\)/
    );
  });

  test('canConfirmShopPayment allows PENDING_PAYMENT and EXPIRED (not prepare)', () => {
    expect(CONSTANTS_SOURCE).toMatch(
      /order\.status === 'PENDING_PAYMENT'\s*\|\|\s*order\.status === 'EXPIRED'/
    );
    expect(CONSTANTS_SOURCE).toContain('export const canConfirmShopPayment');
    expect(CONSTANTS_SOURCE).toMatch(
      /export const isShopOrderAwaitingPayment = \(order\) =>\s*Boolean\(\s*order &&\s*order\.status !== 'REFUNDED' &&\s*\(order\.status === 'CREATED' \|\| order\.status === 'PENDING_PAYMENT'\)/
    );
  });

  test('shows paymentId label when present; checkout message via location state', () => {
    expect(SOURCE).toContain('PAYMENT_ID_LABEL');
    expect(SOURCE).toContain('displayPaymentId');
    expect(SOURCE).toContain('shopCheckoutMessage');
    expect(SOURCE).toContain('useLocation');
    expect(SOURCE).toContain('consumePendingCheckoutMessage');
  });

  test('fail-closed: verify failure surfaces error message (no soft-fail)', () => {
    expect(SOURCE).toContain('SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED');
    expect(SOURCE).toContain('SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT');
    expect(SOURCE).not.toMatch(/isValid\s*!==\s*true[\s\S]{0,40}setMessage\(['"]결제가 완료/);
  });
});
