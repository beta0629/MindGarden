/**
 * CLIENT `/client/community` — LNB CLT_COMMUNITY 게이트 제거 회귀
 *
 * After #1102/#1103 community is an allowed deep-link under ClientWebTopChrome,
 * not an LNB/header tab. Guarding on LNB presence fail-closes to /client/dashboard.
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('CLIENT community route — no CommunityMenuRouteGuard', () => {
  const appJs = read('src/App.js');

  const clientCommunityBlock = (() => {
    const start = appJs.indexOf('path={CLIENT_DASHBOARD_ROUTES.COMMUNITY}');
    expect(start).toBeGreaterThan(-1);
    const end = appJs.indexOf('path="/consultant/dashboard"', start);
    expect(end).toBeGreaterThan(start);
    return appJs.slice(start, end);
  })();

  test('CLIENT community mounts ClientCommunityPage without CommunityMenuRouteGuard', () => {
    expect(clientCommunityBlock).toMatch(/ProtectedRoute\s+requiredRoles=\{\[USER_ROLES\.CLIENT\]\}/);
    expect(clientCommunityBlock).toMatch(/<ClientCommunityPage\s*\/>/);
    expect(clientCommunityBlock).not.toMatch(/CommunityMenuRouteGuard/);
    expect(clientCommunityBlock).not.toMatch(/CLT_COMMUNITY/);
    expect(clientCommunityBlock).not.toMatch(/fallbackPath=\{CLIENT_DASHBOARD_ROUTES\.DASHBOARD\}/);
  });

  test('legacy /client/more/community still redirects TO /client/community', () => {
    expect(appJs).toMatch(
      /path="\/client\/more\/community"[\s\S]*?Navigate\s+to=\{CLIENT_DASHBOARD_ROUTES\.COMMUNITY\}/
    );
  });

  test('CONSULTANT community routes keep CommunityMenuRouteGuard', () => {
    const consultantGuards = appJs.match(
      /CommunityMenuRouteGuard[\s\S]*?menuCode=\{MENU_PERMISSION_CODES\.CST_COMMUNITY\}/g
    );
    expect(consultantGuards).not.toBeNull();
    expect(consultantGuards.length).toBeGreaterThanOrEqual(4);
    expect(appJs).not.toMatch(
      /CommunityMenuRouteGuard[\s\S]*?menuCode=\{MENU_PERMISSION_CODES\.CLT_COMMUNITY\}/
    );
  });
});
