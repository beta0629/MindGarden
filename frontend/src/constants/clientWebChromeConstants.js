/**
 * Client web top chrome — shared copy · nav SSOT (lobby · shop · cart · checkout)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import { CLIENT_DASHBOARD_ROUTES } from './clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from './clientShopConstants';

export const CLIENT_WEB_LOGOUT = '로그아웃';
export const CLIENT_WEB_LOGOUT_CONFIRM = '로그아웃 하시겠습니까?';
export const CLIENT_WEB_LOGOUT_CANCEL = '취소';
export const CLIENT_WEB_LOGIN = '로그인';

/** data-testid for shared ClientWebTopChrome */
export const CLIENT_WEB_TOP_CHROME_TEST_ID = 'client-web-top-chrome';

/** data-testid for shared ClientWebPageShell */
export const CLIENT_WEB_PAGE_SHELL_TEST_ID = 'client-web-page-shell';

/** CSS class for shared ClientWebPageShell */
export const CLIENT_WEB_PAGE_SHELL_CLASS = 'client-web-page-shell';

/** data-testid for shared top nav */
export const CLIENT_WEB_TOP_NAV_TEST_ID = 'client-web-top-nav';

/** data-testid for profile → settings entry (header-right, not nav tab) */
export const CLIENT_WEB_PROFILE_LINK_TEST_ID = 'client-web-profile-settings-link';

/** ClientWebTopChrome — profile link aria (header-right → settings) */
export const CLIENT_WEB_SETTINGS_ARIA = '설정';

/** Header utility entries — notifications · messages (SSOT href) */
export const CLIENT_WEB_NOTIFICATIONS_HREF = '/notifications';
export const CLIENT_WEB_MESSAGES_HREF = CLIENT_DASHBOARD_ROUTES.MESSAGES;
export const CLIENT_WEB_NOTIFICATIONS_ARIA = '알림';
export const CLIENT_WEB_MESSAGES_ARIA = '메시지';
export const CLIENT_WEB_NOTIFICATIONS_LINK_TEST_ID = 'client-web-notifications-link';
export const CLIENT_WEB_MESSAGES_LINK_TEST_ID = 'client-web-messages-link';
export const CLIENT_WEB_NOTIFICATIONS_LABEL = '알림';
export const CLIENT_WEB_MESSAGES_LABEL = '메시지';

/**
 * Clinic-OS client web editorial nav (header SSOT)
 * 「회기 고르기」= shop catalog entrance
 * @type {ReadonlyArray<{ id: string, label: string, path: string }>}
 */
export const CLIENT_WEB_NAV = Object.freeze([
  { id: 'home', label: '홈', path: CLIENT_DASHBOARD_ROUTES.DASHBOARD },
  { id: 'schedule', label: '예정', path: CLIENT_DASHBOARD_ROUTES.SCHEDULE },
  { id: 'sessions', label: '회기', path: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT },
  { id: 'shop', label: '회기 고르기', path: CLIENT_SHOP_ROUTES.CATALOG },
  { id: 'payment', label: '결제', path: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY }
]);

/** Exact nav labels for smoke asserts */
export const CLIENT_WEB_NAV_LABELS = Object.freeze(
  CLIENT_WEB_NAV.map((item) => item.label)
);
