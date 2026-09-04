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
import {
  filterBranchAdminLnbItems,
  filterHiddenAdminLnbItems,
  filterStaffErpLnbItems,
  mergeShopAdminLnbItems,
  normalizeLnbTree,
  resolveOperatorLnbDisplayLabel
} from '../lnbMenuUtils';

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

/**
 * filterHiddenAdminLnbItems 단위 테스트
 *
 * 카카오 알림톡·문자(SMS) 설정은 LNB에서만 숨김. 라우트·API는 유지.
 */
describe('filterHiddenAdminLnbItems', () => {
  test('시스템·설정 그룹에서 카카오 알림톡·SMS 항목만 제거', () => {
    const items = [
      {
        to: '/tenant/profile',
        label: '시스템·설정',
        icon: 'SETTINGS',
        end: false,
        children: [
          { to: '/tenant/profile', label: '센터 프로필', icon: 'BUILDING', end: true },
          { to: '/tenant/pg-configurations', label: 'PG 설정', icon: 'CREDIT_CARD', end: true },
          { to: ADMIN_ROUTES.KAKAO_ALIMTALK_SETTINGS, label: '카카오 알림톡', icon: 'MESSAGE_CIRCLE', end: true },
          { to: ADMIN_ROUTES.TENANT_SMS_SETTINGS, label: '문자 메시지(SMS)', icon: 'MESSAGE_SQUARE', end: true },
          { to: ADMIN_ROUTES.TEST_NOTIFICATION, label: '알림 테스트 발송', icon: 'BELL', end: true }
        ]
      }
    ];

    const result = filterHiddenAdminLnbItems(items);

    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(3);
    expect(result[0].children.map((c) => c.to)).toEqual([
      '/tenant/profile',
      '/tenant/pg-configurations',
      ADMIN_ROUTES.TEST_NOTIFICATION
    ]);
  });

  test('루트에 숨김 경로가 있으면 해당 항목 제거', () => {
    const items = [
      { to: ADMIN_ROUTES.DASHBOARD, label: '대시보드', icon: 'LAYOUT_DASHBOARD', end: true },
      { to: ADMIN_ROUTES.KAKAO_ALIMTALK_SETTINGS, label: '카카오 알림톡', icon: 'MESSAGE_CIRCLE', end: true }
    ];

    const result = filterHiddenAdminLnbItems(items);

    expect(result).toHaveLength(1);
    expect(result[0].to).toBe(ADMIN_ROUTES.DASHBOARD);
  });

  test('숨김 경로가 없으면 트리를 변형하지 않음 (no-op)', () => {
    const items = [
      { to: ADMIN_ROUTES.DASHBOARD, label: '대시보드', icon: 'LAYOUT_DASHBOARD', end: true },
      { to: '/tenant/pg-configurations', label: 'PG 설정', icon: 'CREDIT_CARD', end: true }
    ];

    const result = filterHiddenAdminLnbItems(items);

    expect(result).toHaveLength(2);
    expect(result[0].to).toBe(ADMIN_ROUTES.DASHBOARD);
    expect(result[1].to).toBe('/tenant/pg-configurations');
  });

  test('items 가 배열이 아니면 그대로 반환', () => {
    expect(filterHiddenAdminLnbItems(null)).toBeNull();
    expect(filterHiddenAdminLnbItems(undefined)).toBeUndefined();
  });

  test('운영·재무 그룹에서 미사용 조달·재고·구매 경로만 제거', () => {
    const items = [
      {
        to: '/erp/dashboard',
        label: '운영·재무',
        icon: 'BRIEFCASE',
        end: false,
        children: [
          { to: '/erp/dashboard', label: '운영 현황', icon: 'LINE_CHART', end: true },
          { to: '/erp/purchase', label: '조달·품목', icon: 'SHOPPING_CART', end: true },
          { to: '/erp/items', label: '아이템', icon: 'PACKAGE', end: true },
          { to: '/erp/inventory', label: '재고', icon: 'BOX', end: true },
          { to: '/erp/purchase-requests', label: '구매 요청', icon: 'SHOPPING_CART', end: true },
          { to: '/erp/orders', label: '주문', icon: 'TRUCK', end: true },
          { to: '/admin/erp/purchase', label: '구매(어드민)', icon: 'SHOPPING_CART', end: true },
          { to: '/erp/financial', label: '거래·정산', icon: 'CALCULATOR', end: true },
          { to: '/erp/budget', label: '예산 관리', icon: 'PIE_CHART', end: true },
          { to: '/erp/salary', label: '급여 관리', icon: 'BANKNOTE', end: true }
        ]
      }
    ];

    const result = filterHiddenAdminLnbItems(items);

    expect(result).toHaveLength(1);
    expect(result[0].children.map((c) => c.to)).toEqual([
      '/erp/dashboard',
      '/erp/financial',
      '/erp/budget',
      '/erp/salary'
    ]);
  });

  test('루트에 purchase/items 숨김 경로가 있으면 해당 항목 제거', () => {
    const items = [
      { to: '/erp/dashboard', label: '운영 현황', icon: 'LAYOUT_DASHBOARD', end: true },
      { to: '/erp/purchase', label: '조달·품목', icon: 'SHOPPING_CART', end: true },
      { to: '/erp/items', label: '아이템', icon: 'PACKAGE', end: true },
      { to: '/erp/budget', label: '예산 관리', icon: 'PIE_CHART', end: true }
    ];

    const result = filterHiddenAdminLnbItems(items);

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.to)).toEqual(['/erp/dashboard', '/erp/budget']);
  });
});

