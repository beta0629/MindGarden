/**
 * 루트 레이아웃
 * QueryClientProvider(영속화), ThemeProvider, 알림 핸들러, 오프라인 배너 래핑
 * 인증 상태에 따른 그룹 분기
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import 'react-native-reanimated';
import { ThemeProvider } from '../src/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import {
  queryClient,
  queryPersister,
  QUERY_PERSIST_MAX_AGE_MS,
  queryPersistDehydrateOptions,
} from '../src/api/queryClient';
import { setupOfflineNetworking } from '../src/hooks/useOffline';
import { NotificationService } from '../src/services/NotificationService';
import { BackgroundTaskService } from '../src/services/BackgroundTaskService';
import { OfflineBanner } from '../src/components/organisms/OfflineBanner';
import { InAppNotificationToast } from '../src/components/organisms/InAppNotificationToast';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
  });

  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const queryPersistBuster = useMemo(() => {
    const tenant = user?.tenantId ?? 'no-tenant';
    const uid = user?.id ?? 'anon';
    return `${tenant}:${uid}`;
  }, [user?.tenantId, user?.id]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  /** 백그라운드 fetch 등록은 로그인과 무관하게 한 경로만(인증 이펙트와 분리) */
  useEffect(() => {
    if (!loaded) return;
    void BackgroundTaskService.register();
  }, [loaded]);

  useEffect(() => {
    const unsubOnline = setupOfflineNetworking();
    return () => {
      unsubOnline();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const { foreground, response } = NotificationService.setupAllHandlers();
    NotificationService.registerToken();

    return () => {
      foreground.remove();
      response.remove();
    };
  }, [isAuthenticated]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: QUERY_PERSIST_MAX_AGE_MS,
          buster: queryPersistBuster,
          dehydrateOptions: queryPersistDehydrateOptions,
        }}
      >
        <ThemeProvider role={role ?? 'client'}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(consultant)" />
            <Stack.Screen name="(client)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <OfflineBanner />
          <InAppNotificationToast />
          <StatusBar style="auto" />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
