/**
 * CoverGuideDenseRow — hex 금지 · dense flex · chevron 고정폭
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

const fs = require('fs');
const path = require('path');

const HEX_LITERAL = /#[0-9A-Fa-f]{3,8}\b/;
const DIR = path.join(__dirname, '..');

describe('CoverGuideDenseRow hex / layout guard', () => {
  test.each(['CoverGuideDenseRow.js', 'CoverGuideDenseRow.css'])(
    '%s has no hex color literals',
    (fileName) => {
      const source = fs.readFileSync(path.join(DIR, fileName), 'utf8');
      expect(source.match(HEX_LITERAL) || []).toEqual([]);
    }
  );

  test('CSS uses flex dense row; chevron has fixed token size and flex-shrink 0', () => {
    const css = fs.readFileSync(path.join(DIR, 'CoverGuideDenseRow.css'), 'utf8');
    expect(css).toMatch(/\.cover-guide-dense\s*\{[^}]*display:\s*flex/s);
    expect(css).toMatch(/\.cover-guide-dense__text\s*\{[^}]*min-width:\s*0/s);
    expect(css).toMatch(/overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/word-break:\s*keep-all/);
    expect(css).toMatch(
      /\.cover-guide-dense__go\s*\{[^}]*flex-shrink:\s*0/s
    );
    expect(css).toMatch(
      /\.cover-guide-dense__go\s*\{[^}]*width:\s*var\(--mg-v2-component-height-md\)/s
    );
    expect(css).toMatch(
      /\.cover-guide-dense__go\s*\{[^}]*max-width:\s*var\(--mg-v2-component-height-md\)/s
    );
    expect(css).not.toMatch(/grid-template-columns/);
  });
});
