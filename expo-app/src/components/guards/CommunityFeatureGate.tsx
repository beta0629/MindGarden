/**
 * App Store Review Mode — 커뮤니티 딥링크 차단 후 더보기로 복귀
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { isCommunityFeatureVisible } from '@/config/appStoreReviewMode';

export function useRedirectIfCommunityHidden(fallbackHref: Href) {
  const router = useRouter();

  useEffect(() => {
    if (!isCommunityFeatureVisible()) {
      router.replace(fallbackHref);
    }
  }, [router, fallbackHref]);
}

/** 레이아웃용: 숨김이면 빈 뷰(리다이렉트 중) */
export function CommunityFeatureGate({
  fallbackHref,
  children,
}: {
  readonly fallbackHref: Href;
  readonly children: ReactNode;
}) {
  useRedirectIfCommunityHidden(fallbackHref);
  if (!isCommunityFeatureVisible()) {
    return <View />;
  }
  return <>{children}</>;
}
