/**
 * 내담자 알림 진입은 /notifications?tab=personal.
 * 상담사·관리자 목록과 역할 없는 공용 기본 경로는 그대로 둔다.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('client notification entry paths', () => {
  test('내담자 진입 파일은 내 알림 주소를 쓴다', () => {
    [
      'components/layout/SimpleLayout.js',
      'components/common/NotificationBadge.js',
      'components/dashboard/widgets/ClientMessageWidget.js',
      'components/dashboard/ClientMessageSection.js',
      'components/client/ClientWebTopChrome.js'
    ].forEach((rel) => {
      expect(read(rel)).toContain('CLIENT_NOTIFICATIONS_ENTRY_PATH');
    });
    expect(read('components/dashboard-v2/molecules/NotificationDropdown.js'))
      .toContain('resolveNotificationsListPath(user)');
    expect(read('components/notifications/UnifiedNotifications.js'))
      .toContain('resolveNotificationsListPath(user)');
    expect(read('constants/clientDashboardRoutes.js'))
      .toContain("from: '/client/notifications', to: CLIENT_NOTIFICATIONS_ENTRY_PATH");
  });

  test('상담사·관리자 목록과 App.js 라우트 등록은 바꾸지 않는다', () => {
    const simple = read('components/layout/SimpleLayout.js');
    expect(simple).toMatch(/CONSULTANT:\s*'\/notifications'/);
    expect(simple).toMatch(/ADMIN:\s*'\/admin\/messages'/);

    const badge = read('components/common/NotificationBadge.js');
    expect(badge).toMatch(/CONSULTANT:[\s\S]*?system:\s*CLIENT_DASHBOARD_ROUTES\.NOTIFICATIONS/);
    expect(badge).toMatch(/ADMIN:[\s\S]*?system:\s*CLIENT_DASHBOARD_ROUTES\.NOTIFICATIONS/);

    const app = read('App.js');
    expect(app).toContain('CLIENT_LEGACY_ROUTE_REDIRECTS.map');
    expect(app).toContain('path="/notifications"');
    expect(app).not.toContain('tab=personal');
  });

  test('역할 없는 공용 기본 경로는 내 알림 탭으로 바꾸지 않는다', () => {
    expect(read('services/PushNotificationService.js')).toContain("SYSTEM: '/notifications'");
    expect(read('components/common/MGHeader.js')).toContain('href="/notifications"');
    expect(read('constants/MenuConstants.js')).toContain("path: '/notifications'");
    expect(read('components/dashboard/widgets/NotificationWidget.js')).toContain("navigate('/notifications')");
    expect(read('constants/consultantDashboardRoutes.js')).toContain("NOTIFICATIONS: '/notifications'");
  });
});
