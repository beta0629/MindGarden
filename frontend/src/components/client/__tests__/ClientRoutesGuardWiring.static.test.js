/**
 * Static gate: 내담자 보호 라우트는 App.js 의 ClientRouteGuard 그룹 한 곳에만 둔다.
 * 화면은 navigate('/login')·SessionContext.isLoading 으로 로그인 상태를 직접 판단하지 않는다.
 * 레거시 앱 경로는 Redirect SSOT 로만 받는다. 내담자 화면은 관리자 매칭·연장 API 를 새로 부르지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const GUARD_OPEN = '<Route element={<ClientRouteGuard />}>';

/** App.js 에서 ClientRouteGuard 그룹 본문만 잘라 낸다 (같은 들여쓰기의 첫 </Route> 까지). */
const extractGuardGroup = () => {
  const src = read('App.js');
  const start = src.indexOf(GUARD_OPEN);
  expect(start).toBeGreaterThan(-1);
  const lineStart = src.lastIndexOf('\n', start) + 1;
  const indent = src.slice(lineStart, start);
  const close = src.indexOf(`\n${indent}</Route>`, start);
  expect(close).toBeGreaterThan(start);
  return src.slice(start, close);
};

const GUARDED_ROUTE_MARKERS = [
  'path={CLIENT_DASHBOARD_ROUTES.DASHBOARD}',
  'path={CLIENT_DASHBOARD_ROUTES.SCHEDULE}',
  'path={CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT}',
  'path={CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY}',
  'path={CLIENT_DASHBOARD_ROUTES.MESSAGES}',
  'path={CLIENT_DASHBOARD_ROUTES.MYPAGE}',
  'path="/client/activity-history"',
  'path={CLIENT_DASHBOARD_ROUTES.WELLNESS}',
  'path={`${CLIENT_DASHBOARD_ROUTES.WELLNESS}/:id`}',
  'path="/client/mindfulness-guide"',
  'path="/client" element={<ClientAppShell />}',
  'path={CLIENT_SHOP_ROUTES.CART}',
  'path={CLIENT_SHOP_ROUTES.CHECKOUT}',
  'path={CLIENT_SHOP_ROUTES.ORDERS}'
];

const CLIENT_SCREENS = [
  'components/client/ClientSchedule.js',
  'components/client/ClientSessionManagement.js',
  'components/client/ClientPaymentHistory.js',
  'components/client/ClientMessageScreen.js',
  'pages/client/ActivityHistory.js',
  'components/wellness/WellnessNotificationList.js',
  'components/wellness/WellnessNotificationDetail.js',
  'components/wellness/MindfulnessGuide.js'
];

describe('Client routes — single shared guard', () => {
  test.each(GUARDED_ROUTE_MARKERS)('%s 는 ClientRouteGuard 그룹 안에 있다', (marker) => {
    expect(extractGuardGroup()).toContain(marker);
  });

  test('가드 그룹 안 화면에는 개별 ProtectedRoute 를 중첩하지 않는다', () => {
    expect(extractGuardGroup()).not.toMatch(/<ProtectedRoute[\s>]/);
  });

  test('앱 시절 렌더러(ClientHome/Booking/Wellness/SessionPayment Renewal)는 App.js 에서 import 하지 않는다', () => {
    const src = stripComments(read('App.js'));
    ['ClientHomeRenewal', 'ClientBookingRenewal', 'ClientWellnessRenewal', 'ClientSessionPaymentRenewal']
      .forEach((name) => expect(src).not.toMatch(new RegExp(`import\\s+${name}\\s+from`)));
  });

  test.each(CLIENT_SCREENS)('%s 는 /login 이동·전역 세션 로딩으로 로그인 상태를 판단하지 않는다', (rel) => {
    const src = stripComments(read(rel));
    expect(src).not.toMatch(/navigate\(\s*['"]\/login/);
    expect(src).not.toMatch(/isLoading:\s*sessionLoading/);
    expect(src).not.toMatch(/\bisLoggedIn\b/);
  });

  test.each(CLIENT_SCREENS.filter((rel) => !rel.includes('MindfulnessGuide')))(
    '%s 는 공통 세션 준비 훅(useClientSessionReady)을 쓴다',
    (rel) => {
      expect(read(rel)).toMatch(/useClientSessionReady\(\)/);
    }
  );

  test('결제 내역은 관리자 매칭 API·current-user 를 부르지 않는다', () => {
    const src = stripComments(read('components/client/ClientPaymentHistory.js'));
    expect(src).not.toMatch(/\/api\/v1\/admin\//);
    expect(src).not.toMatch(/auth\/current-user/);
  });

  test('세션 관리는 current-user 를 다시 부르지 않는다 (세션 사용자 id 사용)', () => {
    expect(stripComments(read('components/client/ClientSessionManagement.js'))).not.toMatch(/AUTH_API|current-user/);
  });
});

describe('Legacy client paths — redirect SSOT', () => {
  const { CLIENT_LEGACY_ROUTE_REDIRECTS, CLIENT_DASHBOARD_ROUTES } = require('../../../constants/clientDashboardRoutes');
  const { CLIENT_SHOP_ROUTES } = require('../../../constants/clientShopConstants');

  test.each([
    ['/client/home', CLIENT_DASHBOARD_ROUTES.DASHBOARD],
    ['/client/booking', CLIENT_DASHBOARD_ROUTES.SCHEDULE],
    ['/client/wellness-hub', CLIENT_DASHBOARD_ROUTES.WELLNESS],
    ['/client/session-payment', CLIENT_SHOP_ROUTES.CATALOG]
  ])('%s → %s', (from, to) => {
    expect(CLIENT_LEGACY_ROUTE_REDIRECTS).toContainEqual({ from, to });
  });

  test('레거시 from 은 중복 없음', () => {
    const froms = CLIENT_LEGACY_ROUTE_REDIRECTS.map((r) => r.from);
    expect(new Set(froms).size).toBe(froms.length);
  });
});
