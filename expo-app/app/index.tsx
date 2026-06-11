/**
 * 앱 진입점
 * 테넌트 캐시·인증 상태에 따라 라우팅 분기
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/theme';
import { AppBrandMark } from '../src/components/molecules/AppBrandMark';
import { useTenantStore } from '../src/stores/useTenantStore';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useEulaGateOnBoot } from '../src/hooks/useEulaGateOnBoot';

export default function AppEntry() {
  const theme = useTheme();
  const { tenantCode } = useTenantStore();
  const { isAuthenticated, isLoading, role, restoreTokens, user } = useAuthStore();

  useEffect(() => {
    restoreTokens();
  }, [restoreTokens]);

  // Apple G1.2 UGC (P2-C) — 인증된 사용자는 EULA 동의 여부를 캐시→BE 순으로 확인.
  const eulaGate = useEulaGateOnBoot({
    userId: user?.id,
    isAuthenticated,
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <Animated.View entering={FadeIn.duration(400)}>
          <AppBrandMark variant="splash" style={{ marginBottom: theme.spacing.lg }} />
        </Animated.View>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (!tenantCode) {
    return <Redirect href={'/(auth)/tenant-select' as Href} />;
  }

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  if (eulaGate.status === 'checking') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <Animated.View entering={FadeIn.duration(400)}>
          <AppBrandMark variant="splash" style={{ marginBottom: theme.spacing.lg }} />
        </Animated.View>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (eulaGate.status === 'requires-consent') {
    return <Redirect href={'/(auth)/eula-consent' as Href} />;
  }

  if (role === 'admin' || role === 'staff') {
    return <Redirect href={'/(admin)/(home)' as Href} />;
  }

  if (role === 'consultant') {
    return <Redirect href={'/(consultant)/(home)' as Href} />;
  }

  return <Redirect href={'/(client)/(home)' as Href} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 8,
  },
});
