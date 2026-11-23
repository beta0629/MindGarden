/**
 * MobileLayout - GNB + 드로어 + 메인 + 하단 탭바(선택)
 * RESPONSIVE_LAYOUT_SPEC: 768px 미만
 * soft-sheet: 상담사·관리자 공통 햄버거 셸 (본문 push 금지)
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
  /** true면 stage 검색 행 미렌더(커버 홈 등) */
  hideSearch = false,
  /** 'soft-sheet' = stone 오버레이 드로어 (시안 shell-outline) */
  drawerVariant,
  /** soft-sheet 활성 톤: counselor=primary, admin=slate */
  drawerActiveTone,
  /** soft-sheet 드로어 헤드 제목 (관리자 「메뉴」) */
  drawerTitle,
  /** 'admin' | 'counselor' — 본문 여백·GNB 크롬 분기 */
  shellTone,
  navigateQuickActionsFromLnb
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isSoftSheet = drawerVariant === 'soft-sheet';
  const isAdminShell = isSoftSheet && shellTone === 'admin';

  const handleMenuClick = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);

  const handleLogout = () => {
    handleDrawerClose();
    onLogout?.();
  };

  const layoutClassName = [
    'mg-v2-mobile-layout',
    isSoftSheet ? 'mg-v2-mobile-layout--soft-sheet' : '',
    isAdminShell ? 'mg-v2-mobile-layout--admin-shell' : ''
  ]
    .filter(Boolean)
    .join(' ');

  /* 관리자 soft-sheet: 검색은 GNB(≥1024). stage 검색 행은 숨김 */
  const showStageSearch = !hideSearch && !isAdminShell;

  return (
    <div className={layoutClassName}>
      <MobileGnb
        logoLabel={logoLabel}
        logoUrl={logoUrl}
        logoHomePath={logoHomePath}
        logoBrandingLoading={logoBrandingLoading}
        headerTitle={headerTitle}
        onMenuClick={handleMenuClick}
        onBellClick={onBellClick}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        shellTone={isSoftSheet ? (shellTone || 'counselor') : undefined}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        hideSearch={hideSearch}
        navigateQuickActionsFromLnb={navigateQuickActionsFromLnb}
        menuExpanded={drawerOpen}
      />
      <MobileLnbDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        menuItems={menuItems}
        headerTitle={drawerTitle || headerTitle}
        onLogout={onLogout ? handleLogout : undefined}
        variant={drawerVariant}
        activeTone={drawerActiveTone}
      />
      <main className="mg-v2-mobile-layout__main" role="main">
        <div className="mg-v2-mobile-layout__stage">
          {showStageSearch ? (
            <div className="mg-v2-mobile-layout__search">
              <SearchInput value={searchValue} onChange={onSearchChange} />
            </div>
          ) : null}
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
