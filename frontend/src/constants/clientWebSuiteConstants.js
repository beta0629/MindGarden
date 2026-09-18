/**
 * Clinic-OS client web suite — page titles · slot copy (no tenant/product hardcode)
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import { CLIENT_SHOP_ROUTES } from './clientShopConstants';
import { CLIENT_DASHBOARD_ROUTES } from './clientDashboardRoutes';

/** Stage / shell layout tokens (mirrored as CSS custom properties) */
export const CLIENT_WEB_STAGE_MAX_PX = 920;
export const CLIENT_WEB_STAGE_PAD_TOP = 36;
export const CLIENT_WEB_STAGE_PAD_X = 56;
export const CLIENT_WEB_STAGE_PAD_BOTTOM = 56;
export const CLIENT_WEB_ASIDE_WIDTH_PX = 320;
export const CLIENT_WEB_TOPCHROME_H_PX = 64;

export const CLIENT_WEB_SUITE_COPY = Object.freeze({
  SCHEDULE_TITLE: '다가오는 상담',
  SCHEDULE_EMPTY: '예정된 상담이 없습니다',
  SCHEDULE_ASIDE_TITLE: '다음 상담',
  SCHEDULE_MINI_MONTH_LABEL: '이번 달',
  SCHEDULE_RETRY: '다시 시도',
  SCHEDULE_ERROR_TITLE: '일정을 불러오지 못했습니다',
  SCHEDULE_LOADING: '불러오는 중…',
  SESSIONS_TITLE: '남은 회기',
  SESSIONS_TOTAL_UNIT: '회',
  SESSIONS_BREAKDOWN_TOTAL: '전체',
  SESSIONS_BREAKDOWN_USED: '사용',
  SESSIONS_BREAKDOWN_REMAINING: '남음',
  SESSIONS_EMPTY_TITLE: '이용 가능한 회기가 없습니다',
  SESSIONS_EMPTY_BODY: '회기를 고르면 여기에서 잔량을 확인할 수 있습니다.',
  SESSIONS_SHOP_CTA_TITLE: '회기가 더 필요하신가요?',
  SESSIONS_SHOP_CTA: '회기 고르기',
  SESSIONS_SHOP_HREF: CLIENT_SHOP_ROUTES.CATALOG,
  SESSIONS_LOADING: '불러오는 중…',
  SESSIONS_ERROR_TITLE: '회기 정보를 불러오지 못했습니다',
  SESSIONS_RETRY: '다시 시도',
  PAYMENT_TITLE: '결제 내역',
  PAYMENT_FILTER_TITLE: '기간·상태',
  PAYMENT_FILTER_ALL: '전체',
  PAYMENT_FILTER_COMPLETED: '완료',
  PAYMENT_FILTER_PENDING: '대기',
  PAYMENT_FILTER_REFUNDED: '환불',
  PAYMENT_COL_DATE: '일자',
  PAYMENT_COL_PRODUCT: '상품',
  PAYMENT_COL_AMOUNT: '금액',
  PAYMENT_COL_METHOD: '방법',
  PAYMENT_COL_STATUS: '상태',
  PAYMENT_EMPTY_TITLE: '결제 내역이 없습니다',
  PAYMENT_EMPTY_BODY: '결제가 완료되면 여기에서 확인할 수 있습니다.',
  PAYMENT_LOADING: '불러오는 중…',
  PAYMENT_ERROR_TITLE: '결제 내역을 불러오지 못했습니다',
  PAYMENT_RETRY: '다시 시도',
  SETTINGS_TITLE: '계정 및 알림',
  SETTINGS_ACCOUNT_GROUP: '계정',
  SETTINGS_ACCOUNT_NAME: '이름',
  SETTINGS_ACCOUNT_EMAIL: '이메일',
  SETTINGS_ACCOUNT_MOBILE: '휴대폰',
  SETTINGS_ACCOUNT_PASSWORD: '비밀번호',
  SETTINGS_ACCOUNT_PASSWORD_MASK: '••••••••',
  SETTINGS_NOTIFY_GROUP: '알림',
  COMMUNITY_TITLE: '센터의 이야기',
  SHOP_CATALOG_TITLE: '필요한 회기를 고르세요',
  CART_TITLE: '담은 회기 확인',
  CHECKOUT_TITLE: '주문 마무리',
  CHECKOUT_LOGIN_GATE_TITLE: '결제 전 로그인',
  CHECKOUT_LOGIN_GATE_BODY: '결제를 진행하려면 로그인해 주세요.',
  CHECKOUT_LOGIN_CTA: '로그인',
  CHECKOUT_LOGIN_DONE: '로그인됨',
  CHECKOUT_PAY_CTA: '결제하기',
  HOME_ASIDE_SESSIONS: '회기',
  HOME_ASIDE_PAY: '결제'
});

export const CLIENT_WEB_SUITE_ROUTES = Object.freeze({
  DASHBOARD: CLIENT_DASHBOARD_ROUTES.DASHBOARD,
  SCHEDULE: CLIENT_DASHBOARD_ROUTES.SCHEDULE,
  SESSIONS: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
  SHOP: CLIENT_SHOP_ROUTES.CATALOG,
  CART: CLIENT_SHOP_ROUTES.CART,
  CHECKOUT: CLIENT_SHOP_ROUTES.CHECKOUT,
  PAYMENT: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY,
  COMMUNITY: CLIENT_DASHBOARD_ROUTES.COMMUNITY,
  SETTINGS: CLIENT_DASHBOARD_ROUTES.SETTINGS
});

/** data-testid helpers for suite smoke */
export const CLIENT_WEB_SUITE_TEST_IDS = Object.freeze({
  STAGE: 'client-web-page-shell-stage',
  GRID: 'client-web-page-shell-grid',
  MAIN: 'client-web-page-shell-main',
  ASIDE: 'client-web-page-shell-aside',
  PAGE_HEAD: 'client-web-page-shell-page-head',
  SCHEDULE_PAGE: 'client-schedule-page',
  SCHEDULE_MINI_MONTH: 'client-schedule-mini-month',
  SESSIONS_PAGE: 'client-session-management-page',
  PAYMENT_PAGE: 'client-payment-history-page',
  SETTINGS_PAGE: 'client-settings-page',
  CHECKOUT_LOGIN_GATE: 'client-shop-checkout-login-gate'
});
