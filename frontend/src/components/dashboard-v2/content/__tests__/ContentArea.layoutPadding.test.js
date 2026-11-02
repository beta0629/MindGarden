/**
 * ContentArea — AdminCommonLayout main 하위 이중 인셋 제거 계약
 */
const fs = require('fs');
const path = require('path');

const CSS_PATH = path.resolve(__dirname, '../ContentArea.css');

describe('ContentArea layout padding contract', () => {
  const css = fs.readFileSync(CSS_PATH, 'utf8');

  it('기본 .mg-v2-content-area 는 토큰 패딩을 유지한다', () => {
    expect(css).toMatch(
      /\.mg-v2-content-area\s*\{[^}]*padding:\s*var\(--mg-v2-space-8/s
    );
  });

  it('Desktop/Mobile layout main(및 stage) 하위 ContentArea 는 padding:0', () => {
    expect(css).toMatch(
      /\.mg-v2-desktop-layout__main\s+\.mg-v2-content-area/s
    );
    expect(css).toMatch(
      /\.mg-v2-mobile-layout__main\s+\.mg-v2-content-area/s
    );
    expect(css).toMatch(
      /\.mg-v2-mobile-layout__stage\s+\.mg-v2-content-area/s
    );
    expect(css).toMatch(
      /\.mg-v2-desktop-layout__main\s+\.mg-v2-content-area\s*,\s*\n\s*\.mg-v2-mobile-layout__main\s+\.mg-v2-content-area\s*,\s*\n\s*\.mg-v2-mobile-layout__stage\s+\.mg-v2-content-area\s*\{[^}]*padding:\s*0/s
    );
  });

  it('신규 hex 하드코딩이 없다', () => {
    const ruleBlocks = css.match(
      /\.mg-v2-desktop-layout__main[\s\S]*?padding:\s*0;[\s\S]*?\}/
    );
    expect(ruleBlocks && ruleBlocks[0]).toBeTruthy();
    expect(ruleBlocks[0]).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
