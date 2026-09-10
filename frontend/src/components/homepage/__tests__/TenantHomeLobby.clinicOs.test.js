/**
 * TenantHomeLobby — reduced motion · 상담 안내 destination
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

describe('TenantHomeLobby v3 locks', () => {
  const js = read('TenantHomeLobby.js');
  const css = read('TenantHomeLobby.css');

  test('상담 안내 scrolls to #counseling-guide (documented destination)', () => {
    expect(js).toMatch(/id="counseling-guide"/);
    expect(js).toMatch(/#counseling-guide/);
    expect(js).toMatch(/상담 안내 destination/);
  });

  test('uses DB center name placeholders, no MindGarden hardcode in hero', () => {
    expect(js).not.toMatch(/MindGarden/);
    expect(js).toMatch(/meta\?\.tenant\?\.name/);
    expect(js).toMatch(/천천히, 안전하게/);
  });

  test('respects prefers-reduced-motion', () => {
    expect(js).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  test('accent via --brand token', () => {
    expect(js).toMatch(/--brand/);
    expect(css).toMatch(/--brand/);
  });

  test('home products list uses ConsultationPackagePublicList molecule', () => {
    expect(js).toMatch(/ConsultationPackagePublicList/);
    expect(js).toMatch(/consultationPackages/);
    expect(js).toMatch(/상담 상품·가격/);
  });

  test('no platform SaaS CTAs', () => {
    expect(js).not.toMatch(/시작하기/);
    expect(js).not.toMatch(/센터 도입 문의/);
  });
});
