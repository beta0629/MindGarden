/**
 * 공통 어드민 레이아웃 컴포넌트
 * - DesktopLayout, MobileLayout 분기 처리 추상화
 * - LNB 메뉴는 DB 기반 API(/api/v1/menus/lnb) 전용, 실패 시에만 내부 폴백 상수 사용
 * - AdminShellContext 내부에서는 GNB/LNB 재마운트 없이 children만 반환(영속 셸)
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { AdminShellContext, useAdminShell } from '../../contexts/AdminShellContext';
import { useBranding } from '../../hooks/useBranding';
import { useResponsive } from '../../hooks/useResponsive';
import { getTenantGnbLabel } from '../../utils/tenantDisplayName';
import { getGnbLogoUrl } from '../../utils/brandingUtils';
import { DesktopLayout, MobileLayout } from '../dashboard-v2/templates';
import { DEFAULT_MENU_ITEMS, CONSULTANT_MENU_ITEMS, CLIENT_MENU_ITEMS, BREAKPOINT_DESKTOP } from '../dashboard-v2/constants/menuItems';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import UnifiedLoading from '../common/UnifiedLoading';
import { getLnbMenus } from '../../utils/menuApi';
import { useTenantComponentFlags } from '../../hooks/useTenantComponentFlags';
import {
  deriveGnbQuickNavigateActionsFromLnb,
  filterBranchAdminLnbItems,
  filterHiddenAdminLnbItems,
  filterStaffErpLnbItems,
  getLnbTreeFromResponse,
  mergeBillingAdminLnbItems,
  mergeClientShopLnbItems,
  mergeShopAdminLnbItems,
  mergeSupplementalAdminLnbItems,
  normalizeLnbTree
} from '../../utils/lnbMenuUtils';
import { USER_ROLES } from '../../constants/roles';
import RoleUtils from '../../utils/RoleUtils';
import { resolvePostLoginLandingPath } from '../../utils/dashboardUtils';

/** LNB 사이드바 헤더 — 페이지 title 미전달(G-14) 시 역할별 기본 문구 */
const LNB_HEADER_TITLE_COUNSELOR = '상담';
const LNB_HEADER_TITLE_CLIENT = '내담자';
const LNB_HEADER_TITLE_OPERATOR = '운영';
const DEFAULT_LOADING_TEXT = '데이터를 불러오는 중...';

/**
 * 영속 셸 내부: GNB/LNB 재렌더 금지.
 * title/className/search/bell/logout만 셸에 올리고, loading은 로컬에서 처리해 Outlet 언마운트를 막는다.
 */
const AdminCommonLayoutPassthrough = ({
  children,
  title,
  searchValue,
  onSearchChange,
  onBellClick,
  onLogout,
  className = '',
  loading = false,
  loadingText = DEFAULT_LOADING_TEXT
}) => {
  const shell = useAdminShell();

  useLayoutEffect(() => {
    if (!shell?.setShellMeta) {
      return undefined;
    }
    // loading/loadingText 는 셸로 올리지 않음 — Outlet 교체 시 페이지 언마운트·로딩 고착 방지
    shell.setShellMeta({
      title,
      className,
      searchValue,
      onSearchChange,
      onBellClick,
      onLogout
    });
    return undefined;
  }, [
    shell,
    title,
    className,
    searchValue,
    onSearchChange,
    onBellClick,
    onLogout
  ]);

  if (loading) {
    return (
      <div className="mg-v2-loading-container" aria-busy="true" aria-live="polite">
        <UnifiedLoading type="inline" text={loadingText} />
      </div>
    );
  }

  return children;
};

/**
 * 셸 소유자: Desktop/Mobile 레이아웃 + AdminShellProvider
 */
