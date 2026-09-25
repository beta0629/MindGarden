/**
 * ShopPaymentReturnPage — stash paymentId 폴백 + verify retry + 재이행 계약
 *
 * @author MindGarden
 * @since 2026-09-18
 */

const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'ShopPaymentReturnPage.js'),
  'utf8'
);

describe('ShopPaymentReturnPage verify retry + stash paymentId', () => {
  test('uses resolveShopPaymentReturnPaymentId and verifyShopPaymentWithRetry', () => {
    expect(SOURCE).toContain('resolveShopPaymentReturnPaymentId');
    expect(SOURCE).toContain('verifyShopPaymentWithRetry');
    expect(SOURCE).not.toMatch(/await verifyShopPayment\(/);
  });

  test('missing paymentId after stash resolve stays fail-closed', () => {
    expect(SOURCE).toContain('MISSING_PAYMENT_ID');
    expect(SOURCE).toContain('resolveShopPaymentReturnPaymentId(query)');
  });

  test('wires fulfill-retry when FAILED+retryable after verify SUCCESS', () => {
    expect(SOURCE).toContain('canClientShopFulfillRetry');
    expect(SOURCE).toContain('FulfillmentLineList');
    expect(SOURCE).toContain('retryShopOrderFulfillment');
    expect(SOURCE).toContain('resolveShopFulfillmentLines');
    expect(SOURCE).toContain('SHOP_PAYMENT_RETURN_COPY.PAID_FULFILLMENT_RETRY');
    expect(SOURCE).toMatch(/canClientShopFulfillRetry\(paidOrder\)/);
    // retryable 이면 navigate 하지 않고 return; 비-retryable 만 detail navigate
    expect(SOURCE).toMatch(
      /if \(canClientShopFulfillRetry\(paidOrder\)\)[\s\S]*?return;[\s\S]*?navigate\(buildShopOrderDetailPath/
    );
  });
});