/**
 * normalizeLnbTree — 운영자 LNB 표시 오버레이 (DB menuName 「테넌트 …」 → 센터 …)
 * Flyway/menuName 저장값 변경 없음. menuCode·리프 path 기준 표시만.
 */
describe('normalizeLnbTree operator display overlay', () => {
  test('ADM_SETTINGS_TENANT_CODES / path → 센터 코드', () => {
    const tree = normalizeLnbTree([
      {
        menuPath: '/admin/tenant-common-codes',
        menuName: '테넌트 공통코드',
        menuCode: 'ADM_SETTINGS_TENANT_CODES',
        icon: 'TAG',
        children: []
      }
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].label).toBe('센터 코드');
    expect(tree[0].to).toBe('/admin/tenant-common-codes');
    expect(tree[0].menuCode).toBe('ADM_SETTINGS_TENANT_CODES');
  });

  test('path만 있어도 리프 /admin/tenant-common-codes → 센터 코드', () => {
    const tree = normalizeLnbTree([
      {
        menuPath: '/admin/tenant-common-codes',
        menuName: '테넌트 공통코드',
        icon: 'TAG',
        children: []
      }
    ]);
    expect(tree[0].label).toBe('센터 코드');
  });

  test('ADM_SETTINGS_TENANT 리프 → 센터 프로필 (부모 시스템·설정은 유지)', () => {
    const tree = normalizeLnbTree([
      {
        menuPath: '/tenant/profile',
        menuName: '시스템·설정',
        menuCode: 'ADM_SETTINGS',
        icon: 'SETTINGS',
        children: [
          {
            menuPath: '/tenant/profile',
            menuName: '테넌트 프로필',
            menuCode: 'ADM_SETTINGS_TENANT',
            icon: 'BUILDING',
            children: []
          },
          {
            menuPath: '/admin/branding',
            menuName: '브랜딩',
            menuCode: 'ADM_SETTINGS_BRANDING',
            icon: 'IMAGE',
            children: []
          }
        ]
      }
    ]);
    expect(tree[0].label).toBe('시스템·설정');
    expect(tree[0].children[0].label).toBe('센터 프로필');
    expect(tree[0].children[1].label).toBe('브랜딩');
  });

  test('resolveOperatorLnbDisplayLabel: 부모 path 공유 시 hasChildren이면 오버레이 안 함', () => {
    expect(resolveOperatorLnbDisplayLabel({
      menuCode: 'ADM_SETTINGS',
      path: '/tenant/profile',
      menuName: '시스템·설정',
      hasChildren: true
    })).toBe('시스템·설정');
    expect(resolveOperatorLnbDisplayLabel({
      path: '/tenant/profile',
      menuName: '테넌트 프로필',
      hasChildren: false
    })).toBe('센터 프로필');
  });

  test('ERP_FINANCIAL / path → 이번 달 돈 (DB menuName 거래·정산 유지)', () => {
    const tree = normalizeLnbTree([
      {
        menuPath: '/erp/financial',
        menuName: '거래·정산',
        menuCode: 'ERP_FINANCIAL',
        icon: 'CALCULATOR',
        children: []
      }
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].label).toBe('이번 달 돈');
    expect(tree[0].to).toBe('/erp/financial');
    expect(tree[0].menuCode).toBe('ERP_FINANCIAL');
  });

  test('path만 있어도 리프 /erp/financial → 이번 달 돈', () => {
    const tree = normalizeLnbTree([
      {
        menuPath: '/erp/financial',
        menuName: '거래·정산',
        icon: 'CALCULATOR',
        children: []
      }
    ]);
    expect(tree[0].label).toBe('이번 달 돈');
  });
});

