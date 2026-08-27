/**
 * LedgerInlineFilter + view toggle (테이블 | 달력)
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import {
  FM_FILTER,
  FM_FILTER_TX_TYPE_OPTIONS,
  FM_FILTER_CATEGORY_OPTIONS,
  FM_LEDGER_VIEW_OPTIONS,
  FM_LEDGER_VIEW_ARIA
} from '../../../../constants/financialManagementStrings';

/**
 * @param {object} props
 * @param {object} props.filters
 * @param {(patch: object) => void} props.onFiltersChange
 * @param {string} props.viewMode
 * @param {(mode: string) => void} props.onViewModeChange
 */
const LedgerInlineFilter = ({ filters, onFiltersChange, viewMode, onViewModeChange }) => (
  <div className="operator-ledger-toolbar" role="toolbar" aria-label={FM_FILTER.ARIA_TOOLBAR}>
    <div className="operator-ledger-toolbar__filters">
      <div className="operator-ledger-toolbar__field operator-ledger-toolbar__field--search">
        <label className="operator-ledger-toolbar__label" htmlFor="operator-ledger-search">
          {FM_FILTER.SEARCH}
        </label>
        <input
          id="operator-ledger-search"
          type="search"
          className="operator-ledger-toolbar__input"
          value={filters.searchText || ''}
          placeholder={FM_FILTER.SEARCH_PLACEHOLDER}
          onChange={(e) => onFiltersChange({ searchText: e.target.value })}
        />
      </div>
      <div className="operator-ledger-toolbar__field">
        <label className="operator-ledger-toolbar__label" htmlFor="operator-ledger-type">
          {FM_FILTER.TRANSACTION_TYPE}
        </label>
        <select
          id="operator-ledger-type"
          className="operator-ledger-toolbar__select"
          value={filters.transactionType || 'ALL'}
          onChange={(e) => onFiltersChange({ transactionType: e.target.value })}
        >
          {FM_FILTER_TX_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="operator-ledger-toolbar__field">
        <label className="operator-ledger-toolbar__label" htmlFor="operator-ledger-category">
          {FM_FILTER.CATEGORY}
        </label>
        <select
          id="operator-ledger-category"
          className="operator-ledger-toolbar__select"
          value={filters.category || 'ALL'}
          onChange={(e) => onFiltersChange({ category: e.target.value })}
        >
          {FM_FILTER_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
    <div className="operator-ledger-view-toggle" role="group" aria-label={FM_LEDGER_VIEW_ARIA}>
      {FM_LEDGER_VIEW_OPTIONS.map((opt) => {
        const isActive = viewMode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={[
              'operator-ledger-view-toggle__seg',
              isActive
                ? 'operator-ledger-view-toggle__seg--active'
                : 'operator-ledger-view-toggle__seg--inactive'
            ].join(' ')}
            onClick={() => onViewModeChange(opt.value)}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

LedgerInlineFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired
};

export default LedgerInlineFilter;
