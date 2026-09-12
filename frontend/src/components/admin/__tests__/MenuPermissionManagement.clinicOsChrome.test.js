/**
 * MenuPermissionManagement Clinic-OS chrome locks
 * SSOT: docs/design-system/clinic-os-app-menu-visibility-spec.md
 * Orchestration: MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md
 *
 * @author CoreSolution
 * @since 2026-09-08
 * @updated 2026-09-12 — 일괄 저장 CTA 제거 · iOS|Android 이중 Switch 즉시 grant
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

  test('layout order: QuietHeader → IosReviewBar → TabChipRow → BadgeRail → __stage', () => {
    const quietIdx = pageJs.indexOf('<MenuPermissionQuietHeader');
    const reviewIdx = pageJs.indexOf('<MenuPermissionIosReviewBar');
    const chipsIdx = pageJs.indexOf('<TabChipRow');
    const railIdx = pageJs.indexOf('<MenuPermissionBadgeRail');
    const stageIdx = pageJs.indexOf('menu-permission__stage');
    expect(quietIdx).toBeGreaterThan(-1);
    expect(reviewIdx).toBeGreaterThan(quietIdx);
    expect(chipsIdx).toBeGreaterThan(reviewIdx);
    expect(railIdx).toBeGreaterThan(chipsIdx);
    expect(stageIdx).toBeGreaterThan(railIdx);
  });

  test('title and subtitle are Critic PASS Korean copy (immediate apply + iOS one-button)', () => {
    expect(stringsJs).toMatch(/TITLE:\s*'앱 메뉴 노출 관리'/);
    expect(stringsJs).toMatch(/즉시/);
    expect(stringsJs).toMatch(/iOS/);
    expect(stringsJs).toMatch(/원버튼|커뮤니티/);
    expect(stringsJs).not.toMatch(/메뉴 권한 관리/);
    expect(stringsJs).not.toMatch(/커뮤니티는 출시 후 검토/);
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

  test('batch Save CTA removed; dual platform Switch grants immediately', () => {
    expect(quietHeaderJs).not.toMatch(/SAVE_CHANGES/);
    expect(quietHeaderJs).not.toMatch(/onSave/);
    expect(quietHeaderJs).not.toMatch(/MGButton/);
    expect(pageJs).not.toMatch(/batchUpdateMenuPermissions/);
    expect(pageJs).not.toMatch(/handleBatchSave/);
    expect(pageJs).toMatch(/grantMenuPermission/);
    expect(pageJs).toMatch(/handlePlatformVisibilityChange/);
    expect(pageJs).toMatch(/setIosReviewMode/);
    expect(pageJs).toMatch(/MenuPermissionIosReviewBar/);
    expect(uiJs).toMatch(/canViewIos/);
    expect(uiJs).toMatch(/canViewAndroid/);
    expect(uiJs).toMatch(/menu-permission-platform-toggles/);
    expect(uiJs).toMatch(/onPlatformVisibilityChange/);
  });

  test('iOS review one-button: hide/show community iOS only', () => {
    const reviewBarJs = read(
      'src/components/admin/menu-permission/MenuPermissionIosReviewBar.js'
    );
    const apiJs = read('src/utils/menuPermissionApi.js');
    expect(reviewBarJs).toMatch(/iOS에서 커뮤니티 숨기기|MENU_PERM_IOS_REVIEW\.HIDE/);
    expect(reviewBarJs).toMatch(/다시 보이기|MENU_PERM_IOS_REVIEW\.SHOW/);
    expect(stringsJs).toMatch(/MENU_PERM_IOS_REVIEW/);
    expect(stringsJs).toMatch(/iOS에서 커뮤니티 숨기기/);
    expect(stringsJs).toMatch(/Android·웹은 그대로/);
    expect(css).toMatch(/\.menu-permission-ios-review\s*\{/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(apiJs).toMatch(/ios-review-mode/);
    expect(apiJs).toMatch(/setIosReviewMode/);
    expect(apiJs).toMatch(/getIosReviewMode/);
    expect(apiJs).toMatch(/StandardizedApi\.(get|post)/);
    expect(lockPolicyJs).not.toMatch(/CLT_COMMUNITY/);
    expect(lockPolicyJs).not.toMatch(/CST_COMMUNITY/);
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

  test('hard locks: CONSULTANT schedule-create + STAFF ops finance + P0 core', () => {
    expect(lockPolicyJs).toMatch(/STAFF_OPS_FINANCE_MENU_CODES/);
    expect(lockPolicyJs).toMatch(/ERP_FINANCIAL/);
    expect(lockPolicyJs).toMatch(/CORE_LAUNCH_ALWAYS_ON_MENU_CODES/);
    expect(lockPolicyJs).toMatch(/CLT_SCHEDULE/);
    expect(lockPolicyJs).toMatch(/isCoreLaunchAlwaysOnMenu/);
    expect(lockPolicyJs).toMatch(/isScheduleCreateMenu/);
    expect(lockPolicyJs).toMatch(/CONSULTANT/);
    expect(lockPolicyJs).not.toMatch(/커뮤니티는 출시 후 검토/);
    expect(uiJs).toMatch(/bi-lock-fill|menu-permission-lock/);
    expect(stringsJs).toMatch(/SCHEDULE_CREATE/);
    expect(stringsJs).toMatch(/STAFF_OPS_FINANCE/);
    expect(stringsJs).toMatch(/CORE_LAUNCH/);
    expect(stringsJs).toMatch(/원버튼|가이드라인 준수/);
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