describe('normalizeLnbTree — ADMIN 대시보드 랜딩 SSOT', () => {
  test('user ADMIN: 「대시보드」 → /admin/dashboard (erp leftover 아님)', () => {
    const tree = normalizeLnbTree(
      [
        { menuPath: '/dashboard', menuName: '대시보드', icon: 'LAYOUT_DASHBOARD', children: [] },
        {
          menuPath: '/erp/dashboard',
          menuName: '운영·재무',
          menuCode: 'ADM_ERP',
          icon: 'BRIEFCASE',
          children: [
            { menuPath: '/erp/dashboard', menuName: '운영 현황', icon: 'LINE_CHART', children: [] }
          ]
        }
      ],
      { user: { role: 'ADMIN' } }
    );
    expect(tree[0].label).toBe('대시보드');
    expect(tree[0].to).toBe('/admin/dashboard');
    expect(tree[0].to).not.toBe('/erp/dashboard');
    expect(tree[1].children[0].label).toBe('운영 현황');
    expect(tree[1].children[0].to).toBe('/erp/dashboard');
  });

  test('userRole ADMIN (세션 폴백): 「대시보드」 → /admin/dashboard', () => {
    const tree = normalizeLnbTree(
      [{ menuPath: '/dashboard', menuName: '대시보드', icon: 'LAYOUT_DASHBOARD', children: [] }],
      { userRole: 'ADMIN' }
    );
    expect(tree[0].to).toBe('/admin/dashboard');
  });
});

describe('filterStaffErpLnbItems', () => {
  test('ADM_ERP menuCode 및 /erp/* 노드를 제거한다', () => {
    const items = [
      { to: '/admin/dashboard', label: '대시보드', icon: 'LAYOUT_DASHBOARD', end: true },
      {
        to: '/erp/dashboard',
        label: '운영·재무',
        icon: 'BRIEFCASE',
        end: false,
        menuCode: 'ADM_ERP',
        children: [
          { to: '/erp/financial', label: '이번 달 돈', icon: 'CALCULATOR', end: true }
        ]
      },
      { to: '/admin/users', label: '사용자', icon: 'USERS', end: true }
    ];
    const result = filterStaffErpLnbItems(items);
    expect(result.map((i) => i.to)).toEqual(['/admin/dashboard', '/admin/users']);
    expect(result.some((i) => i.menuCode === 'ADM_ERP')).toBe(false);
  });

  test('/admin/erp/* 경로도 제거한다', () => {
    const items = [
      { to: '/admin/erp/financial', label: '재무', icon: 'CALCULATOR', end: true },
      { to: '/admin/messages', label: '메시지', icon: 'MESSAGE', end: true }
    ];
    const result = filterStaffErpLnbItems(items);
    expect(result.map((i) => i.to)).toEqual(['/admin/messages']);
  });

  test('비배열 입력은 그대로 반환', () => {
    expect(filterStaffErpLnbItems(null)).toBeNull();
    expect(filterStaffErpLnbItems(undefined)).toBeUndefined();
  });
});
