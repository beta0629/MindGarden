/**
 * useYearTaxMonthlySeries — calendar-year tax monthly series (stored amounts SSOT)
 *
 * GET /api/v1/erp/finance/tax-monthly-series?year=
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../../../utils/standardizedApi';
import { ERP_API } from '../../../../constants/api';
import { FM_TAX_SUMMARY } from '../../../../constants/financialManagementStrings';

/**
 * @returns {{
 *   month: number,
 *   vatTotal: number,
 *   withholdingTotal: number,
 *   expenseVatTotal: number,
 *   salaryWithholdingNational: number,
 *   salaryWithholdingLocal: number,
 *   salaryVat: number
 * }}
 */
export const emptyMonthRow = (month = 1) => ({
  month,
  vatTotal: 0,
  withholdingTotal: 0,
  expenseVatTotal: 0,
  salaryWithholdingNational: 0,
  salaryWithholdingLocal: 0,
  salaryVat: 0
});

/**
 * @returns {{
 *   WITHHOLDING_NATIONAL: number,
 *   WITHHOLDING_LOCAL: number,
 *   VAT: number
 * }}
 */
export const emptySalaryTaxTotals = () => ({
  WITHHOLDING_NATIONAL: 0,
  WITHHOLDING_LOCAL: 0,
  VAT: 0
});

/**
 * @param {unknown} value
 * @returns {number}
 */
const toAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * tax-monthly-series API 응답을 UI용 숫자 맵으로 정규화한다 (세율 재계산 없음).
 *
 * @param {unknown} raw
 * @returns {{
 *   year: number|null,
 *   months: Array<ReturnType<typeof emptyMonthRow>>,
 *   totals: { vatTotal: number, withholdingTotal: number, expenseVatTotal: number },
 *   salaryTaxTotals: ReturnType<typeof emptySalaryTaxTotals>
 * }}
 */
export function parseTaxMonthlySeriesPayload(raw) {
  const data = raw?.data ?? raw;
  const yearNum = data?.year != null ? Number(data.year) : null;
  const monthsRaw = Array.isArray(data?.months) ? data.months : [];
  const months = [];
  let vatTotal = 0;
  let withholdingTotal = 0;
  let expenseVatTotal = 0;

  for (let m = 1; m <= 12; m += 1) {
    const found = monthsRaw.find((row) => Number(row?.month) === m);
    const row = emptyMonthRow(m);
    if (found && typeof found === 'object') {
      row.vatTotal = toAmount(found.vatTotal);
      row.withholdingTotal = toAmount(found.withholdingTotal);
      row.expenseVatTotal = toAmount(found.expenseVatTotal);
      row.salaryWithholdingNational = toAmount(found.salaryWithholdingNational);
      row.salaryWithholdingLocal = toAmount(found.salaryWithholdingLocal);
      row.salaryVat = toAmount(found.salaryVat);
    }
    vatTotal += row.vatTotal;
    withholdingTotal += row.withholdingTotal;
    expenseVatTotal += row.expenseVatTotal;
    months.push(row);
  }

  const salaryRaw = data?.salaryTaxTotals && typeof data.salaryTaxTotals === 'object'
    ? data.salaryTaxTotals
    : {};
  const salaryTaxTotals = {
    WITHHOLDING_NATIONAL: toAmount(
      salaryRaw.WITHHOLDING_NATIONAL ?? salaryRaw.withholdingNational
    ),
    WITHHOLDING_LOCAL: toAmount(
      salaryRaw.WITHHOLDING_LOCAL ?? salaryRaw.withholdingLocal
    ),
    VAT: toAmount(salaryRaw.VAT ?? salaryRaw.vat)
  };

  // API year totals 미제공 시 월 행 합으로 보강 (저장값 합만, 세율 없음)
  if (salaryTaxTotals.WITHHOLDING_NATIONAL === 0
      && salaryTaxTotals.WITHHOLDING_LOCAL === 0
      && salaryTaxTotals.VAT === 0) {
    months.forEach((row) => {
      salaryTaxTotals.WITHHOLDING_NATIONAL += row.salaryWithholdingNational;
      salaryTaxTotals.WITHHOLDING_LOCAL += row.salaryWithholdingLocal;
      salaryTaxTotals.VAT += row.salaryVat;
    });
  }

  return {
    year: Number.isFinite(yearNum) ? yearNum : null,
    months,
    totals: { vatTotal, withholdingTotal, expenseVatTotal },
    salaryTaxTotals
  };
}

/**
 * @param {number} [yearProp] controlled calendar year from parent (shared selector)
 * @returns {{
 *   year: number,
 *   setYear: (y: number) => void,
 *   loading: boolean,
 *   error: string|null,
 *   months: Array<ReturnType<typeof emptyMonthRow>>,
 *   totals: { vatTotal: number, withholdingTotal: number, expenseVatTotal: number },
 *   salaryTaxTotals: ReturnType<typeof emptySalaryTaxTotals>,
 *   reload: () => void
 * }}
 */
const useYearTaxMonthlySeries = (yearProp) => {
  const currentYear = new Date().getFullYear();
  const year = typeof yearProp === 'number' ? yearProp : currentYear;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [months, setMonths] = useState(() => (
    Array.from({ length: 12 }, (_, i) => emptyMonthRow(i + 1))
  ));
  const [totals, setTotals] = useState({
    vatTotal: 0,
    withholdingTotal: 0,
    expenseVatTotal: 0
  });
  const [salaryTaxTotals, setSalaryTaxTotals] = useState(emptySalaryTaxTotals);

  const fetchSeries = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const raw = await StandardizedApi.get(
        ERP_API.FINANCE_TAX_MONTHLY_SERIES,
        { year: String(year) }
      );
      if (raw == null) {
        setError(FM_TAX_SUMMARY.LOAD_ERROR);
        setMonths(Array.from({ length: 12 }, (_, i) => emptyMonthRow(i + 1)));
        setTotals({ vatTotal: 0, withholdingTotal: 0, expenseVatTotal: 0 });
        setSalaryTaxTotals(emptySalaryTaxTotals());
        return;
      }
      const parsed = parseTaxMonthlySeriesPayload(raw);
      setMonths(parsed.months);
      setTotals(parsed.totals);
      setSalaryTaxTotals(parsed.salaryTaxTotals);
    } catch {
      setError(FM_TAX_SUMMARY.LOAD_ERROR_NETWORK);
      setMonths(Array.from({ length: 12 }, (_, i) => emptyMonthRow(i + 1)));
      setTotals({ vatTotal: 0, withholdingTotal: 0, expenseVatTotal: 0 });
      setSalaryTaxTotals(emptySalaryTaxTotals());
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  return {
    year,
    loading,
    error,
    months,
    totals,
    salaryTaxTotals,
    reload: fetchSeries
  };
};

export default useYearTaxMonthlySeries;
