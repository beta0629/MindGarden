import fs from 'fs';
import path from 'path';

import { ADMIN_SHOP_PRODUCTS_COPY } from '../../../constants/adminShopSuite';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (...parts) => fs.readFileSync(path.join(SRC, ...parts), 'utf8');

const PRODUCTS = read('components', 'admin', 'AdminShopProductsPage.js');
const EDITOR = read('components', 'admin', 'AdminShopProductEditorPage.js');
const REWARD = read('components', 'admin', 'AdminShopPointPoliciesPage.js');
const APP = read('App.js');

const countPrimary = (src) => (src.match(/variant="primary"/g) || []).length;

describe('admin shop suite screens (v3.1)', () => {
  test('usage period notice contains the approved sentence (copy only)', () => {
    expect(ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_NOTICE).toContain(
      '이용기간 — 단회기와 10회기 패키지 모두 결제일부터 3개월 안에 사용해야 합니다. 무제한 유효기간은 없습니다.'
    );
    expect(PRODUCTS).toMatch(/PRODUCTS_USAGE_NOTICE/);
    expect(PRODUCTS).toMatch(/USAGE_PERIOD_EXPIRY_NOTE/);
    expect(EDITOR).toMatch(/USAGE_PERIOD_NOTICE/);
  });

  test('products page: status chip, stopped group row, blocked toggles, no duplicate', () => {
    expect(PRODUCTS).toMatch(/PRODUCT_STATUS_CHIP/);
    expect(PRODUCTS).toMatch(/STOPPED_GROUP/);
    expect(PRODUCTS).toMatch(/STOPPED_BLOCKED_HINT/);
    expect(PRODUCTS).not.toMatch(/MENU_DUPLICATE/);
    expect(EDITOR).not.toMatch(/MENU_DUPLICATE/);
  });

  test('no session-count / validity enforcement code', () => {
    [PRODUCTS, EDITOR, read('utils', 'adminShopSuite.js')].forEach((src) => {
      expect(src).not.toMatch(/validityMonths|VALIDITY_MAX|autoStop|ALLOWED_SESSION/i);
    });
  });

  test('manual product registration stays available', () => {
    expect(PRODUCTS).toMatch(/ADMIN_SHOP_PRODUCT_ROUTES\.NEW|CREATE_LABEL|ADD_PRODUCT/);
  });

  test('one primary button per screen', () => {
    expect(countPrimary(PRODUCTS)).toBe(1);
    expect(countPrimary(REWARD)).toBe(1);
  });

  test('reward PATCH body carries both boolean policies', () => {
    expect(REWARD).toMatch(/ALLOW_PG_MIX\]: Boolean\(/);
    expect(REWARD).toMatch(/ALLOW_POINTS_ONLY\]: Boolean\(/);
    expect(REWARD).toMatch(/softRefresh\(loadPolicies\)/);
  });

  test('legacy product routes redirect to 상품', () => {
    expect(APP).toMatch(/path="package-pricing\/new" element={<Navigate to={ADMIN_SHOP_PRODUCT_ROUTES\.NEW} replace \/>}/);
    expect(APP).toMatch(/path="package-pricing\/:id" element={<RedirectToShopProductEdit paramName="id" \/>}/);
    expect(APP).toMatch(/path="package-pricing" element={<Navigate to={ADMIN_SHOP_PRODUCT_ROUTES\.LIST} replace \/>}/);
    expect(APP).toMatch(/<RedirectToShopProductEdit paramName="packageCode" \/>/);
    expect(APP).toMatch(/<AdminShopProductsPage \/>/);
    expect(APP).toMatch(/<AdminShopProductEditorPage isNew \/>/);
    expect(APP).not.toMatch(/import AdminShopCatalogSkusPage/);
  });
});

describe('admin shop suite has no mockup sample data', () => {
  const FORBIDDEN = ['PKG_10', 'BASIC_20', 'SIG_TEST', 'TOOSA', 'ops_core', 'store-655aec45', 'channel-key-'];
  const FILES = [
    'components/admin/AdminShopProductsPage.js',
    'components/admin/AdminShopProductEditorPage.js',
    'components/admin/AdminShopPointPoliciesPage.js',
    'components/admin/AdminShopOrdersPage.js',
    'components/admin/shop/AdminShopOrderDetailModal.js',
    'components/admin/shop/AdminShopRefundConfirmModal.js',
    'components/admin/shop/AdminShopSuiteParts.js',
    'components/tenant/PgConfigurationDetail.js',
    'components/tenant/PgConfigurationList.js',
    'constants/adminShopSuite.js',
    'utils/adminShopSuite.js',
    'styles/shop/AdminShopSuite.css'
  ];

  test.each(FILES)('%s is free of mockup tokens', (rel) => {
    const src = read(...rel.split('/'));
    FORBIDDEN.forEach((token) => expect(src).not.toContain(token));
  });
});
