/**
 * Tenant PG Configuration Clinic-OS chrome alignment — cascade / copy / structure locks
 *
 * @author CoreSolution
 * @since 2026-09-05
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('PgConfiguration Clinic-OS chrome', () => {
  const listJs = read('src/components/tenant/PgConfigurationList.js');
  const listCss = read('src/components/tenant/PgConfigurationList.css');
  const createJs = read('src/components/tenant/PgConfigurationCreate.js');
  const editJs = read('src/components/tenant/PgConfigurationEdit.js');
  const detailJs = read('src/components/tenant/PgConfigurationDetail.js');
  const detailCss = read('src/components/tenant/PgConfigurationDetail.css');
  const formJs = read('src/components/tenant/PgConfigurationForm.js');
  const formCss = read('src/components/tenant/PgConfigurationForm.css');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(listJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(createJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(editJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(detailJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(listJs).toMatch(/pg-config-list--clinic-os/);
    expect(createJs).toMatch(/pg-config-create--clinic-os/);
    expect(editJs).toMatch(/pg-config-edit--clinic-os/);
    expect(detailJs).toMatch(/pg-config-detail--clinic-os/);
    expect(listJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(createJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(editJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(detailJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(formJs).not.toMatch(/mg-v2-ad-b0kla/);
  });

  test('header CTA uses MGButton solid primary not ActionBarButton', () => {
    expect(listJs).toMatch(/import MGButton from/);
    expect(listJs).toMatch(/pg-config-list__header-actions/);
    expect(listJs).toMatch(/<MGButton[\s\S]*variant="primary"/);
    expect(listJs).not.toMatch(/ActionBarButton/);
    expect(listCss).toMatch(/pg-config-list__header-actions[\s\S]*height:\s*var\(--button-height-sm\)/);
    expect(listCss).not.toMatch(/--ad-b0kla/);
  });

  test('summary strip present (3-cell Clinic-OS, no icon tiles)', () => {
    expect(listJs).toMatch(/pg-config-list-summary/);
    expect(listJs).toMatch(/mapping-management-summary/);
    expect(listJs).toMatch(/KpiNumeral/);
    expect(listCss).toMatch(/\.pg-config-list-summary\.mapping-management-summary\s*\{[^}]*grid-template-columns:\s*repeat\(3/s);
    expect(listCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('main stage single card geometry', () => {
    expect(listCss).toMatch(/\.pg-config-list__stage\s*\{[^}]*min-height:\s*36rem/s);
    expect(listCss).toMatch(/border:\s*1px solid var\(--mg-v2-color-neutral-300\)/);
    expect(listCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
    expect(listCss).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(formCss).toMatch(/\.pg-config-form-stage\s*\{[^}]*min-height:\s*36rem/s);
  });

  test('route param uses :id (Edit/Detail)', () => {
    expect(editJs).toMatch(/const\s*\{\s*id:\s*configId\s*\}\s*=\s*useParams\(\)/);
    expect(detailJs).toMatch(/const\s*\{\s*id:\s*configId\s*\}\s*=\s*useParams\(\)/);
    expect(editJs).not.toMatch(/const\s*\{\s*configId\s*\}\s*=\s*useParams\(\)/);
    expect(detailJs).not.toMatch(/const\s*\{\s*configId\s*\}\s*=\s*useParams\(\)/);
  });

  test('Korean operator titles (no raw English code keys as UI titles)', () => {
    expect(formJs).toMatch(/<dt>콘텐츠 유형<\/dt>/);
    expect(formJs).toMatch(/<dt>버전<\/dt>/);
    expect(formJs).toMatch(/웹훅 시크릿 \(선택\)/);
    expect(formJs).not.toMatch(/<dt>Content-Type<\/dt>/);
    expect(formJs).not.toMatch(/<dt>Version<\/dt>/);
    expect(formJs).not.toMatch(/htmlFor="portoneWebhookSecret">\{PORTONE_SETTINGS_KEY_WEBHOOK_SECRET\}/);
  });

  test('page CSS has no leftover --ad-b0kla or page hex accents', () => {
    expect(listCss).not.toMatch(/--ad-b0kla/);
    expect(detailCss).not.toMatch(/--ad-b0kla/);
    expect(formCss).not.toMatch(/--ad-b0kla/);
    expect(listCss).not.toMatch(/#155724|#357abd|#e2e3e5|#d1ecf1/);
    expect(detailCss).not.toMatch(/#155724|#357abd|#e2e3e5|#d1ecf1/);
    expect(detailCss).toMatch(/border-left:\s*none\s*!important/);
  });
});
