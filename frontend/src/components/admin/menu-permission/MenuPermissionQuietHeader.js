/**
 * MenuPermissionQuietHeader — title + subtitle + Save CTA (height 36)
 * Twin: RefundQuietHeader / SalaryQuietHeader
 * SSOT: docs/design-system/clinic-os-menu-permissions.md
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import {
  MENU_PERM_PAGE,
  MENU_PERM_BUTTON
} from '../../../constants/menuPermissionManagementStrings';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../../erp/common/erpMgButtonProps';

/**
 * @param {object} props
 * @param {() => void} props.onSave
 * @param {boolean} [props.saving]
 * @param {boolean} [props.disabled]
 */
const MenuPermissionQuietHeader = ({
  onSave,
  saving = false,
  disabled = false
}) => (
  <header
    className="menu-permission-header"
    aria-label={MENU_PERM_PAGE.TITLE}
  >
    <div className="menu-permission-header__titles">
      <h1
        id={MENU_PERM_PAGE.TITLE_ID}
        className="menu-permission-header__title"
      >
        {MENU_PERM_PAGE.TITLE}
      </h1>
      <p className="menu-permission-header__subtitle">
        {MENU_PERM_PAGE.SUBTITLE}
      </p>
    </div>
    <div className="menu-permission-header__controls">
      <MGButton
        type="button"
        variant="primary"
        size="small"
        className={buildErpMgButtonClassName({
          variant: 'primary',
          size: 'sm',
          loading: saving,
          className: 'menu-permission-header__save'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onSave}
        loading={saving}
        disabled={disabled}
        preventDoubleClick
      >
        {MENU_PERM_BUTTON.SAVE_CHANGES}
      </MGButton>
    </div>
  </header>
);

MenuPermissionQuietHeader.propTypes = {
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  disabled: PropTypes.bool
};

export default MenuPermissionQuietHeader;
