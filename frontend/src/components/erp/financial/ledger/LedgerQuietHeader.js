/**
 * LedgerQuietHeader — 제목 + 기간 세그먼트(3) + 돈 기록 ghost 링크
 * Chrome contract: MoneyQuietHeader SSOT — h1 + 3 period chips + ONE ghost MGButton.
 * 직접 기간 입력은 LedgerInlineFilter(필터 툴바)로 이동.
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
  FM_PERIOD_ARIA_LABEL,
  FM_PERIOD_HEADER_OPTIONS,
  FM_RECORD_CTA,
  FM_RECORD_CTA_ARIA
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {string} props.period
 * @param {(next: string) => void} props.onPeriodChange
 * @param {() => void} props.onRecordClick
 */
const LedgerQuietHeader = ({
  period,
  onPeriodChange,
  onRecordClick
}) => (
  <header className="operator-ledger-header" aria-label={FM_PAGE_TITLE}>
    <h1 id={FM_PAGE_TITLE_ID} className="operator-ledger-header__title">
      {FM_PAGE_TITLE}
    </h1>
    <div className="operator-ledger-header__controls">
      <BadgeSelect
        options={FM_PERIOD_HEADER_OPTIONS}
        value={period}
        onChange={onPeriodChange}
        size="small"
        aria-label={FM_PERIOD_ARIA_LABEL}
        className="operator-ledger-header__period"
      />
      <nav className="operator-ledger-header__links" aria-label="바로가기">
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: false,
            className: 'operator-ledger-header__action'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onRecordClick}
          aria-label={FM_RECORD_CTA_ARIA}
          preventDoubleClick={false}
        >
          {FM_RECORD_CTA}
        </MGButton>
      </nav>
    </div>
  </header>
);

LedgerQuietHeader.propTypes = {
  period: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  onRecordClick: PropTypes.func.isRequired
};

export default LedgerQuietHeader;
