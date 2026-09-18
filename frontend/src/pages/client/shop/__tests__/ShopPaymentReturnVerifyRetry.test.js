/**
 * ShopPaymentReturnPage — stash paymentId 폴백 + verify retry 계약
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
});
