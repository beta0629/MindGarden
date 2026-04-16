/**
 * NavIcon - GNB/LNB icon button (44x44 touch target)
 * RESPONSIVE_LAYOUT_SPEC: minimum 44px touch area
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import './NavIcon.css';

/**
 * @param {Object} props
 * @param {string} props.icon - {@link import('../../../constants/icons').ICONS} registry key
 */
const NavIcon = ({ icon, label, onClick, className = '', disabled = false, ...rest }) => {
  const LucideIcon = icon ? ICONS[icon] : null;
  return (
    <MGButton
      type="button"
      variant="outline"
      size="small"
      preventDoubleClick={false}
      className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false, className: `mg-v2-nav-icon ${className}` })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={onClick}
      disabled={disabled}
      aria-label={label || 'Icon button'}
      {...rest}
    >
      {LucideIcon ? (
        <span className="mg-v2-nav-icon__lucide" aria-hidden>
          <LucideIcon size={ICON_SIZES.LG} strokeWidth={2} />
        </span>
      ) : null}
    </MGButton>
  );
};

export default NavIcon;
