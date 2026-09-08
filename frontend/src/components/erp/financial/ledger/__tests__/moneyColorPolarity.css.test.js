/**
 * Ledger CSS contract — Critic PASS money polarity
 * (ledger-scoped income/expense aliases; remaining-negative = text-primary ink)
 *
 * @author CoreSolution
 * @since 2026-08-29
 */

import fs from 'fs';
import path from 'path';

const CALENDAR_CSS_PATH = path.resolve(__dirname, '..', 'LedgerCalendar.css');
const OPERATOR_CSS_PATH = path.resolve(__dirname, '..', 'OperatorLedger.css');

const readCalendarCss = () => fs.readFileSync(CALENDAR_CSS_PATH, 'utf8');
const readOperatorCss = () => fs.readFileSync(OPERATOR_CSS_PATH, 'utf8');

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

describe('LedgerCalendar money color polarity CSS contract', () => {
  const css = readCalendarCss();

  test('.ledger-calendar__amount--income uses Critic ledger income alias', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-income');
  });

  test('.ledger-calendar__amount--expense uses Critic ledger expense alias', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-expense');
  });

  test('.ledger-calendar__detail-amount--income uses Critic ledger income alias', () => {
    const body = extractRuleBody(css, '.ledger-calendar__detail-amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-income');
  });

  test('.ledger-calendar__detail-amount--expense uses Critic ledger expense alias', () => {
    const body = extractRuleBody(css, '.ledger-calendar__detail-amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-expense');
  });

  test('.ledger-calendar__dot--income uses Critic ledger income alias', () => {
    const body = extractRuleBody(css, '.ledger-calendar__dot--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-income');
  });

  test('.ledger-calendar__dot--expense uses Critic ledger expense alias', () => {
    const body = extractRuleBody(css, '.ledger-calendar__dot--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-expense');
  });
});

describe('OperatorLedger money color polarity CSS contract', () => {
  const css = readOperatorCss();

  test('.operator-ledger defines Critic income/expense/remaining-negative aliases', () => {
    const body = extractRuleBody(css, '.operator-ledger');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-income');
    expect(body).toContain('#B91C1C');
    expect(body).toContain('--mg-v2-ledger-color-expense');
    expect(body).toContain('#1D4ED8');
    expect(body).toContain('--mg-v2-ledger-color-remaining-negative');
    expect(body).toContain('--mg-v2-color-text-primary');
  });

  test('.operator-ledger-table__amount--income uses Critic ledger income alias', () => {
    const body = extractRuleBody(css, '.operator-ledger-table__amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-income');
  });

  test('.operator-ledger-table__amount--expense uses Critic ledger expense alias', () => {
    const body = extractRuleBody(css, '.operator-ledger-table__amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-expense');
  });

  test('KPI strip .operator-ledger-summary__cell--income uses Critic income alias', () => {
    const body = extractRuleBody(
      css,
      '.operator-ledger-summary__cell--income .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-income');
  });

  test('KPI strip .operator-ledger-summary__cell--expense uses Critic expense alias', () => {
    const body = extractRuleBody(
      css,
      '.operator-ledger-summary__cell--expense .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-ledger-color-expense');
  });

  test('remaining cell uses text-primary ink (not primary-main hero teal)', () => {
    const body = extractRuleBody(
      css,
      '.operator-ledger-summary__cell--remaining .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-text-primary');
  });

  test('remaining-negative selector uses text-primary ink (not semantic-error)', () => {
    const body = extractRuleBody(css, '.operator-ledger-summary__amount--remaining-negative');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-text-primary');
    expect(body).not.toContain('--mg-v2-color-semantic-error');
    expect(body).not.toContain('--mg-v2-color-danger-main');
  });

  test('no rule in OperatorLedger.css references the non-existent --mg-v2-color-danger-main token', () => {
    expect(css).not.toContain('--mg-v2-color-danger-main');
  });
});
