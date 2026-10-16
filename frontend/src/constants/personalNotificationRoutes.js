/**
 * 내 알림 유형 → 내담자 경로.
 * 경로는 CLIENT_DASHBOARD_ROUTES / CLIENT_SHOP_ROUTES 만 참조한다.
 * kind 가 없으면 제목·본문을 비교하지 않고, notificationType 참고 경로만 연다.
 *
 * @author CoreSolution
 * @since 2026-10-16
 */

import { CLIENT_DASHBOARD_ROUTES } from './clientDashboardRoutes';
import { CLIENT_PAYMENT_QUERY_KEYS } from './clientPaymentHistoryConstants';
import { CLIENT_SHOP_ROUTES } from './clientShopConstants';
import { LEGACY_USER_ROLES, USER_ROLES } from './roles';

export const PERSONAL_NOTIFICATION_KIND = Object.freeze({
  MAPPING_APPROVED: 'MAPPING_APPROVED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  DEPOSIT_CONFIRMED: 'DEPOSIT_CONFIRMED'
});

export const PERSONAL_NOTIFICATION_ROUTE_TYPE = Object.freeze({
  SHOP_ORDER: 'SHOP_ORDER',
  SCHEDULE: 'SCHEDULE',
  MESSAGE: 'MESSAGE',
  WELLNESS: 'WELLNESS'
});

export const PERSONAL_NOTIFICATION_PRESENTATION = Object.freeze({
  [PERSONAL_NOTIFICATION_KIND.MAPPING_APPROVED]: Object.freeze({
    tone: 'matching',
    titleKey: 'common:notification.unified.personal.type.matching.title',
    summaryKey: 'common:notification.unified.personal.type.matching.summary',
    goKey: 'common:notification.unified.personal.type.matching.go'
  }),
  [PERSONAL_NOTIFICATION_KIND.PAYMENT_CONFIRMED]: Object.freeze({
    tone: 'payment',
    titleKey: 'common:notification.unified.personal.type.payment.title',
    summaryKey: 'common:notification.unified.personal.type.payment.summary',
    goKey: 'common:notification.unified.personal.type.payment.go'
  }),
  [PERSONAL_NOTIFICATION_KIND.DEPOSIT_CONFIRMED]: Object.freeze({
    tone: 'deposit',
    titleKey: 'common:notification.unified.personal.type.deposit.title',
    summaryKey: 'common:notification.unified.personal.type.deposit.summary',
    goKey: 'common:notification.unified.personal.type.deposit.go'
  })
});

const KIND_VALUES = new Set(Object.values(PERSONAL_NOTIFICATION_KIND));

/**
 * @param {object|null|undefined} user
 * @returns {boolean}
 */
export const isClientNotificationUser = (user) => {
  const role = user && user.role;
  return role === USER_ROLES.CLIENT || role === LEGACY_USER_ROLES.ROLE_CLIENT;
};

/**
 * 비로그인·내담자는 ClientWebPageShell. 상담사·관리자는 AdminCommonLayout.
 *
 * @param {object|null|undefined} user
 * @param {boolean} isLoggedIn
 * @returns {boolean}
 */
export const usesClientNotificationShell = (user, isLoggedIn) => {
  if (!isLoggedIn || !user) {
    return true;
  }
  return isClientNotificationUser(user);
};

/**
 * @param {unknown} metadata 객체 또는 JSON 문자열
 * @returns {{ kind: string, mappingId: string, productName: string, amount: number|null }}
 */
export const parsePersonalNotificationMetadata = (metadata) => {
  const empty = { kind: '', mappingId: '', productName: '', amount: null };
  let source = metadata;
  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) {
      return empty;
    }
    try {
      source = JSON.parse(trimmed);
    } catch (err) {
      return empty;
    }
  }
  if (!source || typeof source !== 'object') {
    return empty;
  }
  const kindRaw = typeof source.kind === 'string' ? source.kind.trim() : '';
  const mappingRaw = source.mappingId;
  const mappingId = mappingRaw != null && String(mappingRaw).trim() !== ''
    ? String(mappingRaw).trim()
    : '';
  const productName = typeof source.productName === 'string' ? source.productName.trim() : '';
  const amountNumber = Number(source.amount);
  const amount = source.amount != null && source.amount !== '' && Number.isFinite(amountNumber)
    ? amountNumber
    : null;
  return {
    kind: KIND_VALUES.has(kindRaw) ? kindRaw : '',
    mappingId,
    productName,
    amount
  };
};

/**
 * @param {object|null|undefined} notification
 * @param {{ isClient?: boolean, shopEnabled?: boolean, shopGateKnown?: boolean }} [options]
 * @returns {{ path: string|null, meta: object, unavailable: boolean }}
 */
export const resolvePersonalNotificationDestination = (notification, options = {}) => {
  const meta = parsePersonalNotificationMetadata(notification && notification.metadata);
  const isClient = options.isClient === true;
  const shopEnabled = options.shopEnabled !== false;
  const shopGateKnown = options.shopGateKnown !== false;

  if (!isClient) {
    return { path: null, meta, unavailable: true };
  }

  if (meta.kind === PERSONAL_NOTIFICATION_KIND.MAPPING_APPROVED) {
    return {
      path: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
      meta,
      unavailable: false
    };
  }

  if (meta.kind === PERSONAL_NOTIFICATION_KIND.PAYMENT_CONFIRMED
    || meta.kind === PERSONAL_NOTIFICATION_KIND.DEPOSIT_CONFIRMED) {
    const params = new URLSearchParams();
    if (meta.mappingId) {
      params.set(CLIENT_PAYMENT_QUERY_KEYS.MAPPING_ID, meta.mappingId);
    }
    const query = params.toString();
    return {
      path: query
        ? `${CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY}?${query}`
        : CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY,
      meta,
      unavailable: false
    };
  }

  const type = String((notification && notification.notificationType) || '').toUpperCase();
  if (type === PERSONAL_NOTIFICATION_ROUTE_TYPE.SHOP_ORDER) {
    if (shopGateKnown && !shopEnabled) {
      return { path: null, meta, unavailable: true };
    }
    return { path: CLIENT_SHOP_ROUTES.ORDERS, meta, unavailable: false };
  }
  if (type === PERSONAL_NOTIFICATION_ROUTE_TYPE.SCHEDULE) {
    return { path: CLIENT_DASHBOARD_ROUTES.SCHEDULE, meta, unavailable: false };
  }
  if (type === PERSONAL_NOTIFICATION_ROUTE_TYPE.MESSAGE) {
    return { path: CLIENT_DASHBOARD_ROUTES.MESSAGES, meta, unavailable: false };
  }
  if (type === PERSONAL_NOTIFICATION_ROUTE_TYPE.WELLNESS) {
    return { path: CLIENT_DASHBOARD_ROUTES.WELLNESS, meta, unavailable: false };
  }

  return { path: null, meta, unavailable: true };
};
