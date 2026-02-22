/**
 * 공통 어드민 레이아웃 컴포넌트
 * - DesktopLayout, MobileLayout 분기 처리 추상화
 * - 검색, 알림, 로그아웃 등 공통 기능 제공
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { useResponsive } from '../../hooks/useResponsive';
import { DesktopLayout, MobileLayout } from '../dashboard-v2/templates';
import { DEFAULT_MENU_ITEMS, BREAKPOINT_DESKTOP } from '../dashboard-v2/constants/menuItems';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import UnifiedLoading from '../common/UnifiedLoading';

const AdminCommonLayout = ({
  children,
  title,
  menuItems = DEFAULT_MENU_ITEMS,
  searchValue,
  onSearchChange,
  onBellClick,
  onLogout,
  className = '',
  loading = false,
  loadingText = "데이터를 불러오는 중..."
}) => {
  const navigate = useNavigate();
  const { logout } = useSession();
  const { windowSize } = useResponsive();
  const isDesktop = windowSize.width >= BREAKPOINT_DESKTOP;

  const handleLogout = useCallback(async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await logout();
      }
    } catch (e) {
      console.error('로그아웃 실패:', e);
    }
  }, [logout, onLogout]);

  const handleBellClick = useCallback(() => {
    if (onBellClick) {
      onBellClick();
    } else {
      navigate(ADMIN_ROUTES.MESSAGES);
    }
  }, [navigate, onBellClick]);

  const layoutProps = {
    menuItems,
    headerTitle: title,
    searchValue,
    onSearchChange,
    onBellClick: handleBellClick,
    onLogout: handleLogout
  };

  const content = loading ? (
    <UnifiedLoading type="page" text={loadingText} />
  ) : (
    children
  );

  return (
    <div className={`mg-v2-ad-b0kla mg-v2-ad-dashboard-v2 ${className}`.trim()}>
      {isDesktop ? (
        <DesktopLayout {...layoutProps}>
          {content}
        </DesktopLayout>
      ) : (
        <MobileLayout {...layoutProps}>
          {content}
        </MobileLayout>
      )}
    </div>
  );
};

export default AdminCommonLayout;
