/**
 * 매칭 관리 페이지 - 아토믹 구조 래퍼
 * AdminDashboardV2와 동일한 레이아웃(GNB+LNB) 사용
 *
 * @author MindGarden
 * @since 2024-12-19
 * @updated 2025-02-22 - AdminDashboardV2 레이아웃 적용
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MappingManagementPage } from './mapping-management';
import { useSession } from '../../contexts/SessionContext';
import { useResponsive } from '../../hooks/useResponsive';
import { DesktopLayout, MobileLayout } from '../dashboard-v2/templates';
import { DEFAULT_MENU_ITEMS, BREAKPOINT_DESKTOP } from '../dashboard-v2/constants/menuItems';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/dashboard-common-v3.css';
import '../../styles/themes/admin-theme.css';

const MappingManagement = () => {
  const navigate = useNavigate();
  const { logout } = useSession();
  const { windowSize } = useResponsive();
  const isDesktop = windowSize.width >= BREAKPOINT_DESKTOP;
  const [searchValue, setSearchValue] = useState('');

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error('로그아웃 실패:', e);
    }
  }, [logout]);

  const layoutProps = {
    menuItems: DEFAULT_MENU_ITEMS,
    headerTitle: '매칭 관리',
    searchValue,
    onSearchChange: setSearchValue,
    onBellClick: () => navigate(ADMIN_ROUTES.MESSAGES),
    onLogout: handleLogout
  };

  return (
    <div className="mg-v2-ad-b0kla mg-v2-ad-dashboard-v2">
      {isDesktop ? (
        <DesktopLayout {...layoutProps}>
          <MappingManagementPage />
        </DesktopLayout>
      ) : (
        <MobileLayout {...layoutProps}>
          <MappingManagementPage />
        </MobileLayout>
      )}
    </div>
  );
};

export default MappingManagement;
