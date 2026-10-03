/**
 * 통합 알림 화면(/notifications) 탭 키·쿼리 상수.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

export const NOTIFICATION_TABS = Object.freeze({
  SYSTEM: 'system',
  MESSAGES: 'messages',
  PERSONAL: 'personal'
});

/** `/notifications?tab=personal` — 헤더 종에서 바로 내 알림 탭으로 연다 */
export const NOTIFICATION_TAB_QUERY_KEY = 'tab';

export const API_PERSONAL_NOTIFICATIONS_LIST = '/api/v1/notifications';

/**
 * @param {string} basePath 알림 화면 경로
 * @param {string} tab NOTIFICATION_TABS 값
 * @returns {string}
 */
export const buildNotificationsTabPath = (basePath, tab) =>
  `${basePath}?${NOTIFICATION_TAB_QUERY_KEY}=${encodeURIComponent(tab)}`;

export const PERSONAL_NOTIFICATION_TEST_IDS = Object.freeze({
  LIST: 'personal-notifications-list',
  ITEM: 'personal-notifications-item',
  TAB: 'notifications-tab-personal'
});
