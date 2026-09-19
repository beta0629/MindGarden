/**
 * ShopPaymentReturn / ClientDashboard — soft-refresh wiring (no location.reload)
 *
 * @author MindGarden
 * @since 2026-09-19
 */

const fs = require('fs');
const path = require('path');

const PAYMENT_RETURN = fs.readFileSync(
  path.join(__dirname, '..', 'ShopPaymentReturnPage.js'),
  'utf8'
);
const ORDER_DETAIL = fs.readFileSync(
  path.join(__dirname, '..', 'ShopOrderDetailPage.js'),
  'utf8'
);
const DASHBOARD_HOOK = fs.readFileSync(
  path.join(
    __dirname,
    '..',
    '..',
    '..',
    'components',
    'client',
    'clientDashboard',
    'useClientDashboardData.js'
  ),
  'utf8'
);
const CLIENT_DASHBOARD = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'components', 'client', 'ClientDashboard.js'),
  'utf8'
);

describe('client home soft-refresh after shop payment/fulfill', () => {
  test('ShopPaymentReturnPage requests soft-refresh on verify SUCCESS and fulfill-retry SUCCESS', () => {
    expect(PAYMENT_RETURN).toContain('requestClientHomeMappingsSoftRefresh');
    expect(PAYMENT_RETURN).toMatch(
      /verifyShopPaymentWithRetry[\s\S]*?requestClientHomeMappingsSoftRefresh\(\)/
    );
    expect(PAYMENT_RETURN).toMatch(
      /SHOP_FULFILLMENT_RETRY_COPY\.SUCCESS[\s\S]*?requestClientHomeMappingsSoftRefresh\(\)/
    );
    expect(PAYMENT_RETURN).not.toMatch(/location\.reload/);
    expect(PAYMENT_RETURN).not.toMatch(/window\.location\.reload/);
  });

  test('ShopOrderDetailPage fulfill-retry SUCCESS requests soft-refresh', () => {
    expect(ORDER_DETAIL).toContain('requestClientHomeMappingsSoftRefresh');
    expect(ORDER_DETAIL).toMatch(
      /SHOP_FULFILLMENT_RETRY_COPY\.SUCCESS[\s\S]*?requestClientHomeMappingsSoftRefresh\(\)/
    );
    expect(ORDER_DETAIL).not.toMatch(/location\.reload/);
  });

  test('useClientDashboardData listens for soft-refresh event and uses softRefresh(silent)', () => {
    expect(DASHBOARD_HOOK).toContain('CLIENT_HOME_MAPPINGS_SOFT_REFRESH_EVENT');
    expect(DASHBOARD_HOOK).toContain('softRefresh');
    expect(DASHBOARD_HOOK).toContain('consumeClientHomeMappingsSoftRefreshFlag');
    expect(DASHBOARD_HOOK).toContain('calculateClientSessionTotalsFromMappings');
    expect(DASHBOARD_HOOK).not.toMatch(/location\.reload/);
    expect(DASHBOARD_HOOK).not.toMatch(/window\.location\.reload/);
  });

  test('ClientDashboard does not hard-reload the page', () => {
    expect(CLIENT_DASHBOARD).not.toMatch(/location\.reload/);
    expect(CLIENT_DASHBOARD).not.toMatch(/window\.location\.reload/);
  });
});
