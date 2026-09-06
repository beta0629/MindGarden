/**
 * SalaryQuietHeader — 제목 + ghost 기산일/급여 설정·목록 새로고침
 * Chrome contract: PurchaseQuietHeader / LedgerQuietHeader SSOT — h1 + ghost MGButton.
 *
 * @author CoreSolution
 * @since 2026-09-06
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  SM_PAGE_TITLE,
  SM_PAGE_TITLE_ID,
  SM_CONFIG_CTA,
  SM_CONFIG_ARIA,
  SM_REFRESH_CTA,
  SM_REFRESH_ARIA,
  SM_HEADER_TOOLS_ARIA
} from '../../../constants/salaryManagementClinicOsStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {() => void} props.onOpenConfig
 * @param {() => void} props.onRefresh
 * @param {boolean} [props.refreshing]
 * @param {boolean} [props.disabled]
 */
const SalaryQuietHeader = ({
  onOpenConfig,
  onRefresh,
  refreshing = false,
  disabled = false
}) => (
  <header className="salary-management-header" aria-label={SM_PAGE_TITLE}>
    <h1 id={SM_PAGE_TITLE_ID} className="salary-management-header__title">
      {SM_PAGE_TITLE}
    </h1>
    <div className="salary-management-header__controls">
      {/* equal-height lock: salary-management__header-actions (clinicOsChrome test) */}
      <nav
        className="salary-management-header__links salary-management__header-actions"
        aria-label={SM_HEADER_TOOLS_ARIA}
        role="group"
      >
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            className: 'salary-management-header__action salary-management__header-btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onOpenConfig}
          disabled={disabled}
          aria-label={SM_CONFIG_ARIA}
          preventDoubleClick={false}
        >
          {SM_CONFIG_CTA}
        </MGButton>
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: refreshing,
            className: 'salary-management-header__action salary-management__header-btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onRefresh}
          loading={refreshing}
          disabled={disabled}
          aria-label={SM_REFRESH_ARIA}
          preventDoubleClick={false}
        >
          {SM_REFRESH_CTA}
        </MGButton>
      </nav>
    </div>
  </header>
);

SalaryQuietHeader.propTypes = {
  onOpenConfig: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
  disabled: PropTypes.bool
};

export default SalaryQuietHeader;
