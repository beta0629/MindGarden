/**
 * ApiEnvironmentChrome — 개발/Metro API 환경 띠를 레이아웃 플로우에 두고,
 * 표시 중에는 하위 화면에 top inset 0 을 넘겨 이중 SafeArea 패딩을 막는다.
 *
 * OfflineBanner · InAppNotificationToast 는 본 Provider 바깥에 두어 실제 insets.top 을 유지한다.
 *
 * @author MindGarden
 * @since 2026-11-10
 */
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ApiEnvironmentBanner } from '@/components/atoms/ApiEnvironmentBanner';
import { shouldShowApiEnvironmentBanner } from '@/config/apiEnvironment';
import { resolveApiEnvironmentChromeInsets } from './apiEnvironmentChromeInsets';

export interface ApiEnvironmentChromeProps {
  readonly children: ReactNode;
}

/**
 * @param children Stack 등 본문 (배너 ON 시 top inset 이 0 인 컨텍스트 안)
 */
export function ApiEnvironmentChrome({ children }: ApiEnvironmentChromeProps) {
  const insets = useSafeAreaInsets();
  const showBanner = useMemo(() => shouldShowApiEnvironmentBanner(), []);
  const childInsets = useMemo(
    () => resolveApiEnvironmentChromeInsets(showBanner, insets),
    [showBanner, insets],
  );

  if (!showBanner) {
    return <View style={styles.fill}>{children}</View>;
  }

  return (
    <View style={styles.fill}>
      <ApiEnvironmentBanner />
      <SafeAreaInsetsContext.Provider value={childInsets}>
        <View style={styles.fill}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
