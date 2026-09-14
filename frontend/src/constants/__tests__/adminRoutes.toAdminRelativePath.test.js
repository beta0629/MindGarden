/**
 * toAdminRelativePath — /admin 중첩 Route 상대 세그먼트
 */

import { toAdminRelativePath, ADMIN_ROUTES } from '../adminRoutes';

describe('toAdminRelativePath', () => {
  test('절대 /admin/* → 상대 세그먼트', () => {
    expect(toAdminRelativePath(ADMIN_ROUTES.DASHBOARD)).toBe('dashboard');
    expect(toAdminRelativePath(ADMIN_ROUTES.USER_MANAGEMENT)).toBe('user-management');
    expect(toAdminRelativePath(ADMIN_ROUTES.SHOP_CATALOG_SKUS)).toBe('shop/catalog-skus');
    expect(toAdminRelativePath('/admin')).toBe('');
  });

  test('비 /admin 경로는 그대로', () => {
    expect(toAdminRelativePath('/erp/dashboard')).toBe('/erp/dashboard');
  });
});
