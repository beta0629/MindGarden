/**
 * useYearLedgerSummary — calendar-year posted ledger summary (financial-transactions API)
 *
 * Same envelope.summary pattern as FinancialManagement.applyLedgerSummary / loadTransactions.
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import { useState, useEffect, useCallback } from 'react';
import StandardizedApi from '../../../../utils/standardizedApi';
import { FM_ERRORS } from '../../../../constants/financialManagementStrings';

const API_ADMIN_FINANCIAL_TRANSACTIONS = '/api/v1/admin/financial-transactions';

/**
 * @param {number} year calendar year (e.g. 2026)
 * @returns {{ totalIncome: number, totalExpense: number, remaining: number }}
 */
const emptySummary = () => ({
  totalIncome: 0,
  totalExpense: 0,
  remaining: 0
});

/**
 * @param {object|null|undefined} serverSummary
 * @returns {{ totalIncome: number, totalExpense: number, remaining: number }}
 */
const parseServerSummary = (serverSummary) => {
  if (!serverSummary || typeof serverSummary !== 'object') {
    return emptySummary();
  }
  const totalIncome = Number(serverSummary.totalIncome) || 0;
  const totalExpense = Number(serverSummary.totalExpense) || 0;
  const remaining = serverSummary.remaining != null
    ? (Number(serverSummary.remaining) || 0)
    : (totalIncome - totalExpense);
  return { totalIncome, totalExpense, remaining };
};

/**
 * @param {number} year
 * @returns {{ startDate: string, endDate: string }}
 */
export const getCalendarYearDateRange = (year) => ({
  startDate: `${year}-01-01`,
  endDate: `${year}-12-31`
});

/**
 * @param {number} [year] defaults to current calendar year
 * @returns {{
 *   year: number,
 *   setYear: (y: number) => void,
 *   loading: boolean,
 *   error: string|null,
 *   summary: { totalIncome: number, totalExpense: number, remaining: number },
 *   reload: () => void
 * }}
 */
const useYearLedgerSummary = (initialYear) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(
    typeof initialYear === 'number' ? initialYear : currentYear
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(emptySummary);

  const fetchSummary = useCallback(async() => {
    const { startDate, endDate } = getCalendarYearDateRange(year);
    setLoading(true);
    setError(null);
    try {
      const envelope = await StandardizedApi.get(
        API_ADMIN_FINANCIAL_TRANSACTIONS,
        { page: 0, size: 1, startDate, endDate },
        { unwrapApiEnvelope: false }
      );

      if (!envelope || typeof envelope !== 'object') {
        setError(FM_ERRORS.TX_LIST);
        setSummary(emptySummary());
        return;
      }

      if (envelope.success === false) {
        setError(envelope?.message || FM_ERRORS.TX_LIST);
        setSummary(emptySummary());
        return;
      }

      setSummary(parseServerSummary(envelope.summary));
    } catch {
      setError(FM_ERRORS.TX_LIST_NETWORK);
      setSummary(emptySummary());
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    year,
    setYear,
    loading,
    error,
    summary,
    reload: fetchSummary
  };
};

export default useYearLedgerSummary;
