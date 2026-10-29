/**
 * Client dock — fixed bottom + dock-h padding SSOT
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '..', 'ClientCoverChapter.css');

describe('ClientMinimalDock CSS contract', () => {
  test('dock is fixed full-bleed bottom with dock-h; scroll pads for dock', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');

    expect(css).toMatch(/--client-cover-dock-h:\s*calc\(/);
    expect(css).toMatch(
      /\.client-cover__dock\s*\{[^}]*position:\s*fixed/s
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
      /\.client-cover__dock\s*\{[^}]*z-index:\s*var\(--mg-v2-z-sticky\)/s
    );
    expect(css).toMatch(
      /\.client-cover__scroll\s*\{[^}]*padding:[^;]*var\(--client-cover-dock-h\)/s
    );
    expect(css).not.toMatch(
      /\.client-cover__guide\s*\{[^}]*grid-template-columns/s
    );
    expect(css).not.toMatch(/\.client-cover__guide-go\s*\{/);
  });
});
