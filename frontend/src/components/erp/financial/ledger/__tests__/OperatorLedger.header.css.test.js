/**
 * Operator Ledger quiet header CSS contract — period chips + primary CTA
 * stay on ONE row at desktop; only wrap to a full-width column on mobile
 * (SSOT §D.1 — regression from #709 where the CTA dropped onto a lone
 * second row under the period chips at ~1280px).
 *
 * @author CoreSolution
 * @since 2026-08-30
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

describe('OperatorLedger quiet header CSS contract (desktop one-row, mobile wraps)', () => {
  const css = readCss();

  test('desktop .operator-ledger-header__controls keeps period + CTA on one row (flex-wrap: nowrap)', () => {
    const body = extractRuleBody(css, '.operator-ledger-header__controls');
    expect(body).toBeTruthy();
    expect(body).toMatch(/flex-wrap:\s*nowrap/);
  });

  test('desktop .operator-ledger-header__controls does not grow/stretch to steal width from the title', () => {
    const body = extractRuleBody(css, '.operator-ledger-header__controls');
    expect(body).toBeTruthy();
    expect(body).toMatch(/flex:\s*0\s+0\s+auto/);
  });

  test('desktop title can shrink without forcing controls into a narrow wrapping column', () => {
    const body = extractRuleBody(css, '.operator-ledger-header__title');
    expect(body).toBeTruthy();
    expect(body).toMatch(/min-width:\s*0/);
  });

  test('desktop primary CTA does not stretch to the controls/chip-group width', () => {
    const body = extractRuleBody(css, '.operator-ledger-header__controls .mg-v2-button');
    expect(body).toBeTruthy();
    expect(body).toMatch(/width:\s*auto/);
    expect(body).not.toMatch(/width:\s*100%/);
  });

  test('mobile breakpoint (max-width: 767px) still wraps controls to a full-width column', () => {
    expect(css).toMatch(
      /@media\s*\(\s*max-width:\s*767px\s*\)\s*\{[\s\S]*?\.operator-ledger-header__controls\s*\{[^}]*flex-direction:\s*column[^}]*width:\s*100%|@media\s*\(\s*max-width:\s*767px\s*\)\s*\{[\s\S]*?\.operator-ledger-header__controls\s*\{[^}]*width:\s*100%[^}]*flex-direction:\s*column/m
    );
  });

  test('mobile breakpoint forces the primary CTA to full width', () => {
    expect(css).toMatch(
      /@media\s*\(\s*max-width:\s*767px\s*\)\s*\{[\s\S]*?\.operator-ledger-header__controls \.mg-v2-button\s*\{[^}]*width:\s*100%/m
    );
  });
});
