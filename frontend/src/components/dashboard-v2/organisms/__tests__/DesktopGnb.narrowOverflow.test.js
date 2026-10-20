/**
 * DesktopGnb 좁은 데스크톱 폭 — 시계는 축소 금지, 우측·로고만 줄어든다.
 */
const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');

describe('DesktopGnb narrow desktop overflow', () => {
  const gnbCss = read('components/dashboard-v2/organisms/DesktopGnb.css');
  const rightCss = read('components/dashboard-v2/molecules/GnbRight.css');

  test('center hosts CurrentTimeChip and does not shrink the chip', () => {
    expect(gnbCss).toMatch(/\.mg-v2-desktop-gnb__center\s*\{[^}]*position:\s*absolute/s);
    expect(gnbCss).toMatch(/\.mg-v2-desktop-gnb__center\s*\{[^}]*flex-shrink:\s*0/s);
    expect(gnbCss).toMatch(/--mg-v2-now-chip-gap-sides/);
  });

  test('right group can shrink; icons stay flex-shrink 0', () => {
    expect(gnbCss).toMatch(/\.mg-v2-desktop-gnb__right\s*\{[^}]*min-width:\s*0/s);
    expect(rightCss).toMatch(/\.mg-v2-gnb-right\s*\{[^}]*min-width:\s*0/s);
    expect(rightCss).toMatch(/\.mg-v2-gnb-right__icons\s*\{[^}]*flex-shrink:\s*0/s);
    expect(rightCss).not.toMatch(/\.mg-v2-gnb-right > \.mg-v2-search-input/);
  });

  test('text logo truncates with ellipsis like the brand name', () => {
    expect(gnbCss).toMatch(
      /\.mg-v2-desktop-gnb__logo-text\s*\{[^}]*max-width:\s*min\(40vw, 28ch\);[^}]*text-overflow:\s*ellipsis/s
    );
  });
});
