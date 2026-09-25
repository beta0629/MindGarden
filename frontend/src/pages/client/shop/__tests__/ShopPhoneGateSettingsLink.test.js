/**
 * Shop phone gate — checkout/order-detail 에 settings Link CTA 존재 (Leader #3)
 *
 * @author MindGarden
 * @since 2026-09-18
 */

const fs = require('fs');
const path = require('path');

const read = (fileName) =>
  fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');

describe('Shop phone gate settings Link CTA', () => {
  test('ShopCheckoutPage — 미인증 시 /client/settings Link', () => {
    const src = read('ShopCheckoutPage.js');
    expect(src).toContain('to="/client/settings"');
    expect(src).toContain('CHECKOUT_SETTINGS_LINK');
    expect(src).toContain('assertPortOneCustomerReadyBeforeCheckout');
    expect(src).toContain('portOneCustomerGate');
  });

  test('ShopOrderDetailPage — 미인증 시 /client/settings Link (Leader #3)', () => {
    const src = read('ShopOrderDetailPage.js');
    expect(src).toContain('to="/client/settings"');
    expect(src).toContain('CHECKOUT_SETTINGS_LINK');
    expect(src).toContain('assertPortOneCustomerReadyBeforeCheckout');
    expect(src).toContain('ORDER_DETAIL_PHONE_GATE');
    expect(src).toContain('!portOneCustomerGate.ready');
  });
});
