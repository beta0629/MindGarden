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
  test('FulfillmentLineList uses MGButton with loading and preventDoubleClick', () => {
    expect(FULFILLMENT_LIST).toMatch(/import MGButton from ['"].*MGButton['"]/);
    expect(FULFILLMENT_LIST).toMatch(/<MGButton[\s\S]*loading=\{retrying\}/);
    expect(FULFILLMENT_LIST).toMatch(/preventDoubleClick/);
    expect(FULFILLMENT_LIST).toMatch(/SHOP_FULFILLMENT_RETRY_TEST_IDS\.BUTTON/);
    expect(FULFILLMENT_LIST).toMatch(/SHOP_FULFILLMENT_RETRY_TEST_IDS\.HINT/);
    expect(FULFILLMENT_LIST).toMatch(/client-shop__cta--fulfill-retry/);
    expect(FULFILLMENT_LIST).toMatch(/showRetry/);
    expect(FULFILLMENT_LIST).toMatch(/retryDisabled/);
    expect(FULFILLMENT_LIST).toMatch(/SHOP_FULFILLMENT_RETRY_COPY\.HINT/);
    expect(FULFILLMENT_LIST).not.toMatch(/<button[\s\S]*client-shop__cta--fulfill-retry/);
  });

  test('ShopOrderDetailPage wires retryShopOrderFulfillment and one-shot gate', () => {
    expect(ORDER_DETAIL).toMatch(/retryShopOrderFulfillment/);
    expect(ORDER_DETAIL).toMatch(/canClientShopFulfillRetry/);
    expect(ORDER_DETAIL).toMatch(/clientRetryUsed/);
    expect(ORDER_DETAIL).toMatch(/showRetry=\{showFulfillRetry\}/);
    expect(ORDER_DETAIL).toMatch(/setClientRetryUsed\(true\)/);
  });
});
