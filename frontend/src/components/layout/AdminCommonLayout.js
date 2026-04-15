/**
 * 공통 어드민 레이아웃 컴포넌트
 * - DesktopLayout, MobileLayout 분기 처리 추상화
 * - LNB 메뉴는 DB 기반 API(/api/v1/menus/lnb) 전용, 실패 시에만 내부 폴백 상수 사용
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { useBranding } from '../../hooks/useBranding';
import { useResponsive } from '../../hooks/useResponsive';
import { getTenantGnbLabel } from '../../utils/tenantDisplayName';
import { getGnbLogoUrl } from '../../utils/brandingUtils';
import { DesktopLayout, MobileLayout } from '../dashboard-v2/templates';
import { DEFAULT_MENU_ITEMS, CONSULTANT_MENU_ITEMS, CLIENT_MENU_ITEMS, BREAKPOINT_DESKTOP } from '../dashboard-v2/constants/menuItems';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import UnifiedLoading from '../common/UnifiedLoading';
import { getLnbMenus } from '../../utils/menuApi';
import {
  deriveGnbQuickNavigateActionsFromLnb,
  getLnbTreeFromResponse,
  mergeSupplementalAdminLnbItems,
  normalizeLnbTree
} from '../../utils/lnbMenuUtils';

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
  const { user, logout } = useSession();
  const { brandingInfo } = useBranding({ autoLoad: Boolean(user) });
  const logoLabel = useMemo(
    () => getTenantGnbLabel(user, brandingInfo),
    [user, brandingInfo]
  );
  const logoUrl = useMemo(
    () => getGnbLogoUrl(brandingInfo),
    [brandingInfo]
  );
  const { windowSize } = useResponsive();
  const isDesktop = windowSize.width >= BREAKPOINT_DESKTOP;
  const userRole = user?.role;

  const getDefaultMenu = () => (userRole === 'CONSULTANT' ? CONSULTANT_MENU_ITEMS : userRole === 'CLIENT' ? CLIENT_MENU_ITEMS : DEFAULT_MENU_ITEMS);

  const [lnbMenuItems, setLnbMenuItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fallback = getDefaultMenu();
    getLnbMenus()
      .then((res) => {
        if (cancelled) return;
        const tree = getLnbTreeFromResponse(res);
        if (tree && tree.length > 0) {
          setLnbMenuItems(
            mergeSupplementalAdminLnbItems(normalizeLnbTree(tree, { userRole }))
          );
        } else {
          setLnbMenuItems(fallback);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLnbMenuItems(fallback);
        }
      });
    return () => { cancelled = true; };
  }, [userRole]);

  const menuItems = lnbMenuItems !== null ? lnbMenuItems : getDefaultMenu();

  const navigateQuickActionsFromLnb = useMemo(
    () => deriveGnbQuickNavigateActionsFromLnb(menuItems),
    [menuItems]
  );

  const handleLogout = useCallback(async() => {
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
    logoLabel,
    logoUrl,
    searchValue,
    onSearchChange,
    onBellClick: handleBellClick,
    onLogout: handleLogout,
    navigateQuickActionsFromLnb
  };

  const content = loading ? (
    <div className="mg-v2-loading-container" aria-busy="true" aria-live="polite">
      <UnifiedLoading type="inline" text={loadingText} />
    </div>
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
