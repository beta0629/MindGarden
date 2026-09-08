/**
 * Ledger CSS contract — Clinic-OS money color polarity
 * (income = --mg-v2-color-money-income, expense = --mg-v2-color-money-expense,
 *  remaining always --mg-v2-color-text-primary including negative)
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

  test('.ledger-calendar__amount--income uses money-income', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-income');
  });

  test('.ledger-calendar__amount--expense uses money-expense', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-expense');
  });

  test('.ledger-calendar__detail-amount--income uses money-income', () => {
    const body = extractRuleBody(css, '.ledger-calendar__detail-amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-income');
  });

  test('.ledger-calendar__detail-amount--expense uses money-expense', () => {
    const body = extractRuleBody(css, '.ledger-calendar__detail-amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-expense');
  });

  test('.ledger-calendar__dot--income uses money-income', () => {
    const body = extractRuleBody(css, '.ledger-calendar__dot--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-income');
  });

  test('.ledger-calendar__dot--expense uses money-expense', () => {
    const body = extractRuleBody(css, '.ledger-calendar__dot--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-expense');
  });
});

describe('OperatorLedger money color polarity CSS contract', () => {
  const css = readOperatorCss();

  test('.operator-ledger-table__amount--income uses money-income', () => {
    const body = extractRuleBody(css, '.operator-ledger-table__amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-income');
  });

  test('.operator-ledger-table__amount--expense uses money-expense', () => {
    const body = extractRuleBody(css, '.operator-ledger-table__amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-expense');
  });

  test('KPI strip .operator-ledger-summary__cell--income uses money-income', () => {
    const body = extractRuleBody(
      css,
      '.operator-ledger-summary__cell--income .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-income');
  });

  test('KPI strip .operator-ledger-summary__cell--expense uses money-expense', () => {
    const body = extractRuleBody(
      css,
      '.operator-ledger-summary__cell--expense .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-expense');
  });

  test('remaining cell uses text-primary (ink) for both signs', () => {
    const body = extractRuleBody(
      css,
      '.operator-ledger-summary__cell--remaining .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-text-primary');
    expect(body).not.toContain('--mg-v2-color-semantic-error');
    expect(body).not.toContain('--mg-v2-color-primary-main');
  });

  test('legacy remaining-negative selector uses text-primary (not semantic-error)', () => {
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
