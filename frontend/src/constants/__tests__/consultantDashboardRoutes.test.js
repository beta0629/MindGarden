/**
 * consultantDashboardRoutes — 웹 LNB SSOT
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import {
  CONSULTANT_DASHBOARD_KPI_ROUTES,
  CONSULTANT_DASHBOARD_QUICK_ACTION_ITEMS,
  CONSULTANT_DASHBOARD_ROUTES,
  buildConsultantDashboardQuickActionTestId
} from '../consultantDashboardRoutes';

describe('consultantDashboardRoutes web-native SSOT', () => {
  test('routes align with web LNB (CONSULTANT_MENU_ITEMS)', () => {
    expect(CONSULTANT_DASHBOARD_ROUTES.DASHBOARD).toBe('/consultant/dashboard');
    expect(CONSULTANT_DASHBOARD_ROUTES.SCHEDULE).toBe('/consultant/schedule');
    expect(CONSULTANT_DASHBOARD_ROUTES.AVAILABILITY).toBe('/consultant/availability');
    expect(CONSULTANT_DASHBOARD_ROUTES.CLIENTS).toBe('/consultant/clients');
    expect(CONSULTANT_DASHBOARD_ROUTES.MESSAGES).toBe('/consultant/messages');
    expect(CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS).toBe('/consultant/consultation-records');
    expect(CONSULTANT_DASHBOARD_ROUTES.SALARY_SETTLEMENT).toBe('/consultant/salary-settlement');
  });

  test('KPI routes stay web-native (not AppShell paths)', () => {
    expect(CONSULTANT_DASHBOARD_KPI_ROUTES.WEEKLY_CONSULTATIONS).toBe(
      CONSULTANT_DASHBOARD_ROUTES.SCHEDULE
    );
    expect(CONSULTANT_DASHBOARD_KPI_ROUTES.NEW_CLIENTS).toBe(
      CONSULTANT_DASHBOARD_ROUTES.CLIENTS
    );
    expect(CONSULTANT_DASHBOARD_KPI_ROUTES.UNREAD_MESSAGES).toBe(
      CONSULTANT_DASHBOARD_ROUTES.MESSAGES
    );
    expect(CONSULTANT_DASHBOARD_KPI_ROUTES.INCOMPLETE_RECORDS).toBe(
      `${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?filter=incomplete`
    );
  });

  test('quick action items mirror dashboard CTA paths', () => {
    const ids = CONSULTANT_DASHBOARD_QUICK_ACTION_ITEMS.map((item) => item.id);
    expect(ids).toEqual(['create-record', 'view-schedule', 'view-clients']);
    ids.forEach((id) => {
      expect(buildConsultantDashboardQuickActionTestId(id)).toBe(
        `consultant-dashboard-quick-action-${id}`
      );
    });
  });

  test('quick action excludes App-only and cross-link paths', () => {
    const routes = CONSULTANT_DASHBOARD_QUICK_ACTION_ITEMS.map((item) => item.route);
    expect(routes).not.toContain('/consultant/renewal/dashboard');
    expect(routes).not.toContain('/consultant/more');
    expect(routes.every((route) => route.startsWith('/consultant/'))).toBe(true);
  });
});
