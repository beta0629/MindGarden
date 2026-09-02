/**
 * YearEndIncomePanel — calendar-year 손익 (LedgerSummaryStrip) + 세금 저장액 표
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import PropTypes from 'prop-types';
import LedgerSummaryStrip from '../ledger/LedgerSummaryStrip';
import MGButton from '../../../common/MGButton';
import {
  FM_TAX_DISCLOSURE,
  FM_RETRY
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';
import useYearLedgerSummary from './useYearLedgerSummary';
import YearEndTaxSummaryPanel from './YearEndTaxSummaryPanel';

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
 * @param {object} [props]
 * @param {number} [props.initialYear]
 */
const YearEndIncomePanel = ({ initialYear }) => {
  const currentYear = new Date().getFullYear();
  const {
    year,
    setYear,
    loading,
    error,
    summary,
    reload
  } = useYearLedgerSummary(initialYear ?? currentYear);

  const yearOptions = buildYearOptions(currentYear);

  return (
    <div className="operator-ledger-year-end" data-testid="year-end-income-panel">
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

      {error ? (
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
            onClick={reload}
            preventDoubleClick={false}
            aria-label={FM_RETRY.ARIA_LABEL}
          >
            {FM_RETRY.LABEL}
          </MGButton>
        </div>
      ) : (
        <LedgerSummaryStrip
          loading={loading}
          totalIncome={summary.totalIncome}
          totalExpense={summary.totalExpense}
          remaining={summary.remaining}
        />
      )}

      <YearEndTaxSummaryPanel year={year} />
    </div>
  );
};

YearEndIncomePanel.propTypes = {
  initialYear: PropTypes.number
};

export default YearEndIncomePanel;
