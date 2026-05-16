/**
 * 관리자 모바일 셸 — client/consultant 등 비허용 역할 진입 차단
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminMobileShellRole } from '@/utils/adminRole';

type AdminRoleGateProps = {
  children: ReactNode;
};

export function AdminRoleGate({ children }: AdminRoleGateProps) {
  const theme = useTheme();
  const role = useAuthStore((s) => s.role);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  if (!hasHydrated || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (role === 'consultant') {
    return <Redirect href={'/(consultant)/(home)' as Href} />;
  }

  if (role === 'client') {
    return <Redirect href={'/(client)/(home)' as Href} />;
  }

  if (!isAdminMobileShellRole(role)) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  return <>{children}</>;
}
