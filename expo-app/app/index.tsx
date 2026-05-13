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
import { fontSize as fontSizeTokens } from '../src/theme/typography';
import { useTenantStore } from '../src/stores/useTenantStore';
import { useAuthStore } from '../src/stores/useAuthStore';

export default function AppEntry() {
  const theme = useTheme();
  const { tenantCode } = useTenantStore();
  const { isAuthenticated, isLoading, role, restoreTokens } = useAuthStore();

  useEffect(() => {
    restoreTokens();
  }, [restoreTokens]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <Animated.Text
          entering={FadeIn.duration(400)}
          style={[styles.logo, { color: theme.colors.primary }]}
        >
          MindGarden
        </Animated.Text>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loader}
        />
      </View>
    );
  }

  if (!tenantCode) {
    return <Redirect href={'/(auth)/tenant-select' as Href} />;
  }

  if (!isAuthenticated) {
    return <Redirect href={'/(auth)/login' as Href} />;
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
  logo: {
    fontSize: fontSizeTokens['4xl'],
    fontWeight: '700',
    marginBottom: 16,
  },
  loader: {
    marginTop: 8,
  },
});
