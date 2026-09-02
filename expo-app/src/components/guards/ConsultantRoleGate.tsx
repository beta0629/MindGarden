/**
 * 상담사 모바일 셸 — 상담 역량 없는 사용자 진입 차단
 *
 * 운영 전용 ADMIN/STAFF 는 admin 홈으로, 내담자는 client 홈으로 리다이렉트.
 * 듀얼(운영+상담) ADMIN 은 consultant 라우트 접근 허용(재로그인·모드 전환 없음).
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  POST_AUTH_HOME_ADMIN,
  POST_AUTH_HOME_CLIENT,
} from '@/utils/resolvePostAuthHomeHref';
import { hasCounselorCapability, hasOperatorCapability } from '@/utils/roleCapability';

type ConsultantRoleGateProps = {
  children: ReactNode;
};

export function ConsultantRoleGate({ children }: ConsultantRoleGateProps) {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  if (!hasHydrated || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (hasCounselorCapability(user)) {
    return <>{children}</>;
  }

  if (hasOperatorCapability(user)) {
    return <Redirect href={POST_AUTH_HOME_ADMIN as Href} />;
  }

  if (user?.role === 'client') {
    return <Redirect href={POST_AUTH_HOME_CLIENT as Href} />;
  }

  return <Redirect href={'/(auth)/login' as Href} />;
}
