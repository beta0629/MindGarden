/**
 * 커뮤니티 메뉴 권한 게이트 — LNB API(RoleMenuPermission) 기준 딥링크 차단
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useLnbMenus } from '@/api/hooks/useLnbMenus';
import { MENU_PERMISSION_CODES } from '@/constants/menuPermissionCodes';
import { isCommunityMenuVisible } from '@/utils/menuAccessUtils';

export type CommunityFeatureGateProps = {
  readonly fallbackHref: Href;
  readonly menuCode: string;
  readonly children: ReactNode;
};

export function useCommunityMenuAllowed(menuCode: string): {
  allowed: boolean;
  ready: boolean;
} {
  const { menus, menusReady } = useLnbMenus();
  const allowed = isCommunityMenuVisible({
    menus,
    menuCode,
    ready: menusReady,
  });
  return { allowed, ready: menusReady };
}

export function useRedirectIfCommunityHidden(fallbackHref: Href, menuCode: string) {
  const router = useRouter();
  const { allowed, ready } = useCommunityMenuAllowed(menuCode);

  useEffect(() => {
    if (ready && !allowed) {
      router.replace(fallbackHref);
    }
  }, [router, fallbackHref, allowed, ready]);
}

/** 레이아웃용: 권한 없으면 빈 뷰(리다이렉트 중) */
export function CommunityFeatureGate({
  fallbackHref,
  menuCode,
  children,
}: CommunityFeatureGateProps) {
  const { allowed, ready } = useCommunityMenuAllowed(menuCode);
  useRedirectIfCommunityHidden(fallbackHref, menuCode);

  if (!ready || !allowed) {
    return <View />;
  }
  return <>{children}</>;
}

export const CLIENT_COMMUNITY_MENU_CODE = MENU_PERMISSION_CODES.CLT_COMMUNITY;
export const CONSULTANT_COMMUNITY_MENU_CODE = MENU_PERMISSION_CODES.CST_COMMUNITY;
