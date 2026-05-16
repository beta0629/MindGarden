/**
 * API 환경(개발 Metro / 개발 서버 / 운영) 상단 고정 띠 — `OfflineBanner` 아래 z-index.
 * `pointerEvents="none"` 으로 하단 화면 터치를 가리지 않음.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useTheme } from '@/theme';
import type { AppTheme } from '@/theme/client-theme';
import {
  getApiDeploymentUi,
  shouldShowApiEnvironmentBanner,
  type ApiDeploymentKind,
} from '@/config/apiEnvironment';

function bannerPalette(theme: AppTheme, kind: ApiDeploymentKind): { bg: string; fg: string } {
  if (kind === 'prod') {
    return { bg: theme.colors.gray[700], fg: theme.colors.textOnPrimary };
  }
  if (kind === 'dev-metro') {
    return { bg: theme.colors.primaryDark, fg: theme.colors.textOnPrimary };
  }
  return { bg: theme.colors.warning, fg: theme.colors.textMain };
}

export function ApiEnvironmentBanner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const ui = useMemo(() => getApiDeploymentUi(), []);
  const show = useMemo(() => shouldShowApiEnvironmentBanner(), []);

  if (!show) {
    return null;
  }

  const { bg, fg } = bannerPalette(theme, ui.kind);
  const line = `${ui.headline} · ${ui.detail}`;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          backgroundColor: bg,
          paddingTop: insets.top > 0 ? insets.top : 6,
        },
      ]}
      accessibilityRole="header"
      accessibilityLabel={line}
    >
      <Text
        style={[
          styles.line,
          {
            color: fg,
            fontFamily: theme.fontFamily.semibold,
          },
        ]}
        numberOfLines={1}
      >
        {line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9980,
    paddingBottom: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  line: {
    fontSize: 11,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
