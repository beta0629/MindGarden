/**
 * AdminShopOrdersPage — 재이행(fulfill-retry) 배선
 *
 * @author MindGarden
 * @since 2026-09-19
 */

const fs = require('fs');
const path = require('path');

const SOURCE = fs.readFileSync(
  path.join(__dirname, '..', 'AdminShopOrdersPage.js'),
  'utf8'
);

const SERVICE = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'services', 'adminShopOrderService.js'),
  'utf8'
);

const API = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'constants', 'adminShopApi.js'),
  'utf8'
);

describe('AdminShopOrdersPage fulfill-retry', () => {
  test('exposes admin-shop-fulfillment-retry and primary MGButton', () => {
    expect(SOURCE).toMatch(/SHOP_FULFILLMENT_RETRY_TEST_IDS\.ADMIN_BUTTON/);
    expect(SOURCE).toMatch(/retryAdminShopOrderFulfillment/);
    expect(SOURCE).toMatch(/onFulfillRetry/);
    expect(SOURCE).toMatch(/variant="primary"/);
    expect(SOURCE).toMatch(/buildErpMgButtonClassName\(\{\s*variant: 'primary',\s*size: 'md'\s*\}\)/);
    expect(SOURCE).toMatch(/loading=\{fulfillRetrying\}/);
    expect(SOURCE).toMatch(/loadingText=\{SHOP_FULFILLMENT_RETRY_COPY\.BUTTON\}/);
    expect(SOURCE).toMatch(/preventDoubleClick/);
    expect(SOURCE).toMatch(/disabled=\{refunding \|\| deleting \|\| fulfillRetrying\}/);
  });

  test('after retry toast: error when still retryable FAILED, success otherwise', () => {
    expect(SOURCE).toMatch(/resolveShopFulfillmentLines\(nextDetail\)/);
    expect(SOURCE).toMatch(/hasShopFulfillmentRetryableLine\(events\)/);
    expect(SOURCE).toMatch(/notificationManager\.error\(SHOP_FULFILLMENT_RETRY_COPY\.FAILED\)/);
    expect(SOURCE).toMatch(/notificationManager\.success\(SHOP_FULFILLMENT_RETRY_COPY\.SUCCESS\)/);
    expect(SOURCE).toMatch(/setFulfillRetrying\(false\)/);
  });

  test('service posts fulfill-retry path', () => {
    expect(API).toMatch(/buildAdminShopOrderFulfillRetryPath/);
    expect(API).toMatch(/\/fulfill-retry/);
    expect(SERVICE).toMatch(/buildAdminShopOrderFulfillRetryPath/);
    expect(SERVICE).toMatch(/retryAdminShopOrderFulfillment/);
  });
});
