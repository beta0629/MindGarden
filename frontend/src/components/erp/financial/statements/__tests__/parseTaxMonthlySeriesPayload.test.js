/**
 * parseTaxMonthlySeriesPayload — tax-monthly-series stored-amount parser
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import {
  parseTaxMonthlySeriesPayload,
  emptyMonthRow,
  emptySalaryTaxTotals
} from '../useYearTaxMonthlySeries';
import { FM_TAX_SUMMARY } from '../../../../../constants/financialManagementStrings';

describe('parseTaxMonthlySeriesPayload', () => {
  test('sums ledger stored months and keeps salary national/local separate', () => {
    const parsed = parseTaxMonthlySeriesPayload({
      year: '2026',
      months: [
        {
          month: 3,
          vatTotal: 100000,
          withholdingTotal: 33000,
          expenseVatTotal: 5000,
          salaryWithholdingNational: 30000,
          salaryWithholdingLocal: 3000,
          salaryVat: 10000
        },
        {
          month: 4,
          vatTotal: 20000,
          withholdingTotal: 0,
          expenseVatTotal: 0,
          salaryWithholdingNational: 15000,
          salaryWithholdingLocal: 1500,
          salaryVat: 0
        }
      ],
      salaryTaxTotals: {
        WITHHOLDING_NATIONAL: 45000,
        WITHHOLDING_LOCAL: 4500,
        VAT: 10000
      }
    });

    expect(parsed.year).toBe(2026);
    expect(parsed.months).toHaveLength(12);
    expect(parsed.months[2]).toMatchObject({
      month: 3,
      vatTotal: 100000,
      withholdingTotal: 33000,
      expenseVatTotal: 5000,
      salaryWithholdingNational: 30000,
      salaryWithholdingLocal: 3000,
      salaryVat: 10000
    });
    expect(parsed.totals).toEqual({
      vatTotal: 120000,
      withholdingTotal: 33000,
      expenseVatTotal: 5000
    });
    expect(parsed.salaryTaxTotals).toEqual({
      WITHHOLDING_NATIONAL: 45000,
      WITHHOLDING_LOCAL: 4500,
      VAT: 10000
    });
  });

  test('missing payload yields zero rows without rate literals', () => {
    const parsed = parseTaxMonthlySeriesPayload(null);
    expect(parsed.months).toHaveLength(12);
    expect(parsed.months[0]).toEqual(emptyMonthRow(1));
    expect(parsed.totals).toEqual({
      vatTotal: 0,
      withholdingTotal: 0,
      expenseVatTotal: 0
    });
    expect(parsed.salaryTaxTotals).toEqual(emptySalaryTaxTotals());
    expect(JSON.stringify(parsed)).not.toMatch(/0\.033|3\.3%/);
  });

  test('salary labels remain separate (no combined 3.3% string in FM_TAX_SUMMARY)', () => {
    expect(FM_TAX_SUMMARY.TH_SALARY_NATIONAL).toContain('국세');
    expect(FM_TAX_SUMMARY.TH_SALARY_LOCAL).toContain('지방세');
    expect(FM_TAX_SUMMARY.TH_SALARY_NATIONAL).not.toMatch(/3\.3%/);
    expect(FM_TAX_SUMMARY.TH_SALARY_LOCAL).not.toMatch(/3\.3%/);
    expect(FM_TAX_SUMMARY.SALARY_INTRO).not.toMatch(/3\.3%/);
  });
});