const AdminCommonLayoutShell = ({
  children,
  title,
  searchValue,
  onSearchChange,
  onBellClick,
  onLogout,
  className = ''
  // loading / loadingText: 셸 props로 올 수 있으나 Outlet 대체에 사용하지 않음(페이지 passthrough 전용)
}) => {
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const { brandingInfo, isLoading: isBrandingLoading } = useBranding({ autoLoad: Boolean(user) });
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
  const isCounselorOnly = RoleUtils.hasCounselorCapability(user) && !RoleUtils.hasOperatorCapability(user);
  const isClientOnly = userRole === USER_ROLES.CLIENT;
  const isStaffUser = RoleUtils.isStaff(user);

  const [shellMeta, setShellMeta] = useState({});

  const resolvedTitle = shellMeta.title !== undefined ? shellMeta.title : title;
  // 페이지 passthrough loading 은 셸에서 무시 — Outlet(children) 항상 유지(페이지 로컬 loading만 사용)
  const resolvedClassName = shellMeta.className !== undefined ? shellMeta.className : className;
  const resolvedSearchValue = shellMeta.searchValue !== undefined
    ? shellMeta.searchValue
    : searchValue;
  const resolvedOnSearchChange = shellMeta.onSearchChange !== undefined
    ? shellMeta.onSearchChange
    : onSearchChange;
  const resolvedOnBellClick = shellMeta.onBellClick !== undefined
    ? shellMeta.onBellClick
    : onBellClick;
  const resolvedOnLogout = shellMeta.onLogout !== undefined ? shellMeta.onLogout : onLogout;

  const shellContextValue = useMemo(() => ({
    isInsideAdminShell: true,
    setShellMeta
  }), []);

  const getDefaultMenu = () => {
    if (isCounselorOnly) {
      return CONSULTANT_MENU_ITEMS;
    }
    if (isClientOnly) {
      return CLIENT_MENU_ITEMS;
    }
    const base = DEFAULT_MENU_ITEMS;
    return isStaffUser ? filterStaffErpLnbItems(base) : base;
  };

  const resolveLnbHeaderTitle = () => {
    if (resolvedTitle) {
      return resolvedTitle;
    }
    if (isCounselorOnly) {
      return LNB_HEADER_TITLE_COUNSELOR;
    }
    if (isClientOnly) {
      return LNB_HEADER_TITLE_CLIENT;
    }
    return LNB_HEADER_TITLE_OPERATOR;
  };

  // P0 hotfix 2026-06-12: LNB API 호출과 메뉴 변형 분리 — 컴포넌트 플래그 비동기 로딩으로 인한
  // /api/v1/menus/lnb 중복 호출 제거. fetch 는 userRole 변경 시에만, 변형은 useMemo 로 계산.
  const [lnbRawTree, setLnbRawTree] = useState(null);
  const { adminShopCatalogEnabled, clientShopEnabled, clientRewardEnabled } = useTenantComponentFlags({
    enabled: Boolean(user)
  });

  useEffect(() => {
    // 상담사-only: API ops LNB 누출 방지 — 폴백 CONSULTANT_MENU_ITEMS 고정
    if (isCounselorOnly) {
      setLnbRawTree([]);
      return undefined;
    }
    let cancelled = false;
    getLnbMenus()
      .then((res) => {
        if (cancelled) return;
        const tree = getLnbTreeFromResponse(res);
        setLnbRawTree(tree && tree.length > 0 ? tree : []);
      })
      .catch(() => {
        if (!cancelled) {
          setLnbRawTree([]);
        }
      });
    return () => { cancelled = true; };
  }, [userRole, user?.counselingEnabled, user?.availableRoles, isCounselorOnly]);

  const menuItems = useMemo(() => {
    const fallback = getDefaultMenu();
    // 상담사-only: 운영 LNB(API·admin merge) 절대 사용 금지
    if (isCounselorOnly) {
      return CONSULTANT_MENU_ITEMS;
    }
    const applyStaffErpFilter = (items) => (
      isStaffUser ? filterStaffErpLnbItems(items) : items
    );
    if (lnbRawTree && lnbRawTree.length > 0) {
      let normalized = mergeSupplementalAdminLnbItems(
        normalizeLnbTree(lnbRawTree, { userRole, user })
      );
      if (isClientOnly) {
        normalized = mergeClientShopLnbItems(normalized, { clientShopEnabled, clientRewardEnabled });
      } else {
        normalized = mergeShopAdminLnbItems(normalized, { adminShopCatalogEnabled, userRole });
        normalized = mergeBillingAdminLnbItems(normalized, { userRole });
      }
      return applyStaffErpFilter(
        filterHiddenAdminLnbItems(filterBranchAdminLnbItems(normalized))
      );
    }
    if (lnbRawTree === null) {
      return isClientOnly
        ? mergeClientShopLnbItems(fallback, { clientShopEnabled, clientRewardEnabled })
        : applyStaffErpFilter(
          filterHiddenAdminLnbItems(filterBranchAdminLnbItems(fallback))
        );
    }
    return isClientOnly
      ? mergeClientShopLnbItems(fallback, { clientShopEnabled, clientRewardEnabled })
      : applyStaffErpFilter(
        filterHiddenAdminLnbItems(filterBranchAdminLnbItems(mergeBillingAdminLnbItems(
          mergeShopAdminLnbItems(fallback, { adminShopCatalogEnabled, userRole }),
          { userRole }
        )))
      );
  }, [
    lnbRawTree,
    userRole,
    user,
    adminShopCatalogEnabled,
    clientShopEnabled,
    clientRewardEnabled,
    isCounselorOnly,
    isClientOnly,
    isStaffUser
  ]);

  const logoHomePath = useMemo(
    () => resolvePostLoginLandingPath(user),
    [user]
  );

  const navigateQuickActionsFromLnb = useMemo(
    () => deriveGnbQuickNavigateActionsFromLnb(menuItems),
    [menuItems]
  );

  const handleLogout = useCallback(async() => {
    try {
      if (resolvedOnLogout) {
        await resolvedOnLogout();
      } else {
        await logout();
      }
    } catch (e) {
      console.error('로그아웃 실패:', e);
    }
  }, [logout, resolvedOnLogout]);

  const handleBellClick = useCallback(() => {
    if (resolvedOnBellClick) {
      resolvedOnBellClick();
    } else {
      navigate(ADMIN_ROUTES.MESSAGES);
    }
  }, [navigate, resolvedOnBellClick]);

  const layoutProps = {
    menuItems,
    headerTitle: resolveLnbHeaderTitle(),
    logoLabel,
    logoUrl,
    logoHomePath,
    logoBrandingLoading: isBrandingLoading,
    searchValue: resolvedSearchValue,
    onSearchChange: resolvedOnSearchChange,
    onBellClick: handleBellClick,
    onLogout: handleLogout,
    navigateQuickActionsFromLnb
  };

  // Clinic-OS chrome(GNB+LNB) 마운트 유지 — stage(Outlet/children)만 교체. 셸 레벨 loading 대체 금지.
  return (
    <AdminShellContext.Provider value={shellContextValue}>
      <div className={`mg-v2-ad-b0kla mg-v2-ad-dashboard-v2 ${resolvedClassName}`.trim()}>
        {isDesktop ? (
          <DesktopLayout {...layoutProps}>
            {children}
          </DesktopLayout>
        ) : (
          <MobileLayout {...layoutProps}>
            {children}
          </MobileLayout>
        )}
      </div>
    </AdminShellContext.Provider>
  );
};

const AdminCommonLayout = (props) => {
  const shell = useAdminShell();
  if (shell?.isInsideAdminShell) {
    return <AdminCommonLayoutPassthrough {...props} />;
  }
  return <AdminCommonLayoutShell {...props} />;
};

export default AdminCommonLayout;
