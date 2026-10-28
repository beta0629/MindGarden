/**
 * MobileLayout - GNB + 드로어 + 메인 + 하단 탭바(선택)
 * RESPONSIVE_LAYOUT_SPEC: 768px 미만
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useState } from 'react';
import { SearchInput } from '../atoms';
import { MobileGnb, MobileLnbDrawer } from '../organisms';
import './MobileLayout.css';

const MobileLayout = ({
  children,
  menuItems = [],
  headerTitle = '운영',
  logoLabel,
  logoUrl,
  logoHomePath,
  logoBrandingLoading = false,
  searchValue = '',
  onSearchChange,
  onBellClick,
  onProfileClick,
  onLogout,
  showBottomTabBar = false,
  bottomTabContent,
  /** 'soft-sheet' = 상담사 태블릿 stone 드로어 (시안 shell-outline) */
  drawerVariant
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSoftSheet = drawerVariant === 'soft-sheet';

  const handleMenuClick = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  const handleLogout = () => {
    handleDrawerClose();
    onLogout?.();
  };

  return (
    <div
      className={`mg-v2-mobile-layout${isSoftSheet ? ' mg-v2-mobile-layout--soft-sheet' : ''}`}
    >
      <MobileGnb
        logoLabel={logoLabel}
        logoUrl={logoUrl}
        logoHomePath={logoHomePath}
        logoBrandingLoading={logoBrandingLoading}
        onMenuClick={handleMenuClick}
        onBellClick={onBellClick}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
      />
      <MobileLnbDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        menuItems={menuItems}
        headerTitle={headerTitle}
        onLogout={onLogout ? handleLogout : undefined}
        variant={drawerVariant}
      />
      <main className="mg-v2-mobile-layout__main" role="main">
        <div className="mg-v2-mobile-layout__stage">
          <div className="mg-v2-mobile-layout__search">
            <SearchInput value={searchValue} onChange={onSearchChange} />
          </div>
          {children}
        </div>
      </main>
      {showBottomTabBar && bottomTabContent && (
        <nav className="mg-v2-mobile-layout__tabbar" role="navigation">
          {bottomTabContent}
        </nav>
      )}
    </div>
  );
};

export default MobileLayout;
