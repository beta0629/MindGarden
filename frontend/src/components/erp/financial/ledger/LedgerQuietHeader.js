/**
 * LedgerQuietHeader — 제목 + 기간 세그먼트 + 돈 기록 CTA (하나의 quiet row)
 * Chrome contract: h1 + period segment + ONE primary MGButton only.
 * 매월 나가는 돈 바로가기는 LedgerInlineFilter(stage tools)로 이동됨 — SSOT §D/§9.
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import PropTypes from 'prop-types';
import BadgeSelect from '../../../common/BadgeSelect';
import MGButton from '../../../common/MGButton';
import {
  FM_PAGE_TITLE,
  FM_PAGE_TITLE_ID,
  FM_PERIOD,
  FM_PERIOD_ARIA_LABEL,
  FM_PERIOD_OPTIONS,
  FM_RECORD_CTA,
  FM_RECORD_CTA_ARIA,
  FM_FILTER
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {string} props.period
 * @param {(next: string) => void} props.onPeriodChange
 * @param {string} [props.startDate]
 * @param {string} [props.endDate]
 * @param {(field: 'startDate'|'endDate', value: string) => void} [props.onCustomDateChange]
 * @param {() => void} props.onRecordClick
 */
const LedgerQuietHeader = ({
  period,
  onPeriodChange,
  startDate = '',
  endDate = '',
  onCustomDateChange,
  onRecordClick
}) => (
  <header className="operator-ledger-header" aria-label={FM_PAGE_TITLE}>
    <h1 id={FM_PAGE_TITLE_ID} className="operator-ledger-header__title">
      {FM_PAGE_TITLE}
    </h1>
    <div className="operator-ledger-header__controls">
      <BadgeSelect
        options={FM_PERIOD_OPTIONS}
        value={period}
        onChange={onPeriodChange}
        size="small"
        aria-label={FM_PERIOD_ARIA_LABEL}
        className="operator-ledger-header__period"
      />
      {period === FM_PERIOD.CUSTOM && (
        <div className="operator-ledger-header__custom-range" role="group" aria-label={FM_PERIOD_ARIA_LABEL}>
          <input
            type="date"
            className="operator-ledger-header__date-input"
            value={startDate}
            onChange={(e) => onCustomDateChange?.('startDate', e.target.value)}
            aria-label={FM_FILTER.START_DATE}
          />
          <input
            type="date"
            className="operator-ledger-header__date-input"
            value={endDate}
            onChange={(e) => onCustomDateChange?.('endDate', e.target.value)}
            aria-label={FM_FILTER.END_DATE}
          />
        </div>
      )}
      <MGButton
        type="button"
        variant="primary"
        size="medium"
        className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onRecordClick}
        aria-label={FM_RECORD_CTA_ARIA}
        preventDoubleClick={false}
      >
        {FM_RECORD_CTA}
      </MGButton>
    </div>
  </header>
);

LedgerQuietHeader.propTypes = {
  period: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onCustomDateChange: PropTypes.func,
  onRecordClick: PropTypes.func.isRequired
};

export default LedgerQuietHeader;
