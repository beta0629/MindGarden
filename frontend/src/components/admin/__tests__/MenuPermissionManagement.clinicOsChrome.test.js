/**
 * MenuPermissionManagement Clinic-OS chrome locks
 * SSOT: docs/design-system/clinic-os-menu-permissions.md
 * Twin: RefundManagement.clinicOsChrome.test.js
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('MenuPermissionManagement Clinic-OS chrome', () => {
  const pageJs = read('src/components/admin/MenuPermissionManagement.js');
  const uiJs = read('src/components/ui/MenuPermissionManagementUI.js');
  const css = read('src/components/admin/menu-permission/MenuPermissionClinicOs.css');
  const quietHeaderJs = read(
    'src/components/admin/menu-permission/MenuPermissionQuietHeader.js'
  );
  const railJs = read('src/components/admin/menu-permission/MenuPermissionBadgeRail.js');
  const stringsJs = read('src/constants/menuPermissionManagementStrings.js');
  const lockPolicyJs = read('src/utils/menuPermissionLockPolicy.js');
  const appJs = read('src/App.js');
  const menuItemsJs = read('src/components/dashboard-v2/constants/menuItems.js');

  test('layout order: QuietHeader → TabChipRow → BadgeRail → __stage', () => {
    const quietIdx = pageJs.indexOf('<MenuPermissionQuietHeader');
    const chipsIdx = pageJs.indexOf('<TabChipRow');
    const railIdx = pageJs.indexOf('<MenuPermissionBadgeRail');
    const stageIdx = pageJs.indexOf('menu-permission__stage');
    expect(quietIdx).toBeGreaterThan(-1);
    expect(chipsIdx).toBeGreaterThan(quietIdx);
    expect(railIdx).toBeGreaterThan(chipsIdx);
    expect(stageIdx).toBeGreaterThan(railIdx);
  });

  test('title and subtitle are Critic PASS Korean copy', () => {
    expect(stringsJs).toMatch(/TITLE:\s*'앱 메뉴 노출 관리'/);
    expect(stringsJs).toMatch(/모바일 앱과 웹에서 역할별로/);
    expect(stringsJs).not.toMatch(/메뉴 권한 관리/);
    expect(quietHeaderJs).toMatch(/MENU_PERM_PAGE\.TITLE/);
    expect(quietHeaderJs).toMatch(/MENU_PERM_PAGE\.SUBTITLE/);
    expect(pageJs).toMatch(/title=\{MENU_PERM_PAGE\.TITLE\}/);
  });

  test('ALIGNED shell: clinic-os + stage + no B0KlA', () => {
    expect(pageJs).toMatch(/menu-permission--clinic-os/);
    expect(pageJs).toMatch(/menu-permission__stage/);
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(pageJs).not.toMatch(/ContentHeader/);
    expect(css).not.toMatch(/--ad-b0kla/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).toMatch(/\.menu-permission__stage\s*\{/);
    expect(css).toMatch(/border:\s*0\.0625rem solid var\(--mg-v2-color-neutral-300\)/);
    expect(css).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
  });

  test('Save CTA height locks to --mg-spacing-36', () => {
    expect(quietHeaderJs).toMatch(/MGButton/);
    expect(quietHeaderJs).toMatch(/menu-permission-header__save/);
    expect(css).toMatch(
      /menu-permission-header__save[\s\S]*?height:\s*var\(--mg-spacing-36\)/s
    );
  });

  test('role chips use TabChipRow; badges 기본/센터 맞춤 in middle column', () => {
    expect(pageJs).toMatch(/import TabChipRow from/);
    expect(stringsJs).toMatch(/DEFAULT:\s*'기본'/);
    expect(stringsJs).toMatch(/CENTER:\s*'센터 맞춤'/);
    expect(uiJs).toMatch(/menu-permission-row__badge-col/);
    expect(uiJs).toMatch(/MENU_PERM_BADGE/);
    expect(railJs).toMatch(/menu-permission-rail/);
  });

  test('operator body hides menuCode and menuPath', () => {
    expect(uiJs).not.toMatch(/menu\.menuCode/);
    expect(uiJs).not.toMatch(/menu\.menuPath/);
    expect(uiJs).not.toMatch(/mg-menu-code/);
    expect(uiJs).not.toMatch(/mg-menu-path/);
  });

  test('hard locks: CONSULTANT schedule-create + STAFF ops finance', () => {
    expect(lockPolicyJs).toMatch(/STAFF_OPS_FINANCE_MENU_CODES/);
    expect(lockPolicyJs).toMatch(/ERP_FINANCIAL/);
    expect(lockPolicyJs).toMatch(/ERP_DASHBOARD/);
    expect(lockPolicyJs).toMatch(/ERP_TAX/);
    expect(lockPolicyJs).toMatch(/ERP_SALARY/);
    expect(lockPolicyJs).toMatch(/isScheduleCreateMenu/);
    expect(lockPolicyJs).toMatch(/CONSULTANT/);
    expect(uiJs).toMatch(/bi-lock-fill|menu-permission-lock/);
    expect(stringsJs).toMatch(/SCHEDULE_CREATE/);
    expect(stringsJs).toMatch(/STAFF_OPS_FINANCE/);
  });

  test('route kept; Admin LNB does not add 메뉴 권한', () => {
    expect(appJs).toMatch(/MenuPermissionManagement/);
    expect(appJs).toMatch(/path="menu-permissions"/);
    expect(appJs).not.toMatch(
      /path="menu-permissions"\s+element=\{<\s*Navigate/
    );
    expect(menuItemsJs).not.toMatch(/MENU_PERMISSIONS/);
    expect(menuItemsJs).not.toMatch(/label:\s*'메뉴 권한'/);
  });
});
