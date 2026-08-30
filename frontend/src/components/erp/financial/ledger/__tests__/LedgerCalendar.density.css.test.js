/**
 * LedgerCalendar CSS contract — open-cell density + no mid-number wrap/clip
 * (SSOT §D.5 / §10: day + formatKrw ≤ 2 lines, soft hairline grid, no dense
 * spreadsheet, complete formatKrw never breaks mid-digit).
 *
 * #709 shipped mid-glyph CLIP (overflow:hidden + line-clamp). #710 fixed that but
 * introduced mid-number WRAP via word-break:break-all + overflow-wrap:anywhere,
 * splitting "+1,140,000원" into "+1,14" / "0,000" / "원". This suite forbids both
 * regressions and requires the figure/unit split that only allows a wrap before "원".
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

  test('.ledger-calendar__amount does not force a mid-digit break (no word-break:break-all / overflow-wrap:anywhere — the #710 regression)', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount');
    expect(body).toBeTruthy();
    expect(body).not.toMatch(/word-break:\s*break-all/);
    expect(body).not.toMatch(/overflow-wrap:\s*anywhere/);
  });

  test('.ledger-calendar__amount-figure keeps the numeric figure (sign + digits + commas) on one nowrap line', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount-figure');
    expect(body).toBeTruthy();
    expect(body).toMatch(/white-space:\s*nowrap/);
    expect(body).not.toMatch(/word-break:\s*break-all/);
    expect(body).not.toMatch(/overflow-wrap:\s*anywhere/);
  });

  test('.ledger-calendar__amount-unit ("원") is its own nowrap child so wrapping can only happen before it', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount-unit');
    expect(body).toBeTruthy();
    expect(body).toMatch(/white-space:\s*nowrap/);
  });
});

describe('LedgerCalendar desktop layout — calendar gets enough width for a nowrap figure', () => {
  const css = readCss();

  test('@media (min-width: 1280px) gives the calendar column a flexible share instead of splitting it 1fr with the sidebar', () => {
    const match = css.match(/@media\s*\(\s*min-width:\s*1280px\s*\)\s*\{([\s\S]*?)\n\}\n/m);
    expect(match).toBeTruthy();
    const block = match[1];
    const layoutBody = extractRuleBody(block, '.ledger-calendar__layout');
    expect(layoutBody).toBeTruthy();
    expect(layoutBody).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  test('@media (min-width: 1280px) sidebar column is a fixed narrow range, not minmax(16rem, 1fr) stealing width from the calendar', () => {
    const match = css.match(/@media\s*\(\s*min-width:\s*1280px\s*\)\s*\{([\s\S]*?)\n\}\n/m);
    expect(match).toBeTruthy();
    const block = match[1];
    const layoutBody = extractRuleBody(block, '.ledger-calendar__layout');
    expect(layoutBody).toBeTruthy();
    expect(layoutBody).not.toMatch(/minmax\(16rem,\s*1fr\)/);
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
