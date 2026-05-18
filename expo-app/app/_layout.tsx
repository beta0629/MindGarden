/**
 * 루트 레이아웃
 * QueryClientProvider(영속화), ThemeProvider, 알림 핸들러, 오프라인 배너 래핑
 * 인증 상태에 따른 그룹 분기
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import 'react-native-reanimated';
import { ThemeProvider } from '../src/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { hydrateJsessionCacheFromSecureStore } from '../src/utils/sessionCookie';
import { useAppForegroundRefetch } from '../src/hooks/useAppForegroundRefetch';
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
import { ApiEnvironmentBanner } from '../src/components/atoms/ApiEnvironmentBanner';
import { ForceUpdateGate } from '../src/components/organisms/ForceUpdateGate';
import { useTenantStore } from '../src/stores/useTenantStore';

const PUSH_TOKEN_REGISTER_DEBOUNCE_MS = 500;

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

function AppForegroundRefetchBridge() {
  useAppForegroundRefetch();
  return null;
}

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
  const tenantId = useTenantStore((s) => s.tenantId);
  const tenantHydrated = useTenantStore((s) => s._hasHydrated);
  const pushRegisterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /** dev client 직접 진입 등 `index`를 거치지 않아도 SecureStore·JSESSION 복구 (MMKV rehydrate 후 토큰) */
  useEffect(() => {
    if (!loaded) return;
    void (async () => {
      await hydrateJsessionCacheFromSecureStore();
      await useAuthStore.getState().restoreTokens();
    })();
  }, [loaded]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const { foreground, response } = NotificationService.setupAllHandlers();

    return () => {
      foreground.remove();
      response.remove();
    };
  }, [isAuthenticated]);

  /** 테넌트 MMKV hydrate + 로그인 후 푸시 토큰 등록 (중복 호출 debounce) */
  useEffect(() => {
    if (!loaded || !isAuthenticated || !tenantHydrated) {
      return;
    }
    const tid = tenantId?.trim() ?? '';
    if (!tid) {
      return;
    }

    if (pushRegisterTimerRef.current != null) {
      clearTimeout(pushRegisterTimerRef.current);
    }
    pushRegisterTimerRef.current = setTimeout(() => {
      void NotificationService.registerToken();
    }, PUSH_TOKEN_REGISTER_DEBOUNCE_MS);

    return () => {
      if (pushRegisterTimerRef.current != null) {
        clearTimeout(pushRegisterTimerRef.current);
        pushRegisterTimerRef.current = null;
      }
    };
  }, [loaded, isAuthenticated, tenantHydrated, tenantId]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ForceUpdateGate enabled={loaded}>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: queryPersister,
              maxAge: QUERY_PERSIST_MAX_AGE_MS,
              buster: queryPersistBuster,
              dehydrateOptions: queryPersistDehydrateOptions,
            }}
          >
            <AppForegroundRefetchBridge />
            <ThemeProvider role={role ?? 'client'}>
              <ApiEnvironmentBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="(consultant)" />
                <Stack.Screen name="(client)" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <OfflineBanner />
              <InAppNotificationToast />
              <StatusBar style="auto" />
            </ThemeProvider>
          </PersistQueryClientProvider>
        </ForceUpdateGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
