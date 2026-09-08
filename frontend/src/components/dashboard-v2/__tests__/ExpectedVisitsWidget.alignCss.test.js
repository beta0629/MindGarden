/**
 * ExpectedVisitsWidget — 액션/헤더 컨트롤 동일 높이 CSS 계약
 * CTA(MGButton small) + EntityRowActions ⋮ 트리거가 위젯 스코프에서
 * --button-height-sm 으로 맞는지 정적 검증.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../ExpectedVisitsWidget.css');
const css = fs.readFileSync(cssPath, 'utf8');

describe('ExpectedVisitsWidget align CSS contract', () => {
  it('scopes EntityRowActions trigger height to --button-height-sm in table and card actions', () => {
    expect(css).toContain(
      '.mg-v2-expected-visits__actions .mg-v2-entity-row-actions__trigger.mg-button'
    );
    expect(css).toContain(
      '.mg-v2-expected-visits__card-actions .mg-v2-entity-row-actions__trigger.mg-button'
    );
    expect(css).toMatch(
      /height:\s*var\(--button-height-sm\)\s*!important/
    );
    expect(css).toMatch(
      /min-height:\s*var\(--button-height-sm\)\s*!important/
    );
    expect(css).toMatch(
      /min-width:\s*var\(--button-height-sm\)\s*!important/
    );
  });

  it('aligns header select with --button-height-sm under widget scope only', () => {
    expect(css).toContain('.mg-v2-expected-visits .mg-v2-content-section__actions');
    expect(css).toContain('.mg-v2-expected-visits__filter select');
    expect(css).toContain('.mg-v2-expected-visits .mg-v2-ad-b0kla__select--sm');
    expect(css).toMatch(/height:\s*var\(--button-height-sm\)/);
    expect(css).toContain('box-sizing: border-box');
  });

  it('keeps card-actions vertical centering and avoids new hex hardcodes', () => {
    expect(css).toMatch(
      /\.mg-v2-expected-visits__card-actions\s*\{[^}]*align-items:\s*center/s
    );
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
