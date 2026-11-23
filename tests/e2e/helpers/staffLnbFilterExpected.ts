/**
 * `filterStaffRestrictedLnbItems`(+ERP) 패리티용 기대값 계산.
 * 프론트 모듈을 Playwright Node에서 직접 import하지 않고, 동일 규칙(SSOT 코드/경로)을 복제한다.
 * 입력은 normalize 후 `{ label, to, menuCode?, children? }` 형태.
 */

export type LnbNode = {
  label: string;
  to?: string;
  menuCode?: string;
  children?: LnbNode[];
};

const ADM_ERP = 'ADM_ERP';
const ERP_PREFIXES = ['/erp', '/admin/erp'];

const STAFF_RESTRICTED_CODES = [
  'ADM_SETTINGS_PG',
  'ADM_SETTINGS_AI_PROVIDER',
  'ADM_SETTINGS_SYSTEM',
  'ADM_REPORTS_COMP'
];

const STAFF_RESTRICTED_PATHS = [
  '/tenant/pg-configurations',
  '/admin/system/ai-providers',
  '/admin/system-config',
  '/admin/compliance'
];

const STAFF_RESTRICTED_PATH_PREFIXES = ['/admin/compliance'];

function isErpPath(path?: string): boolean {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return false;
  }
  const normalized = path.split('?')[0];
  return ERP_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function isRestrictedPath(path?: string): boolean {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return false;
  }
  const normalized = path.split('?')[0];
  if (STAFF_RESTRICTED_PATHS.includes(normalized)) {
    return true;
  }
  return STAFF_RESTRICTED_PATH_PREFIXES.some((prefix) =>
    normalized.startsWith(`${prefix}/`)
  );
}

function filterErp(items: LnbNode[]): LnbNode[] {
  const filterNode = (item: LnbNode): LnbNode | null => {
    if (!item || typeof item !== 'object') {
      return null;
    }
    if (item.menuCode === ADM_ERP || isErpPath(item.to)) {
      return null;
    }
    if (!Array.isArray(item.children) || item.children.length === 0) {
      return item;
    }
    const children = item.children.map(filterNode).filter(Boolean) as LnbNode[];
    if (children.length === 0) {
      return null;
    }
    return { ...item, children };
  };
  return items.map(filterNode).filter(Boolean) as LnbNode[];
}

/** filterStaffRestrictedLnbItems 와 동일 정책 */
export function filterStaffRestrictedLnbItemsExpected(items: LnbNode[]): LnbNode[] {
  if (!Array.isArray(items)) {
    return items;
  }
  const filterNode = (item: LnbNode): LnbNode | null => {
    if (!item || typeof item !== 'object') {
      return null;
    }
    if (
      (item.menuCode && STAFF_RESTRICTED_CODES.includes(item.menuCode))
      || isRestrictedPath(item.to)
    ) {
      return null;
    }
    if (!Array.isArray(item.children) || item.children.length === 0) {
      return item;
    }
    const children = item.children.map(filterNode).filter(Boolean) as LnbNode[];
    if (children.length === 0) {
      return null;
    }
    return { ...item, children };
  };
  return filterErp(items).map(filterNode).filter(Boolean) as LnbNode[];
}

const SHOP_PATHS = new Set([
  '/admin/shop/orders',
  '/admin/shop/products',
  '/admin/shop/catalog-skus',
  '/admin/shop/point-policies',
  '/admin/shop/client-offers'
]);

/**
 * AdminCommonLayout 과 동일: STAFF/ADMIN 이면 DB에 shop 없을 때 쇼핑·리워드 폴백 병합.
 * 경로 상수는 adminRoutes 와 맞춤.
 */
export function mergeShopAdminLnbItemsExpected(items: LnbNode[]): LnbNode[] {
  if (!Array.isArray(items)) {
    return items;
  }
  const hasShop = items.some((item) => {
    if (item.to && SHOP_PATHS.has(item.to)) {
      return true;
    }
    if (Array.isArray(item.children)) {
      return item.children.some((c) => c.to && SHOP_PATHS.has(c.to));
    }
    return false;
  });
  if (hasShop) {
    return items;
  }
  return [
    ...items,
    {
      label: '쇼핑·리워드',
      to: '/admin/shop/orders',
      children: [
        { label: '온라인 주문', to: '/admin/shop/orders' },
        { label: '상품 관리', to: '/admin/shop/products' },
        { label: '리워드 정책', to: '/admin/shop/point-policies' },
        { label: '내담자별 결제 상품', to: '/admin/shop/client-offers' }
      ]
    }
  ];
}

/** API RAW → 최소 normalize (menuName→label, menuPath→to) */
export function normalizeRawLnbForParity(
  raw: Array<{
    menuName: string;
    menuPath: string;
    menuCode?: string;
    children?: any[];
  }>
): LnbNode[] {
  const mapNode = (m: any): LnbNode => {
    const children = (m.children || []).map(mapNode);
    const hasChildren = children.length > 0;
    return {
      label: m.menuName || '',
      to: m.menuPath,
      menuCode: m.menuCode,
      children: hasChildren ? children : undefined
    };
  };
  return (raw || []).map(mapNode);
}

/** 앱 파이프라인: normalize → shop merge → staff filter */
export function expectedStaffDrawerLabelsFromRaw(raw: unknown[]): string[] {
  const normalized = normalizeRawLnbForParity(raw as any);
  const merged = mergeShopAdminLnbItemsExpected(normalized);
  const filtered = filterStaffRestrictedLnbItemsExpected(merged);
  return sortedUnique(flattenLnbLabels(filtered));
}

export function flattenLnbLabels(items: LnbNode[] = []): string[] {
  return items.flatMap((m) => [m.label, ...flattenLnbLabels(m.children || [])]);
}

export function sortedUnique(labels: string[]): string[] {
  return [...new Set(labels.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
}
