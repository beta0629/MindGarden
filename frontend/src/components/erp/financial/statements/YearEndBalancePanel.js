/**
 * YearEndBalancePanel — simplified year-end 자산·부채 (balance API)
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import StandardizedApi from '../../../../utils/standardizedApi';
import { ERP_API } from '../../../../constants/api';
import UnifiedLoading from '../../../common/UnifiedLoading';
import MGButton from '../../../common/MGButton';
import {
  FM_TAX_DISCLOSURE,
  FM_LOADING,
  FM_RETRY
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';
import { formatKrw } from '../../../../utils/erpFinancialAmountStack';
import { toSafeNumber } from '../../../../utils/safeDisplay';

const YEAR_RANGE = 5;

/**
 * @param {number} currentYear
 * @returns {number[]}
 */
const buildYearOptions = (currentYear) => {
  const years = [];
  for (let y = currentYear; y >= currentYear - YEAR_RANGE; y -= 1) {
    years.push(y);
  }
  return years;
};

/**
 * @param {object|null} raw
 * @returns {object|null}
 */
const normalizeBalanceResponse = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  if ('data' in raw && raw.data != null && typeof raw.data === 'object') {
    return raw.data;
  }
  return raw;
};

/**
 * @param {object} [props]
 * @param {number} [props.initialYear]
 */
const YearEndBalancePanel = ({ initialYear }) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear ?? currentYear);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balanceData, setBalanceData] = useState(null);

  const asOfDate = `${year}-12-31`;
  const yearOptions = buildYearOptions(currentYear);

  const fetchBalance = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      const response = await StandardizedApi.get(ERP_API.FINANCIAL_STATEMENT_BALANCE, { asOfDate });
      const normalized = normalizeBalanceResponse(response);
      setBalanceData(normalized && typeof normalized === 'object' ? normalized : null);
    } catch {
      setError(FM_TAX_DISCLOSURE.BALANCE_LOAD_ERROR);
      setBalanceData(null);
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const assetsTotal = toSafeNumber(balanceData?.assets?.total);
  const liabilitiesTotal = toSafeNumber(balanceData?.liabilities?.total);
  const equityTotal = toSafeNumber(balanceData?.equity?.total);
  const assetsItems = Array.isArray(balanceData?.assets?.items) ? balanceData.assets.items : [];
  const liabilitiesItems = Array.isArray(balanceData?.liabilities?.items)
    ? balanceData.liabilities.items
    : [];
  const equityItems = Array.isArray(balanceData?.equity?.items) ? balanceData.equity.items : [];

  const hasData = assetsTotal !== 0 || liabilitiesTotal !== 0 || equityTotal !== 0
    || assetsItems.length > 0 || liabilitiesItems.length > 0 || equityItems.length > 0;

  const renderItems = (items) => {
    if (items.length === 0) {
      return null;
    }
    return (
      <ul className="operator-ledger-year-end-balance__items">
        {items.map((item, idx) => (
          <li key={item.accountId ?? idx} className="operator-ledger-year-end-balance__item">
            <span className="operator-ledger-year-end-balance__item-name">
              {item.accountName || '—'}
            </span>
            <span className="operator-ledger-year-end-balance__item-amount">
              {formatKrw(toSafeNumber(item.balance))}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderSection = (title, totalLabel, items, total) => (
    <article className="operator-ledger-year-end-balance__section">
      <h3 className="operator-ledger-year-end-balance__section-title">{title}</h3>
      {renderItems(items)}
      <p className="operator-ledger-year-end-balance__total">
        <span>{totalLabel}</span>
        <strong>{formatKrw(total)}</strong>
      </p>
    </article>
  );

  return (
    <div className="operator-ledger-year-end" data-testid="year-end-balance-panel">
      <div className="operator-ledger-year-end__toolbar">
        <label className="operator-ledger-year-end__field">
          <span className="operator-ledger-year-end__label">{FM_TAX_DISCLOSURE.YEAR_LABEL}</span>
          <select
            className="operator-ledger-year-end__select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label={FM_TAX_DISCLOSURE.YEAR_LABEL}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
                {FM_TAX_DISCLOSURE.YEAR_OPTION_SUFFIX}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <UnifiedLoading type="inline" text={FM_LOADING.INLINE} />
      ) : error ? (
        <div className="operator-ledger-year-end__error" role="alert">
          <p className="operator-ledger-year-end__error-text">{error}</p>
          <MGButton
            type="button"
            variant="primary"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'sm',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={fetchBalance}
            preventDoubleClick={false}
            aria-label={FM_RETRY.ARIA_LABEL}
          >
            {FM_RETRY.LABEL}
          </MGButton>
        </div>
      ) : !hasData ? (
        <p className="operator-ledger-year-end__empty">{FM_TAX_DISCLOSURE.BALANCE_EMPTY}</p>
      ) : (
        <div className="operator-ledger-year-end-balance">
          {renderSection(
            FM_TAX_DISCLOSURE.BALANCE_ASSETS,
            FM_TAX_DISCLOSURE.BALANCE_ASSETS_TOTAL,
            assetsItems,
            assetsTotal
          )}
          {renderSection(
            FM_TAX_DISCLOSURE.BALANCE_LIABILITIES,
            FM_TAX_DISCLOSURE.BALANCE_LIABILITIES_TOTAL,
            liabilitiesItems,
            liabilitiesTotal
          )}
          {renderSection(
            FM_TAX_DISCLOSURE.BALANCE_EQUITY,
            FM_TAX_DISCLOSURE.BALANCE_EQUITY_TOTAL,
            equityItems,
            equityTotal
          )}
        </div>
      )}
    </div>
  );
};

YearEndBalancePanel.propTypes = {
  initialYear: PropTypes.number
};

export default YearEndBalancePanel;
