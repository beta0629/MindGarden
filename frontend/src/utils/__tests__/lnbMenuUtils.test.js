/**
 * lnbMenuUtils.mergeShopAdminLnbItems 단위 테스트
 *
 * - 운영 핫픽스(2026-05-23): CONSULTANT 등 비-admin 역할 LNB 에 어드민 쇼핑·리워드
 *   그룹이 폴백으로 끼어드는 결함 회귀 방지.
 * - 어드민 권한군(ADMIN, STAFF, BRANCH_*, HQ_*, TENANT_ADMIN, SUPER_ADMIN)에서만
 *   폴백 그룹이 추가되어야 한다.
 *
 * @author Core Solution
 * @since 2026-05-23
 */

import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { LEGACY_USER_ROLES, USER_ROLES } from '../../constants/roles';
import { filterBranchAdminLnbItems, mergeShopAdminLnbItems } from '../lnbMenuUtils';

const SHOP_ADMIN_GROUP_LABEL = '쇼핑·리워드';

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

const hasShopAdminGroup = (items) => Array.isArray(items)
  && items.some((it) => it.label === SHOP_ADMIN_GROUP_LABEL
    || it.to === ADMIN_ROUTES.SHOP_CATALOG_SKUS);

describe('mergeShopAdminLnbItems', () => {
  describe('비-admin 역할: 폴백 그룹 미삽입 (운영 누출 차단)', () => {
    test('CONSULTANT 는 items 그대로 반환', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: USER_ROLES.CONSULTANT
      });

      expect(result).toBe(items);
      expect(hasShopAdminGroup(result)).toBe(false);
    });

    test('CLIENT 는 items 그대로 반환', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: USER_ROLES.CLIENT
      });

      expect(result).toBe(items);
      expect(hasShopAdminGroup(result)).toBe(false);
    });

    test('PLAY_THERAPIST 는 items 그대로 반환', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: USER_ROLES.PLAY_THERAPIST
      });

      expect(result).toBe(items);
      expect(hasShopAdminGroup(result)).toBe(false);
    });

    test('SPEECH_THERAPIST 는 items 그대로 반환', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: USER_ROLES.SPEECH_THERAPIST
      });

      expect(result).toBe(items);
      expect(hasShopAdminGroup(result)).toBe(false);
    });

    test('알 수 없는 임의 역할 문자열은 items 그대로 반환', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: 'UNKNOWN_ROLE'
      });

      expect(result).toBe(items);
    });
  });

  describe('admin 권한군: 폴백 그룹 삽입', () => {
    test('ADMIN 은 쇼핑·리워드 그룹 삽입', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: USER_ROLES.ADMIN
      });

      expect(result).not.toBe(items);
      expect(hasShopAdminGroup(result)).toBe(true);
      const group = result.find((it) => it.label === SHOP_ADMIN_GROUP_LABEL);
      expect(group).toBeDefined();
      expect(Array.isArray(group.children)).toBe(true);
      expect(group.children.map((c) => c.to)).toEqual([
        ADMIN_ROUTES.SHOP_CATALOG_SKUS,
        ADMIN_ROUTES.SHOP_POINT_POLICIES,
        ADMIN_ROUTES.SHOP_ORDERS
      ]);
    });

    test('STAFF 는 쇼핑·리워드 그룹 삽입', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: USER_ROLES.STAFF
      });

      expect(hasShopAdminGroup(result)).toBe(true);
    });

    test('BRANCH_SUPER_ADMIN(레거시 세션 문자열) 은 쇼핑·리워드 그룹 삽입', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: LEGACY_USER_ROLES.BRANCH_SUPER_ADMIN
      });

      expect(hasShopAdminGroup(result)).toBe(true);
    });

    test('HQ_MASTER(레거시) 은 쇼핑·리워드 그룹 삽입', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: LEGACY_USER_ROLES.HQ_MASTER
      });

      expect(hasShopAdminGroup(result)).toBe(true);
    });

    test('어드민 트리에 이미 shop 경로가 있으면 폴백 미추가 (멱등성)', () => {
      const items = [
        ...buildBaseAdminLnb(),
        {
          to: ADMIN_ROUTES.SHOP_CATALOG_SKUS,
          label: SHOP_ADMIN_GROUP_LABEL,
          icon: 'SHOPPING_BAG',
          end: false,
          children: [
            { to: ADMIN_ROUTES.SHOP_CATALOG_SKUS, label: '상품(SKU) 관리', icon: 'PACKAGE', end: true }
          ]
        }
      ];

      const result = mergeShopAdminLnbItems(items, {
        adminShopCatalogEnabled: true,
        userRole: USER_ROLES.ADMIN
      });

      expect(result).toBe(items);
      const groupCount = result.filter((it) => it.label === SHOP_ADMIN_GROUP_LABEL).length;
      expect(groupCount).toBe(1);
    });
  });

  describe('안전 기본값 (legacy 호출 호환)', () => {
    test('userRole 미전달 시 items 그대로 반환', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, { adminShopCatalogEnabled: true });

      expect(result).toBe(items);
      expect(hasShopAdminGroup(result)).toBe(false);
    });

    test('options 자체 미전달 시 items 그대로 반환', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items);

      expect(result).toBe(items);
    });

    test('userRole = null 은 items 그대로 반환', () => {
      const items = buildBaseAdminLnb();
      const result = mergeShopAdminLnbItems(items, { userRole: null });

      expect(result).toBe(items);
    });

    test('items 가 배열이 아니면 그대로 반환', () => {
      expect(mergeShopAdminLnbItems(null, { userRole: USER_ROLES.ADMIN })).toBeNull();
      expect(mergeShopAdminLnbItems(undefined, { userRole: USER_ROLES.ADMIN })).toBeUndefined();
    });
  });
});

