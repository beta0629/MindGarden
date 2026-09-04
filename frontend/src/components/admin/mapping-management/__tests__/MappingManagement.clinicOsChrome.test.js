/**
 * MappingManagement Clinic-OS chrome alignment — cascade / copy / structure locks
 *
 * @author CoreSolution
 * @since 2026-09-04
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
    expect(pageCss).toMatch(/mapping-management__header-actions[\s\S]*height:\s*var\(--button-height-sm\)/);
    expect(pageCss).not.toMatch(/--ad-b0kla-green/);
    expect(pageCss).not.toMatch(/mg-v2-mapping-header-btn--primary/);
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
