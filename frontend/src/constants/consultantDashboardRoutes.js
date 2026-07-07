/**
 * Consultant Dashboard · 웹 전용 라우트 SSOT
 * `menuItems.js` CONSULTANT_MENU_ITEMS(LNB) 및 App.js `/consultant/*` 와 정합.
 * Expo AppShell 경로와 cross-link 금지.
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

/** 웹 LNB · App.js consultant 라우트 — 변경 시 menuItems.js 와 동시 갱신 */
export const CONSULTANT_DASHBOARD_ROUTES = {
  DASHBOARD: '/consultant/dashboard',
  SCHEDULE: '/consultant/schedule',
  AVAILABILITY: '/consultant/availability',
  CLIENTS: '/consultant/clients',
  MESSAGES: '/consultant/messages',
  CONSULTATION_RECORDS: '/consultant/consultation-records',
  CONSULTATION_LOGS: '/consultant/consultation-logs',
  SALARY_SETTLEMENT: '/consultant/salary-settlement',
  /** 시스템 알림 (역할 공통) */
  NOTIFICATIONS: '/notifications'
};

/** KPI 카드 → 웹-native deep link */
export const CONSULTANT_DASHBOARD_KPI_ROUTES = {
  WEEKLY_CONSULTATIONS: CONSULTANT_DASHBOARD_ROUTES.SCHEDULE,
  NEW_CLIENTS: CONSULTANT_DASHBOARD_ROUTES.CLIENTS,
  UNREAD_MESSAGES: CONSULTANT_DASHBOARD_ROUTES.MESSAGES,
  INCOMPLETE_RECORDS: `${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?filter=incomplete`
};

export const CONSULTANT_DASHBOARD_QUICK_ACTION_TEST_ID_PREFIX = 'consultant-dashboard-quick-action';

/**
 * QuickActionBar = 대시보드 주요 CTA (LNB 핵심 경로와 정합)
 * @type {ReadonlyArray<{ id: string, label: string, route: string, variant: 'primary' | 'outline' }>}
 */
export const CONSULTANT_DASHBOARD_QUICK_ACTION_ITEMS = [
  {
    id: 'create-record',
    label: '상담일지 작성',
    route: `${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?action=create`,
    variant: 'primary'
  },
  {
    id: 'view-schedule',
    label: '일정 조회',
    route: CONSULTANT_DASHBOARD_ROUTES.SCHEDULE,
    variant: 'outline'
  },
  {
    id: 'view-clients',
    label: '내담자 관리',
    route: CONSULTANT_DASHBOARD_ROUTES.CLIENTS,
    variant: 'outline'
  }
];

/**
 * @param {string} itemId
 * @returns {string}
 */
export const buildConsultantDashboardQuickActionTestId = (itemId) =>
  `${CONSULTANT_DASHBOARD_QUICK_ACTION_TEST_ID_PREFIX}-${itemId}`;
