/**
 * DesktopGnb - GNB 64px: 로고 | 검색 | 우측 아이콘 그룹
 * RESPONSIVE_LAYOUT_SPEC: 데스크톱 헤더 64px
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { GnbRight } from '../molecules';
import './DesktopGnb.css';

const DEFAULT_LOGO_LABEL = 'MindGarden';

const DesktopGnb = ({
  logoLabel = DEFAULT_LOGO_LABEL,
  logoUrl,
  searchValue = '',
  onSearchChange,
  onCalendarClick,
  onBellClick,
  onMoonClick
}) => {
  return (
    <header className="mg-v2-desktop-gnb" role="banner">
      <div className="mg-v2-desktop-gnb__logo">
        {logoUrl ? (
          <img src={logoUrl} alt={logoLabel} className="mg-v2-desktop-gnb__logo-img" />
        ) : (
          <span className="mg-v2-desktop-gnb__logo-text">{logoLabel}</span>
        )}
      </div>
      <div className="mg-v2-desktop-gnb__center">
        <GnbRight
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onCalendarClick={onCalendarClick}
          onBellClick={onBellClick}
          onMoonClick={onMoonClick}
        />
      </div>
    </header>
  );
};

export default DesktopGnb;
