/**
 * Client dock — body-scoped absolute + dock-h padding SSOT
 * 독 규칙은 ClientMinimalDock.css (컴포넌트 옆 import) SSOT.
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

const fs = require('fs');
const path = require('path');

const DOCK_CSS_PATH = path.join(__dirname, '..', 'ClientMinimalDock.css');
const CHAPTER_CSS_PATH = path.join(__dirname, '..', 'ClientCoverChapter.css');

describe('ClientMinimalDock CSS contract', () => {
  test('dock SSOT: absolute body panel, grid 4, no viewport fixed, split full width', () => {
    const css = fs.readFileSync(DOCK_CSS_PATH, 'utf8');

    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*position:\s*absolute/s
    );
    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*bottom:\s*0/s
    );
    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*left:\s*0/s
    );
    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*right:\s*0/s
    );
    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*width:\s*100%/s
    );
    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*z-index:\s*var\(--mg-v2-z-sticky\)/s
    );
    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*display:\s*grid/s
    );
    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/s
    );
    // viewport fixed 전폭 독 회귀 금지
    expect(css).not.toMatch(
      /\.client-cover__dock\s*\{[^}]*position:\s*fixed/s
    );
    expect(css).not.toMatch(/position:\s*fixed/);
    // split에서도 left/width 커버 % 하드코딩 금지 — 100%만
    expect(css).toMatch(
      /\.client-cover\[data-layout='split'\]\s*\.client-cover__dock\s*\{[^}]*left:\s*0/s
    );
    expect(css).toMatch(
      /\.client-cover\[data-layout='split'\]\s*\.client-cover__dock\s*\{[^}]*right:\s*0/s
    );
    expect(css).toMatch(
      /\.client-cover\[data-layout='split'\]\s*\.client-cover__dock\s*\{[^}]*width:\s*100%/s
    );
    expect(css).not.toMatch(
      /\.client-cover\[data-layout='split'\]\s*\.client-cover__dock\s*\{[^}]*left:\s*\d+%/s
    );
    expect(css).not.toMatch(
      /\.client-cover\[data-layout='split'\]\s*\.client-cover__dock\s*\{[^}]*width:\s*(?!100%)\d+%/s
    );
  });

  test('chapter shell pads for dock; dock rules extracted to ClientMinimalDock.css', () => {
    const css = fs.readFileSync(CHAPTER_CSS_PATH, 'utf8');

    expect(css).toMatch(/--client-cover-dock-h:\s*calc\(/);
    expect(css).toMatch(
      /\.client-cover__body\s*\{[^}]*position:\s*relative/s
    );
    expect(css).toMatch(
      /\.client-cover__scroll\s*\{[^}]*padding:[^;]*var\(--client-cover-dock-h\)/s
    );
    expect(css).toMatch(/DOCK → ClientMinimalDock\.css SSOT/);
    // 독 블록은 컴포넌트 CSS로 이동 — chapter에 잔존 금지
    expect(css).not.toMatch(/\.client-cover__dock\s*\{/);
    expect(css).not.toMatch(/\.client-cover__dock-item/);
    expect(css).not.toMatch(
      /\.client-cover__guide\s*\{[^}]*grid-template-columns/s
    );
    expect(css).not.toMatch(/\.client-cover__guide-go\s*\{/);
  });
});
