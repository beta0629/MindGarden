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

const MODAL = fs.readFileSync(
  path.join(__dirname, '..', 'shop', 'AdminShopOrderDetailModal.js'),
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
  test('exposes admin-shop-fulfillment-retry as ghost MGButton in detail modal', () => {
    expect(MODAL).toMatch(/SHOP_FULFILLMENT_RETRY_TEST_IDS\.ADMIN_BUTTON/);
    expect(SOURCE).toMatch(/retryAdminShopOrderFulfillment/);
    expect(SOURCE).toMatch(/onFulfillRetry=\{handleFulfillRetry\}/);
    expect(MODAL).toMatch(/onFulfillRetry/);
    expect(MODAL).toMatch(/variant="ghost"/);
    expect(MODAL).toMatch(/buildErpMgButtonClassName\(\{\s*variant: 'ghost',\s*size: 'md'\s*\}\)/);
    expect(MODAL).toMatch(/loading=\{fulfillRetrying\}/);
    expect(MODAL).toMatch(/loadingText=\{SHOP_FULFILLMENT_RETRY_COPY\.BUTTON\}/);
    expect(MODAL).toMatch(/preventDoubleClick/);
    expect(MODAL).toMatch(/const anyBusy = refunding \|\| deleting \|\| fulfillRetrying \|\| reconcileRefunding/);
    expect(MODAL).toMatch(/disabled=\{anyBusy\}/);
    expect(MODAL).toMatch(/SHOP_FULFILLMENT_RETRY_TEST_IDS\.HINT/);
    expect(MODAL).toMatch(/SHOP_FULFILLMENT_RETRY_COPY\.HINT/);
    expect(MODAL).toMatch(/canFulfillRetry[\s\S]*SHOP_FULFILLMENT_RETRY_TEST_IDS\.HINT/);
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
