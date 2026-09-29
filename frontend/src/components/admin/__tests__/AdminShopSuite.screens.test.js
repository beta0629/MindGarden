import fs from 'fs';
import path from 'path';

import { ADMIN_SHOP_PRODUCTS_COPY } from '../../../constants/adminShopSuite';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (...parts) => fs.readFileSync(path.join(SRC, ...parts), 'utf8');

const PRODUCTS = read('components', 'admin', 'AdminShopProductsPage.js');
const EDITOR = read('components', 'admin', 'AdminShopProductEditorPage.js');
const REWARD = read('components', 'admin', 'AdminShopPointPoliciesPage.js');
const APP = read('App.js');
const ORDERS = read('components', 'admin', 'AdminShopOrdersPage.js');
const DETAIL_MODAL = read('components', 'admin', 'shop', 'AdminShopOrderDetailModal.js');
const REFUND_MODAL = read('components', 'admin', 'shop', 'AdminShopRefundConfirmModal.js');
const EXTEND_MODAL = read('components', 'admin', 'shop', 'AdminShopOrderExtendModal.js');
const SUITE_CSS = read('styles', 'shop', 'AdminShopSuite.css');
const PG_FORM_CSS = read('components', 'tenant', 'PgConfigurationForm.css');
const PG_DETAIL = read('components', 'tenant', 'PgConfigurationDetail.js');

const countPrimary = (src) => (src.match(/variant="primary"/g) || []).length;

describe('admin shop suite screens (v3.2)', () => {
  test('usage period notice is neutral — per-product months, blank = no expiry, no 3-month cap', () => {
    expect(ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_NOTICE).toContain('상품마다 결제일부터 쓸 수 있는 개월 수');
    expect(ADMIN_SHOP_PRODUCTS_COPY.USAGE_PERIOD_NOTICE).not.toMatch(/3개월|무제한 유효기간은 없습니다/);
    expect(PRODUCTS).toMatch(/PRODUCTS_USAGE_NOTICE/);
    expect(PRODUCTS).toMatch(/USAGE_PERIOD_EXPIRY_NOTE/);
    expect(EDITOR).toMatch(/USAGE_PERIOD_NOTICE/);
  });

  test('products page: per-row sale toggle, stop locks home/mall with undo toast, server paging', () => {
    expect(PRODUCTS).toMatch(/PRODUCT_SALE_TOGGLE/);
    expect(PRODUCTS).toMatch(/setAdminShopProductSaleStatus\(product, onSale\)/);
    expect(PRODUCTS).toMatch(/STOP_KEPT_TOAST/);
    expect(PRODUCTS).toMatch(/label: ADMIN_SHOP_PRODUCTS_COPY\.UNDO/);
    expect(PRODUCTS).toMatch(/const blocked = stopped \|\|/);
    expect(PRODUCTS).toMatch(/listAdminShopProducts\(/);
    expect(PRODUCTS).not.toMatch(/listAdminShopProductSources|paginateAdminShopItems/);
    expect(ADMIN_SHOP_PRODUCTS_COPY.CREATE).toBe('＋ 상품 등록');
  });

  test('products page: status chip, stopped group row, blocked toggles, no duplicate', () => {
    expect(PRODUCTS).toMatch(/PRODUCT_STATUS_CHIP/);
    expect(PRODUCTS).toMatch(/STOPPED_GROUP/);
    expect(PRODUCTS).toMatch(/STOPPED_BLOCKED_HINT/);
    expect(PRODUCTS).not.toMatch(/MENU_DUPLICATE/);
    expect(EDITOR).not.toMatch(/MENU_DUPLICATE/);
  });

  test('validity months are save-only — no cap, no auto stop, no session-kind lock', () => {
    [PRODUCTS, EDITOR, read('utils', 'adminShopSuite.js')].forEach((src) => {
      expect(src).not.toMatch(/VALIDITY_MAX|autoStop|ALLOWED_SESSION/i);
    });
    expect(EDITOR).toMatch(/PRODUCT_EDITOR_VALIDITY/);
    expect(EDITOR).toMatch(/validityMonths: validation\.validityMonths/);
    expect(PRODUCTS).toMatch(/COL_VALIDITY/);
  });

  test('orders page: server paging/segment/period, no per-row detail GET', () => {
    expect(ORDERS).toMatch(/resolveAdminShopOrderPeriodRange\(period\)/);
    expect(ORDERS).toMatch(/page: page - 1/);
    expect(ORDERS).toMatch(/normalizeAdminShopOrderSummary\(result\?\.summary\)/);
    expect(ORDERS).not.toMatch(/runAdminShopWithConcurrency|needsAdminShopOrderEnrich|ORDERS_FETCH_SIZE|detailMap/);
    expect(ORDERS).toMatch(/ADMIN_SHOP_ORDERS_EXPORT_PAGE_SIZE/);
  });

  test('expiry extension is admin-only and wired from list + detail', () => {
    expect(ORDERS).toMatch(/canManageExpiry=\{isAdmin\}/);
    expect(ORDERS).toMatch(/extendAdminShopOrderExpiry\(orderPublicId, \{ newExpireDate, reason \}\)/);
    expect(ORDERS).toMatch(/ORDER_EXTENDABLE_LINK/);
    expect(DETAIL_MODAL).toMatch(/ORDER_EXTEND_BUTTON/);
    expect(DETAIL_MODAL).toMatch(/EVENT_EXTENDED/);
    expect(countPrimary(EXTEND_MODAL)).toBe(1);
  });

  test('screen-specific modal widths (order 840 · refund 460) and 6px chips', () => {
    expect(ORDERS).toMatch(/className="admin-shop-suite admin-shop-order-modal"/);
    expect(REFUND_MODAL).toMatch(/admin-shop-refund-confirm-modal/);
    expect(SUITE_CSS).toMatch(/\.mg-modal\.admin-shop-order-modal \{[^}]*max-width: 52\.5rem;/);
    expect(SUITE_CSS).toMatch(/\.mg-modal\.admin-shop-refund-confirm-modal \{[^}]*max-width: 28\.75rem;/);
    expect(SUITE_CSS).not.toMatch(/radius-pill/);
    expect(SUITE_CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test('PG: reveal button does not stretch, history reads server fields', () => {
    expect(PG_FORM_CSS).toMatch(/\.pg-config-form \.input-with-icon \.icon-button \{\s*width: auto;\s*\}/);
    expect(PG_DETAIL).toMatch(/item\?\.changeType/);
    expect(PG_DETAIL).not.toMatch(/item\.action|item\.description/);
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
    'components/admin/shop/AdminShopOrderExtendModal.js',
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
