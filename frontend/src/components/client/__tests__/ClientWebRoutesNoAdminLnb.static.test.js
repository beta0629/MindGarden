/**
 * Static gate: client route sources must not mount AdminCommonLayout / DesktopLnb
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Strip line and block comments so commented imports do not fail the gate */
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const CLIENT_ROUTE_SOURCES = [
  'components/client/ClientSettings.js',
  'components/client/ClientMessageScreen.js',
  'pages/client/ActivityHistory.js',
  'components/wellness/WellnessNotificationList.js',
  'components/wellness/WellnessNotificationDetail.js',
  'components/wellness/MindfulnessGuide.js',
  'components/client/ClientPaymentHistory.js',
  'components/client/ClientSchedule.js',
  'components/client/ClientSessionManagement.js',
  'components/layout/ClientAppShell.js',
  'pages/client/shop/ShopCartPage.js',
  'pages/client/shop/ShopCatalogPage.js',
  'pages/client/shop/ShopCheckoutPage.js',
  'components/shop/templates/ShopClientLayout.js'
];

describe('ClientWebRoutesNoAdminLnb — static source gate', () => {
  test.each(CLIENT_ROUTE_SOURCES)('%s has no AdminCommonLayout import', (rel) => {
    const src = stripComments(read(rel));
    expect(src).not.toMatch(/import\s+AdminCommonLayout\s+from/);
    expect(src).not.toMatch(/<AdminCommonLayout[\s>]/);
  });

  test('ClientAppShell has no sidebar / DesktopLnb / AppTopBar / BottomNavigation', () => {
    const src = stripComments(read('components/layout/ClientAppShell.js'));
    expect(src).not.toMatch(/mg-app-shell__sidebar/);
    expect(src).not.toMatch(/DesktopLnb/);
    expect(src).not.toMatch(/mg-v2-desktop-lnb/);
    expect(src).not.toMatch(/AppTopBar/);
    expect(src).not.toMatch(/BottomNavigation/);
    expect(src).toMatch(/ClientWebPageShell/);
  });

  test('MyPage CLIENT path uses ClientWebPageShell; keeps AdminCommonLayout for non-client', () => {
    const src = stripComments(read('components/mypage/MyPage.js'));
    expect(src).toMatch(/ClientWebPageShell/);
    expect(src).toMatch(/RoleUtils\.isClient/);
    expect(src).toMatch(/AdminCommonLayout/);
  });
});
