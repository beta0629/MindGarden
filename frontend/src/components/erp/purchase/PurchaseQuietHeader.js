/**
 * PurchaseQuietHeader — 제목 + ghost 목록 새로고침
 * Chrome contract: LedgerQuietHeader / MoneyQuietHeader SSOT — h1 + ONE ghost MGButton.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  PM_PAGE_TITLE,
  PM_PAGE_TITLE_ID,
  PM_REFRESH_CTA,
  PM_REFRESH_ARIA
} from '../../../constants/purchaseManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {() => void} props.onRefresh
 * @param {boolean} [props.refreshing]
 * @param {boolean} [props.disabled]
 */
const PurchaseQuietHeader = ({
  onRefresh,
  refreshing = false,
  disabled = false
}) => (
  <header className="purchase-management-header" aria-label={PM_PAGE_TITLE}>
    <h1 id={PM_PAGE_TITLE_ID} className="purchase-management-header__title">
      {PM_PAGE_TITLE}
    </h1>
    <div className="purchase-management-header__controls">
      <nav className="purchase-management-header__links" aria-label="센터 경비 도구">
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: refreshing,
            className: 'purchase-management-header__action'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onRefresh}
          loading={refreshing}
          disabled={disabled}
          aria-label={PM_REFRESH_ARIA}
          preventDoubleClick={false}
        >
          {PM_REFRESH_CTA}
        </MGButton>
      </nav>
    </div>
  </header>
);

PurchaseQuietHeader.propTypes = {
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
  disabled: PropTypes.bool
};

export default PurchaseQuietHeader;
