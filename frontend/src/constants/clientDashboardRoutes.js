/**
 * Client Dashboard · 웹 전용 라우트 SSOT
 * `menuItems.js` CLIENT_MENU_ITEMS(LNB) 및 App.js `/client/*` 와 정합.
 * Expo/AppShell 경로(wellness-hub 등)와 cross-link 금지.
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

/** 웹 LNB · App.js client 라우트 — 변경 시 menuItems.js 와 동시 갱신 */
export const CLIENT_DASHBOARD_ROUTES = {
  DASHBOARD: '/client/dashboard',
  SCHEDULE: '/client/schedule',
  SESSION_MANAGEMENT: '/client/session-management',
  PAYMENT_HISTORY: '/client/payment-history',
  SETTINGS: '/client/settings',
  /** 웹 대시보드 KPI·코어 블록 전용 (LNB 미포함) */
  MESSAGES: '/client/messages',
  /** 웹 레거시 웰니스 알림 목록 — App wellness-hub 와 별도 */
  WELLNESS: '/client/wellness',
  /**
   * 웹 `ClientWellnessRenewal` (`App.js` wellness-hub) — LNB·QUICK_MENU 미포함.
   * Expo `/(client)/(wellness)` 와 cross-link 금지. 대시보드 자료실 CTA 전용.
   */
  WELLNESS_HUB: '/client/wellness-hub'
};

/** KPI 카드 → 웹-native deep link */
export const CLIENT_DASHBOARD_KPI_ROUTES = {
  REMAINING_SESSIONS: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
  THIS_MONTH_SESSIONS: CLIENT_DASHBOARD_ROUTES.SCHEDULE,
  UNREAD_MESSAGES: CLIENT_DASHBOARD_ROUTES.MESSAGES
};

export const CLIENT_DASHBOARD_QUICK_MENU_TEST_ID_PREFIX = 'client-dashboard-quick-menu-item';

/**
 * 빠른 메뉴 = 웹 LNB(CLIENT_MENU_ITEMS)와 동일 경로 (대시보드 제외)
 * @type {ReadonlyArray<{ id: string, label: string, route: string }>}
 */
export const CLIENT_DASHBOARD_QUICK_MENU_ITEMS = [
  { id: 'schedule', label: '스케줄', route: CLIENT_DASHBOARD_ROUTES.SCHEDULE },
  { id: 'session-management', label: '회기 관리', route: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT },
  { id: 'payment-history', label: '결제 내역', route: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY },
  { id: 'settings', label: '설정', route: CLIENT_DASHBOARD_ROUTES.SETTINGS }
];

/**
 * @param {string} itemId
 * @returns {string}
 */
export const buildClientDashboardQuickMenuItemTestId = (itemId) =>
  `${CLIENT_DASHBOARD_QUICK_MENU_TEST_ID_PREFIX}-${itemId}`;
