/**
 * Guard: dashboard first-paint paths must NOT call MAPPINGS.LIST.
 * STATS / pending-payment / pending-deposit 만 허용.
 */

const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.join(__dirname, '..', '..');

const DASHBOARD_SOURCES = [
  path.join(SRC_ROOT, 'dashboard-v2', 'AdminDashboardV2.js'),
  path.join(SRC_ROOT, 'admin', 'AdminDashboard.js'),
  path.join(SRC_ROOT, 'dashboard', 'CommonDashboard.js'),
  path.join(SRC_ROOT, 'dashboard', 'widgets', 'consultation', 'MappingManagementWidget.js')
];

describe('AdminDashboardV2.noMappingsList', () => {
  test('dashboard sources must not reference MAPPINGS.LIST or bare /api/v1/admin/mappings LIST', () => {
    DASHBOARD_SOURCES.forEach((filePath) => {
      const src = fs.readFileSync(filePath, 'utf8');
      const relative = path.relative(path.join(__dirname, '../../..'), filePath);

      expect(src).not.toMatch(/MAPPINGS\.LIST/);
      // bare LIST path as GET target (allow /mappings/stats, pending-payment, pending-deposit)
      const bareListHits = src.match(/['"`]\/api\/v1\/admin\/mappings['"`]/g) || [];
      expect(bareListHits).toEqual([]);
      void relative;
    });
  });

  test('AdminDashboardV2 uses MAPPINGS.STATS', () => {
    const src = fs.readFileSync(
      path.join(SRC_ROOT, 'dashboard-v2', 'AdminDashboardV2.js'),
      'utf8'
    );
    expect(src).toMatch(/MAPPINGS\.STATS/);
  });
});
