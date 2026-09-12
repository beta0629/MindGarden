/**
 * UserManagementPage Clinic-OS chrome alignment — cascade / structure locks
 * Twin: ConsultationLogView.clinicOsChrome.test.js / MappingManagement.clinicOsChrome.test.js
 *
 * @author CoreSolution
 * @since 2026-09-06
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('UserManagementPage Clinic-OS chrome', () => {
  const pageJs = read('src/components/admin/UserManagementPage.js');
  const pageCss = read('src/components/admin/UserManagementPage.css');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).toMatch(/user-management--clinic-os/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
  });

  test('quiet header ContentHeader kept; no invented UserQuietHeader', () => {
    expect(pageJs).toMatch(/ContentHeader/);
    expect(pageJs).toMatch(/통합 사용자 관리/);
    expect(pageJs).not.toMatch(/UserQuietHeader/);
    expect(pageJs).toMatch(/ADMIN_ROUTES\.MENU_PERMISSIONS/);
    expect(pageJs).toMatch(/앱 메뉴 노출/);
  });

  test('type toggle uses TabChipRow (active primary / inactive outline via SSOT)', () => {
    expect(pageJs).toMatch(/import TabChipRow from ['"]\.\.\/common\/TabChipRow['"]/);
    expect(pageJs).toMatch(/<TabChipRow[\s\S]*activeKey=\{type\}/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla__pill/);
    expect(pageJs).not.toMatch(/user-management-tab-pending-deletion/);
  });

  test('page chrome CSS has no leftover --ad-b0kla tokens or hex', () => {
    expect(pageCss).not.toMatch(/--ad-b0kla/);
    expect(pageCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(pageCss).toMatch(/user-management--clinic-os/);
    expect(pageCss).toMatch(/--mg-v2-space-/);
  });
});
