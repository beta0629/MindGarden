/**
 * MobileLayout - GNB + 드로어 + 메인 + 하단 탭바(선택)
 * RESPONSIVE_LAYOUT_SPEC: 768px 미만
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useState } from 'react';
import { MobileGnb, MobileLnbDrawer } from '../organisms';
import './MobileLayout.css';

const MobileLayout = ({
  children,
  menuItems = [],
  headerTitle = '시스템 관리',
  logoLabel,
  logoUrl,
  onBellClick,
  onProfileClick,
  onLogout,
  showBottomTabBar = false,
  bottomTabContent
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuClick = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  const handleLogout = () => {
    handleDrawerClose();
    onLogout?.();
  };

  return (
    <div className="mg-v2-mobile-layout">
      <MobileGnb
        logoLabel={logoLabel}
        logoUrl={logoUrl}
        onMenuClick={handleMenuClick}
        onBellClick={onBellClick}
        onProfileClick={onProfileClick}
      />
      <MobileLnbDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        menuItems={menuItems}
        headerTitle={headerTitle}
        onLogout={onLogout ? handleLogout : undefined}
      />
      <main className="mg-v2-mobile-layout__main" role="main">
        {children}
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
