/**
 * 어드민 결제/구독 LNB 폴백 — mergeBillingAdminLnbItems 단위 테스트.
 *
 * - 옵션 C 분리 PR (2026-05-27) 후속: Flyway 시드 V20260530_003 배포 전에도
 *   ADMIN/STAFF/HQ/SUPER_ADMIN 등 어드민 권한군에서 "결제/구독" 그룹이 노출되어야 함.
 * - CONSULTANT/CLIENT 등 비-admin 역할에서는 폴백이 *미*삽입되어야 함 (운영 누출 차단).
 * - DB 트리에 결제/구독 경로가 이미 있으면 폴백 미삽입.
 *
 * @author MindGarden
 * @since 2026-05-27
 */

import { ADMIN_ROUTES } from '../../../../constants/adminRoutes';
import { USER_ROLES } from '../../../../constants/roles';
import { mergeBillingAdminLnbItems } from '../../../../utils/lnbMenuUtils';

const BILLING_GROUP_LABEL = '결제/구독';

const buildBaseAdminLnb = () => ([
  {
    to: ADMIN_ROUTES.DASHBOARD,
    label: '대시보드',
    icon: 'LAYOUT_DASHBOARD',
    end: true
  },
  {
    to: ADMIN_ROUTES.USER_MANAGEMENT,
    label: '사용자 관리',
    icon: 'USERS',
    end: true
  }
]);

const hasBillingGroup = (items) => Array.isArray(items)
  && items.some((it) => it.label === BILLING_GROUP_LABEL
    || it.to === ADMIN_ROUTES.BILLING_SUBSCRIPTIONS
    || (Array.isArray(it.children) && it.children.some((c) => c.to === ADMIN_ROUTES.BILLING_SUBSCRIPTIONS)));

describe('mergeBillingAdminLnbItems — 어드민 결제/구독 LNB 폴백', () => {
  describe('어드민 권한군: 폴백 삽입', () => {
    it('ADMIN 은 결제/구독 그룹이 삽입된다', () => {
      const items = buildBaseAdminLnb();
      const result = mergeBillingAdminLnbItems(items, { userRole: USER_ROLES.ADMIN });
      expect(hasBillingGroup(result)).toBe(true);
      const billingGroup = result.find((it) => it.label === BILLING_GROUP_LABEL);
      expect(billingGroup).toBeDefined();
      expect(billingGroup.children).toHaveLength(2);
      expect(billingGroup.children.map((c) => c.to)).toEqual([
        ADMIN_ROUTES.BILLING_SUBSCRIPTIONS,
        ADMIN_ROUTES.BILLING_PAYMENT_METHODS
      ]);
    });

    it('STAFF 도 결제/구독 그룹이 삽입된다', () => {
      const items = buildBaseAdminLnb();
      const result = mergeBillingAdminLnbItems(items, { userRole: USER_ROLES.STAFF });
      expect(hasBillingGroup(result)).toBe(true);
    });
  });

  describe('비-admin 역할: 폴백 미삽입 (운영 누출 차단)', () => {
    it('CONSULTANT 는 items 가 그대로 반환된다', () => {
      const items = buildBaseAdminLnb();
      const result = mergeBillingAdminLnbItems(items, { userRole: USER_ROLES.CONSULTANT });
      expect(result).toBe(items);
      expect(hasBillingGroup(result)).toBe(false);
    });

    it('CLIENT 는 items 가 그대로 반환된다', () => {
      const items = buildBaseAdminLnb();
      const result = mergeBillingAdminLnbItems(items, { userRole: USER_ROLES.CLIENT });
      expect(result).toBe(items);
      expect(hasBillingGroup(result)).toBe(false);
    });

    it('userRole 미전달 시 items 가 그대로 반환된다', () => {
      const items = buildBaseAdminLnb();
      const result = mergeBillingAdminLnbItems(items, {});
      expect(result).toBe(items);
      expect(hasBillingGroup(result)).toBe(false);
    });
  });

  describe('DB 트리 결제/구독 경로 존재 시 폴백 미삽입 (중복 방지)', () => {
    it('items 에 BILLING_SUBSCRIPTIONS 경로가 이미 있으면 폴백 미삽입', () => {
      const items = [
        ...buildBaseAdminLnb(),
        {
          to: ADMIN_ROUTES.BILLING_SUBSCRIPTIONS,
          label: '결제/구독',
          icon: 'CREDIT_CARD',
          end: false,
          children: [
            { to: ADMIN_ROUTES.BILLING_SUBSCRIPTIONS, label: '구독 관리', icon: 'RECEIPT', end: true }
          ]
        }
      ];
      const result = mergeBillingAdminLnbItems(items, { userRole: USER_ROLES.ADMIN });
      expect(result).toBe(items);
      const billingMatches = result.filter((it) => it.to === ADMIN_ROUTES.BILLING_SUBSCRIPTIONS);
      expect(billingMatches.length).toBe(1);
    });
  });

  describe('비정상 입력', () => {
    it('items 가 배열이 아니면 그대로 반환', () => {
      const result = mergeBillingAdminLnbItems(null, { userRole: USER_ROLES.ADMIN });
      expect(result).toBeNull();
    });
  });
});
