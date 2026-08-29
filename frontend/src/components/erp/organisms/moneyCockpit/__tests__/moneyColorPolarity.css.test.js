/**
 * Money cockpit CSS/JS contract — Korean-stock money color invert
 * (income/red = semantic-error, expense/blue = semantic-info)
 *
 * @author CoreSolution
 * @since 2026-08-29
 */

import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve(__dirname, '..', 'MoneyCockpit.css');
const FLOW_STAGE_JS_PATH = path.resolve(__dirname, '..', 'MoneyFlowStage.js');

const readCss = () => fs.readFileSync(CSS_PATH, 'utf8');
const readFlowStageJs = () => fs.readFileSync(FLOW_STAGE_JS_PATH, 'utf8');

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

describe('MoneyCockpit money color polarity CSS contract', () => {
  const css = readCss();

  test('hero income amount uses semantic-error (not semantic-info)', () => {
    const body = extractRuleBody(
      css,
      '.money-hero-band__cell--income .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-error');
    expect(body).not.toContain('--mg-v2-color-semantic-info');
  });

  test('hero expense amount uses semantic-info (not semantic-error)', () => {
    const body = extractRuleBody(
      css,
      '.money-hero-band__cell--expense .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-info');
    expect(body).not.toContain('--mg-v2-color-semantic-error');
  });

  test('ledger amount--in uses semantic-error', () => {
    const body = extractRuleBody(css, '.money-ledger__table tbody .money-ledger__amount--in');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-error');
  });

  test('ledger amount--out uses semantic-info', () => {
    const body = extractRuleBody(css, '.money-ledger__table tbody .money-ledger__amount--out');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-info');
  });

  test('hero remaining amount still uses primary-main', () => {
    const body = extractRuleBody(
      css,
      '.money-hero-band__cell--remaining .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('primary-main');
    expect(body).not.toContain('--mg-v2-color-semantic-error');
    expect(body).not.toContain('--mg-v2-color-semantic-info');
  });

  test('flow avg caption income uses --mg-error-700', () => {
    const body = extractRuleBody(css, '.money-flow-stage__avg-caption-income');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-error-700');
  });

  test('flow avg caption expense uses --mg-v2-color-semantic-info-dark', () => {
    const body = extractRuleBody(css, '.money-flow-stage__avg-caption-expense');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-semantic-info-dark');
  });
});

describe('MoneyFlowStage chart fill token polarity', () => {
  const js = readFlowStageJs();

  test('INCOME_FILL and EXPENSE_FILL lock Korean-stock invert tokens', () => {
    expect(js).toContain("INCOME_FILL: '--mg-color-error'");
    expect(js).toContain("EXPENSE_FILL: '--mg-v2-color-semantic-info'");
  });
});
