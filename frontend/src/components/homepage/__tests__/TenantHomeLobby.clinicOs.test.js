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

  test('OS dark intro is light-pinned and the hero login uses solid teal', () => {
    expect(js).toMatch(/mg-theme-light-pinned/);
    expect(js).toMatch(/data-theme="light"/);
    expect(js).toMatch(/mg-tenant-home-body mg-theme-light-pinned/);
    expect(js).toMatch(/mg-tenant-home--loading mg-theme-light-pinned/);
    expect(css).toMatch(/--th-cta-bg:\s*var\(--mg-v2-color-primary-solid\)/);
    expect(css).toMatch(/--th-cta-fg:\s*var\(--mg-v2-color-text-on-solid\)/);
    expect(css).toMatch(/--th-surface:\s*var\(--mg-v2-color-surface-bg\)/);
    expect(css).toMatch(/--th-wash:\s*var\(--mg-v2-color-neutral-100\)/);
    expect(css).toMatch(/border:\s*1px solid var\(--mg-v2-color-border-strong\)/);
    expect(css).not.toMatch(/border-main/);
    expect(css).not.toMatch(/--mg-warm-gray/);
    expect(css).not.toMatch(/--mg-white/);
    expect(css).not.toMatch(/background:\s*var\(--th-ink\)/);
    expect(css).not.toMatch(/background:\s*var\(--brand\)/);
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

  test('merchant-legal footer uses /legal/* SSOT (no platform /terms|/privacy hops)', () => {
    expect(js).toMatch(/MerchantLegalFooterPreview/);
    expect(js).toMatch(/\/legal\/\*/);
    expect(js).toMatch(/공개 페이지와/);
    expect(js).toMatch(/푸터 링크에서 확인할 수 있습니다/);
    expect(js).not.toMatch(/안내에서 확인\(모달\)/);
    expect(js).not.toMatch(/푸터\s*링크와 센터 약관/);
  });
});