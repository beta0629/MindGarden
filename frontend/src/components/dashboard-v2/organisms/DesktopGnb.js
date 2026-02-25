/**
 * DesktopGnb - GNB 64px: 로고 | 검색 | 우측 아이콘 그룹
 * RESPONSIVE_LAYOUT_SPEC: 데스크톱 헤더 64px
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { GnbRight } from '../molecules';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import './DesktopGnb.css';

const DEFAULT_LOGO_LABEL = '코어솔류션';

const DesktopGnb = ({
  logoLabel = DEFAULT_LOGO_LABEL,
  logoUrl,
  searchValue = '',
  onSearchChange,
  onCalendarClick,
  onBellClick,
  onMoonClick,
  onLogout
}) => {
  return (
    <header className="mg-v2-desktop-gnb" role="banner">
      <NavLink to={ADMIN_ROUTES.DASHBOARD} className="mg-v2-desktop-gnb__logo">
        {logoUrl ? (
          <img src={logoUrl} alt={logoLabel} className="mg-v2-desktop-gnb__logo-img" />
        ) : (
          <span className="mg-v2-desktop-gnb__logo-text">{logoLabel}</span>
        )}
      </NavLink>
      <div className="mg-v2-desktop-gnb__center">
        <GnbRight
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onCalendarClick={onCalendarClick}
          onBellClick={onBellClick}
          onMoonClick={onMoonClick}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
};

export default DesktopGnb;
