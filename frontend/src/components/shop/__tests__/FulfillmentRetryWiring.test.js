/**
 * FulfillmentLineList / ShopOrderDetailPage — 재이행 버튼 배선
 *
 * @author MindGarden
 * @since 2026-09-19
 */

const fs = require('fs');
const path = require('path');

const FULFILLMENT_LIST = fs.readFileSync(
  path.join(__dirname, '..', 'molecules', 'FulfillmentLineList.js'),
  'utf8'
);

const ORDER_DETAIL = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'pages', 'client', 'shop', 'ShopOrderDetailPage.js'),
  'utf8'
);

describe('Fulfillment retry client wiring', () => {
  test('FulfillmentLineList exposes shop-fulfillment-retry test id', () => {
    expect(FULFILLMENT_LIST).toMatch(/SHOP_FULFILLMENT_RETRY_TEST_IDS\.BUTTON/);
    expect(FULFILLMENT_LIST).toMatch(/client-shop__cta--fulfill-retry/);
    expect(FULFILLMENT_LIST).toMatch(/showRetry/);
  });

  test('ShopOrderDetailPage wires retryShopOrderFulfillment and PAID+retryable gate', () => {
    expect(ORDER_DETAIL).toMatch(/retryShopOrderFulfillment/);
    expect(ORDER_DETAIL).toMatch(/hasShopFulfillmentRetryableLine/);
    expect(ORDER_DETAIL).toMatch(/showRetry=\{showFulfillRetry\}/);
    expect(ORDER_DETAIL).toMatch(/status === 'PAID'/);
  });
});
