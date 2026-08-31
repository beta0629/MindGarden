/**
 * LedgerInlineFilter + stage tools (매월 나가는 돈 바로가기 · 테이블/달력 전환)
 * 직접 기간(시작일·종료일)은 quiet header에서 이동 — dateRange===CUSTOM 시 표시.
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import BadgeSelect from '../../../common/BadgeSelect';
import MGButton from '../../../common/MGButton';
import {
  FM_FILTER,
  FM_FILTER_TX_TYPE_OPTIONS,
  FM_FILTER_CATEGORY_OPTIONS,
  FM_FILTER_DATE_RANGE_OPTIONS,
  FM_LEDGER_VIEW_OPTIONS,
  FM_LEDGER_VIEW_ARIA,
  FM_PERIOD,
  FM_RECURRING
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {object} props.filters
 * @param {(patch: object) => void} props.onFiltersChange
 * @param {string} props.viewMode
 * @param {(mode: string) => void} props.onViewModeChange
 * @param {() => void} [props.onRecurringClick] 매월 나가는 돈 패널로 스크롤 이동 (stage tools)
 * @param {Array<{ value: string, label: string }>} [props.categoryOptions] SSOT API 기반 칩 (미전달 시 전체만)
 * @param {(field: 'startDate'|'endDate', value: string) => void} [props.onCustomDateChange]
 * @param {(period: string) => void} [props.onPeriodChange] CUSTOM chip → FM_PERIOD.CUSTOM
 */
const LedgerInlineFilter = ({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  onRecurringClick,
  categoryOptions,
  onCustomDateChange,
  onPeriodChange
}) => {
  const resolvedCategoryOptions = Array.isArray(categoryOptions) && categoryOptions.length > 0
    ? categoryOptions
    : FM_FILTER_CATEGORY_OPTIONS;
  const showCustomRange = filters.dateRange === 'CUSTOM';
  const customPeriodValue = filters.dateRange === 'CUSTOM' ? FM_PERIOD.CUSTOM : '';

  const handleCustomPeriodSelect = (value) => {
    if (value === FM_PERIOD.CUSTOM && onPeriodChange) {
      onPeriodChange(FM_PERIOD.CUSTOM);
    }
  };

  return (
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
      <div className="operator-ledger-toolbar__field operator-ledger-toolbar__field--date-range">
        <span className="operator-ledger-toolbar__label" id="operator-ledger-date-range-label">
          {FM_FILTER.PERIOD}
        </span>
        <BadgeSelect
          options={FM_FILTER_DATE_RANGE_OPTIONS}
          value={customPeriodValue}
          onChange={handleCustomPeriodSelect}
          size="small"
          aria-label={FM_FILTER.DATE_RANGE_CUSTOM}
        />
      </div>
      {showCustomRange ? (
        <div
          className="operator-ledger-toolbar__field operator-ledger-toolbar__field--custom-range"
          role="group"
          aria-label={FM_FILTER.DATE_RANGE_CUSTOM}
        >
          <label className="operator-ledger-toolbar__label" htmlFor="operator-ledger-start-date">
            {FM_FILTER.START_DATE}
          </label>
          <input
            id="operator-ledger-start-date"
            type="date"
            className="operator-ledger-toolbar__input operator-ledger-toolbar__date-input"
            value={filters.startDate || ''}
            onChange={(e) => {
              if (onCustomDateChange) {
                onCustomDateChange('startDate', e.target.value);
              } else {
                onFiltersChange({ startDate: e.target.value, dateRange: 'CUSTOM' });
              }
            }}
            aria-label={FM_FILTER.START_DATE}
          />
          <label className="operator-ledger-toolbar__label" htmlFor="operator-ledger-end-date">
            {FM_FILTER.END_DATE}
          </label>
          <input
            id="operator-ledger-end-date"
            type="date"
            className="operator-ledger-toolbar__input operator-ledger-toolbar__date-input"
            value={filters.endDate || ''}
            onChange={(e) => {
              if (onCustomDateChange) {
                onCustomDateChange('endDate', e.target.value);
              } else {
                onFiltersChange({ endDate: e.target.value, dateRange: 'CUSTOM' });
              }
            }}
            aria-label={FM_FILTER.END_DATE}
          />
        </div>
      ) : null}
      <div className="operator-ledger-toolbar__field">
        <span className="operator-ledger-toolbar__label" id="operator-ledger-type-label">
          {FM_FILTER.TRANSACTION_TYPE}
        </span>
        <BadgeSelect
          options={FM_FILTER_TX_TYPE_OPTIONS}
          value={filters.transactionType || 'ALL'}
          onChange={(value) => onFiltersChange({ transactionType: value })}
          size="small"
          aria-label={FM_FILTER.TRANSACTION_TYPE}
        />
      </div>
      <div className="operator-ledger-toolbar__field operator-ledger-toolbar__field--category">
        <span className="operator-ledger-toolbar__label" id="operator-ledger-category-label">
          {FM_FILTER.CATEGORY}
        </span>
        <BadgeSelect
          options={resolvedCategoryOptions}
          value={filters.category || 'ALL'}
          onChange={(value) => onFiltersChange({ category: value })}
          size="small"
          aria-label={FM_FILTER.CATEGORY}
        />
      </div>
    </div>
    <div className="operator-ledger-toolbar__tools">
      {onRecurringClick ? (
        <MGButton
          type="button"
          variant="ghost"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onRecurringClick}
          aria-label={FM_RECURRING.HEADER_BUTTON_ARIA}
          preventDoubleClick={false}
        >
          {FM_RECURRING.HEADER_BUTTON}
        </MGButton>
      ) : null}
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
  </div>
  );
};

LedgerInlineFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  onRecurringClick: PropTypes.func,
  categoryOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })),
  onCustomDateChange: PropTypes.func,
  onPeriodChange: PropTypes.func
};

export default LedgerInlineFilter;
