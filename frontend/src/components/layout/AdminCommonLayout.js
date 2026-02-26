/**
 * 공통 어드민 레이아웃 컴포넌트
 * - DesktopLayout, MobileLayout 분기 처리 추상화
 * - LNB 메뉴는 DB 기반 API(/api/v1/menus/lnb) 전용, 실패 시에만 내부 폴백 상수 사용
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { useResponsive } from '../../hooks/useResponsive';
import { DesktopLayout, MobileLayout } from '../dashboard-v2/templates';
import { DEFAULT_MENU_ITEMS, BREAKPOINT_DESKTOP } from '../dashboard-v2/constants/menuItems';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import UnifiedLoading from '../common/UnifiedLoading';
import { getLnbMenus } from '../../utils/menuApi';
import { getLnbTreeFromResponse, normalizeLnbTree } from '../../utils/lnbMenuUtils';

const AdminCommonLayout = ({
  children,
  title,
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

  const [lnbMenuItems, setLnbMenuItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getLnbMenus()
      .then((res) => {
        if (cancelled) return;
        const tree = getLnbTreeFromResponse(res);
        if (tree && tree.length > 0) {
          setLnbMenuItems(normalizeLnbTree(tree));
        } else {
          setLnbMenuItems(DEFAULT_MENU_ITEMS);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLnbMenuItems(DEFAULT_MENU_ITEMS);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const menuItems = lnbMenuItems !== null ? lnbMenuItems : DEFAULT_MENU_ITEMS;

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
