/**
 * Shop 구매면 — 이용기간·결제유형 SSOT 상수 연동 (소스 스모크)
 *
 * @author CoreSolution
 * @since 2026-09-16
 */

const fs = require('fs');
const path = require('path');

const SHOP_DIR = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(SHOP_DIR, name), 'utf8');

describe('Shop purchase surfaces usage/payment SSOT', () => {
  const detail = read('ShopSkuDetailPage.js');
  const checkout = read('ShopCheckoutPage.js');
  const constants = fs.readFileSync(
    path.resolve(__dirname, '../../../../constants/legalPublic.js'),
    'utf8'
  );
  const shopConstants = fs.readFileSync(
    path.resolve(__dirname, '../../../../constants/clientShopConstants.js'),
    'utf8'
  );

  test('PDP·체크아웃이 legalPublic 이용기간·결제유형 상수를 렌더한다', () => {
    expect(detail).toMatch(/CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE/);
    expect(detail).toMatch(/CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE/);
    expect(detail).toMatch(/from ['"].*legalPublic['"]/);
    expect(detail).toMatch(/shop-sku-usage-period-note/);
    expect(detail).toMatch(/shop-sku-payment-type-note/);

    expect(checkout).toMatch(/CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE/);
    expect(checkout).toMatch(/CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE/);
    expect(checkout).toMatch(/from ['"].*legalPublic['"]/);
    expect(checkout).toMatch(/shop-checkout-usage-period-note/);
    expect(checkout).toMatch(/shop-checkout-payment-type-note/);
    expect(checkout.lastIndexOf('CheckoutSummary')).toBeLessThan(
      checkout.indexOf('shop-checkout-usage-period-note')
    );
    expect(checkout.indexOf('shop-checkout-usage-period-note')).toBeLessThan(
      checkout.indexOf('shop-checkout-payment-type-note')
    );
    expect(checkout.indexOf('shop-checkout-payment-type-note')).toBeLessThan(
      checkout.indexOf('client-shop__checkbox-row')
    );
  });

  test('SSOT는 2개월/1년/일시불이며 clientShopConstants는 legalPublic을 재수출한다', () => {
    expect(constants).toMatch(/단회기: 결제일부터 2개월 내 소진/);
    expect(constants).toMatch(/패키지\(최대 20회기\): 결제일부터 1년 내 소진/);
    expect(constants).toMatch(/일시불만 가능합니다/);
    expect(shopConstants).toMatch(
      /export\s*\{[\s\S]*CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE[\s\S]*\}\s*from\s*['"]\.\/legalPublic['"]/
    );
  });
});
