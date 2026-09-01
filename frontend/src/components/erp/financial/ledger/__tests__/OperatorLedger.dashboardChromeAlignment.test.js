/**
 * Operator Ledger chrome alignment with `/erp/dashboard` MoneyCockpit SSOT
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  FM_PAGE_TITLE,
  FM_PERIOD_HEADER_OPTIONS,
  FM_RECORD_CTA,
  FM_RECORD_CTA_ARIA
} from '../../../../../constants/financialManagementStrings';
import LedgerQuietHeader from '../LedgerQuietHeader';

jest.mock('../../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ options, 'aria-label': ariaLabel }) => (
    <div data-testid="badge-select" aria-label={ariaLabel} data-count={(options || []).length}>
      {(options || []).map((opt) => (
        <button key={opt.value} type="button">{opt.label}</button>
      ))}
    </div>
  )
}));

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, variant, onClick, 'aria-label': ariaLabel, className }) => (
    <button
      type="button"
      data-variant={variant}
      data-classname={className || ''}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}));

const OPERATOR_CSS_PATH = path.resolve(__dirname, '..', 'OperatorLedger.css');
const MONEY_COCKPIT_CSS_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'organisms',
  'moneyCockpit',
  'MoneyCockpit.css'
);

const extractRuleBody = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const match = css.match(re);
  return match ? match[1] : null;
};

describe('OperatorLedger dashboard chrome alignment (MoneyCockpit SSOT)', () => {
  test('FM_PAGE_TITLE matches dashboard title string 이번 달 돈', () => {
    expect(FM_PAGE_TITLE).toBe('이번 달 돈');
  });

  test('header period options count is 3 (not 4)', () => {
    expect(FM_PERIOD_HEADER_OPTIONS).toHaveLength(3);
    expect(FM_PERIOD_HEADER_OPTIONS.map((o) => o.value)).toEqual([
      'THIS_MONTH',
      'LAST_MONTH',
      'THIS_YEAR'
    ]);
  });

  test('summary strip uses same color tokens as MoneyCockpit hero band', () => {
    const operatorCss = fs.readFileSync(OPERATOR_CSS_PATH, 'utf8');
    const moneyCss = fs.readFileSync(MONEY_COCKPIT_CSS_PATH, 'utf8');

    const ledgerIncome = extractRuleBody(
      operatorCss,
      '.operator-ledger-summary__cell--income .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    const heroIncome = extractRuleBody(
      moneyCss,
      '.money-hero-band__cell--income .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(ledgerIncome).toContain('--mg-v2-color-semantic-error');
    expect(heroIncome).toContain('--mg-v2-color-semantic-error');

    const ledgerExpense = extractRuleBody(
      operatorCss,
      '.operator-ledger-summary__cell--expense .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    const heroExpense = extractRuleBody(
      moneyCss,
      '.money-hero-band__cell--expense .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(ledgerExpense).toContain('--mg-v2-color-semantic-info');
    expect(heroExpense).toContain('--mg-v2-color-semantic-info');

    const ledgerRemaining = extractRuleBody(
      operatorCss,
      '.operator-ledger-summary__cell--remaining .operator-ledger-summary__amount .mg-v2-kpi-numeral'
    );
    const heroRemaining = extractRuleBody(
      moneyCss,
      '.money-hero-band__cell--remaining .money-hero-band__amount .mg-v2-kpi-numeral'
    );
    expect(ledgerRemaining).toContain('--mg-v2-color-primary-main');
    expect(heroRemaining).toContain('--mg-v2-color-primary-main');
  });

  test('TabChipRow.css prevents full-width button stretch in chip row', () => {
    const tabChipRowCss = fs.readFileSync(
      path.resolve(__dirname, '..', '..', '..', '..', 'common', 'TabChipRow.css'),
      'utf8'
    );
    const body = extractRuleBody(tabChipRowCss, '.mg-tab-chip-row .mg-v2-button');
    expect(body).toBeTruthy();
    expect(body).toMatch(/width:\s*auto/);
    expect(body).toMatch(/flex-shrink:\s*0/);
  });

  test('LedgerQuietHeader uses ghost variant for record action (not primary)', () => {
    render(
      <LedgerQuietHeader
        period="THIS_MONTH"
        onPeriodChange={() => {}}
        onRecordClick={() => {}}
      />
    );
    expect(screen.getByRole('heading', { level: 1, name: FM_PAGE_TITLE })).toBeInTheDocument();
    const recordBtn = screen.getByRole('button', { name: FM_RECORD_CTA_ARIA });
    expect(recordBtn).toHaveAttribute('data-variant', 'ghost');
    expect(recordBtn).not.toHaveAttribute('data-variant', 'primary');
    expect(recordBtn).toHaveTextContent(FM_RECORD_CTA);
    expect(screen.getByTestId('badge-select')).toHaveAttribute('data-count', '3');
  });
});
