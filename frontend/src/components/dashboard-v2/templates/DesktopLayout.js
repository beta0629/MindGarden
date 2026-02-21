/**
 * DesktopLayout - GNB + LNB + 메인 콘텐츠
 * RESPONSIVE_LAYOUT_SPEC: 768px 이상
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { DesktopGnb, DesktopLnb } from '../organisms';
import './DesktopLayout.css';

const DesktopLayout = ({
  children,
  menuItems = [],
  headerTitle = '시스템 관리',
  logoLabel,
  logoUrl,
  searchValue = '',
  onSearchChange,
  onCalendarClick,
  onBellClick,
  onMoonClick
}) => {
  return (
    <div className="mg-v2-desktop-layout">
      <DesktopGnb
        logoLabel={logoLabel}
        logoUrl={logoUrl}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onCalendarClick={onCalendarClick}
        onBellClick={onBellClick}
        onMoonClick={onMoonClick}
      />
      <div className="mg-v2-desktop-layout__body">
        <DesktopLnb menuItems={menuItems} headerTitle={headerTitle} />
        <main className="mg-v2-desktop-layout__main" role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;
