/**
 * LedgerCalendar CSS contract — open-cell density + no "+100…" mid-number truncation
 * (SSOT §D.5 / §10: day + formatKrw ≤ 2 lines, soft hairline grid, no dense spreadsheet)
 *
 * @author CoreSolution
 * @since 2026-08-30
 */

import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'LedgerCalendar.css');

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

describe('LedgerCalendar amount cell — no single-line ellipsis truncation ("+100…")', () => {
  const css = readCss();

  test('.ledger-calendar__amount allows wrapping (not nowrap+ellipsis)', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount');
    expect(body).toBeTruthy();
    expect(body).not.toMatch(/white-space:\s*nowrap/);
    expect(body).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  test('.ledger-calendar__amount does not hard-clip mid-glyph (no overflow:hidden / -webkit-line-clamp — the #709 regression)', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount');
    expect(body).toBeTruthy();
    expect(body).not.toMatch(/overflow:\s*hidden/);
    expect(body).toMatch(/overflow:\s*visible/);
    expect(body).not.toMatch(/-webkit-line-clamp/);
    expect(body).not.toMatch(/display:\s*-webkit-box/);
  });

  test('.ledger-calendar__amount wraps the full formatKrw string instead of clipping (word-break: keep-all + line-clamp combo shipped in #709)', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount');
    expect(body).toBeTruthy();
    expect(body).toMatch(/white-space:\s*normal/);
    expect(body).toMatch(/(overflow-wrap:\s*anywhere|word-break:\s*break-all|word-wrap:\s*break-word)/);
    expect(body).not.toMatch(/word-break:\s*keep-all/);
  });
});

describe('LedgerCalendar grid — open cells, not a dense 1px spreadsheet grid', () => {
  const css = readCss();

  test('day cells use their own soft hairline + radius instead of a boxed full grid', () => {
    const body = extractRuleBody(css, '.ledger-calendar__cell');
    expect(body).toBeTruthy();
    expect(body).toMatch(/border:\s*0\.0625rem solid var\(--mg-v2-color-neutral-200\)/);
    expect(body).toMatch(/border-radius:\s*var\(--mg-v2-radius-md/);
  });

  test('grid uses gap-based spacing rather than a single boxed border', () => {
    const body = extractRuleBody(css, '.ledger-calendar__grid');
    expect(body).toBeTruthy();
    expect(body).toMatch(/gap:\s*var\(--mg-v2-space-2\)/);
  });
});
