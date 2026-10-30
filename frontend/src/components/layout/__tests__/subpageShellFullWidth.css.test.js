/**
 * 전폭·반응형 ① — 상담사(soft-sheet)·내담자(ClientWebPageShell) 서브페이지 공통 셸에
 * 고정 stage max-width(856/808px 박스) 회귀 금지.
 */
const fs = require('fs');
const path = require('path');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', '..', rel), 'utf8');

describe('subpage shell full-width', () => {
  it('상담사 soft-sheet stage에 고정 rem/px max-width가 없다', () => {
    const css = read('dashboard-v2/templates/MobileLayout.css');
    expect(css).not.toMatch(/57\.5rem/);
    const stageRules = css.match(/\.mg-v2-mobile-layout--soft-sheet \.mg-v2-mobile-layout__stage\s*\{[^}]*\}/g) || [];
    expect(stageRules.length).toBeGreaterThan(0);
    stageRules.forEach((rule) => {
      expect(rule).not.toMatch(/max-width:\s*[0-9.]+(rem|px)/);
    });
  });

  it('내담자 서브페이지 stage max는 none', () => {
    const css = read('client/ClientWebPageShell.css');
    expect(css).toMatch(/--client-web-stage-max:\s*none/);
    expect(css).not.toMatch(/57\.5rem/);
  });
});

describe('#1794 보강 — 홈 기준 공통 토큰 · 자동 칼럼', () => {
  it('상담사 공통 카드 그리드는 auto-fill/minmax 토큰(고정 칼럼 수 없음)', () => {
    const css = read('consultant/suite/ConsultantSuite.css');
    const grid = css.match(/\.consultant-suite-card-grid\s*\{[^}]*\}/g) || [];
    expect(grid.length).toBeGreaterThan(0);
    grid.forEach((rule) => expect(rule).not.toMatch(/repeat\(\d/));
    expect(css).toMatch(/repeat\(auto-fill, minmax\(min\(100%, var\(--mg-v2-subpage-grid-min\)\), 1fr\)\)/);
  });

  it('샵 그리드는 auto-fit 토큰(빈 칸 없음)', () => {
    const css = read('../styles/shop/ClientMall.css');
    expect(css).toMatch(/\.client-mall-grid\s*\{[^}]*repeat\(auto-fit, minmax\(min\(100%, var\(--mg-v2-subpage-grid-min-sm\)\)/);
  });

  it('내담자 셸은 홈 기준 pad·타이틀·헤더 48 토큰, chrome-h 자기참조 없음', () => {
    const css = read('client/ClientWebPageShell.css');
    expect(css).toMatch(/--client-web-pad-x:\s*var\(--mg-v2-subpage-pad-x\)/);
    expect(css).toMatch(/font-size:\s*var\(--mg-v2-subpage-title-size\)/);
    expect(css).not.toMatch(/--client-web-chrome-h:\s*var\(--client-web-chrome-h\)/);
  });
});
