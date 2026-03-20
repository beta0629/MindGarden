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
import { useResponsive } from '../../hooks/useResponsive';
import { DesktopLayout, MobileLayout } from '../dashboard-v2/templates';
import { DEFAULT_MENU_ITEMS, CONSULTANT_MENU_ITEMS, CLIENT_MENU_ITEMS, BREAKPOINT_DESKTOP } from '../dashboard-v2/constants/menuItems';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import UnifiedLoading from '../common/UnifiedLoading';
import { getLnbMenus } from '../../utils/menuApi';
import { getLnbTreeFromResponse, normalizeLnbTree } from '../../utils/lnbMenuUtils';

const LNB_CACHE_PREFIX = 'mg:v2:lnb:menu:';

const normalizeRoleKey = (role) => {
  const raw = String(role || '').toUpperCase();
  return raw.startsWith('ROLE_') ? raw.slice(5) : raw;
};

const getCacheKey = (role) => `${LNB_CACHE_PREFIX}${normalizeRoleKey(role) || 'GUEST'}`;

const loadCachedMenu = (role) => {
  if (typeof globalThis.window === 'undefined') return null;
  try {
    const key = getCacheKey(role);
    const raw = globalThis.window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const saveCachedMenu = (role, menu) => {
  if (typeof globalThis.window === 'undefined') return;
  try {
    const key = getCacheKey(role);
    globalThis.window.sessionStorage.setItem(key, JSON.stringify(menu));
  } catch {
    // 저장 실패 시 무시 (quota 등)
  }
};

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
  const { windowSize } = useResponsive();
  const isDesktop = windowSize.width >= BREAKPOINT_DESKTOP;
  const userRole = user?.role;

  const getDefaultMenu = () => (userRole === 'CONSULTANT' ? CONSULTANT_MENU_ITEMS : userRole === 'CLIENT' ? CLIENT_MENU_ITEMS : DEFAULT_MENU_ITEMS);

  const [lnbMenuItems, setLnbMenuItems] = useState(() => loadCachedMenu(userRole));
  const fallbackMenu = useMemo(() => getDefaultMenu(), [userRole]);

  useEffect(() => {
    let cancelled = false;
    const cached = loadCachedMenu(userRole);
    if (cached && cached.length > 0) {
      setLnbMenuItems(cached);
    } else {
      setLnbMenuItems(fallbackMenu);
    }

    getLnbMenus()
      .then((res) => {
        if (cancelled) return;
        const tree = getLnbTreeFromResponse(res);
        if (tree && tree.length > 0) {
          const normalized = normalizeLnbTree(tree, { userRole });
          setLnbMenuItems(normalized);
          saveCachedMenu(userRole, normalized);
        } else {
          setLnbMenuItems((prev) => (prev && prev.length > 0 ? prev : fallbackMenu));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLnbMenuItems((prev) => (prev && prev.length > 0 ? prev : fallbackMenu));
        }
      });
    return () => { cancelled = true; };
  }, [fallbackMenu, userRole]);

  const menuItems = lnbMenuItems !== null ? lnbMenuItems : fallbackMenu;

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
