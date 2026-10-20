/**
 * 내 알림 metadata → 내담자 경로.
 */

import { CLIENT_DASHBOARD_ROUTES } from '../clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from '../clientShopConstants';
import { CLIENT_NOTIFICATIONS_ENTRY_PATH } from '../notificationTabs';
import { USER_ROLES, LEGACY_USER_ROLES } from '../roles';
import {
  isClientNotificationUser,
  parsePersonalNotificationMetadata,
  resolveNotificationsListPath,
  resolvePersonalNotificationDestination,
  usesClientNotificationShell
} from '../personalNotificationRoutes';

const clientOptions = { isClient: true, shopEnabled: true, shopGateKnown: true };

describe('personalNotificationRoutes', () => {
  test('kind 별 경로. 매칭 승인은 mappingId 가 있어도 회기 관리', () => {
    const approved = resolvePersonalNotificationDestination({
      metadata: { kind: 'MAPPING_APPROVED', mappingId: 12, productName: '10회' }
    }, clientOptions);
    expect(approved.path).toBe(CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT);
    expect(approved.unavailable).toBe(false);

    const payment = resolvePersonalNotificationDestination({
      metadata: { kind: 'PAYMENT_CONFIRMED', mappingId: 929, productName: '기본', amount: 1000 }
    }, clientOptions);
    expect(payment.path).toBe(`${CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY}?mappingId=929`);

    const deposit = resolvePersonalNotificationDestination({
      metadata: JSON.stringify({ kind: 'DEPOSIT_CONFIRMED', mappingId: '8', amount: 0 })
    }, clientOptions);
    expect(deposit.path).toBe(`${CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY}?mappingId=8`);
    expect(deposit.meta.amount).toBe(0);

    const paymentWithoutId = resolvePersonalNotificationDestination({
      metadata: { kind: 'PAYMENT_CONFIRMED', productName: '상품' }
    }, clientOptions);
    expect(paymentWithoutId.path).toBe(CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY);
  });

  test('kind 가 없으면 참고 유형만 열고, 모르는 유형·비내담자는 모달', () => {
    expect(resolvePersonalNotificationDestination({
      notificationType: 'SHOP_ORDER',
      metadata: null
    }, clientOptions).path).toBe(CLIENT_SHOP_ROUTES.ORDERS);

    expect(resolvePersonalNotificationDestination({
      notificationType: 'SHOP_ORDER'
    }, { isClient: true, shopEnabled: false, shopGateKnown: true }).unavailable).toBe(true);

    expect(resolvePersonalNotificationDestination({
      notificationType: 'SHOP_ORDER'
    }, { isClient: true, shopEnabled: false, shopGateKnown: false }).path).toBe(CLIENT_SHOP_ROUTES.ORDERS);

    expect(resolvePersonalNotificationDestination({
      notificationType: 'SCHEDULE'
    }, clientOptions).path).toBe(CLIENT_DASHBOARD_ROUTES.SCHEDULE);
    expect(resolvePersonalNotificationDestination({
      notificationType: 'MESSAGE'
    }, clientOptions).path).toBe(CLIENT_DASHBOARD_ROUTES.MESSAGES);
    expect(resolvePersonalNotificationDestination({
      notificationType: 'WELLNESS'
    }, clientOptions).path).toBe(CLIENT_DASHBOARD_ROUTES.WELLNESS);

    const unknown = resolvePersonalNotificationDestination({
      title: '매칭 승인',
      content: '패키지: 1',
      metadata: {}
    }, clientOptions);
    expect(unknown.path).toBeNull();
    expect(unknown.unavailable).toBe(true);

    expect(resolvePersonalNotificationDestination({
      metadata: { kind: 'PAYMENT_CONFIRMED', mappingId: 1 }
    }, { isClient: false }).unavailable).toBe(true);
  });

  test('metadata 파싱과 셸 선택', () => {
    expect(parsePersonalNotificationMetadata('{"kind":"NOPE","productName":"상담 상품"}')).toEqual({
      kind: '',
      mappingId: '',
      productName: '상담 상품',
      amount: null
    });
    expect(usesClientNotificationShell(null, false)).toBe(true);
    expect(usesClientNotificationShell({ role: USER_ROLES.CLIENT }, true)).toBe(true);
    expect(usesClientNotificationShell({ role: LEGACY_USER_ROLES.ROLE_CLIENT }, true)).toBe(true);
    expect(isClientNotificationUser({ role: 'CONSULTANT' })).toBe(false);
    expect(usesClientNotificationShell({ role: 'ADMIN' }, true)).toBe(false);
  });

  test('알림 목록 주소는 내담자만 내 알림 탭', () => {
    expect(resolveNotificationsListPath({ role: USER_ROLES.CLIENT })).toBe(CLIENT_NOTIFICATIONS_ENTRY_PATH);
    expect(resolveNotificationsListPath({ role: LEGACY_USER_ROLES.ROLE_CLIENT }))
      .toBe(CLIENT_NOTIFICATIONS_ENTRY_PATH);
    expect(resolveNotificationsListPath({ role: 'CONSULTANT' })).toBe(CLIENT_DASHBOARD_ROUTES.NOTIFICATIONS);
    expect(resolveNotificationsListPath({ role: 'ADMIN' })).toBe('/notifications');
    expect(resolveNotificationsListPath(null)).toBe('/notifications');
  });
});
