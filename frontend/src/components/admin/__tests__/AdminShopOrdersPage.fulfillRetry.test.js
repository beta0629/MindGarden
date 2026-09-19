/**
 * AdminShopOrdersPage — 재이행(fulfill-retry) 배선
 *
 * @author MindGarden
 * @since 2026-09-19
 */

import fs from 'fs';
import path from 'path';

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
  test('exposes admin-shop-fulfillment-retry and secondary MGButton', () => {
    expect(SOURCE).toMatch(/SHOP_FULFILLMENT_RETRY_TEST_IDS\.ADMIN_BUTTON/);
    expect(SOURCE).toMatch(/retryAdminShopOrderFulfillment/);
    expect(SOURCE).toMatch(/onFulfillRetry/);
    expect(SOURCE).toMatch(/variant: 'secondary'/);
  });

  test('service posts fulfill-retry path', () => {
    expect(API).toMatch(/buildAdminShopOrderFulfillRetryPath/);
    expect(API).toMatch(/\/fulfill-retry/);
    expect(SERVICE).toMatch(/buildAdminShopOrderFulfillRetryPath/);
    expect(SERVICE).toMatch(/retryAdminShopOrderFulfillment/);
  });
});
