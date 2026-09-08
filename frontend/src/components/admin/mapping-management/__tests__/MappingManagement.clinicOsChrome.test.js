/**
 * MappingManagement Clinic-OS TO-BE chrome — cascade / layout / viewMode locks
 *
 * @author CoreSolution
 * @since 2026-09-04
 * @updated 2026-09-08 — list|card, PaymentAttentionRail, compact 36px
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('MappingManagement Clinic-OS chrome', () => {
  const entryJs = read('src/components/admin/MappingManagement.js');
  const pageJs = read('src/components/admin/mapping-management/pages/MappingManagementPage.js');
  const pageCss = read('src/components/admin/mapping-management/MappingManagementPage.css');
  const kpiJs = read('src/components/admin/mapping-management/organisms/MappingKpiSection.js');
  const kpiCss = read('src/components/admin/mapping-management/organisms/MappingKpiSection.css');
  const listCss = read('src/components/admin/mapping-management/organisms/MappingListBlock.css');
  const searchCss = read('src/components/admin/mapping-management/organisms/MappingSearchSection.css');
  const listJs = read('src/components/admin/mapping-management/organisms/MappingListBlock.js');
  const railJs = read('src/components/admin/mapping-management/molecules/MappingPaymentAttentionRail.js');
  const railCss = read('src/components/admin/mapping-management/molecules/MappingPaymentAttentionRail.css');
  const savedViewConstants = read('src/constants/mappingManagementSavedViewConstants.js');
  const mappingConstants = read('src/constants/mapping.js');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(entryJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).toMatch(/mapping-management--clinic-os/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
  });

  test('header CTA uses MGButton solid primary not ActionBarButton B0KlA skin', () => {
    expect(pageJs).toMatch(/import MGButton from/);
    expect(pageJs).toMatch(/mapping-management__header-actions/);
    expect(pageJs).toMatch(/<MGButton[\s\S]*variant="primary"/);
    expect(pageCss).toMatch(/--mg-v2-component-height-compact:\s*2\.25rem/);
    expect(pageCss).toMatch(/mapping-management__header-actions[\s\S]*height:\s*var\(--mg-v2-component-height-compact\)/);
    expect(pageCss).not.toMatch(/--ad-b0kla-green/);
    expect(pageCss).not.toMatch(/mg-v2-mapping-header-btn--primary/);
  });

  test('quiet header omits subtitle', () => {
    expect(pageJs).not.toMatch(/subtitle=\{t\('admin:mapping\.page\.subtitle'\)\}/);
  });

  test('layout order: KPI → PaymentAttentionRail → Search → ListBlock', () => {
    const kpiIdx = pageJs.indexOf('<MappingKpiSection');
    const railIdx = pageJs.indexOf('<MappingPaymentAttentionRail');
    const searchIdx = pageJs.indexOf('<MappingSearchSection');
    const listIdx = pageJs.indexOf('<MappingListBlock');
    expect(kpiIdx).toBeGreaterThan(-1);
    expect(railIdx).toBeGreaterThan(kpiIdx);
    expect(searchIdx).toBeGreaterThan(railIdx);
    expect(listIdx).toBeGreaterThan(searchIdx);
  });

  test('PaymentAttentionRail uses formatKrw and color-red-700 (no hex)', () => {
    expect(railJs).toMatch(/formatKrw/);
    expect(railJs).toMatch(/오늘 손볼 결제/);
    expect(railCss).toMatch(/var\(--color-red-700\)/);
    expect(railCss).not.toMatch(/#B91C1C/i);
    expect(pageCss).not.toMatch(/#B91C1C/i);
  });

  test('viewMode list|card only; calendar removed from this page', () => {
    expect(savedViewConstants).toMatch(/MAPPING_LIST_DEFAULT_VIEW_MODE = 'list'/);
    expect(savedViewConstants).toMatch(/MAPPING_LIST_ALLOWED_VIEW_MODES = \['list', 'card'\]/);
    expect(listJs).toMatch(/MAPPING_LIST_VIEW_MODE_OPTIONS/);
    expect(listJs).not.toMatch(/MappingCalendarView/);
    expect(listJs).toMatch(/viewMode === 'list'/);
    expect(listJs).not.toMatch(/viewMode === 'calendar'/);
    expect(listJs).not.toMatch(/value: 'calendar'/);
  });

  test('MAPPING_FILTER_OPTIONS includes 환불 chip (REFUNDED)', () => {
    expect(mappingConstants).toMatch(/label:\s*'환불'/);
    expect(mappingConstants).toMatch(/PAYMENT_STATUS\.REFUNDED/);
    expect(pageJs).toMatch(/PAYMENT_STATUS\.REFUNDED/);
  });

  test('CONSULTANT create CTA fail-closed (ADMIN/STAFF only)', () => {
    expect(pageJs).toMatch(/canCreateMapping/);
    expect(pageJs).toMatch(/RoleUtils\.isAdmin/);
    expect(pageJs).toMatch(/RoleUtils\.isStaff/);
  });

  test('summary strip present (3-cell Clinic-OS, no icon tiles)', () => {
    expect(pageJs).toMatch(/MappingKpiSection/);
    expect(kpiJs).toMatch(/mapping-management-summary/);
    expect(kpiJs).toMatch(/KpiNumeral/);
    expect(kpiJs).not.toMatch(/lucide-react/);
    expect(kpiJs).not.toMatch(/iconVariant/);
    expect(kpiCss).toMatch(/\.mapping-management-summary\s*\{[^}]*grid-template-columns:\s*repeat\(3/s);
    expect(kpiCss).not.toMatch(/mapping-management-summary__cell::before/);
    expect(kpiCss).not.toMatch(/--ad-b0kla/);
    expect(kpiCss).not.toMatch(/mg-v2-mapping-kpi-section__icon/);
  });

  test('main stage single card geometry', () => {
    expect(listCss).toMatch(/\.mg-v2-mapping-list-block__card\s*\{[^}]*min-height:\s*36rem/s);
    expect(listCss).toMatch(/border:\s*1px solid var\(--mg-v2-color-neutral-300\)/);
    expect(listCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
    expect(listCss).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
  });

  test('view toggle scoped off B0KlA forest greens', () => {
    expect(listJs).toMatch(/ViewModeToggle/);
    expect(listCss).toMatch(/--mg-v2-color-primary-solid/);
    expect(listCss).not.toMatch(/--ad-b0kla-green/);
    expect(listCss).not.toMatch(/--ad-b0kla-border/);
  });

  test('search chips use Clinic-OS primary not ad-b0kla-green', () => {
    expect(searchCss).toMatch(/--mg-v2-color-primary-solid/);
    expect(searchCss).not.toMatch(/--ad-b0kla/);
  });

  test('empty CTA uses MGButton primary', () => {
    expect(listJs).toMatch(/import MGButton from/);
    expect(listJs).toMatch(/mg-v2-mapping-list-block__empty-btn/);
    expect(listJs).not.toMatch(/ActionButton/);
  });

  test('organism CSS has no leftover --ad-b0kla tokens on page chrome files', () => {
    expect(pageCss).not.toMatch(/--ad-b0kla/);
    expect(kpiCss).not.toMatch(/--ad-b0kla/);
    expect(listCss).not.toMatch(/--ad-b0kla-/);
    expect(searchCss).not.toMatch(/--ad-b0kla/);
  });
});
