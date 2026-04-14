/**
 * NavIcon - GNB/LNB icon button (44x44 touch target)
 * RESPONSIVE_LAYOUT_SPEC: minimum 44px touch area
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import MGButton from '../../common/MGButton';
import Icon from '../../ui/Icon/Icon';
import './NavIcon.css';

/**
 * @param {Object} props
 * @param {string} props.icon - {@link import('../../../constants/icons').ICONS} registry key
 */
const NavIcon = ({ icon, label, onClick, className = '', disabled = false, ...rest }) => {
  return (
    <MGButton
      type="button"
      variant="outline"
      size="small"
      preventDoubleClick={false}
      className={`mg-v2-nav-icon ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label || 'Icon button'}
      {...rest}
    >
      {icon ? <Icon name={icon} size="LG" color="TRANSPARENT" aria-hidden /> : null}
    </MGButton>
  );
};

export default NavIcon;
