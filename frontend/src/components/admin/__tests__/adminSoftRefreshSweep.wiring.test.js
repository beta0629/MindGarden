/**
 * Admin soft-refresh full sweep — source wiring guards (mutation/refresh silent path)
 */
import fs from 'fs';
import path from 'path';

const ADMIN_DIR = path.join(__dirname, '..');

function readAdmin(...parts) {
  return fs.readFileSync(path.join(ADMIN_DIR, ...parts), 'utf8');
}

describe('admin soft-refresh sweep wiring', () => {
  const cases = [
    {
      name: 'AdminShopCatalogSkusPage',
      source: () => readAdmin('AdminShopCatalogSkusPage.js'),
      loadFn: 'loadSkus'
    },
    {
      name: 'AdminShopPointPoliciesPage',
      source: () => readAdmin('AdminShopPointPoliciesPage.js'),
      loadFn: 'loadPolicies'
    },
    {
      name: 'InstitutionLinkAdminPage',
      source: () => readAdmin('institution-link', 'InstitutionLinkAdminPage.js'),
      loadFn: 'loadAll'
    },
    {
      name: 'AdminCommunityModerationQueuePage',
      source: () => readAdmin('AdminCommunityModerationQueuePage.js'),
      loadFn: 'fetchQueue'
    },
    {
      name: 'AdminContentMasterPage',
      source: () => readAdmin('AdminContentMasterPage.js'),
      loadFn: 'reloadTab'
    },
    {
      name: 'AdminPendingPaymentCleanupPage',
      source: () => readAdmin('mapping', 'AdminPendingPaymentCleanupPage.js'),
      loadFn: 'fetchList'
    },
    {
      name: 'WellnessManagement',
      source: () => readAdmin('WellnessManagement.js'),
      loadFn: 'loadData'
    },
    {
      name: 'AdminMindWeatherObservabilityPage',
      source: () => readAdmin('AdminMindWeatherObservabilityPage.js'),
      loadFn: 'loadList'
    },
    {
      name: 'AdminMindGardenObservabilityPage',
      source: () => readAdmin('AdminMindGardenObservabilityPage.js'),
      loadFn: 'loadList'
    },
    {
      name: 'AdminTenantSmsSettingsPage',
      source: () => readAdmin('AdminTenantSmsSettingsPage.js'),
      loadFn: 'loadSettings'
    },
    {
      name: 'AdminKakaoAlimtalkSettingsPage',
      source: () => readAdmin('AdminKakaoAlimtalkSettingsPage.js'),
      loadFn: 'loadSettings'
    },
    {
      name: 'CacheMonitoringDashboard',
      source: () => readAdmin('CacheMonitoringDashboard.js'),
      loadFn: 'fetchCacheStats'
    },
    {
      name: 'SubscriptionsPage',
      source: () => readAdmin('billing', 'SubscriptionsPage.js'),
      loadFn: 'loadList'
    },
    {
      name: 'MappingManagementPage',
      source: () => readAdmin('mapping-management', 'pages', 'MappingManagementPage.js'),
      loadFn: 'loadMappings'
    },
    {
      name: 'IntegratedMatchingSchedule',
      source: () => readAdmin('mapping-management', 'IntegratedMatchingSchedule.js'),
      loadFn: 'loadMappings'
    }
  ];

  test.each(cases)('$name imports softRefresh and uses softRefresh($loadFn)', ({ source, loadFn }) => {
    const src = source();
    expect(src).toMatch(/from ['"][^'"]*utils\/softRefresh['"]/);
    expect(src).toMatch(/runResourceLoad/);
    expect(src).toMatch(new RegExp(`softRefresh\\(${loadFn}\\)`));
  });

  test('CacheMonitoringDashboard keeps setInterval but polls via softRefresh', () => {
    const src = readAdmin('CacheMonitoringDashboard.js');
    expect(src).toMatch(/setInterval/);
    expect(src).toMatch(/softRefresh\(fetchCacheStats\)/);
  });
});
