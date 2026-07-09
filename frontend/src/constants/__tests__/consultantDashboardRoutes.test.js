/**
 * consultantDashboardRoutes — 웹 LNB SSOT
 *
 * @author CoreSolution
 * @since 2026-07-09
 */

import {
  CONSULTANT_DASHBOARD_KPI_ROUTES,
  CONSULTANT_DASHBOARD_QUICK_ACTIONS,
  CONSULTANT_DASHBOARD_ROUTES,
  buildConsultantClientDetailRoute,
  buildConsultantConsultationRecordRoute,
  buildConsultantConsultationRecordsRoute,
  buildConsultantClientsRoute
} from '../consultantDashboardRoutes';

describe('consultantDashboardRoutes web-native SSOT', () => {
  test('routes align with CONSULTANT_MENU_ITEMS / App.js', () => {
    expect(CONSULTANT_DASHBOARD_ROUTES.DASHBOARD).toBe('/consultant/dashboard');
    expect(CONSULTANT_DASHBOARD_ROUTES.SCHEDULE).toBe('/consultant/schedule');
    expect(CONSULTANT_DASHBOARD_ROUTES.CLIENTS).toBe('/consultant/clients');
    expect(CONSULTANT_DASHBOARD_ROUTES.MESSAGES).toBe('/consultant/messages');
    expect(CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS).toBe('/consultant/consultation-records');
    expect(CONSULTANT_DASHBOARD_ROUTES.SALARY_SETTLEMENT).toBe('/consultant/salary-settlement');
    expect(CONSULTANT_DASHBOARD_ROUTES.NOTIFICATIONS).toBe('/notifications');
  });

  test('KPI routes stay web-native (not renewal/AppShell paths)', () => {
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

  test('client detail uses App.js canonical /consultant/client/:id', () => {
    expect(buildConsultantClientDetailRoute(42)).toBe('/consultant/client/42');
    expect(buildConsultantClientsRoute({ filter: 'urgent' })).toBe(
      '/consultant/clients?filter=urgent'
    );
  });

  test('schedule deep link uses consultation-record screen', () => {
    expect(buildConsultantConsultationRecordRoute(99)).toBe('/consultant/consultation-record/99');
    expect(buildConsultantConsultationRecordsRoute({ filter: 'incomplete' })).toBe(
      '/consultant/consultation-records?filter=incomplete'
    );
  });

  test('quick actions exclude renewal and dashboard-v2 paths', () => {
    const paths = CONSULTANT_DASHBOARD_QUICK_ACTIONS.map((item) => item.path);
    expect(paths).not.toContain('/consultant/dashboard-v2');
    expect(paths).not.toContain('/consultant/renewal/dashboard');
    paths.forEach((path) => {
      expect(path.startsWith('/consultant/') || path === '/notifications').toBe(true);
    });
    expect(CONSULTANT_DASHBOARD_QUICK_ACTIONS.map((item) => item.id)).toEqual([
      'create-schedule',
      'view-schedule',
      'check-messages',
      'create-record',
      'salary-settlement'
    ]);
  });
});
