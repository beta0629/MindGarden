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