/**
 * filterBranchAdminLnbItems 단위 테스트
 *
 * 역할 SSOT 정리 PR-5 (2026-06-12): 사용자가 결정한 「Branch 시스템 사용 중단」 정책에 따라,
 * BE LNB seed 변경 없이 FE 측에서 Branch(/admin/branches, /admin/branch-*) 경로를 가진
 * 모든 메뉴 항목을 LNB 트리에서 제거한다.
 */
describe('filterBranchAdminLnbItems', () => {
  test('루트 Branch 메뉴 항목 제거', () => {
    const items = [
      { to: ADMIN_ROUTES.DASHBOARD, label: '대시보드', icon: 'LAYOUT_DASHBOARD', end: true },
      { to: '/admin/branches', label: '지점 관리', icon: 'BUILDING', end: true },
      { to: ADMIN_ROUTES.USER_MANAGEMENT, label: '사용자 관리', icon: 'USERS', end: true }
    ];

    const result = filterBranchAdminLnbItems(items);

    expect(result).toHaveLength(2);
    expect(result.map((it) => it.to)).toEqual([
      ADMIN_ROUTES.DASHBOARD,
      ADMIN_ROUTES.USER_MANAGEMENT
    ]);
  });

  test('자식 항목 중 Branch 경로만 제거되고 그룹은 유지', () => {
    const items = [
      {
        to: '#',
        label: '본사 관리',
        icon: 'BUILDING',
        end: false,
        children: [
          { to: '/admin/branches', label: '지점 목록', icon: 'LIST', end: true },
          { to: '/admin/branch-create', label: '지점 생성', icon: 'PLUS', end: true },
          { to: '/admin/branch-managers', label: '지점장 관리', icon: 'USER_COG', end: true },
          { to: '/admin/hq-settings', label: '본사 설정', icon: 'COG', end: true }
        ]
      }
    ];

    const result = filterBranchAdminLnbItems(items);

    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].to).toBe('/admin/hq-settings');
  });

  test('자식이 모두 Branch 경로이면 부모도 제거', () => {
    const items = [
      { to: ADMIN_ROUTES.DASHBOARD, label: '대시보드', icon: 'LAYOUT_DASHBOARD', end: true },
      {
        to: '/admin/branches',
        label: '지점 관리',
        icon: 'BUILDING',
        end: false,
        children: [
          { to: '/admin/branches', label: '지점 목록', icon: 'LIST', end: true },
          { to: '/admin/branch-status', label: '지점 상태', icon: 'ACTIVITY', end: true }
        ]
      }
    ];

    const result = filterBranchAdminLnbItems(items);

    expect(result).toHaveLength(1);
    expect(result[0].to).toBe(ADMIN_ROUTES.DASHBOARD);
  });

  test('Branch 경로가 없으면 트리를 변형하지 않음 (멱등성·no-op)', () => {
    const items = [
      { to: ADMIN_ROUTES.DASHBOARD, label: '대시보드', icon: 'LAYOUT_DASHBOARD', end: true },
      {
        to: ADMIN_ROUTES.USER_MANAGEMENT,
        label: '사용자 관리',
        icon: 'USERS',
        end: false,
        children: [
          { to: ADMIN_ROUTES.USER_MANAGEMENT, label: '사용자 목록', icon: 'USER', end: true }
        ]
      }
    ];

    const result = filterBranchAdminLnbItems(items);

    expect(result).toHaveLength(2);
    expect(result[0].to).toBe(ADMIN_ROUTES.DASHBOARD);
    expect(result[1].to).toBe(ADMIN_ROUTES.USER_MANAGEMENT);
    expect(result[1].children).toHaveLength(1);
  });

  test('items 가 배열이 아니면 그대로 반환', () => {
    expect(filterBranchAdminLnbItems(null)).toBeNull();
    expect(filterBranchAdminLnbItems(undefined)).toBeUndefined();
  });

  test('Branch 경로 prefix 매칭 — /admin/branches/123 도 제거', () => {
    const items = [
      { to: '/admin/branches/123', label: '지점 상세', icon: 'BUILDING', end: true },
      { to: '/admin/branch-consultants/456', label: '지점 상담사 상세', icon: 'USER', end: true },
      { to: '/admin/dashboard', label: '대시보드', icon: 'LAYOUT_DASHBOARD', end: true }
    ];

    const result = filterBranchAdminLnbItems(items);

    expect(result).toHaveLength(1);
    expect(result[0].to).toBe('/admin/dashboard');
  });

  test('/admin/branding 등 Branch prefix 가 아닌 유사 경로는 보존', () => {
    const items = [
      { to: '/admin/branding', label: '브랜딩', icon: 'PALETTE', end: true },
      { to: '/admin/branches', label: '지점 관리', icon: 'BUILDING', end: true }
    ];

    const result = filterBranchAdminLnbItems(items);

    expect(result).toHaveLength(1);
    expect(result[0].to).toBe('/admin/branding');
  });
});
