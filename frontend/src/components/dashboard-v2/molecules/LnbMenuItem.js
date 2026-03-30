/**
 * LnbMenuItem - LNB 메뉴 아이템 (아이콘+텍스트, 260px)
 * RESPONSIVE_LAYOUT_SPEC: LNB 메뉴 항목 44px 높이
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { NavLinkWithRouter } from '../atoms';
import './LnbMenuItem.css';

const LnbMenuItem = ({ to, icon, children, end = false, onItemClick }) => {
  const handleClick = (e) => {
    onItemClick?.(e);
  };

  return (
    <li className="mg-v2-lnb-menu-item">
      <NavLinkWithRouter to={to} icon={icon} end={end} onClick={handleClick}>
        {children}
      </NavLinkWithRouter>
    </li>
  );
};

export default LnbMenuItem;
