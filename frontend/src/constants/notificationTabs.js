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

/** 내담자가 알림 화면으로 들어오는 기본 주소. 상담사·관리자 목록 경로와 분리한다. */
export const NOTIFICATIONS_LIST_PATH = '/notifications';

export const CLIENT_NOTIFICATIONS_ENTRY_PATH = buildNotificationsTabPath(
  NOTIFICATIONS_LIST_PATH,
  NOTIFICATION_TABS.PERSONAL
);

export const PERSONAL_NOTIFICATION_TEST_IDS = Object.freeze({
  LIST: 'personal-notifications-list',
  ITEM: 'personal-notifications-item',
  TAB: 'notifications-tab-personal'
});

export const NOTIFICATION_PAGE_TEST_IDS = Object.freeze({
  TAB_SYSTEM: 'notifications-tab-system',
  TAB_MESSAGES: 'notifications-tab-messages',
  UNAVAILABLE: 'notification-target-unavailable',
  ERROR: 'notifications-error',
  LOGIN: 'notifications-login-required',
  SKELETON: 'notifications-skeleton'
});

/** 로딩 스켈레톤 카드 수 (시안 03·04) */
export const NOTIFICATION_SKELETON_COUNT = 3;

export const NOTIFICATION_PREVIEW_MAX_CHARS = 100;
