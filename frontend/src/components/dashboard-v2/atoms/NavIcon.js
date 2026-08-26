/**
 * NavIcon - GNB/LNB icon button (44x44 touch target)
 * RESPONSIVE_LAYOUT_SPEC: minimum 44px touch area
 * 네이티브 button — MGButton outline chrome(1px solid !important) 미사용
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import './NavIcon.css';

/**
 * @param {Object} props
 * @param {string} props.icon - {@link import('../../../constants/icons').ICONS} registry key
 */
const NavIcon = ({ icon, label, onClick, className = '', disabled = false, ...rest }) => {
  const LucideIcon = icon ? ICONS[icon] : null;
  return (
    <button
      type="button"
      className={`mg-v2-nav-icon ${className}`.trim()}
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
    </button>
  );
};

export default NavIcon;
