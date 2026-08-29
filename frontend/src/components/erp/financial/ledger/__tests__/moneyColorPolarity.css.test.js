/**
 * Ledger CSS contract — Korean-stock money color invert
 * (income/red = semantic-error, expense/blue = semantic-info)
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

  test('.ledger-calendar__amount--income uses semantic-error', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-error');
  });

  test('.ledger-calendar__amount--expense uses semantic-info', () => {
    const body = extractRuleBody(css, '.ledger-calendar__amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-info');
  });

  test('.ledger-calendar__detail-amount--income uses semantic-error', () => {
    const body = extractRuleBody(css, '.ledger-calendar__detail-amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-error');
  });

  test('.ledger-calendar__detail-amount--expense uses semantic-info', () => {
    const body = extractRuleBody(css, '.ledger-calendar__detail-amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-info');
  });

  test('.ledger-calendar__dot--income uses semantic-error', () => {
    const body = extractRuleBody(css, '.ledger-calendar__dot--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-error');
  });

  test('.ledger-calendar__dot--expense uses semantic-info', () => {
    const body = extractRuleBody(css, '.ledger-calendar__dot--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-info');
  });
});

describe('OperatorLedger money color polarity CSS contract', () => {
  const css = readOperatorCss();

  test('.operator-ledger-table__amount--income uses semantic-error', () => {
    const body = extractRuleBody(css, '.operator-ledger-table__amount--income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-error');
  });

  test('.operator-ledger-table__amount--expense uses semantic-info', () => {
    const body = extractRuleBody(css, '.operator-ledger-table__amount--expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-info');
  });

  test('remaining-positive still uses primary-main', () => {
    const body = extractRuleBody(css, '.operator-ledger-summary__amount--remaining-positive');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-primary-main');
  });

  test('remaining-negative still uses danger-main', () => {
    const body = extractRuleBody(css, '.operator-ledger-summary__amount--remaining-negative');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-danger-main');
  });
});
