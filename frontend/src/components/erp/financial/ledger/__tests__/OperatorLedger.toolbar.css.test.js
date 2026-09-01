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

  test('view toggle segment radius matches MGButton token (--mg-v2-radius-md, not the 4px radius-sm)', () => {
    const body = extractRuleBody(css, '.operator-ledger-view-toggle__seg');
    expect(body).toBeTruthy();
    expect(body).toMatch(/border-radius:\s*var\(--mg-v2-radius-md/);
    expect(body).not.toMatch(/border-radius:\s*var\(--mg-v2-radius-sm/);
  });

  test('사용 중 toggle chip radius matches token (--mg-v2-radius-md, not the 4px radius-sm)', () => {
    const body = extractRuleBody(css, '.operator-ledger-recurring__toggle');
    expect(body).toBeTruthy();
    expect(body).toMatch(/border-radius:\s*var\(--mg-v2-radius-md/);
    expect(body).not.toMatch(/border-radius:\s*var\(--mg-v2-radius-sm/);
  });
});

describe('OperatorLedger table layout CSS contract (no forced horizontal scroll)', () => {
  const css = readCss();

  test('.operator-ledger-table uses table-layout: fixed', () => {
    const body = extractRuleBody(css, '.operator-ledger-table');
    expect(body).toBeTruthy();
    expect(body).toMatch(/table-layout:\s*fixed/);
  });

  test('column widths are percentage-based and sum to 100%', () => {
    const colSelectors = [
      '.operator-ledger-table__col-date',
      '.operator-ledger-table__col-desc',
      '.operator-ledger-table__col-income',
      '.operator-ledger-table__col-expense',
      '.operator-ledger-table__col-actions'
    ];
    let total = 0;
    colSelectors.forEach((selector) => {
      const body = extractRuleBody(css, selector);
      expect(body).toBeTruthy();
      const match = body.match(/width:\s*(\d+(?:\.\d+)?)%/);
      expect(match).toBeTruthy();
      total += Number(match[1]);
    });
    expect(total).toBe(100);
  });

  test('no column rule uses a forced min-width that would force horizontal scroll', () => {
    const colSelectors = [
      '.operator-ledger-table__col-date',
      '.operator-ledger-table__col-desc',
      '.operator-ledger-table__col-income',
      '.operator-ledger-table__col-expense',
      '.operator-ledger-table__col-actions'
    ];
    colSelectors.forEach((selector) => {
      const body = extractRuleBody(css, selector);
      expect(body).not.toMatch(/min-width/);
    });
  });
});

describe('OperatorLedger pagination CSS contract (scoped BEM — no global .pagination/.page-link collision)', () => {
  const css = readCss();

  test('pagination markup uses scoped BEM classes, not bare .pagination/.page-item/.page-link', () => {
    expect(css).toMatch(/\.operator-ledger-pagination__list/);
    expect(css).toMatch(/\.operator-ledger-pagination__item/);
    expect(css).toMatch(/\.operator-ledger-pagination__btn/);
  });
});

describe('OperatorLedger type-step CSS contract (4 steps only — SSOT §C)', () => {
  const css = readCss();

  test('does not reference the extra font-size-h3 / body-sm / bare body aliases', () => {
    expect(css).not.toMatch(/--mg-v2-font-size-h3\b/);
    expect(css).not.toMatch(/--mg-v2-font-size-body-sm\b/);
    expect(css).not.toMatch(/--mg-v2-font-size-body\)/);
  });
});

describe('OperatorLedger category toolbar wrap CSS contract', () => {
  const css = readCss();

  test('.operator-ledger-toolbar__field--category spans full toolbar row', () => {
    const body = extractRuleBody(css, '.operator-ledger-toolbar__field--category');
    expect(body).toBeTruthy();
    expect(body).toMatch(/flex:\s*1 1 100%/);
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/max-width:\s*100%/);
  });

  test('category BadgeSelect is width-constrained within toolbar', () => {
    expect(css).toMatch(
      /\.operator-ledger-toolbar__field--category\s+\.mg-v2-badge-select\s*\{[^}]*width:\s*100%/m
    );
  });

  test('lighter chip density is scoped under .operator-ledger-toolbar only', () => {
    expect(css).toMatch(/\.operator-ledger-toolbar\s+\.mg-v2-badge-select--small/);
    expect(css).not.toMatch(/^\.mg-v2-badge-select--small\s/m);
  });
});

describe('OperatorLedger recurring delete button CSS contract (muted brick SSOT)', () => {
  const css = readCss();

  test('.operator-ledger-recurring__item-actions danger buttons use semantic-error', () => {
    expect(css).toMatch(
      /\.operator-ledger-recurring__item-actions\s+\.mg-button--danger[\s\S]*?background:\s*var\(--mg-v2-color-semantic-error\)/m
    );
  });

  test('recurring delete hover uses semantic-error-dark fallback', () => {
    expect(css).toMatch(
      /\.operator-ledger-recurring__item-actions\s+\.mg-button--danger:hover[\s\S]*?--mg-v2-color-semantic-error-dark/m
    );
  });
});
