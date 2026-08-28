/**
 * Operator ledger toolbar CSS contract — flex-end baseline + segment heights
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'OperatorLedger.css');

const readCss = () => fs.readFileSync(CSS_PATH, 'utf8');

/**
 * @param {string} css
 * @param {string} selector
 * @returns {string|null}
 */
const extractRuleBody = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const match = css.match(re);
  return match ? match[1] : null;
};

describe('OperatorLedger toolbar CSS contract', () => {
  const css = readCss();

  test('.operator-ledger-toolbar uses align-items: flex-end', () => {
    const body = extractRuleBody(css, '.operator-ledger-toolbar');
    expect(body).toBeTruthy();
    expect(body).toMatch(/align-items:\s*flex-end/);
    expect(body).not.toMatch(/align-items:\s*center/);
  });

  test('.operator-ledger-toolbar__filters uses align-items: flex-end', () => {
    const body = extractRuleBody(css, '.operator-ledger-toolbar__filters');
    expect(body).toBeTruthy();
    expect(body).toMatch(/align-items:\s*flex-end/);
    expect(body).not.toMatch(/align-items:\s*center/);
  });

  test('segment min-height is 2.5rem (matches selects)', () => {
    const body = extractRuleBody(css, '.operator-ledger-view-toggle__seg');
    expect(body).toBeTruthy();
    expect(body).toMatch(/min-height:\s*2\.5rem/);
    expect(body).toMatch(/box-sizing:\s*border-box/);
  });

  test('mobile segment min-height is 2.75rem (≥44px touch)', () => {
    expect(css).toMatch(
      /@media\s*\(\s*max-width:\s*767px\s*\)\s*\{[\s\S]*?\.operator-ledger-view-toggle__seg\s*\{[^}]*min-height:\s*2\.75rem/m
    );
  });
});
