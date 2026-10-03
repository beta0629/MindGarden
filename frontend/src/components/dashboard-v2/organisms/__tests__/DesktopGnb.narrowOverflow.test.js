/**
 * DesktopGnb 좁은 데스크톱 폭 가로 넘침 방지 — 공통 GNB CSS 구조 테스트
 * 고정폭 검색창 + 아이콘 그룹 최소폭이 헤더를 뷰포트 밖으로 밀지 않도록,
 * 가운데 영역·우측 그룹은 줄어들 수 있고 검색창만 줄어든다.
 */
const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');

describe('DesktopGnb narrow desktop overflow', () => {
  const gnbCss = read('components/dashboard-v2/organisms/DesktopGnb.css');
  const rightCss = read('components/dashboard-v2/molecules/GnbRight.css');

  test('center area can shrink below its content width', () => {
    expect(gnbCss).toMatch(/\.mg-v2-desktop-gnb__center\s*\{[^}]*min-width:\s*0/s);
  });

  test('right group shrinks and only the search input gives up width', () => {
    expect(rightCss).toMatch(/\.mg-v2-gnb-right\s*\{[^}]*min-width:\s*0/s);
    expect(rightCss).toMatch(
      /\.mg-v2-gnb-right > \.mg-v2-search-input\s*\{[^}]*flex:\s*0 1 auto;[^}]*min-width:\s*0/s
    );
    expect(rightCss).toMatch(/\.mg-v2-gnb-right__icons\s*\{[^}]*flex-shrink:\s*0/s);
  });

  test('text logo truncates with ellipsis like the brand name', () => {
    expect(gnbCss).toMatch(
      /\.mg-v2-desktop-gnb__logo-text\s*\{[^}]*max-width:\s*min\(40vw, 28ch\);[^}]*text-overflow:\s*ellipsis/s
    );
  });
});
