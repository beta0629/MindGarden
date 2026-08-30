/**
 * LedgerInlineFilter + stage tools (매월 나가는 돈 바로가기 · 테이블/달력 전환)
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
  FM_LEDGER_VIEW_OPTIONS,
  FM_LEDGER_VIEW_ARIA,
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
 */
const LedgerInlineFilter = ({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  onRecurringClick
}) => (
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
      <div className="operator-ledger-toolbar__field">
        <span className="operator-ledger-toolbar__label" id="operator-ledger-category-label">
          {FM_FILTER.CATEGORY}
        </span>
        <BadgeSelect
          options={FM_FILTER_CATEGORY_OPTIONS}
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

LedgerInlineFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  onRecurringClick: PropTypes.func
};

export default LedgerInlineFilter;
