/**
 * Money cockpit CSS/JS contract — Clinic-OS money color polarity
 * (income = --mg-v2-color-money-income, expense = --mg-v2-color-money-expense,
 *  remaining always --mg-v2-color-text-primary)
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

  test('hero income amount uses money-income (not money-expense)', () => {
    const body = extractRuleBody(
      css,
      '.money-hero-band__cell--income .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-income');
    expect(body).not.toContain('--mg-v2-color-money-expense');
  });

  test('hero expense amount uses money-expense (not money-income)', () => {
    const body = extractRuleBody(
      css,
      '.money-hero-band__cell--expense .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-expense');
    expect(body).not.toContain('--mg-v2-color-money-income');
  });

  test('ledger amount--in uses money-income', () => {
    const body = extractRuleBody(css, '.money-ledger__table tbody .money-ledger__amount--in');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-income');
  });

  test('ledger amount--out uses money-expense', () => {
    const body = extractRuleBody(css, '.money-ledger__table tbody .money-ledger__amount--out');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-money-expense');
  });

  test('hero remaining amount uses text-primary (ink)', () => {
    const body = extractRuleBody(
      css,
      '.money-hero-band__cell--remaining .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-color-text-primary');
    expect(body).not.toContain('--mg-v2-color-money-income');
    expect(body).not.toContain('--mg-v2-color-money-expense');
    expect(body).not.toContain('--mg-v2-color-semantic-error');
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

  test('mix income amount uses money-income; fill is money-income wash not primary-solid', () => {
    const amount = extractRuleBody(css, '.money-outflow-mix--income .money-outflow-mix__amount');
    const fill = extractRuleBody(css, '.money-outflow-mix--income .money-outflow-mix__fill');
    expect(amount).toBeTruthy();
    expect(amount).toContain('--mg-v2-color-money-income');
    expect(amount).not.toContain('--mg-v2-color-money-expense');
    expect(fill).toBeTruthy();
    expect(fill).toContain('--mg-v2-color-money-income');
    expect(fill).not.toContain('primary-solid');
  });

  test('mix expense amount uses money-expense; fill is money-expense wash not primary-solid', () => {
    const amount = extractRuleBody(css, '.money-outflow-mix--expense .money-outflow-mix__amount');
    const fill = extractRuleBody(css, '.money-outflow-mix--expense .money-outflow-mix__fill');
    expect(amount).toBeTruthy();
    expect(amount).toContain('--mg-v2-color-money-expense');
    expect(amount).not.toContain('--mg-v2-color-money-income');
    expect(fill).toBeTruthy();
    expect(fill).toContain('--mg-v2-color-money-expense');
    expect(fill).not.toContain('primary-solid');
  });

  test('todo amount uses body-md not h2', () => {
    const body = extractRuleBody(css, '.money-todo-list__amount');
    expect(body).toBeTruthy();
    expect(body).toContain('--mg-v2-font-size-body-md');
    expect(body).not.toContain('--mg-v2-font-size-h2');
  });
});

describe('MoneyFlowStage chart fill token polarity', () => {
  const js = readFlowStageJs();

  test('INCOME_FILL and EXPENSE_FILL lock Korean-stock invert tokens', () => {
    expect(js).toContain("INCOME_FILL: '--mg-color-error'");
    expect(js).toContain("EXPENSE_FILL: '--mg-v2-color-semantic-info'");
  });
});
