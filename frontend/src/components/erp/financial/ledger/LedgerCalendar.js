/**
 * LedgerCalendar — Operator Ledger month grid (shared stage, no dual chrome)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import StandardizedApi from '../../../../utils/standardizedApi';
import { formatKrw } from '../../../../utils/erpFinancialAmountStack';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';
import { formatLocalDateYmd } from '../../../../utils/erpFinanceDisplay';
import {
  FM_LEDGER_CALENDAR,
  FM_SUMMARY,
  FM_ROW_ACTIONS,
  getCategoryDisplayLabel
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';
import './LedgerCalendar.css';

const API_ADMIN_FINANCIAL_TRANSACTIONS = '/api/v1/admin/financial-transactions';
const MONTH_YM_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const CALENDAR_PAGE_SIZE = 1000;

/**
 * @param {string|null|undefined} monthYm
 * @returns {string}
 */
function resolveMonthYm(monthYm) {
  if (typeof monthYm === 'string' && MONTH_YM_REGEX.test(monthYm)) {
    return monthYm;
  }
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * @param {string} monthYm
 * @returns {{ startDate: string, endDate: string, year: number, month: number, daysInMonth: number }}
 */
function getMonthBounds(monthYm) {
  const ym = resolveMonthYm(monthYm);
  const [y, m] = ym.split('-').map(Number);
  const startDate = `${ym}-01`;
  const daysInMonth = new Date(y, m, 0).getDate();
  const endDate = `${ym}-${String(daysInMonth).padStart(2, '0')}`;
  return { startDate, endDate, year: y, month: m, daysInMonth };
}

/**
 * @param {string} monthYm
 * @returns {Array<number|null>}
 */
export function buildMonthGridDays(monthYm) {
  const { year, month, daysInMonth } = getMonthBounds(monthYm);
  const startDow = new Date(year, month - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < startDow; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  while (cells.length < 42) {
    cells.push(null);
  }
  return cells;
}

/**
 * @param {Array<object>} transactions
 * @returns {Record<string, { income: number, expense: number, transactions: object[] }>}
 */
export function groupTransactionsByDate(transactions) {
  const grouped = {};
  (transactions || []).forEach((tx) => {
    const raw = tx && tx.transactionDate != null ? String(tx.transactionDate) : '';
    const dateKey = raw.length >= 10 ? raw.slice(0, 10) : '';
    if (!dateKey) {
      return;
    }
    if (!grouped[dateKey]) {
      grouped[dateKey] = { income: 0, expense: 0, transactions: [] };
    }
    const amount = toSafeNumber(tx.amount);
    const isIncome = String(tx.transactionType || '').toUpperCase() === 'INCOME';
    if (isIncome) {
      grouped[dateKey].income += amount;
    } else {
      grouped[dateKey].expense += amount;
    }
    grouped[dateKey].transactions.push(tx);
  });
  return grouped;
}

/**
 * @param {Record<string, unknown>} transaction
 * @param {string} searchLower
 * @returns {boolean}
 */
function matchesSearchText(transaction, searchLower) {
  if (!searchLower) {
    return true;
  }
  const vals = [
    transaction.description,
    transaction.clientName,
    transaction.consultantName,
    transaction.category,
    transaction.remarks
  ];
  return vals.some((v) => v != null && String(v).toLowerCase().includes(searchLower));
}

/**
 * @param {string|Date|null|undefined} dateValue
 * @returns {string}
 */
function formatLedgerDateTime(dateValue) {
  if (!dateValue) {
    return FM_LEDGER_CALENDAR.TIME_FALLBACK;
  }
  const raw = String(dateValue);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    if (raw.length > 10) {
      return raw.slice(0, 16).replace('T', ' ');
    }
    return raw.slice(0, 10);
  }
  try {
    return formatLocalDateYmd(new Date(dateValue));
  } catch {
    return FM_LEDGER_CALENDAR.TIME_FALLBACK;
  }
}

/**
 * @param {object} props
 * @param {string} props.monthYm
 * @param {string} [props.transactionType]
 * @param {string} [props.category]
 * @param {string} [props.searchText]
 * @param {number|string} [props.refreshKey]
 * @param {(tx: object) => void} [props.onView]
 * @param {(tx: object) => void} [props.onEdit]
 * @param {(tx: object) => void} [props.onDelete]
 */
const LedgerCalendar = ({
  monthYm,
  transactionType = 'ALL',
  category = 'ALL',
  searchText = '',
  refreshKey = 0,
  onView,
  onEdit,
  onDelete
}) => {
  const resolvedYm = resolveMonthYm(monthYm);
  const { startDate, endDate } = useMemo(() => getMonthBounds(resolvedYm), [resolvedYm]);
  const gridDays = useMemo(() => buildMonthGridDays(resolvedYm), [resolvedYm]);

  const [dayMap, setDayMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  const todayYmd = useMemo(() => formatLocalDateYmd(new Date()), []);

  useEffect(() => {
    let cancelled = false;

    const loadMonth = async() => {
      try {
        const params = {
          page: 0,
          size: CALENDAR_PAGE_SIZE,
          startDate,
          endDate
        };
        if (transactionType && transactionType !== 'ALL') {
          params.transactionType = transactionType;
        }
        if (category && category !== 'ALL') {
          params.category = category;
        }

        const envelope = await StandardizedApi.get(
          API_ADMIN_FINANCIAL_TRANSACTIONS,
          params,
          { unwrapApiEnvelope: false }
        );

        let rows = [];
        if (Array.isArray(envelope)) {
          rows = envelope;
        } else if (envelope && typeof envelope === 'object') {
          if (envelope.success === false) {
            if (!cancelled) {
              setDayMap({});
            }
            return;
          }
          rows = Array.isArray(envelope.data) ? envelope.data : [];
        }

        const inRange = (dateStr) => dateStr >= startDate && dateStr <= endDate;
        let filtered = rows.filter((tx) => {
          const raw = tx && tx.transactionDate != null ? String(tx.transactionDate) : '';
          const dateKey = raw.length >= 10 ? raw.slice(0, 10) : '';
          return dateKey && inRange(dateKey);
        });

        const searchLower = searchText ? searchText.trim().toLowerCase() : '';
        if (searchLower) {
          filtered = filtered.filter((tx) => matchesSearchText(tx, searchLower));
        }

        if (!cancelled) {
          setDayMap(groupTransactionsByDate(filtered));
        }
      } catch {
        if (!cancelled) {
          setDayMap({});
        }
      }
    };

    loadMonth();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, transactionType, category, searchText, refreshKey]);

  useEffect(() => {
    if (todayYmd.startsWith(resolvedYm)) {
      setSelectedDate(todayYmd);
      return;
    }
    setSelectedDate(`${resolvedYm}-01`);
  }, [resolvedYm, todayYmd]);

  const selectedDayData = selectedDate ? dayMap[selectedDate] : null;
  const selectedRows = selectedDayData?.transactions || [];

  const handleDayClick = useCallback((day) => {
    if (day == null) {
      return;
    }
    const ymd = `${resolvedYm}-${String(day).padStart(2, '0')}`;
    setSelectedDate(ymd);
  }, [resolvedYm]);

  return (
    <div className="ledger-calendar" data-testid="ledger-calendar">
      <div className="ledger-calendar__layout">
        <div
          className="ledger-calendar__grid"
          role="grid"
          aria-label={FM_LEDGER_CALENDAR.GRID_ARIA}
        >
          {FM_LEDGER_CALENDAR.WEEKDAYS.map((label, idx) => (
            <div
              key={label}
              className={
                idx === 0
                  ? 'ledger-calendar__weekday ledger-calendar__weekday--sunday'
                  : 'ledger-calendar__weekday'
              }
              role="columnheader"
            >
              {label}
            </div>
          ))}
          {gridDays.map((day, idx) => {
            if (day == null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="ledger-calendar__cell ledger-calendar__cell--empty"
                  role="gridcell"
                  aria-hidden="true"
                />
              );
            }
            const ymd = `${resolvedYm}-${String(day).padStart(2, '0')}`;
            const dayData = dayMap[ymd];
            const isToday = ymd === todayYmd;
            const isSelected = ymd === selectedDate;
            const cellClass = [
              'ledger-calendar__cell',
              isToday ? 'ledger-calendar__cell--today' : '',
              isSelected ? 'ledger-calendar__cell--selected' : ''
            ].filter(Boolean).join(' ');

            return (
              <button
                key={ymd}
                type="button"
                className={cellClass}
                role="gridcell"
                aria-label={ymd}
                aria-selected={isSelected}
                onClick={() => handleDayClick(day)}
              >
                <span className="ledger-calendar__day-num">{day}</span>
                <div className="ledger-calendar__amounts">
                  {dayData && dayData.income > 0 ? (
                    <p className="ledger-calendar__amount ledger-calendar__amount--income">
                      {FM_LEDGER_CALENDAR.INCOME_PREFIX}
                      {formatKrw(dayData.income)}
                    </p>
                  ) : null}
                  {dayData && dayData.expense > 0 ? (
                    <p className="ledger-calendar__amount ledger-calendar__amount--expense">
                      {FM_LEDGER_CALENDAR.EXPENSE_PREFIX}
                      {formatKrw(dayData.expense)}
                    </p>
                  ) : null}
                </div>
                <div className="ledger-calendar__dots" aria-hidden="true">
                  {dayData && dayData.income > 0 ? (
                    <span className="ledger-calendar__dot ledger-calendar__dot--income" />
                  ) : null}
                  {dayData && dayData.expense > 0 ? (
                    <span className="ledger-calendar__dot ledger-calendar__dot--expense" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <section
          className="ledger-calendar__detail"
          aria-label={FM_LEDGER_CALENDAR.DAY_LIST_ARIA}
          data-testid="ledger-calendar-day-detail"
        >
          <h3 className="ledger-calendar__detail-title">
            {selectedDate || FM_SUMMARY.DASH}
          </h3>
          {selectedRows.length === 0 ? (
            <p className="ledger-calendar__detail-empty">{FM_LEDGER_CALENDAR.EMPTY_DAY}</p>
          ) : (
            <ul className="ledger-calendar__detail-list">
              {selectedRows.map((tx) => {
                const isIncome = String(tx.transactionType || '').toUpperCase() === 'INCOME';
                const amount = toSafeNumber(tx.amount);
                const desc = toDisplayString(tx.description, FM_SUMMARY.DASH);
                const categoryLabel = getCategoryDisplayLabel(tx.category);
                const rowKey = tx.id != null ? String(tx.id) : `${desc}-${tx.transactionDate}`;
                return (
                  <li key={rowKey} className="ledger-calendar__detail-row">
                    <span className="ledger-calendar__detail-time">
                      {formatLedgerDateTime(tx.transactionDate)}
                    </span>
                    <div className="ledger-calendar__detail-desc">
                      <button
                        type="button"
                        className="ledger-calendar__detail-primary"
                        onClick={() => onView?.(tx)}
                      >
                        {desc}
                      </button>
                      {categoryLabel && categoryLabel !== '-' ? (
                        <span className="ledger-calendar__detail-secondary">{categoryLabel}</span>
                      ) : null}
                    </div>
                    <span
                      className={
                        isIncome
                          ? 'ledger-calendar__detail-amount ledger-calendar__detail-amount--income'
                          : 'ledger-calendar__detail-amount ledger-calendar__detail-amount--expense'
                      }
                    >
                      {isIncome
                        ? `${FM_LEDGER_CALENDAR.INCOME_PREFIX}${formatKrw(amount)}`
                        : `${FM_LEDGER_CALENDAR.EXPENSE_PREFIX}${formatKrw(amount)}`}
                    </span>
                    <div
                      className="ledger-calendar__detail-actions"
                      role="group"
                      aria-label={FM_ROW_ACTIONS.GROUP}
                    >
                      <MGButton
                        type="button"
                        variant="outline"
                        size="small"
                        className={buildErpMgButtonClassName({
                          variant: 'outline',
                          size: 'sm',
                          loading: false
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => onEdit?.(tx)}
                        aria-label={FM_ROW_ACTIONS.EDIT}
                        preventDoubleClick={false}
                      >
                        {FM_ROW_ACTIONS.EDIT}
                      </MGButton>
                      <MGButton
                        type="button"
                        variant="outline"
                        size="small"
                        className={buildErpMgButtonClassName({
                          variant: 'outline',
                          size: 'sm',
                          loading: false
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => onDelete?.(tx)}
                        aria-label={FM_ROW_ACTIONS.DELETE}
                        preventDoubleClick={false}
                      >
                        {FM_ROW_ACTIONS.DELETE}
                      </MGButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

LedgerCalendar.propTypes = {
  monthYm: PropTypes.string.isRequired,
  transactionType: PropTypes.string,
  category: PropTypes.string,
  searchText: PropTypes.string,
  refreshKey: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
};

export default LedgerCalendar;
