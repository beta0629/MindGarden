/**
 * clientDashboardRoutes — 웹 LNB SSOT
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import {
  CLIENT_DASHBOARD_KPI_ROUTES,
  CLIENT_DASHBOARD_QUICK_MENU_ITEMS,
  CLIENT_DASHBOARD_ROUTES,
  buildClientDashboardQuickMenuItemTestId
} from '../clientDashboardRoutes';

describe('clientDashboardRoutes web-native SSOT', () => {
  test('routes align with web LNB (CLIENT_MENU_ITEMS)', () => {
    expect(CLIENT_DASHBOARD_ROUTES.DASHBOARD).toBe('/client/dashboard');
    expect(CLIENT_DASHBOARD_ROUTES.SCHEDULE).toBe('/client/schedule');
    expect(CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT).toBe('/client/session-management');
    expect(CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY).toBe('/client/payment-history');
    expect(CLIENT_DASHBOARD_ROUTES.SETTINGS).toBe('/client/settings');
  });

  test('KPI routes stay web-native (not AppShell paths)', () => {
    expect(CLIENT_DASHBOARD_KPI_ROUTES.REMAINING_SESSIONS).toBe(
      CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT
    );
    expect(CLIENT_DASHBOARD_KPI_ROUTES.THIS_MONTH_SESSIONS).toBe(
      CLIENT_DASHBOARD_ROUTES.SCHEDULE
    );
    expect(CLIENT_DASHBOARD_KPI_ROUTES.UNREAD_MESSAGES).toBe(
      CLIENT_DASHBOARD_ROUTES.MESSAGES
    );
    expect(CLIENT_DASHBOARD_KPI_ROUTES.COMPLETED_SESSIONS).toBe(
      CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT
    );
  });

  test('quick menu mirrors LNB minus dashboard', () => {
    const ids = CLIENT_DASHBOARD_QUICK_MENU_ITEMS.map((item) => item.id);
    expect(ids).toEqual(['schedule', 'session-management', 'payment-history', 'settings']);
    ids.forEach((id) => {
      expect(buildClientDashboardQuickMenuItemTestId(id)).toBe(
        `client-dashboard-quick-menu-item-${id}`
      );
    });
  });

  test('quick menu excludes App-only and cross-link paths', () => {
    const routes = CLIENT_DASHBOARD_QUICK_MENU_ITEMS.map((item) => item.route);
    expect(routes).not.toContain('/client/wellness-hub');
    expect(routes).not.toContain('/client/mypage');
    expect(routes).not.toContain('/client/session-payment');
    expect(routes).not.toContain('/client/consultations');
    expect(routes).not.toContain('/client/messages');
    expect(CLIENT_DASHBOARD_ROUTES.WELLNESS).toBe('/client/wellness');
    expect(CLIENT_DASHBOARD_ROUTES.WELLNESS).not.toBe('/client/wellness-hub');
  });
});
