/**
 * RefundQuietHeader — 제목 + ghost 목록 새로고침
 * Chrome contract: PurchaseQuietHeader / SalaryQuietHeader SSOT — h1 + ghost MGButton.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  RM_PAGE_TITLE,
  RM_PAGE_TITLE_ID,
  RM_REFRESH_CTA,
  RM_REFRESH_ARIA,
  RM_HEADER_TOOLS_ARIA
} from '../../../constants/refundManagementClinicOsStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {() => void} props.onRefresh
 * @param {boolean} [props.refreshing]
 * @param {boolean} [props.disabled]
 */
const RefundQuietHeader = ({
  onRefresh,
  refreshing = false,
  disabled = false
}) => (
  <header className="refund-management-header" aria-label={RM_PAGE_TITLE}>
    <h1 id={RM_PAGE_TITLE_ID} className="refund-management-header__title">
      {RM_PAGE_TITLE}
    </h1>
    <div className="refund-management-header__controls">
      <nav
        className="refund-management-header__links"
        aria-label={RM_HEADER_TOOLS_ARIA}
      >
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: refreshing,
            className: 'refund-management-header__action'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onRefresh}
          loading={refreshing}
          disabled={disabled}
          aria-label={RM_REFRESH_ARIA}
          preventDoubleClick={false}
        >
          {RM_REFRESH_CTA}
        </MGButton>
      </nav>
    </div>
  </header>
);

RefundQuietHeader.propTypes = {
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
  disabled: PropTypes.bool
};

export default RefundQuietHeader;
