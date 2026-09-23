/**
 * OpsApprovalQuietHeader — 제목 + ghost 목록 새로고침 (+ optional 일반/상위 전환)
 * Chrome contract: PurchaseQuietHeader / SalaryQuietHeader SSOT — h1 + ghost MGButton.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  OAC_PAGE_TITLE,
  OAC_PAGE_TITLE_ID,
  OAC_REFRESH_CTA,
  OAC_REFRESH_ARIA,
  OAC_HEADER_TOOLS_ARIA
} from '../../../constants/opsApprovalCenterStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {() => void} props.onRefresh
 * @param {boolean} [props.refreshing]
 * @param {boolean} [props.disabled]
 * @param {'admin'|'super'} [props.mode]
 * @param {() => void} [props.onSwitchAdmin]
 * @param {() => void} [props.onSwitchSuper]
 */
const OpsApprovalQuietHeader = ({
  onRefresh,
  refreshing = false,
  disabled = false,
  mode = 'admin',
  onSwitchAdmin,
  onSwitchSuper
}) => (
  <header className="ops-approval-header" aria-label={OAC_PAGE_TITLE}>
    <h1 id={OAC_PAGE_TITLE_ID} className="ops-approval-header__title">
      {OAC_PAGE_TITLE}
    </h1>
    <div className="ops-approval-header__controls">
      <nav
        className="ops-approval-header__links ops-approval__header-actions"
        aria-label={OAC_HEADER_TOOLS_ARIA}
        role="group"
      >
        {typeof onSwitchAdmin === 'function' && typeof onSwitchSuper === 'function' ? (
          <nav className="ops-approval-mode-switch" aria-label="승인 구역 전환">
            <MGButton
              type="button"
              variant="ghost"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'ghost',
                size: 'sm',
                className: `ops-approval-header__action ops-approval__header-btn${mode === 'admin' ? ' ops-approval-header__action--active' : ''}`
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onSwitchAdmin}
              disabled={disabled}
              aria-pressed={mode === 'admin'}
              preventDoubleClick={false}
            >
              일반 승인
            </MGButton>
            <MGButton
              type="button"
              variant="ghost"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'ghost',
                size: 'sm',
                className: `ops-approval-header__action ops-approval__header-btn${mode === 'super' ? ' ops-approval-header__action--active' : ''}`
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onSwitchSuper}
              disabled={disabled}
              aria-pressed={mode === 'super'}
              preventDoubleClick={false}
            >
              상위 승인
            </MGButton>
          </nav>
        ) : null}
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: refreshing,
            className: 'ops-approval-header__action ops-approval__header-btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onRefresh}
          loading={refreshing}
          disabled={disabled}
          aria-label={OAC_REFRESH_ARIA}
          preventDoubleClick={false}
        >
          {OAC_REFRESH_CTA}
        </MGButton>
      </nav>
    </div>
  </header>
);

OpsApprovalQuietHeader.propTypes = {
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
  disabled: PropTypes.bool,
  mode: PropTypes.oneOf(['admin', 'super']),
  onSwitchAdmin: PropTypes.func,
  onSwitchSuper: PropTypes.func
};

export default OpsApprovalQuietHeader;
