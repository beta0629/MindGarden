/**
 * AdminShopOrdersPage — Clinic-OS 주문 상세 모달 chrome SSOT
 *
 * Hardcode gates cited:
 * - docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17
 * - docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

const fs = require('fs');
const path = require('path');

const PAGE = fs.readFileSync(
  path.join(__dirname, '..', 'AdminShopOrdersPage.js'),
  'utf8'
);
const MODAL = fs.readFileSync(
  path.join(__dirname, '..', 'shop', 'AdminShopOrderDetailModal.js'),
  'utf8'
);
const CSS = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'styles', 'shop', 'AdminShopClinicOs.css'),
  'utf8'
);
const API = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'constants', 'adminShopApi.js'),
  'utf8'
);

describe('AdminShopOrdersPage order detail modal Clinic-OS chrome', () => {
  test('wires extracted AdminShopOrderDetailModal into UnifiedModal', () => {
    expect(PAGE).toMatch(/AdminShopOrderDetailModal/);
    expect(PAGE).toMatch(/from ['"]\.\/shop\/AdminShopOrderDetailModal['"]/);
    expect(PAGE).toMatch(/UnifiedModal/);
    expect(PAGE).toMatch(/portOneHint=\{ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT\}/);
  });

  test('info grid is label↑ / value↓ cards (not inline label+value)', () => {
    expect(MODAL).toMatch(/admin-shop-order-detail__info-grid/);
    expect(MODAL).toMatch(/admin-shop-order-detail__info-card/);
    expect(MODAL).toMatch(/admin-shop-order-detail__info-label/);
    expect(MODAL).toMatch(/admin-shop-order-detail__info-value/);
    expect(CSS).toMatch(
      /\.admin-shop-order-detail__info-card\s*\{[\s\S]*flex-direction:\s*column/
    );
    expect(MODAL).not.toMatch(/주문 ID: \$\{/);
    expect(MODAL).not.toMatch(/상태: \$\{/);
  });

  test('timeline first-dot uses slate class via --cs-slate-400 (not teal/green ring)', () => {
    expect(MODAL).toMatch(/admin-shop-order-detail__timeline-dot--first/);
    expect(MODAL).toMatch(/ADMIN_SHOP_ORDER_DETAIL_TEST_IDS\.TIMELINE_DOT_FIRST/);
    expect(CSS).toMatch(
      /\.admin-shop-order-detail__timeline-dot--first\s*\{[\s\S]*background:\s*var\(--cs-slate-400\)/
    );
    const firstDotBlock = CSS.match(
      /\.admin-shop-order-detail__timeline-dot--first\s*\{[^}]+\}/
    );
    expect(firstDotBlock).toBeTruthy();
    expect(firstDotBlock[0]).toMatch(/background:\s*var\(--cs-slate-400\)/);
    expect(firstDotBlock[0]).not.toMatch(/teal|green|#0[eE]5[fF]5[aA]|primary-solid/i);
  });

  test('action hierarchy: 전액환불 brick primary, 환불 정합 ghost, 강제 환불 정합 muted', () => {
    expect(MODAL).toMatch(/ADMIN_SHOP_ORDER_DETAIL_COPY\.REFUND_PRIMARY/);
    expect(MODAL).toMatch(/admin-shop-order-detail__action--refund-primary/);
    expect(MODAL).toMatch(/variant="danger"/);
    expect(CSS).toMatch(
      /\.admin-shop-order-detail__action--refund-primary[\s\S]*--mg-v2-color-semantic-error/
    );
    expect(MODAL).toMatch(/ADMIN_SHOP_RECONCILE_REFUND_COPY\.BUTTON/);
    expect(MODAL).toMatch(/variant="ghost"/);
    expect(MODAL).toMatch(/admin-shop-order-detail__force-reconcile/);
    expect(MODAL).toMatch(/ADMIN_SHOP_RECONCILE_REFUND_COPY\.FORCE_BUTTON/);
    expect(CSS).toMatch(
      /\.admin-shop-order-detail__force-reconcile[\s\S]*--mg-v2-color-semantic-error/
    );
    expect(CSS).toMatch(
      /\.admin-shop-order-detail__actions-force\s*\{[\s\S]*justify-content:\s*flex-end/
    );
  });

  test('binds real API fields — no demo/fake client names or order IDs', () => {
    expect(MODAL).toMatch(/detail\.orderPublicId/);
    expect(MODAL).toMatch(/detail\.clientId/);
    expect(MODAL).toMatch(/resolveAdminShopOrderAmount/);
    expect(MODAL).toMatch(/line\.title \|\| line\.skuCode/);
    expect(MODAL).toMatch(/ev\.createdAt/);
    expect(MODAL).toMatch(/formatShopFulfillmentBadge/);
    expect(MODAL).not.toMatch(/홍길동/);
    expect(MODAL).not.toMatch(/ORD-DEMO|demo-order|fake-order/i);
    expect(PAGE).not.toMatch(/홍길동/);
  });

  test('quiet PortOne hint from constant (not loud banner paragraph as primary)', () => {
    expect(API).toMatch(/ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT/);
    expect(MODAL).toMatch(/ADMIN_SHOP_ORDER_DETAIL_PORTONE_HINT/);
    expect(MODAL).toMatch(/admin-shop-order-detail__portone/);
    expect(MODAL).toMatch(/from 'lucide-react'/);
    expect(MODAL).toMatch(/<Info[\s\S]*className="admin-shop-order-detail__portone-icon"/);
  });

  test('order detail CSS uses tokens only (no raw hex)', () => {
    const detailCss = CSS.slice(CSS.indexOf('.admin-shop-order-detail'));
    expect(detailCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
